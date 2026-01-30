const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const SERVICES_TABLE = 'Services'; // Понятное название таблицы
const PARTITION_KEY = 'SERVICE'; // Все услуги в одной группе

/**
 * Получить все активные услуги из базы данных
 * GET /api/dashboard/services
 */
app.http('adminGetServiceSettings', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'dashboard/services',
    handler: async (request, context) => {
        try {
            const tableClient = TableClient.fromConnectionString(connectionString, SERVICES_TABLE);
            const services = [];
            
            for await (const entity of tableClient.listEntities()) {
                if (entity.partitionKey === PARTITION_KEY) {
                    services.push({
                        id: entity.serviceId,
                        name: {
                            lv: entity.serviceName_LV,
                            ru: entity.serviceName_RU,
                            en: entity.serviceName_EN
                        },
                        price: entity.priceEUR,
                        duration: entity.durationMinutes,
                        allowOnline: entity.allowOnlineFormat === true,
                        allowInPerson: entity.allowInPersonFormat === true,
                        isActive: entity.isActive !== false,
                        displayOrder: entity.displayOrder || 0,
                        createdAt: entity.createdAt,
                        lastModifiedAt: entity.lastModifiedAt
                    });
                }
            }
            
            // Сортировка по порядку отображения
            services.sort((a, b) => a.displayOrder - b.displayOrder);
            
            return { 
                status: 200,
                jsonBody: { services }
            };
        } catch (error) {
            context.error('Error fetching services:', error);
            return {
                status: 500,
                jsonBody: { error: error.message }
            };
        }
    }
});

/**
 * Обновить настройки услуги
 * PUT /api/dashboard/services/{serviceId}
 * 
 * Body: {
 *   name: { lv, ru, en },
 *   price: number,
 *   duration: number,
 *   allowOnline: boolean,
 *   allowInPerson: boolean,
 *   isActive: boolean,
 *   displayOrder: number
 * }
 */
app.http('adminUpdateServiceSettings', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'dashboard/services/{serviceId}',
    handler: async (request, context) => {
        try {
            const serviceId = request.params.serviceId;
            const body = await request.json();
            
            // Валидация входных данных
            const errors = [];
            
            // Проверка названий
            if (!body.name || !body.name.lv || !body.name.ru || !body.name.en) {
                errors.push('Service name is required in all languages (lv, ru, en)');
            }
            
            // Проверка цены
            if (typeof body.price !== 'number' || body.price < 0) {
                errors.push('Price must be a positive number');
            }
            
            // Проверка длительности
            if (typeof body.duration !== 'number' || body.duration < 5 || body.duration > 180) {
                errors.push('Duration must be between 5 and 180 minutes');
            }
            
            // Проверка форматов - должен быть хоть один доступный
            if (!body.allowOnline && !body.allowInPerson) {
                errors.push('At least one format (online or in-person) must be enabled');
            }
            
            // Проверка порядка отображения
            if (body.displayOrder !== undefined && (typeof body.displayOrder !== 'number' || body.displayOrder < 0)) {
                errors.push('Display order must be a non-negative number');
            }
            
            if (errors.length > 0) {
                return {
                    status: 400,
                    jsonBody: { 
                        error: 'Validation failed',
                        details: errors
                    }
                };
            }
            
            const tableClient = TableClient.fromConnectionString(connectionString, SERVICES_TABLE);
            
            // Проверяем есть ли уже такая услуга (для createdAt)
            let existingEntity;
            try {
                existingEntity = await tableClient.getEntity(PARTITION_KEY, serviceId);
            } catch (e) {
                existingEntity = null;
            }
            
            const now = new Date().toISOString();
            
            const entity = {
                partitionKey: PARTITION_KEY,
                rowKey: serviceId,
                serviceId: serviceId,
                
                // Названия на всех языках
                serviceName_LV: body.name.lv,
                serviceName_RU: body.name.ru,
                serviceName_EN: body.name.en,
                
                // Параметры услуги
                priceEUR: body.price,
                durationMinutes: body.duration,
                
                // Доступные форматы
                allowOnlineFormat: body.allowOnline === true,
                allowInPersonFormat: body.allowInPerson === true,
                
                // Статус и порядок
                isActive: body.isActive !== false,
                displayOrder: body.displayOrder || 0,
                
                // Версионирование
                version: (existingEntity?.version || 0) + 1,
                
                // Даты
                createdAt: existingEntity?.createdAt || now,
                lastModifiedAt: now
            };
            
            // Сохранение в основную таблицу
            await tableClient.upsertEntity(entity, 'Replace');
            
            // Сохранение в историю изменений (только при обновлении)
            if (existingEntity) {
                const historyTableClient = TableClient.fromConnectionString(connectionString, 'ServicesHistory');
                const historyEntry = {
                    partitionKey: serviceId,
                    rowKey: `v${entity.version}_${Date.now()}`,
                    
                    // Копируем все данные
                    ...entity,
                    
                    // Дополнительные поля для истории
                    modifiedBy: 'admin',
                    changeType: 'update'
                };
                
                await historyTableClient.createEntity(historyEntry);
            }
            
            return {
                status: 200,
                jsonBody: { 
                    success: true, 
                    message: 'Service updated successfully',
                    service: {
                        id: entity.serviceId,
                        name: body.name,
                        price: entity.priceEUR,
                        duration: entity.durationMinutes,
                        allowOnline: entity.allowOnlineFormat,
                        allowInPerson: entity.allowInPersonFormat,
                        isActive: entity.isActive,
                        displayOrder: entity.displayOrder
                    }
                }
            };
        } catch (error) {
            context.error('Error updating service:', error);
            return {
                status: 500,
                jsonBody: { error: error.message }
            };
        }
    }
});

