const { TableServiceClient } = require('@azure/data-tables');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '..', 'local.settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const connectionString = settings.Values.AZURE_STORAGE_CONNECTION_STRING;

const TABLES_TO_DELETE = ['AppConfig', 'AuditLogs'];

async function deleteTables() {
    const serviceClient = TableServiceClient.fromConnectionString(connectionString);
    
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║           УДАЛЕНИЕ ИЗБЫТОЧНЫХ ТАБЛИЦ                         ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    for (const tableName of TABLES_TO_DELETE) {
        try {
            await serviceClient.deleteTable(tableName);
            console.log(`✅ Удалена: ${tableName}`);
        } catch (error) {
            if (error.statusCode === 404) {
                console.log(`⚠️  Не найдена: ${tableName}`);
            } else {
                console.error(`❌ Ошибка при удалении ${tableName}:`, error.message);
            }
        }
    }
    
    console.log('\n✨ Готово!\n');
}

deleteTables().catch(console.error);
