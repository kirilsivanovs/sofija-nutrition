/**
 * Booking retention sweep tests (synthetic data only)
 */

type FakeEntity = Record<string, unknown>;

const NOW = new Date('2026-10-06T10:00:00Z');
const OLD_DATE = '2026-03-01';
const RECENT_DATE = '2026-08-01';

describe('booking retention sweep', () => {
  let entities: FakeEntity[];
  let deleteEntity: jest.Mock;
  let listEntities: jest.Mock;
  let repository: {
    deleteStaleUnconfirmedBookings: (now: Date) => Promise<number>;
    sweepStaleBookingsDaily: (now?: Date) => Promise<void>;
  };

  function entity(partitionKey: string, rowKey: string, extra: FakeEntity = {}): FakeEntity {
    return {
      partitionKey,
      rowKey,
      name: 'Test Patient',
      email: 'patient@example.test',
      phone: '+371 20000000',
      ...extra,
    };
  }

  beforeEach(() => {
    jest.resetModules();
    entities = [];
    deleteEntity = jest.fn().mockResolvedValue(undefined);
    // Honours the server-side `PartitionKey lt '<date>'` filter like Table Storage does
    listEntities = jest.fn((options: { queryOptions: { filter: string } }) => {
      const upperBound = /PartitionKey lt '([^']+)'/.exec(options.queryOptions.filter)?.[1] ?? '';
      return {
        async *[Symbol.asyncIterator]() {
          for (const e of entities) {
            if ((e.partitionKey as string) < upperBound) {
              yield e;
            }
          }
        },
      };
    });
    jest.doMock('../src/services/tableClientFactory', () => ({
      isTableStorageConfigured: () => true,
      createTableClient: () => ({
        createTable: jest.fn().mockResolvedValue(undefined),
        listEntities,
        deleteEntity,
      }),
    }));
    repository = require('../src/services/bookingRepository');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.dontMock('../src/services/tableClientFactory');
  });

  it('deletes a pending booking when its date is more than six months past', async () => {
    entities = [entity(OLD_DATE, 'SN-A', { status: 'pending' })];

    const count = await repository.deleteStaleUnconfirmedBookings(NOW);

    expect(count).toBe(1);
    expect(deleteEntity).toHaveBeenCalledWith(OLD_DATE, 'SN-A', expect.anything());
  });

  it('passes the listed etag to the delete when sweeping', async () => {
    entities = [entity(OLD_DATE, 'SN-A', { status: 'pending', etag: 'W/"etag-1"' })];

    await repository.deleteStaleUnconfirmedBookings(NOW);

    expect(deleteEntity).toHaveBeenCalledWith(OLD_DATE, 'SN-A', { etag: 'W/"etag-1"' });
  });

  it('continues with the remaining rows when one delete fails', async () => {
    entities = [
      entity(OLD_DATE, 'SN-X', { status: 'pending' }),
      entity(OLD_DATE, 'SN-Y', { status: 'pending' }),
    ];
    deleteEntity.mockRejectedValueOnce(new Error('412'));

    const count = await repository.deleteStaleUnconfirmedBookings(NOW);

    expect(deleteEntity).toHaveBeenCalledTimes(2);
    expect(count).toBe(1);
  });

  it('keeps a booking dated 2026-03-01 when now is 2026-08-31', async () => {
    entities = [
      entity('2026-03-01', 'SN-M1', { status: 'pending' }),
      entity('2026-02-27', 'SN-M2', { status: 'pending' }),
    ];

    const count = await repository.deleteStaleUnconfirmedBookings(new Date('2026-08-31T10:00:00Z'));

    expect(listEntities).toHaveBeenCalledWith({
      queryOptions: { filter: "PartitionKey lt '2026-02-28'" },
    });
    expect(count).toBe(1);
    expect(deleteEntity).toHaveBeenCalledTimes(1);
    expect(deleteEntity).toHaveBeenCalledWith('2026-02-27', 'SN-M2', expect.anything());
  });

  it('deletes an unpaid cancelled booking when its date is more than six months past', async () => {
    entities = [entity(OLD_DATE, 'SN-B', { status: 'cancelled', paymentConfirmed: false })];

    const count = await repository.deleteStaleUnconfirmedBookings(NOW);

    expect(count).toBe(1);
    expect(deleteEntity).toHaveBeenCalledWith(OLD_DATE, 'SN-B', expect.anything());
  });

  it('treats a booking without status as pending when deciding deletion', async () => {
    entities = [entity(OLD_DATE, 'SN-C')];

    const count = await repository.deleteStaleUnconfirmedBookings(NOW);

    expect(count).toBe(1);
  });

  it('keeps a booking when payment is confirmed', async () => {
    entities = [
      entity(OLD_DATE, 'SN-D', { status: 'pending', paymentConfirmed: true }),
      entity(OLD_DATE, 'SN-E', { status: 'cancelled', paymentConfirmed: true }),
    ];

    const count = await repository.deleteStaleUnconfirmedBookings(NOW);

    expect(count).toBe(0);
    expect(deleteEntity).not.toHaveBeenCalled();
  });

  it('keeps confirmed, completed and no-show bookings when their date is more than six months past', async () => {
    entities = ['confirmed', 'completed', 'no-show'].map((status, i) =>
      entity(OLD_DATE, `SN-F${i}`, { status })
    );

    const count = await repository.deleteStaleUnconfirmedBookings(NOW);

    expect(count).toBe(0);
    expect(deleteEntity).not.toHaveBeenCalled();
  });

  it('keeps an unconfirmed booking when its date is within six months', async () => {
    entities = [entity(RECENT_DATE, 'SN-H', { status: 'pending' })];

    const count = await repository.deleteStaleUnconfirmedBookings(NOW);

    expect(count).toBe(0);
    expect(deleteEntity).not.toHaveBeenCalled();
  });

  it('queries with a server-computed PartitionKey cutoff when sweeping', async () => {
    await repository.deleteStaleUnconfirmedBookings(NOW);

    expect(listEntities).toHaveBeenCalledWith({
      queryOptions: { filter: "PartitionKey lt '2026-04-06'" },
    });
  });

  it('runs at most once a day when called repeatedly', async () => {
    await repository.sweepStaleBookingsDaily(NOW);
    await repository.sweepStaleBookingsDaily(new Date(NOW.getTime() + 60 * 60 * 1000));
    expect(listEntities).toHaveBeenCalledTimes(1);

    await repository.sweepStaleBookingsDaily(new Date(NOW.getTime() + 25 * 60 * 60 * 1000));
    expect(listEntities).toHaveBeenCalledTimes(2);
  });

  it('does not throw when the table query fails', async () => {
    listEntities.mockImplementation(() => {
      throw new Error('table unavailable');
    });
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(repository.sweepStaleBookingsDaily(NOW)).resolves.toBeUndefined();
  });

  it('does not throw when the table query rejects with undefined', async () => {
    listEntities.mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw undefined;
    });
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(repository.sweepStaleBookingsDaily(NOW)).resolves.toBeUndefined();
  });

  it('logs no email, name or phone when deleting', async () => {
    entities = [entity(OLD_DATE, 'SN-G', { status: 'pending' })];
    const info = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await repository.sweepStaleBookingsDaily(NOW);

    const logged = [...info.mock.calls, ...warn.mock.calls, ...error.mock.calls].flat().join('\n');
    expect(logged).toContain('{"count":1}');
    expect(logged).not.toContain('patient@example.test');
    expect(logged).not.toContain('Test Patient');
    expect(logged).not.toContain('+371 20000000');
  });
});