/**
 * Получить историю изменений услуги
 * GET /api/dashboard/services/{serviceId}/history
 */
app.http('adminGetServiceHistory', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'dashboard/services/{serviceId}/history',
    handler: async (request, context) => {
        try {
            const serviceId = request.params.serviceId;
            const historyTableClient = TableClient.fromConnectionString(connectionString, 'ServicesHistory');
            const history = [];
            
            // Получаем все записи для этой услуги
            const queryOptions = { filter: `PartitionKey eq '${serviceId}'` };
            
            for await (const entity of historyTableClient.listEntities({ queryOptions })) {
                history.push({
                    version: entity.version,
                    modifiedAt: entity.lastModifiedAt,
                    modifiedBy: entity.modifiedBy || 'admin',
                    changeType: entity.changeType,
                    data: {
                        name: {
                            lv: entity.serviceName_LV,
                            ru: entity.serviceName_RU,
                            en: entity.serviceName_EN
                        },
                        price: entity.priceEUR,
                        duration: entity.durationMinutes,
                        allowOnline: entity.allowOnlineFormat,
                        allowInPerson: entity.allowInPersonFormat,
                        isActive: entity.isActive,
                        displayOrder: entity.displayOrder
                    }
                });
            }
            
            // Сортировка по версии (новые первые)
            history.sort((a, b) => b.version - a.version);
            
            return {
                status: 200,
                jsonBody: { 
                    serviceId,
                    history,
                    total: history.length
                }
            };
        } catch (error) {
            context.error('Error fetching service history:', error);
            return {
                status: 500,
                jsonBody: { error: error.message }
            };
        }
    }
});

// Initialize default services (migration)
app.http('adminInitializeServices', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'dashboard/services/initialize',
    handler: async (request, context) => {
        try {
            const tableClient = TableClient.fromConnectionString(connectionString, SERVICES_TABLE);
            
            const now = new Date().toISOString();
            
            const defaultServices = [
                {
                    partitionKey: PARTITION_KEY,
                    rowKey: 'cgm-diagnostic',
                    serviceId: 'cgm-diagnostic',
                    serviceId: 'cgm-diagnostic',
                    serviceName_LV: 'CGM diagnostika (60 min)',
                    serviceName_RU: 'CGM-диагностика (60 мін)',
                    serviceName_EN: 'CGM Diagnostic (60 min)',
                    priceEUR: 150,
                    durationMinutes: 60,
                    allowOnlineFormat: false,
                    allowInPersonFormat: true,
                    isActive: true,
                    displayOrder: 1,
                    version: 1,
                    createdAt: now,
                    lastModifiedAt: now
                },
                {
                    partitionKey: PARTITION_KEY,
                    rowKey: 'consultation',
                    serviceId: 'consultation',
                    serviceName_LV: 'Uztura konsultācija (60 min)',
                    serviceName_RU: 'Консультация по питанию (60 мін)',
                    serviceName_EN: 'Nutrition Consultation (60 min)',
                    priceEUR: 80,
                    durationMinutes: 60,
                    allowOnlineFormat: true,
                    allowInPersonFormat: true,
                    isActive: true,
                    displayOrder: 2,
                    version: 1,
                    createdAt: now,
                    lastModifiedAt: now
                },
                {
                    partitionKey: PARTITION_KEY,
                    rowKey: 'free-consultation',
                    serviceId: 'free-consultation',
                    serviceName_LV: 'Bezmaksas konsultācija (15 min)',
                    serviceName_RU: 'Бесплатная консультация (15 мін)',
                    serviceName_EN: 'Free Consultation (15 min)',
                    priceEUR: 0,
                    durationMinutes: 15,
                    allowOnlineFormat: true,
                    allowInPersonFormat: false,
                    isActive: true,
                    displayOrder: 3,
                    version: 1,
                    createdAt: now,
                    lastModifiedAt: now
                }
            ];
            
            let createdCount = 0;
            for (const service of defaultServices) {
                try {
                    await tableClient.createEntity(service);
                    createdCount++;
                } catch (e) {
                    if (e.statusCode === 409) {
                        context.log(`Service already exists: ${service.serviceId}`);
                    } else {
                        throw e;
                    }
                }
            }
            
            return {
                status: 200,
                jsonBody: { 
                    success: true, 
                    message: `Services table initialized with ${createdCount} new services`,
                    servicesCreated: createdCount,
                    services: defaultServices.map(s => ({
                        id: s.serviceId,
                        name: { lv: s.serviceName_LV, ru: s.serviceName_RU, en: s.serviceName_EN },
                        price: s.priceEUR,
                        duration: s.durationMinutes
                    }))
                }
            };
        } catch (error) {
            context.error('Error initializing services:', error);
            return {
                status: 500,
                jsonBody: { error: error.message }
            };
        }
    }
});
