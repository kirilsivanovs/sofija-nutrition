const { TableServiceClient, TableClient } = require('@azure/data-tables');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '..', 'local.settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const connectionString = settings.Values.AZURE_STORAGE_CONNECTION_STRING;

async function listAllTables() {
    const serviceClient = TableServiceClient.fromConnectionString(connectionString);
    
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║           ТАБЛИЦЫ В AZURE TABLE STORAGE                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    const tables = [];
    
    for await (const table of serviceClient.listTables()) {
        const tableClient = TableClient.fromConnectionString(connectionString, table.name);
        let count = 0;
        
        try {
            for await (const entity of tableClient.listEntities()) {
                count++;
                if (count > 1000) break; // Limit for performance
            }
        } catch (e) {
            count = 'error';
        }
        
        tables.push({ name: table.name, count });
    }
    
    // Sort by name
    tables.sort((a, b) => a.name.localeCompare(b.name));
    
    // Categorize tables
    const essential = ['bookings', 'adminSettings', 'Services'];
    const useful = ['AppConfig', 'FeatureFlags', 'AuditLogs', 'ServicesHistory'];
    
    console.log('✅ КРИТИЧЕСКИ ВАЖНЫЕ (без них приложение не работает):');
    tables.filter(t => essential.includes(t.name)).forEach(t => {
        console.log(`   📊 ${t.name.padEnd(25)} ${String(t.count).padStart(6)} записей`);
    });
    
    console.log('\n📦 ПОЛЕЗНЫЕ (улучшают систему, но не критичны):');
    tables.filter(t => useful.includes(t.name)).forEach(t => {
        console.log(`   📊 ${t.name.padEnd(25)} ${String(t.count).padStart(6)} записей`);
    });
    
    console.log('\n📁 ОСТАЛЬНЫЕ:');
    tables.filter(t => !essential.includes(t.name) && !useful.includes(t.name)).forEach(t => {
        console.log(`   📊 ${t.name.padEnd(25)} ${String(t.count).padStart(6)} записей`);
    });
    
    console.log('\n' + '='.repeat(64));
    console.log(`ИТОГО: ${tables.length} таблиц`);
    console.log('='.repeat(64) + '\n');
}

listAllTables().catch(console.error);
