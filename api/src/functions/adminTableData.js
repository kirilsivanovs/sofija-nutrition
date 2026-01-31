const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');
const { checkAuthorization, unauthorizedResponse } = require('../utils/authMiddleware');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

// List all entities from a table (for admin data viewer)
app.http('adminGetTableData', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'dashboard/tables/{tableName}',
    handler: async (request, context) => {
        // Проверяем авторизацию (SWA auth или E2E token)
        const auth = checkAuthorization(request);
        if (!auth.authorized) {
            return unauthorizedResponse(auth.error);
        }

        try {
            const tableName = request.params.tableName;
            
            // Only allow specific tables for security
            const allowedTables = ['bookings', 'adminSettings'];
            if (!allowedTables.includes(tableName)) {
                return {
                    status: 400,
                    jsonBody: { error: 'Table not allowed', allowedTables }
                };
            }

            const tableClient = TableClient.fromConnectionString(
                connectionString,
                tableName
            );

            const entities = [];
            
            try {
                for await (const entity of tableClient.listEntities()) {
                    // Convert entity to a cleaner format
                    const cleanEntity = {};
                    for (const [key, value] of Object.entries(entity)) {
                        // Skip internal Azure properties
                        if (key === 'odata.etag' || key === 'odata.metadata') continue;
                        
                        // Handle Date objects
                        if (value instanceof Date) {
                            cleanEntity[key] = value.toISOString();
                        } else {
                            cleanEntity[key] = value;
                        }
                    }
                    entities.push(cleanEntity);
                }
            } catch (e) {
                // Table might not exist yet
                if (e.statusCode === 404) {
                    return {
                        status: 200,
                        jsonBody: { 
                            tableName, 
                            entities: [],
                            columns: [],
                            message: 'Table does not exist yet'
                        }
                    };
                }
                throw e;
            }

            // Get all unique column names
            const columnsSet = new Set();
            entities.forEach(entity => {
                Object.keys(entity).forEach(key => columnsSet.add(key));
            });
            
            // Sort columns - put important ones first
            const priorityColumns = ['partitionKey', 'rowKey', 'id', 'name', 'email', 'date', 'time', 'status', 'createdAt'];
            const columns = [
                ...priorityColumns.filter(c => columnsSet.has(c)),
                ...Array.from(columnsSet).filter(c => !priorityColumns.includes(c)).sort()
            ];

            return {
                status: 200,
                jsonBody: { 
                    tableName, 
                    entities,
                    columns,
                    count: entities.length
                }
            };
        } catch (error) {
            context.error('Error fetching table data:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to fetch table data', details: error.message }
            };
        }
    }
});

// Delete entity from table
app.http('adminDeleteTableEntity', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'dashboard/tables/{tableName}/{partitionKey}/{rowKey}',
    handler: async (request, context) => {
        // Проверяем авторизацию (SWA auth или E2E token)
        const auth = checkAuthorization(request);
        if (!auth.authorized) {
            return unauthorizedResponse(auth.error);
        }

        try {
            const { tableName, partitionKey, rowKey } = request.params;
            
            // Only allow specific tables
            const allowedTables = ['bookings', 'adminSettings'];
            if (!allowedTables.includes(tableName)) {
                return {
                    status: 400,
                    jsonBody: { error: 'Table not allowed' }
                };
            }

            const tableClient = TableClient.fromConnectionString(
                connectionString,
                tableName
            );

            await tableClient.deleteEntity(decodeURIComponent(partitionKey), decodeURIComponent(rowKey));

            return {
                status: 200,
                jsonBody: { success: true, message: 'Entity deleted' }
            };
        } catch (error) {
            context.error('Error deleting entity:', error);
            return {
                status: 500,
                jsonBody: { error: 'Failed to delete entity', details: error.message }
            };
        }
    }
});
