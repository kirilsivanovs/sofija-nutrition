import { TableClient } from '@azure/data-tables';
import { ClientSecretCredential } from '@azure/identity';

let sharedCredential: ClientSecretCredential | undefined;

export function isTableStorageConfigured(): boolean {
  return !!(process.env.STORAGE_TABLE_ENDPOINT || process.env.AZURE_STORAGE_CONNECTION_STRING);
}

function requireSetting(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function getCredential(): ClientSecretCredential {
  if (!sharedCredential) {
    sharedCredential = new ClientSecretCredential(
      requireSetting('STORAGE_TENANT_ID'),
      requireSetting('STORAGE_CLIENT_ID'),
      requireSetting('STORAGE_CLIENT_SECRET')
    );
  }
  return sharedCredential;
}

export function createTableClient(tableName: string): TableClient {
  const endpoint = process.env.STORAGE_TABLE_ENDPOINT;
  if (endpoint) {
    return new TableClient(endpoint, tableName, getCredential());
  }

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (connectionString) {
    // Local Azurite only: production disables Shared Key on the account.
    return TableClient.fromConnectionString(connectionString, tableName);
  }

  throw new Error('Table Storage is not configured');
}
