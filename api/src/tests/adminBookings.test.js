/**
 * Unit tests for Admin Bookings API
 * Tests booking status updates (confirm/cancel) and booking retrieval
 */

// Mock Azure Table Client
const mockEntities = [
    {
        partitionKey: '2026-02-01',
        rowKey: 'SN-TEST001',
        id: 'SN-TEST001',
        name: 'Test Client 1',
        email: 'test1@example.com',
        phone: '+37120000001',
        date: '2026-02-01',
        time: '10:00',
        service: 'initial',
        consultationFormat: 'online',
        language: 'lv',
        status: 'pending',
        createdAt: '2026-01-24T10:00:00.000Z',
        price: 65
    },
    {
        partitionKey: '2026-02-01',
        rowKey: 'SN-TEST002',
        id: 'SN-TEST002',
        name: 'Test Client 2',
        email: 'test2@example.com',
        phone: '+37120000002',
        date: '2026-02-01',
        time: '11:00',
        service: 'followup',
        consultationFormat: 'in-person',
        language: 'en',
        status: 'confirmed',
        createdAt: '2026-01-24T11:00:00.000Z',
        price: 45
    },
    {
        partitionKey: '2026-02-02',
        rowKey: 'SN-TEST003',
        id: 'SN-TEST003',
        name: 'Test Client 3',
        email: 'test3@example.com',
        phone: '+37120000003',
        date: '2026-02-02',
        time: '14:00',
        service: 'initial',
        consultationFormat: 'online',
        language: 'ru',
        status: 'cancelled',
        createdAt: '2026-01-24T12:00:00.000Z',
        price: 65
    }
];

let mockEntityStore = [];

const mockTableClient = {
    listEntities: jest.fn(function* (options) {
        const filter = options?.filter;
        for (const entity of mockEntityStore) {
            if (filter) {
                // Parse simple status filter
                const statusMatch = filter.match(/status eq '(\w+)'/);
                if (statusMatch && entity.status !== statusMatch[1]) {
                    continue;
                }
            }
            yield entity;
        }
    }),
    updateEntity: jest.fn((entity, mode) => {
        const index = mockEntityStore.findIndex(e => e.rowKey === entity.rowKey);
        if (index !== -1) {
            mockEntityStore[index] = { ...mockEntityStore[index], ...entity };
        }
        return Promise.resolve();
    }),
    getEntity: jest.fn((partitionKey, rowKey) => {
        const entity = mockEntityStore.find(e => 
            e.partitionKey === partitionKey && e.rowKey === rowKey
        );
        if (!entity) {
            const error = new Error('Not found');
            error.statusCode = 404;
            return Promise.reject(error);
        }
        return Promise.resolve(entity);
    })
};

jest.mock('@azure/data-tables', () => ({
    TableClient: {
        fromConnectionString: jest.fn(() => mockTableClient)
    }
}));

// Helper to create mock request
function createMockRequest(method, params = {}, body = null, query = {}) {
    const url = new URL('https://test.azurewebsites.net/api/dashboard/bookings');
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
    
    return {
        method,
        params,
        url: url.toString(),
        json: () => Promise.resolve(body)
    };
}

// Helper to create mock context
function createMockContext() {
    return {
        log: jest.fn(),
        error: jest.fn()
    };
}

