const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');
const { env, tables, cache } = require('../config');

const connectionString = env.azureStorageConnectionString;
const FEATURE_FLAGS_TABLE = tables.featureFlags;
const PARTITION_KEY = 'FEATURE';

// Кэш для feature flags
let featureFlagsCache = null;
let featureFlagsCacheTime = null;
const CACHE_TTL_MS = cache.featureFlagsTtlMs;

/**
 * Проверить, включен ли feature flag
 * 
 * @param {string} featureName - Название feature flag
 * @returns {Promise<boolean>} - true если feature включен
 */
async function isFeatureEnabled(featureName) {
    const now = Date.now();
    
    // Проверка кэша
    if (featureFlagsCache && featureFlagsCacheTime && (now - featureFlagsCacheTime < CACHE_TTL_MS)) {
        const feature = featureFlagsCache.find(f => f.name === featureName);
        return feature ? feature.isEnabled : false;
    }
    
    // Загрузка из базы
    try {
        const tableClient = TableClient.fromConnectionString(connectionString, FEATURE_FLAGS_TABLE);
        const flags = [];
        
        for await (const entity of tableClient.listEntities()) {
            if (entity.partitionKey === PARTITION_KEY) {
                flags.push({
                    name: entity.featureName,
                    isEnabled: entity.isEnabled === true
                });
            }
        }
        
        // Обновление кэша
        featureFlagsCache = flags;
        featureFlagsCacheTime = Date.now();
        
        const feature = flags.find(f => f.name === featureName);
        return feature ? feature.isEnabled : false;
    } catch (e) {
        // По умолчанию feature отключен если не можем получить из базы
        console.error('Error checking feature flag:', e);
        return false;
    }
}

/**
 * Получить все feature flags
 * GET /api/dashboard/features
 */
app.http('adminGetFeatureFlags', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'dashboard/features',
    handler: async (request, context) => {
        try {
            const tableClient = TableClient.fromConnectionString(connectionString, FEATURE_FLAGS_TABLE);
            const features = [];
            
            for await (const entity of tableClient.listEntities()) {
                if (entity.partitionKey === PARTITION_KEY) {
                    features.push({
                        id: entity.rowKey,
                        name: entity.featureName,
                        description: entity.description,
                        isEnabled: entity.isEnabled === true,
                        createdAt: entity.createdAt,
                        lastModifiedAt: entity.lastModifiedAt
                    });
                }
            }
            
            return {
                status: 200,
                jsonBody: { features }
            };
        } catch (error) {
            context.error('Error fetching feature flags:', error);
            return {
                status: 500,
                jsonBody: { error: error.message }
            };
        }
    }
});

/**
 * Обновить feature flag
 * PUT /api/dashboard/features/{featureId}
 * 
 * Body: {
 *   name: string,
 *   description: string,
 *   isEnabled: boolean
 * }
 */
app.http('adminUpdateFeatureFlag', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'dashboard/features/{featureId}',
    handler: async (request, context) => {
        try {
            const featureId = request.params.featureId;
            const body = await request.json();
            
            if (!body.name) {
                return {
                    status: 400,
                    jsonBody: { 
                        error: 'Validation failed',
                        details: ['Feature name is required']
                    }
                };
            }
            
            const tableClient = TableClient.fromConnectionString(connectionString, FEATURE_FLAGS_TABLE);
            
            // Проверка существования
            let existingEntity;
            try {
                existingEntity = await tableClient.getEntity(PARTITION_KEY, featureId);
            } catch (e) {
                existingEntity = null;
            }
            
            const now = new Date().toISOString();
            
            const entity = {
                partitionKey: PARTITION_KEY,
                rowKey: featureId,
                
                featureName: body.name,
                description: body.description || '',
                isEnabled: body.isEnabled === true,
                
                createdAt: existingEntity?.createdAt || now,
                lastModifiedAt: now
            };
            
            await tableClient.upsertEntity(entity, 'Replace');
            
            // Сброс кэша после изменения
            featureFlagsCache = null;
            featureFlagsCacheTime = null;
            
            return {
                status: 200,
                jsonBody: {
                    success: true,
                    feature: {
                        id: featureId,
                        name: entity.featureName,
                        description: entity.description,
                        isEnabled: entity.isEnabled
                    }
                }
            };
        } catch (error) {
            context.error('Error updating feature flag:', error);
            return {
                status: 500,
                jsonBody: { error: error.message }
            };
        }
    }
});

/**
 * Инициализация таблицы FeatureFlags с базовыми флагами
 * POST /api/dashboard/features/initialize
 */
app.http('adminInitializeFeatureFlags', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'dashboard/features/initialize',
    handler: async (request, context) => {
        try {
            const tableClient = TableClient.fromConnectionString(connectionString, FEATURE_FLAGS_TABLE);
            const now = new Date().toISOString();
            
            const defaultFeatures = [
                {
                    partitionKey: PARTITION_KEY,
                    rowKey: 'online_payments',
                    featureName: 'online_payments',
                    description: 'Онлайн оплата через Stripe/Revolut',
                    isEnabled: false, // Пока отключено
                    createdAt: now,
                    lastModifiedAt: now
                },
                {
                    partitionKey: PARTITION_KEY,
                    rowKey: 'email_reminders',
                    featureName: 'email_reminders',
                    description: 'Автоматические email напоминания перед встречей',
                    isEnabled: true,
                    createdAt: now,
                    lastModifiedAt: now
                },
                {
                    partitionKey: PARTITION_KEY,
                    rowKey: 'cgm_diagnostic_booking',
                    featureName: 'cgm_diagnostic_booking',
                    description: 'Возможность бронирования CGM диагностики',
                    isEnabled: true,
                    createdAt: now,
                    lastModifiedAt: now
                },
                {
                    partitionKey: PARTITION_KEY,
                    rowKey: 'free_consultation_booking',
                    featureName: 'free_consultation_booking',
                    description: 'Возможность бронирования бесплатных консультаций',
                    isEnabled: true,
                    createdAt: now,
                    lastModifiedAt: now
                },
                {
                    partitionKey: PARTITION_KEY,
                    rowKey: 'maintenance_mode',
                    featureName: 'maintenance_mode',
                    description: 'Режим технического обслуживания (блокирует новые бронирования)',
                    isEnabled: false,
                    createdAt: now,
                    lastModifiedAt: now
                }
            ];
            
            let createdCount = 0;
            for (const feature of defaultFeatures) {
                try {
                    await tableClient.createEntity(feature);
                    createdCount++;
                } catch (e) {
                    if (e.statusCode === 409) {
                        context.log(`Feature flag already exists: ${feature.featureName}`);
                    } else {
                        throw e;
                    }
                }
            }
            
            return {
                status: 200,
                jsonBody: {
                    success: true,
                    message: `FeatureFlags table initialized with ${createdCount} features`,
                    features: defaultFeatures.map(f => ({
                        name: f.featureName,
                        description: f.description,
                        isEnabled: f.isEnabled
                    }))
                }
            };
        } catch (error) {
            context.error('Error initializing feature flags:', error);
            return {
                status: 500,
                jsonBody: { error: error.message }
            };
        }
    }
});

module.exports = { isFeatureEnabled };
