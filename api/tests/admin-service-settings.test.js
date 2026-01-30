const { TableClient } = require('@azure/data-tables');
const fs = require('fs');
const path = require('path');

// Load connection string from local.settings.json
const settingsPath = path.join(__dirname, '..', 'local.settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const connectionString = settings.Values.AZURE_STORAGE_CONNECTION_STRING;

describe('Admin Service Settings Integration Tests', () => {
    const API_BASE = 'http://localhost:7071/api';
    
    beforeAll(async () => {
        // Очистка тестовых данных перед запуском
        const tableClient = TableClient.fromConnectionString(connectionString, 'Services');
        try {
            for await (const entity of tableClient.listEntities()) {
                if (entity.partitionKey === 'SERVICE' && entity.serviceId.startsWith('test-')) {
                    await tableClient.deleteEntity(entity.partitionKey, entity.rowKey);
                }
            }
        } catch (e) {
            // Таблица может не существовать
        }
    });
    
    describe('GET /api/dashboard/services', () => {
        it('should return list of services', async () => {
            const response = await fetch(`${API_BASE}/dashboard/services`);
            expect(response.status).toBe(200);
            
            const data = await response.json();
            expect(data).toHaveProperty('services');
            expect(Array.isArray(data.services)).toBe(true);
        });
        
        it('should return services with correct structure', async () => {
            // Сначала создадим тестовую услугу
            await fetch(`${API_BASE}/dashboard/services/test-service-1`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: {
                        lv: 'Test LV',
                        ru: 'Test RU',
                        en: 'Test EN'
                    },
                    price: 50,
                    duration: 30,
                    allowOnline: true,
                    allowInPerson: true,
                    isActive: true,
                    displayOrder: 999
                })
            });
            
            const response = await fetch(`${API_BASE}/dashboard/services`);
            const data = await response.json();
            
            const testService = data.services.find(s => s.id === 'test-service-1');
            expect(testService).toBeDefined();
            expect(testService.name).toEqual({
                lv: 'Test LV',
                ru: 'Test RU',
                en: 'Test EN'
            });
            expect(testService.price).toBe(50);
            expect(testService.duration).toBe(30);
            expect(testService.allowOnline).toBe(true);
            expect(testService.allowInPerson).toBe(true);
        });
    });
    
    describe('PUT /api/dashboard/services/{serviceId}', () => {
        it('should create a new service', async () => {
            const response = await fetch(`${API_BASE}/dashboard/services/test-new-service`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: {
                        lv: 'Jauna pakalpojuma',
                        ru: 'Новая услуга',
                        en: 'New Service'
                    },
                    price: 100,
                    duration: 60,
                    allowOnline: true,
                    allowInPerson: false,
                    isActive: true,
                    displayOrder: 1
                })
            });
            
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.service.id).toBe('test-new-service');
        });
        
        it('should update existing service', async () => {
            // Создаем услугу
            await fetch(`${API_BASE}/dashboard/services/test-update-service`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: { lv: 'Original', ru: 'Original', en: 'Original' },
                    price: 50,
                    duration: 30,
                    allowOnline: true,
                    allowInPerson: true,
                    isActive: true,
                    displayOrder: 1
                })
            });
            
            // Обновляем
            const updateResponse = await fetch(`${API_BASE}/dashboard/services/test-update-service`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: { lv: 'Updated', ru: 'Updated', en: 'Updated' },
                    price: 75,
                    duration: 45,
                    allowOnline: false,
                    allowInPerson: true,
                    isActive: true,
                    displayOrder: 2
                })
            });
            
            expect(updateResponse.status).toBe(200);
            const data = await updateResponse.json();
            expect(data.service.name.lv).toBe('Updated');
            expect(data.service.price).toBe(75);
            expect(data.service.duration).toBe(45);
            expect(data.service.allowOnline).toBe(false);
        });
        
        it('should reject invalid data - missing name', async () => {
            const response = await fetch(`${API_BASE}/dashboard/services/test-invalid-1`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    price: 50,
                    duration: 30,
                    allowOnline: true,
                    allowInPerson: true
                })
            });
            
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Validation failed');
        });
        
        it('should reject invalid data - negative price', async () => {
            const response = await fetch(`${API_BASE}/dashboard/services/test-invalid-2`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: { lv: 'Test', ru: 'Test', en: 'Test' },
                    price: -10,
                    duration: 30,
                    allowOnline: true,
                    allowInPerson: true
                })
            });
            
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.details).toContain('Price must be a positive number');
        });
        
        it('should reject invalid data - invalid duration', async () => {
            const response = await fetch(`${API_BASE}/dashboard/services/test-invalid-3`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: { lv: 'Test', ru: 'Test', en: 'Test' },
                    price: 50,
                    duration: 200, // Больше 180 минут
                    allowOnline: true,
                    allowInPerson: true
                })
            });
            
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.details).toContain('Duration must be between 5 and 180 minutes');
        });
        
        it('should reject when both formats are disabled', async () => {
            const response = await fetch(`${API_BASE}/dashboard/services/test-invalid-4`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: { lv: 'Test', ru: 'Test', en: 'Test' },
                    price: 50,
                    duration: 30,
                    allowOnline: false,
                    allowInPerson: false
                })
            });
            
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.details).toContain('At least one format (online or in-person) must be enabled');
        });
    });
    
    describe('GET /api/dashboard/services/{serviceId}/history', () => {
        it('should return version history after updates', async () => {
            const serviceId = 'test-history-service';
            
            // Создаем услугу
            await fetch(`${API_BASE}/dashboard/services/${serviceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: { lv: 'v1', ru: 'v1', en: 'v1' },
                    price: 50,
                    duration: 30,
                    allowOnline: true,
                    allowInPerson: true,
                    isActive: true,
                    displayOrder: 1
                })
            });
            
            // Обновляем несколько раз
            await fetch(`${API_BASE}/dashboard/services/${serviceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: { lv: 'v2', ru: 'v2', en: 'v2' },
                    price: 60,
                    duration: 30,
                    allowOnline: true,
                    allowInPerson: true,
                    isActive: true,
                    displayOrder: 1
                })
            });
            
            await fetch(`${API_BASE}/dashboard/services/${serviceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: { lv: 'v3', ru: 'v3', en: 'v3' },
                    price: 70,
                    duration: 30,
                    allowOnline: true,
                    allowInPerson: true,
                    isActive: true,
                    displayOrder: 1
                })
            });
            
            // Получаем историю
            const response = await fetch(`${API_BASE}/dashboard/services/${serviceId}/history`);
            expect(response.status).toBe(200);
            
            const data = await response.json();
            expect(data.serviceId).toBe(serviceId);
            expect(data.history.length).toBeGreaterThanOrEqual(2); // v2 и v3 должны быть в истории
            expect(data.history[0].version).toBeGreaterThan(data.history[1].version); // Сортировка по убыванию
        });
    });
    
    afterAll(async () => {
        // Очистка тестовых данных после всех тестов
        const tableClient = TableClient.fromConnectionString(connectionString, 'Services');
        try {
            for await (const entity of tableClient.listEntities()) {
                if (entity.partitionKey === 'SERVICE' && entity.serviceId.startsWith('test-')) {
                    await tableClient.deleteEntity(entity.partitionKey, entity.rowKey);
                }
            }
        } catch (e) {
            console.error('Cleanup error:', e);
        }
        
        // Очистка истории
        const historyTableClient = TableClient.fromConnectionString(connectionString, 'ServicesHistory');
        try {
            for await (const entity of historyTableClient.listEntities()) {
                if (entity.partitionKey.startsWith('test-')) {
                    await historyTableClient.deleteEntity(entity.partitionKey, entity.rowKey);
                }
            }
        } catch (e) {
            console.error('History cleanup error:', e);
        }
    });
});