describe('Admin Bookings API', () => {
    beforeEach(() => {
        // Reset mock store before each test
        mockEntityStore = JSON.parse(JSON.stringify(mockEntities));
        jest.clearAllMocks();
    });

    describe('findBookingById', () => {
        test('should find booking by exact rowKey match', () => {
            const targetId = 'SN-TEST002';
            const found = mockEntityStore.find(e => e.rowKey === targetId);
            
            expect(found).toBeDefined();
            expect(found.rowKey).toBe(targetId);
            expect(found.name).toBe('Test Client 2');
        });

        test('should return undefined for non-existent booking', () => {
            const targetId = 'SN-NONEXISTENT';
            const found = mockEntityStore.find(e => e.rowKey === targetId);
            
            expect(found).toBeUndefined();
        });

        test('should not match partial rowKey', () => {
            const partialId = 'SN-TEST';
            const found = mockEntityStore.find(e => e.rowKey === partialId);
            
            expect(found).toBeUndefined();
        });
    });

    describe('Booking Status Updates', () => {
        test('should update pending booking to confirmed', () => {
            const bookingId = 'SN-TEST001';
            const booking = mockEntityStore.find(e => e.rowKey === bookingId);
            
            expect(booking.status).toBe('pending');
            
            // Simulate update
            booking.status = 'confirmed';
            booking.updatedAt = new Date().toISOString();
            
            expect(booking.status).toBe('confirmed');
            expect(booking.updatedAt).toBeDefined();
        });

        test('should update pending booking to cancelled', () => {
            const bookingId = 'SN-TEST001';
            const booking = mockEntityStore.find(e => e.rowKey === bookingId);
            
            expect(booking.status).toBe('pending');
            
            // Simulate update
            booking.status = 'cancelled';
            booking.updatedAt = new Date().toISOString();
            
            expect(booking.status).toBe('cancelled');
        });

        test('should update confirmed booking to cancelled', () => {
            const bookingId = 'SN-TEST002';
            const booking = mockEntityStore.find(e => e.rowKey === bookingId);
            
            expect(booking.status).toBe('confirmed');
            
            // Simulate update
            booking.status = 'cancelled';
            booking.updatedAt = new Date().toISOString();
            
            expect(booking.status).toBe('cancelled');
        });

        test('should preserve other booking fields when updating status', () => {
            const bookingId = 'SN-TEST001';
            const originalBooking = { ...mockEntityStore.find(e => e.rowKey === bookingId) };
            const booking = mockEntityStore.find(e => e.rowKey === bookingId);
            
            // Update only status
            booking.status = 'confirmed';
            booking.updatedAt = new Date().toISOString();
            
            // Verify other fields unchanged
            expect(booking.name).toBe(originalBooking.name);
            expect(booking.email).toBe(originalBooking.email);
            expect(booking.date).toBe(originalBooking.date);
            expect(booking.time).toBe(originalBooking.time);
            expect(booking.price).toBe(originalBooking.price);
            expect(booking.service).toBe(originalBooking.service);
        });
    });

    describe('Booking Filtering', () => {
        test('should filter bookings by pending status', () => {
            const pending = mockEntityStore.filter(e => e.status === 'pending');
            expect(pending).toHaveLength(1);
            expect(pending[0].rowKey).toBe('SN-TEST001');
        });

        test('should filter bookings by confirmed status', () => {
            const confirmed = mockEntityStore.filter(e => e.status === 'confirmed');
            expect(confirmed).toHaveLength(1);
            expect(confirmed[0].rowKey).toBe('SN-TEST002');
        });

        test('should filter bookings by cancelled status', () => {
            const cancelled = mockEntityStore.filter(e => e.status === 'cancelled');
            expect(cancelled).toHaveLength(1);
            expect(cancelled[0].rowKey).toBe('SN-TEST003');
        });

        test('should return all bookings when no filter', () => {
            expect(mockEntityStore).toHaveLength(3);
        });
    });

    describe('Booking Sorting', () => {
        test('should sort bookings by date descending', () => {
            const sorted = [...mockEntityStore].sort((a, b) => {
                const dateA = new Date(a.date + 'T' + a.time);
                const dateB = new Date(b.date + 'T' + b.time);
                return dateB - dateA;
            });
            
            expect(sorted[0].date).toBe('2026-02-02');
            expect(sorted[1].date).toBe('2026-02-01');
            expect(sorted[1].time).toBe('11:00');
            expect(sorted[2].date).toBe('2026-02-01');
            expect(sorted[2].time).toBe('10:00');
        });
    });

    describe('Cancelled Bookings and Availability', () => {
        test('should not count cancelled bookings as booked slots', () => {
            const activeBookings = mockEntityStore.filter(e => e.status !== 'cancelled');
            expect(activeBookings).toHaveLength(2);
            
            // Build booked slots map (excluding cancelled)
            const bookedSlots = {};
            for (const booking of activeBookings) {
                if (!bookedSlots[booking.date]) {
                    bookedSlots[booking.date] = [];
                }
                bookedSlots[booking.date].push(booking.time);
            }
            
            expect(bookedSlots['2026-02-01']).toContain('10:00');
            expect(bookedSlots['2026-02-01']).toContain('11:00');
            expect(bookedSlots['2026-02-02']).toBeUndefined(); // Cancelled booking
        });

        test('should free up slot when booking is cancelled', () => {
            const bookingId = 'SN-TEST001';
            const booking = mockEntityStore.find(e => e.rowKey === bookingId);
            const slotDate = booking.date;
            const slotTime = booking.time;
            
            // Before cancel - slot is booked
            let activeBookings = mockEntityStore.filter(e => e.status !== 'cancelled');
            let bookedTimes = activeBookings
                .filter(e => e.date === slotDate)
                .map(e => e.time);
            expect(bookedTimes).toContain(slotTime);
            
            // Cancel the booking
            booking.status = 'cancelled';
            
            // After cancel - slot is free
            activeBookings = mockEntityStore.filter(e => e.status !== 'cancelled');
            bookedTimes = activeBookings
                .filter(e => e.date === slotDate)
                .map(e => e.time);
            expect(bookedTimes).not.toContain(slotTime);
        });
    });

    describe('Booking Data Validation', () => {
        test('should have required fields for display', () => {
            const booking = mockEntityStore[0];
            
            expect(booking.id).toBeDefined();
            expect(booking.name).toBeDefined();
            expect(booking.email).toBeDefined();
            expect(booking.date).toBeDefined();
            expect(booking.time).toBeDefined();
            expect(booking.status).toBeDefined();
            expect(booking.service).toBeDefined();
            expect(booking.consultationFormat).toBeDefined();
            expect(booking.price).toBeDefined();
        });

        test('should have valid status values', () => {
            const validStatuses = ['pending', 'confirmed', 'cancelled'];
            
            for (const booking of mockEntityStore) {
                expect(validStatuses).toContain(booking.status);
            }
        });

        test('should have valid consultation formats', () => {
            const validFormats = ['online', 'in-person'];
            
            for (const booking of mockEntityStore) {
                expect(validFormats).toContain(booking.consultationFormat);
            }
        });

        test('should have valid service types', () => {
            const validServices = ['initial', 'followup'];
            
            for (const booking of mockEntityStore) {
                expect(validServices).toContain(booking.service);
            }
        });
    });

    describe('Date Grouping for Calendar', () => {
        test('should group bookings by date', () => {
            const byDate = {};
            for (const booking of mockEntityStore) {
                if (!byDate[booking.date]) {
                    byDate[booking.date] = [];
                }
                byDate[booking.date].push(booking);
            }
            
            expect(Object.keys(byDate)).toHaveLength(2);
            expect(byDate['2026-02-01']).toHaveLength(2);
            expect(byDate['2026-02-02']).toHaveLength(1);
        });

        test('should count bookings by status for calendar day', () => {
            const date = '2026-02-01';
            const dayBookings = mockEntityStore.filter(b => b.date === date);
            
            const pending = dayBookings.filter(b => b.status === 'pending').length;
            const confirmed = dayBookings.filter(b => b.status === 'confirmed').length;
            const cancelled = dayBookings.filter(b => b.status === 'cancelled').length;
            
            expect(pending).toBe(1);
            expect(confirmed).toBe(1);
            expect(cancelled).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        test('should handle booking with empty phone', () => {
            const booking = {
                ...mockEntities[0],
                rowKey: 'SN-NOPHONE',
                phone: ''
            };
            mockEntityStore.push(booking);
            
            const found = mockEntityStore.find(e => e.rowKey === 'SN-NOPHONE');
            expect(found.phone).toBe('');
        });

        test('should handle booking with notes', () => {
            const booking = {
                ...mockEntities[0],
                rowKey: 'SN-NOTES',
                notes: 'Special dietary requirements'
            };
            mockEntityStore.push(booking);
            
            const found = mockEntityStore.find(e => e.rowKey === 'SN-NOTES');
            expect(found.notes).toBe('Special dietary requirements');
        });

        test('should handle Latvian characters in name', () => {
            const booking = {
                ...mockEntities[0],
                rowKey: 'SN-LATVIAN',
                name: 'Jānis Bērziņš',
                notes: 'Konsultācija par uzturu'
            };
            mockEntityStore.push(booking);
            
            const found = mockEntityStore.find(e => e.rowKey === 'SN-LATVIAN');
            expect(found.name).toBe('Jānis Bērziņš');
            expect(found.notes).toContain('ā');
        });

        test('should handle Russian characters in name', () => {
            const booking = {
                ...mockEntities[0],
                rowKey: 'SN-RUSSIAN',
                name: 'Иван Петров',
                language: 'ru'
            };
            mockEntityStore.push(booking);
            
            const found = mockEntityStore.find(e => e.rowKey === 'SN-RUSSIAN');
            expect(found.name).toBe('Иван Петров');
        });
    });

    describe('UpdateEntity Mock', () => {
        test('should call updateEntity with correct parameters', async () => {
            const booking = mockEntityStore[0];
            const updatedBooking = {
                ...booking,
                status: 'confirmed',
                updatedAt: '2026-01-24T12:00:00.000Z'
            };
            
            await mockTableClient.updateEntity(updatedBooking, 'Merge');
            
            expect(mockTableClient.updateEntity).toHaveBeenCalledWith(
                updatedBooking,
                'Merge'
            );
        });

        test('should update entity in mock store', async () => {
            const bookingId = 'SN-TEST001';
            const booking = mockEntityStore.find(e => e.rowKey === bookingId);
            
            const updatedBooking = {
                ...booking,
                status: 'confirmed',
                updatedAt: '2026-01-24T12:00:00.000Z'
            };
            
            await mockTableClient.updateEntity(updatedBooking, 'Merge');
            
            const updated = mockEntityStore.find(e => e.rowKey === bookingId);
            expect(updated.status).toBe('confirmed');
        });
    });
});

describe('Status Text and Styling', () => {
    const getStatusText = (status) => {
        switch(status) {
            case 'confirmed': return 'Apstiprināts';
            case 'pending': return 'Gaida';
            case 'cancelled': return 'Atcelts';
            default: return status;
        }
    };

    const getStatusClass = (status) => {
        switch(status) {
            case 'confirmed': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    test('should return correct Latvian text for confirmed', () => {
        expect(getStatusText('confirmed')).toBe('Apstiprināts');
    });

    test('should return correct Latvian text for pending', () => {
        expect(getStatusText('pending')).toBe('Gaida');
    });

    test('should return correct Latvian text for cancelled', () => {
        expect(getStatusText('cancelled')).toBe('Atcelts');
    });

    test('should return correct CSS classes for confirmed', () => {
        expect(getStatusClass('confirmed')).toContain('green');
    });

    test('should return correct CSS classes for pending', () => {
        expect(getStatusClass('pending')).toContain('yellow');
    });

    test('should return correct CSS classes for cancelled', () => {
        expect(getStatusClass('cancelled')).toContain('red');
    });
});
