/**
 * Slot Locking Tests
 * Tests for race condition prevention in booking system
 */

// Mock Azure Table Storage before requiring the module
jest.mock('@azure/data-tables', () => ({
    TableClient: {
        fromConnectionString: jest.fn()
    }
}));

const { TableClient } = require('@azure/data-tables');

describe('Slot Locking - Race Condition Prevention', () => {
    let bookingRepository;
    let mockTableClient;
    let mockLockTableClient;
    
    beforeEach(() => {
        jest.resetModules();
        
        // Clear environment
        delete process.env.AZURE_STORAGE_CONNECTION_STRING;
        
        // Re-require the module to get fresh state
        bookingRepository = require('../src/services/bookingRepository');
    });

    describe('In-Memory Locking', () => {
        it('should acquire lock for available slot', async () => {
            const result = await bookingRepository.acquireSlotLock('2026-02-15', '10:00');
            
            expect(result.success).toBe(true);
            expect(result.lockId).toBeDefined();
            expect(result.lockId).toMatch(/^\d+-[a-z0-9]+$/);
        });

        it('should fail to acquire lock for already locked slot', async () => {
            // First lock should succeed
            const lock1 = await bookingRepository.acquireSlotLock('2026-02-15', '11:00');
            expect(lock1.success).toBe(true);
            
            // Second lock on same slot should fail
            const lock2 = await bookingRepository.acquireSlotLock('2026-02-15', '11:00');
            expect(lock2.success).toBe(false);
            expect(lock2.lockId).toBeNull();
        });

        it('should allow locking different slots', async () => {
            const lock1 = await bookingRepository.acquireSlotLock('2026-02-15', '10:00');
            const lock2 = await bookingRepository.acquireSlotLock('2026-02-15', '11:00');
            const lock3 = await bookingRepository.acquireSlotLock('2026-02-16', '10:00');
            
            expect(lock1.success).toBe(true);
            expect(lock2.success).toBe(true);
            expect(lock3.success).toBe(true);
        });

        it('should release lock and allow re-locking', async () => {
            const lock1 = await bookingRepository.acquireSlotLock('2026-02-15', '12:00');
            expect(lock1.success).toBe(true);
            
            // Release the lock
            await bookingRepository.releaseSlotLock('2026-02-15', '12:00', lock1.lockId);
            
            // Should be able to acquire again
            const lock2 = await bookingRepository.acquireSlotLock('2026-02-15', '12:00');
            expect(lock2.success).toBe(true);
        });

        it('should not release lock with wrong lockId', async () => {
            const lock1 = await bookingRepository.acquireSlotLock('2026-02-15', '13:00');
            expect(lock1.success).toBe(true);
            
            // Try to release with wrong lockId (should not release)
            await bookingRepository.releaseSlotLock('2026-02-15', '13:00', 'wrong-lock-id');
            
            // Lock should still be held
            const lock2 = await bookingRepository.acquireSlotLock('2026-02-15', '13:00');
            expect(lock2.success).toBe(false);
        });

        it('should handle concurrent lock attempts (simulated)', async () => {
            // Simulate 5 concurrent booking attempts for the same slot
            const promises = Array(5).fill().map(() => 
                bookingRepository.acquireSlotLock('2026-02-15', '14:00')
            );
            
            const results = await Promise.all(promises);
            
            // Only one should succeed
            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;
            
            expect(successCount).toBe(1);
            expect(failCount).toBe(4);
        });
    });

    describe('Lock Expiration', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should allow acquiring expired lock', async () => {
            // Acquire initial lock
            const lock1 = await bookingRepository.acquireSlotLock('2026-02-15', '15:00');
            expect(lock1.success).toBe(true);
            
            // Advance time past lock expiration (30 seconds)
            jest.advanceTimersByTime(bookingRepository.LOCK_TTL_MS + 1000);
            
            // Now another request should be able to acquire lock
            const lock2 = await bookingRepository.acquireSlotLock('2026-02-15', '15:00');
            expect(lock2.success).toBe(true);
            expect(lock2.lockId).not.toBe(lock1.lockId);
        });
    });

    describe('Azure Table Storage Locking', () => {
        let entities;
        
        beforeEach(() => {
            // Clear all module caches first
            jest.resetModules();
            
            // Mock entity storage
            entities = new Map();
            
            mockLockTableClient = {
                createTable: jest.fn().mockResolvedValue(undefined),
                createEntity: jest.fn().mockImplementation((entity) => {
                    const key = entity.rowKey;
                    if (entities.has(key)) {
                        const error = new Error('Conflict');
                        error.statusCode = 409;
                        return Promise.reject(error);
                    }
                    entities.set(key, { ...entity, etag: 'etag-' + Date.now() });
                    return Promise.resolve();
                }),
                getEntity: jest.fn().mockImplementation((partitionKey, rowKey) => {
                    const entity = entities.get(rowKey);
                    if (!entity) {
                        const error = new Error('Not found');
                        error.statusCode = 404;
                        return Promise.reject(error);
                    }
                    return Promise.resolve(entity);
                }),
                deleteEntity: jest.fn().mockImplementation((partitionKey, rowKey) => {
                    entities.delete(rowKey);
                    return Promise.resolve();
                }),
                updateEntity: jest.fn().mockImplementation((entity) => {
                    entities.set(entity.rowKey, { ...entity, etag: 'etag-' + Date.now() });
                    return Promise.resolve();
                })
            };

            mockTableClient = {
                createTable: jest.fn().mockResolvedValue(undefined)
            };

            // Set connection string BEFORE requiring the module
            process.env.AZURE_STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=test==;EndpointSuffix=core.windows.net';

            // Re-mock TableClient after resetModules
            const { TableClient: MockTableClient } = require('@azure/data-tables');
            MockTableClient.fromConnectionString = jest.fn().mockImplementation((connStr, tableName) => {
                if (tableName === 'slotlocks') return mockLockTableClient;
                return mockTableClient;
            });
            
            // Now require to get Azure mode
            bookingRepository = require('../src/services/bookingRepository');
        });

        afterEach(() => {
            delete process.env.AZURE_STORAGE_CONNECTION_STRING;
        });

        it('should create lock entity in Azure Table', async () => {
            const result = await bookingRepository.acquireSlotLock('2026-02-20', '10:00');
            
            expect(result.success).toBe(true);
            expect(mockLockTableClient.createEntity).toHaveBeenCalledWith(
                expect.objectContaining({
                    partitionKey: 'LOCK',
                    rowKey: '2026-02-20_10:00'
                })
            );
        });

        it('should handle Azure 409 Conflict for existing lock', async () => {
            // First lock
            await bookingRepository.acquireSlotLock('2026-02-20', '11:00');
            
            // Second attempt should fail
            const result = await bookingRepository.acquireSlotLock('2026-02-20', '11:00');
            
            expect(result.success).toBe(false);
        });

        it('should delete entity when releasing lock in Azure', async () => {
            const lock = await bookingRepository.acquireSlotLock('2026-02-20', '12:00');
            
            await bookingRepository.releaseSlotLock('2026-02-20', '12:00', lock.lockId);
            
            expect(mockLockTableClient.deleteEntity).toHaveBeenCalled();
        });
    });

    describe('Integration with Booking Flow', () => {
        it('should have LOCK_TTL_MS exported', () => {
            expect(bookingRepository.LOCK_TTL_MS).toBe(30000);
        });

        it('should export acquireSlotLock function', () => {
            expect(typeof bookingRepository.acquireSlotLock).toBe('function');
        });

        it('should export releaseSlotLock function', () => {
            expect(typeof bookingRepository.releaseSlotLock).toBe('function');
        });
    });
});
