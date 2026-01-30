const { TableServiceClient } = require('@azure/data-tables');
const fs = require('fs');
const path = require('path');

// Load connection string from local.settings.json
const settingsPath = path.join(__dirname, '..', 'local.settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const connectionString = settings.Values.AZURE_STORAGE_CONNECTION_STRING;

const TABLES = [
    'Services',
    'ServicesHistory',
    'AuditLogs',
    'AppConfig',
    'FeatureFlags'
];

async function createTables() {
    const serviceClient = TableServiceClient.fromConnectionString(connectionString);
    
    console.log('Creating tables...\n');
    
    for (const tableName of TABLES) {
        try {
            await serviceClient.createTable(tableName);
            console.log(`✅ Created table: ${tableName}`);
        } catch (error) {
            if (error.statusCode === 409) {
                console.log(`⚠️  Table already exists: ${tableName}`);
            } else {
                console.error(`❌ Error creating ${tableName}:`, error.message);
            }
        }
    }
    
    console.log('\n✨ Done!');
}

createTables().catch(console.error);
