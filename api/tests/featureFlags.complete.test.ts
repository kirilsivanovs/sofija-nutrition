/**
 * Complete Feature Flags Tests - 100% Coverage
 */

// Mock Azure Table Storage before importing
const mockListEntities = jest.fn();
const mockGetEntity = jest.fn();
const mockUpsertEntity = jest.fn();

jest.mock('@azure/data-tables', () => ({
    TableClient: {
        fromConnectionString: jest.fn().mockReturnValue({
            listEntities: () => mockListEntities(),
            getEntity: mockGetEntity,
            upsertEntity: mockUpsertEntity
        })
    }
}));

import { 
    isFeatureEnabled, 
    getAllFeatureFlags, 
    updateFeatureFlag,
    clearCache 
} from '../src/services/featureFlags';

describe('Feature Flags Service - Complete Coverage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearCache();
    });

    describe('isFeatureEnabled', () => {
        it('should return false for non-existent feature', async () => {
            mockListEntities.mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                    yield* [];
                }
            });

            const result = await isFeatureEnabled('NON_EXISTENT');
            expect(result).toBe(false);
        });

        it('should return true for enabled feature', async () => {
            mockListEntities.mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        partitionKey: 'FEATURE',
                        rowKey: 'feature-1',
                        featureName: 'ADMIN_PANEL',
                        isEnabled: true
                    };
                }
            });

            const result = await isFeatureEnabled('ADMIN_PANEL');
            expect(result).toBe(true);
        });

        it('should return false for disabled feature', async () => {
            mockListEntities.mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        partitionKey: 'FEATURE',
                        rowKey: 'feature-1',
                        featureName: 'ADMIN_PANEL',
                        isEnabled: false
                    };
                }
            });

            const result = await isFeatureEnabled('ADMIN_PANEL');
            expect(result).toBe(false);
        });

        it('should use cache on subsequent calls', async () => {
            mockListEntities.mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        partitionKey: 'FEATURE',
                        rowKey: 'feature-1',
                        featureName: 'TEST_FEATURE',
                        isEnabled: true
                    };
                }
            });

            // First call - should hit database
            const result1 = await isFeatureEnabled('TEST_FEATURE');
            expect(result1).toBe(true);
            expect(mockListEntities).toHaveBeenCalledTimes(1);

            // Second call - should use cache
            const result2 = await isFeatureEnabled('TEST_FEATURE');
            expect(result2).toBe(true);
            expect(mockListEntities).toHaveBeenCalledTimes(1); // Still 1, not 2
        });

        it('should return false on database error', async () => {
            mockListEntities.mockImplementation(() => {
                throw new Error('Database connection failed');
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const result = await isFeatureEnabled('TEST_FEATURE');
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(
                'Error checking feature flag:', 
                expect.any(Error)
            );
            
            consoleSpy.mockRestore();
        });

        it('should ignore entities with wrong partition key', async () => {
            mockListEntities.mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        partitionKey: 'WRONG_PARTITION',
                        rowKey: 'feature-1',
                        featureName: 'ADMIN_PANEL',
                        isEnabled: true
                    };
                    yield {
                        partitionKey: 'FEATURE',
                        rowKey: 'feature-2',
                        featureName: 'TEST_FEATURE',
                        isEnabled: true
                    };
                }
            });

            const result = await isFeatureEnabled('TEST_FEATURE');
            expect(result).toBe(true);
        });

        it('should handle multiple features in cache', async () => {
            mockListEntities.mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        partitionKey: 'FEATURE',
                        rowKey: 'feature-1',
                        featureName: 'FEATURE_A',
                        isEnabled: true
                    };
                    yield {
                        partitionKey: 'FEATURE',
                        rowKey: 'feature-2',
                        featureName: 'FEATURE_B',
                        isEnabled: false
                    };
                }
            });

            const resultA = await isFeatureEnabled('FEATURE_A');
            const resultB = await isFeatureEnabled('FEATURE_B');
            
            expect(resultA).toBe(true);
            expect(resultB).toBe(false);
            expect(mockListEntities).toHaveBeenCalledTimes(1);
        });
    });

    describe('getAllFeatureFlags', () => {
        it('should return all feature flags', async () => {
            mockListEntities.mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        partitionKey: 'FEATURE',
                        rowKey: 'feature-1',
                        featureName: 'ADMIN_PANEL',
                        description: 'Admin panel access',
                        isEnabled: true,
                        createdAt: '2026-01-01T00:00:00Z',
                        lastModifiedAt: '2026-01-15T00:00:00Z'
                    };
                    yield {
                        partitionKey: 'FEATURE',
                        rowKey: 'feature-2',
                        featureName: 'EMAIL_NOTIFICATIONS',
                        description: 'Email notifications',
                        isEnabled: false,
                        createdAt: '2026-01-02T00:00:00Z',
                        lastModifiedAt: '2026-01-16T00:00:00Z'
                    };
                }
            });

            const flags = await getAllFeatureFlags();
            
            expect(flags).toHaveLength(2);
            expect(flags[0]).toEqual({
                partitionKey: 'FEATURE',
                rowKey: 'feature-1',
                featureName: 'ADMIN_PANEL',
                description: 'Admin panel access',
                isEnabled: true,
                createdAt: '2026-01-01T00:00:00Z',
                lastModifiedAt: '2026-01-15T00:00:00Z'
            });
        });

        it('should handle missing description field', async () => {
            mockListEntities.mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        partitionKey: 'FEATURE',
                        rowKey: 'feature-1',
                        featureName: 'TEST_FEATURE',
                        isEnabled: true,
                        createdAt: '2026-01-01T00:00:00Z',
                        lastModifiedAt: '2026-01-01T00:00:00Z'
                    };
                }
            });

            const flags = await getAllFeatureFlags();
            
            expect(flags[0].description).toBe('');
        });

        it('should filter by FEATURE partition key', async () => {
            mockListEntities.mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        partitionKey: 'WRONG',
                        rowKey: 'feature-1',
                        featureName: 'WRONG_FEATURE',
                        isEnabled: true
                    };
                    yield {
                        partitionKey: 'FEATURE',
                        rowKey: 'feature-2',
                        featureName: 'CORRECT_FEATURE',
                        isEnabled: true,
                        createdAt: '2026-01-01T00:00:00Z',
                        lastModifiedAt: '2026-01-01T00:00:00Z'
                    };
                }
            });

            const flags = await getAllFeatureFlags();
            
            expect(flags).toHaveLength(1);
            expect(flags[0].featureName).toBe('CORRECT_FEATURE');
        });

        it('should return empty array when no features', async () => {
            mockListEntities.mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                    yield* [];
                }
            });

            const flags = await getAllFeatureFlags();
            expect(flags).toEqual([]);
        });
    });

    describe('updateFeatureFlag', () => {
        it('should create new feature flag', async () => {
            mockGetEntity.mockRejectedValue(new Error('Not found'));
            mockUpsertEntity.mockResolvedValue({});

            const now = new Date('2026-02-01T12:00:00Z');
            jest.spyOn(global, 'Date').mockImplementation(() => now as any);

            const result = await updateFeatureFlag('feature-1', {
                featureName: 'NEW_FEATURE',
                description: 'New feature flag',
                isEnabled: true
            });

            expect(mockUpsertEntity).toHaveBeenCalledWith(
                {
                    partitionKey: 'FEATURE',
                    rowKey: 'feature-1',
                    featureName: 'NEW_FEATURE',
                    description: 'New feature flag',
                    isEnabled: true,
                    createdAt: now.toISOString(),
                    lastModifiedAt: now.toISOString()
                },
                'Replace'
            );

            expect(result.featureName).toBe('NEW_FEATURE');
            jest.restoreAllMocks();
        });

        it('should update existing feature flag', async () => {
            mockGetEntity.mockResolvedValue({
                partitionKey: 'FEATURE',
                rowKey: 'feature-1',
                featureName: 'EXISTING_FEATURE',
                description: 'Old description',
                isEnabled: false,
                createdAt: '2026-01-01T00:00:00Z'
            });
            mockUpsertEntity.mockResolvedValue({});

            const now = new Date('2026-02-01T12:00:00Z');
            jest.spyOn(global, 'Date').mockImplementation(() => now as any);

            await updateFeatureFlag('feature-1', {
                isEnabled: true
            });

            expect(mockUpsertEntity).toHaveBeenCalledWith(
                {
                    partitionKey: 'FEATURE',
                    rowKey: 'feature-1',
                    featureName: 'EXISTING_FEATURE',
                    description: 'Old description',
                    isEnabled: true,
                    createdAt: '2026-01-01T00:00:00Z',
                    lastModifiedAt: now.toISOString()
                },
                'Replace'
            );

            jest.restoreAllMocks();
        });

        it('should invalidate cache after update', async () => {
            mockGetEntity.mockRejectedValue(new Error('Not found'));
            mockUpsertEntity.mockResolvedValue({});

            // Prime cache first
            mockListEntities.mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        partitionKey: 'FEATURE',
                        rowKey: 'feature-1',
                        featureName: 'TEST',
                        isEnabled: false
                    };
                }
            });

            await isFeatureEnabled('TEST');
            expect(mockListEntities).toHaveBeenCalledTimes(1);

            // Update feature - should invalidate cache
            await updateFeatureFlag('feature-1', { isEnabled: true });

            // Next call should hit database again
            await isFeatureEnabled('TEST');
            expect(mockListEntities).toHaveBeenCalledTimes(2);
        });

        it('should use defaults when fields not provided', async () => {
            mockGetEntity.mockRejectedValue(new Error('Not found'));
            mockUpsertEntity.mockResolvedValue({});

            await updateFeatureFlag('feature-1', {});

            expect(mockUpsertEntity).toHaveBeenCalledWith(
                expect.objectContaining({
                    featureName: 'feature-1', // Uses rowKey as default
                    description: '',
                    isEnabled: false
                }),
                'Replace'
            );
        });

        it('should preserve existing fields when partially updating', async () => {
            mockGetEntity.mockResolvedValue({
                partitionKey: 'FEATURE',
                rowKey: 'feature-1',
                featureName: 'EXISTING',
                description: 'Existing description',
                isEnabled: false,
                createdAt: '2026-01-01T00:00:00Z'
            });
            mockUpsertEntity.mockResolvedValue({});

            await updateFeatureFlag('feature-1', {
                description: 'Updated description'
            });

            expect(mockUpsertEntity).toHaveBeenCalledWith(
                expect.objectContaining({
                    featureName: 'EXISTING',
                    description: 'Updated description',
                    isEnabled: false
                }),
                'Replace'
            );
        });
    });

    describe('clearCache', () => {
        it('should clear the cache', async () => {
            // Prime cache
            mockListEntities.mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        partitionKey: 'FEATURE',
                        rowKey: 'feature-1',
                        featureName: 'TEST',
                        isEnabled: true
                    };
                }
            });

            await isFeatureEnabled('TEST');
            expect(mockListEntities).toHaveBeenCalledTimes(1);

            // Clear cache
            clearCache();

            // Next call should hit database
            await isFeatureEnabled('TEST');
            expect(mockListEntities).toHaveBeenCalledTimes(2);
        });
    });
});
