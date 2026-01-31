/**
 * Feature Flags Service
 * Handles feature flag management with caching
 */

import { TableClient, TableEntity } from '@azure/data-tables';
import type { FeatureFlag } from '../types';
import { env, tables, cache } from '../config';

const connectionString = env.azureStorageConnectionString;
const FEATURE_FLAGS_TABLE = tables.featureFlags;
const PARTITION_KEY = 'FEATURE';

// Cache for feature flags
interface CachedFlag {
  name: string;
  isEnabled: boolean;
}

let featureFlagsCache: CachedFlag[] | null = null;
let featureFlagsCacheTime: number | null = null;
const CACHE_TTL_MS = cache.featureFlagsTtlMs;

/**
 * Check if a feature flag is enabled
 * 
 * @param featureName - Name of the feature flag
 * @returns true if feature is enabled, false otherwise
 */
export async function isFeatureEnabled(featureName: string): Promise<boolean> {
  const now = Date.now();
  
  // Check cache
  if (featureFlagsCache && featureFlagsCacheTime && (now - featureFlagsCacheTime < CACHE_TTL_MS)) {
    const feature = featureFlagsCache.find(f => f.name === featureName);
    return feature ? feature.isEnabled : false;
  }
  
  // Load from database
  try {
    const tableClient = TableClient.fromConnectionString(connectionString, FEATURE_FLAGS_TABLE);
    const flags: CachedFlag[] = [];
    
    for await (const entity of tableClient.listEntities()) {
      if (entity.partitionKey === PARTITION_KEY) {
        flags.push({
          name: entity.featureName as string,
          isEnabled: entity.isEnabled === true
        });
      }
    }
    
    // Update cache
    featureFlagsCache = flags;
    featureFlagsCacheTime = Date.now();
    
    const feature = flags.find(f => f.name === featureName);
    return feature ? feature.isEnabled : false;
  } catch (error) {
    // Feature is disabled by default if we can't fetch from database
    console.error('Error checking feature flag:', error);
    return false;
  }
}

/**
 * Get all feature flags (bypasses cache)
 * 
 * @returns Array of all feature flags
 */
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  const tableClient = TableClient.fromConnectionString(connectionString, FEATURE_FLAGS_TABLE);
  const features: FeatureFlag[] = [];
  
  for await (const entity of tableClient.listEntities()) {
    if (entity.partitionKey === PARTITION_KEY) {
      features.push({
        partitionKey: entity.partitionKey,
        rowKey: entity.rowKey as string,
        featureName: entity.featureName as string,
        description: (entity.description as string) || '',
        isEnabled: entity.isEnabled === true,
        createdAt: entity.createdAt as string,
        lastModifiedAt: entity.lastModifiedAt as string
      });
    }
  }
  
  return features;
}

/**
 * Update a feature flag
 * 
 * @param featureId - Feature flag ID (rowKey)
 * @param updates - Partial feature flag updates
 * @returns Updated feature flag
 */
export async function updateFeatureFlag(
  featureId: string,
  updates: Partial<Pick<FeatureFlag, 'featureName' | 'description' | 'isEnabled'>>
): Promise<FeatureFlag> {
  const tableClient = TableClient.fromConnectionString(connectionString, FEATURE_FLAGS_TABLE);
  const now = new Date().toISOString();
  
  // Get existing entity
  let existingEntity: TableEntity | null = null;
  try {
    existingEntity = await tableClient.getEntity(PARTITION_KEY, featureId);
  } catch {
    existingEntity = null;
  }
  
  const entity = {
    partitionKey: PARTITION_KEY,
    rowKey: featureId,
    featureName: updates.featureName ?? existingEntity?.featureName ?? featureId,
    description: updates.description ?? existingEntity?.description ?? '',
    isEnabled: updates.isEnabled ?? existingEntity?.isEnabled ?? false,
    createdAt: (existingEntity?.createdAt as string) ?? now,
    lastModifiedAt: now
  };
  
  await tableClient.upsertEntity(entity, 'Replace');
  
  // Invalidate cache
  featureFlagsCache = null;
  featureFlagsCacheTime = null;
  
  return entity as FeatureFlag;
}

/**
 * Clear the feature flags cache
 * Useful for testing or forcing a refresh
 */
export function clearCache(): void {
  featureFlagsCache = null;
  featureFlagsCacheTime = null;
}

// CommonJS exports for backward compatibility
module.exports = {
  isFeatureEnabled,
  getAllFeatureFlags,
  updateFeatureFlag,
  clearCache
};
