/**
 * Mock for @azure/data-tables
 * Used in Jest tests to avoid ESM issues with Azure SDK
 */

// Mock entity storage
const mockTables = new Map();

// Initialize with seed data for critical tests
function initializeSeedData() {
    // Services table
    const servicesTable = new Map();
    const services = [
        { partitionKey: 'SERVICE', rowKey: 'initial', serviceName_LV: 'Sākotnējā konsultācija', serviceName_EN: 'Initial Consultation', serviceName_RU: 'Первичная консультация', priceEUR: 75, durationMinutes: 60, isActive: true, allowOnlineFormat: true, allowInPersonFormat: true },
        { partitionKey: 'SERVICE', rowKey: 'followup', serviceName_LV: 'Atkārtota konsultācija', serviceName_EN: 'Follow-up Consultation', serviceName_RU: 'Повторная консультация', priceEUR: 55, durationMinutes: 45, isActive: true, allowOnlineFormat: true, allowInPersonFormat: true },
        { partitionKey: 'SERVICE', rowKey: 'free-consultation', serviceName_LV: 'Bezmaksas 15 min konsultācija', serviceName_EN: 'Free 15 min Consultation', serviceName_RU: 'Бесплатная 15 мин консультация', priceEUR: 0, durationMinutes: 15, isActive: true, allowOnlineFormat: true, allowInPersonFormat: false }
    ];
    services.forEach(s => servicesTable.set(`${s.partitionKey}-${s.rowKey}`, s));
    mockTables.set('Services', servicesTable);

    // FeatureFlags table
    const flagsTable = new Map();
    const flags = [
        { partitionKey: 'FLAGS', rowKey: 'email_reminders', enabled: true, description: 'Send email reminders' },
        { partitionKey: 'FLAGS', rowKey: 'cgm_diagnostic_booking', enabled: true, description: 'Allow CGM diagnostic bookings' }
    ];
    flags.forEach(f => flagsTable.set(`${f.partitionKey}-${f.rowKey}`, f));
    mockTables.set('FeatureFlags', flagsTable);

    // Bookings table (empty initially)
    mockTables.set('bookings', new Map());
}

// Initialize seed data on load
initializeSeedData();

class MockTableClient {
    constructor(connectionString, tableName) {
        this.tableName = tableName;
        if (!mockTables.has(tableName)) {
            mockTables.set(tableName, new Map());
        }
    }

    static fromConnectionString(connectionString, tableName) {
        return new MockTableClient(connectionString, tableName);
    }

    async createTable() {
        return Promise.resolve();
    }

    async createEntity(entity) {
        const key = `${entity.partitionKey}-${entity.rowKey}`;
        mockTables.get(this.tableName).set(key, { ...entity });
        return Promise.resolve();
    }

    async getEntity(partitionKey, rowKey) {
        const key = `${partitionKey}-${rowKey}`;
        const entity = mockTables.get(this.tableName).get(key);
        if (!entity) {
            const error = new Error('Entity not found');
            error.statusCode = 404;
            throw error;
        }
        return Promise.resolve(entity);
    }

    async updateEntity(entity, mode = 'Merge') {
        const key = `${entity.partitionKey}-${entity.rowKey}`;
        const existing = mockTables.get(this.tableName).get(key);
        if (mode === 'Merge' && existing) {
            mockTables.get(this.tableName).set(key, { ...existing, ...entity });
        } else {
            mockTables.get(this.tableName).set(key, { ...entity });
        }
        return Promise.resolve();
    }

    async deleteEntity(partitionKey, rowKey) {
        const key = `${partitionKey}-${rowKey}`;
        mockTables.get(this.tableName).delete(key);
        return Promise.resolve();
    }

    listEntities(options = {}) {
        const table = mockTables.get(this.tableName);
        const entities = Array.from(table.values());
        
        return {
            [Symbol.asyncIterator]: async function* () {
                for (const entity of entities) {
                    yield entity;
                }
            }
        };
    }
}

// Helper to clear all mock data between tests
function clearMockTables() {
    mockTables.clear();
    initializeSeedData();
}

module.exports = {
    TableClient: MockTableClient,
    clearMockTables
};
