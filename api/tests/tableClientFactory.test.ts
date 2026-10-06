const tableClientCtor = jest.fn();
const fromConnectionString = jest.fn();
const credentialCtor = jest.fn();

jest.mock('@azure/data-tables', () => {
  const TableClient: any = function (...args: unknown[]) {
    tableClientCtor(...args);
    return { kind: 'entra-client' };
  };
  TableClient.fromConnectionString = (...args: unknown[]) => {
    fromConnectionString(...args);
    return { kind: 'connection-string-client' };
  };
  return { TableClient };
});

jest.mock('@azure/identity', () => ({
  ClientSecretCredential: function (...args: unknown[]) {
    credentialCtor(...args);
    return { kind: 'credential' };
  },
}));

const SETTINGS = [
  'STORAGE_TABLE_ENDPOINT',
  'STORAGE_TENANT_ID',
  'STORAGE_CLIENT_ID',
  'STORAGE_CLIENT_SECRET',
  'AZURE_STORAGE_CONNECTION_STRING',
];

function loadFactory() {
  let factory: typeof import('../src/services/tableClientFactory');
  jest.isolateModules(() => {
    factory = require('../src/services/tableClientFactory');
  });
  return factory!;
}

function setEntraSettings() {
  process.env.STORAGE_TABLE_ENDPOINT = 'https://account.table.core.windows.net';
  process.env.STORAGE_TENANT_ID = 'tenant-id';
  process.env.STORAGE_CLIENT_ID = 'client-id';
  process.env.STORAGE_CLIENT_SECRET = 'synthetic-secret-value';
}

describe('tableClientFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SETTINGS.forEach((name) => delete process.env[name]);
  });

  afterAll(() => {
    SETTINGS.forEach((name) => delete process.env[name]);
  });

  it('uses the client secret credential when the table endpoint is set', () => {
    setEntraSettings();
    const { createTableClient } = loadFactory();

    createTableClient('bookings');

    expect(credentialCtor).toHaveBeenCalledWith('tenant-id', 'client-id', 'synthetic-secret-value');
    expect(tableClientCtor).toHaveBeenCalledWith(
      'https://account.table.core.windows.net',
      'bookings',
      { kind: 'credential' }
    );
    expect(fromConnectionString).not.toHaveBeenCalled();
  });

  it('prefers the table endpoint when both the endpoint and the connection string are set', () => {
    setEntraSettings();
    process.env.AZURE_STORAGE_CONNECTION_STRING = 'UseDevelopmentStorage=true';
    const { createTableClient } = loadFactory();

    createTableClient('bookings');

    expect(tableClientCtor).toHaveBeenCalledTimes(1);
    expect(fromConnectionString).not.toHaveBeenCalled();
  });

  it('uses the connection string when no table endpoint is set', () => {
    process.env.AZURE_STORAGE_CONNECTION_STRING = 'UseDevelopmentStorage=true';
    const { createTableClient } = loadFactory();

    createTableClient('Meals');

    expect(fromConnectionString).toHaveBeenCalledWith('UseDevelopmentStorage=true', 'Meals');
    expect(credentialCtor).not.toHaveBeenCalled();
  });

  it('throws naming the missing setting when the endpoint is set without a client secret', () => {
    setEntraSettings();
    delete process.env.STORAGE_CLIENT_SECRET;
    const { createTableClient } = loadFactory();

    expect(() => createTableClient('bookings')).toThrow('STORAGE_CLIENT_SECRET');
  });

  it('does not include the secret value in the error when a setting is missing', () => {
    setEntraSettings();
    delete process.env.STORAGE_CLIENT_ID;
    const { createTableClient } = loadFactory();

    expect(() => createTableClient('bookings')).toThrow('STORAGE_CLIENT_ID');
    try {
      createTableClient('bookings');
    } catch (error) {
      expect((error as Error).message).not.toContain('synthetic-secret-value');
    }
  });

  it('throws when neither the endpoint nor the connection string is set', () => {
    const { createTableClient } = loadFactory();

    expect(() => createTableClient('bookings')).toThrow('Table Storage is not configured');
  });

  it('reports storage as configured when either setting is present', () => {
    const { isTableStorageConfigured } = loadFactory();
    expect(isTableStorageConfigured()).toBe(false);

    process.env.AZURE_STORAGE_CONNECTION_STRING = 'UseDevelopmentStorage=true';
    expect(isTableStorageConfigured()).toBe(true);

    delete process.env.AZURE_STORAGE_CONNECTION_STRING;
    process.env.STORAGE_TABLE_ENDPOINT = 'https://account.table.core.windows.net';
    expect(isTableStorageConfigured()).toBe(true);
  });
});
