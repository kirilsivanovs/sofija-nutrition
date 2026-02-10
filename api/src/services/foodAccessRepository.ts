import { TableClient } from '@azure/data-tables';

export interface FoodAccessRecord {
  userId: string;
  enabled: boolean;
  displayName?: string;
  email?: string;
  updatedAt?: string;
}

const ACCESS_EMAIL_SCAN_LIMIT = 2000;

export class FoodAccessRepository {
  private tableClient: TableClient;
  private tableReady: Promise<void> | null = null;

  constructor(connectionString: string, tableName = 'FoodAccess') {
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
    }
    this.tableClient = TableClient.fromConnectionString(connectionString, tableName);
  }

  private async ensureTable(): Promise<void> {
    if (!this.tableReady) {
      this.tableReady = this.tableClient.createTable().catch((error: unknown) => {
        const err = error as { statusCode?: number; message?: string };
        if (err.statusCode !== 409) {
          throw error;
        }
      });
    }

    return this.tableReady;
  }

  private toEntity(record: FoodAccessRecord) {
    const entity: Record<string, unknown> = {
      partitionKey: 'ACCESS',
      rowKey: record.userId,
      userId: record.userId,
      enabled: record.enabled,
      updatedAt: record.updatedAt || new Date().toISOString(),
    };

    if (record.displayName) entity.displayName = record.displayName;
    if (record.email) entity.email = record.email;

    return entity;
  }

  private fromEntity(entity: Record<string, unknown>): FoodAccessRecord {
    return {
      userId: String((entity.userId ?? entity.rowKey) || ''),
      enabled: Boolean(entity.enabled ?? false),
      displayName: entity.displayName ? String(entity.displayName) : undefined,
      email: entity.email ? String(entity.email) : undefined,
      updatedAt: entity.updatedAt ? String(entity.updatedAt) : undefined,
    };
  }

  async getAccess(userId: string): Promise<FoodAccessRecord | null> {
    try {
      await this.ensureTable();
      const entity = await this.tableClient.getEntity('ACCESS', userId);
      return this.fromEntity(entity as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  async setAccess(
    userId: string,
    enabled: boolean,
    meta?: { displayName?: string; email?: string }
  ): Promise<FoodAccessRecord> {
    await this.ensureTable();
    const record: FoodAccessRecord = {
      userId,
      enabled,
      displayName: meta?.displayName,
      email: meta?.email,
      updatedAt: new Date().toISOString(),
    };
    const entity = this.toEntity(record);
    await this.tableClient.upsertEntity(entity as any, 'Merge');
    return record;
  }

  async listAccess(limit = 500): Promise<FoodAccessRecord[]> {
    await this.ensureTable();
    const entities = this.tableClient.listEntities({
      queryOptions: { filter: "PartitionKey eq 'ACCESS'" },
    });

    const results: FoodAccessRecord[] = [];
    for await (const entity of entities) {
      results.push(this.fromEntity(entity as Record<string, unknown>));
      if (results.length >= limit) break;
    }

    return results;
  }

  async findAccessByEmail(email: string, excludeUserId?: string): Promise<FoodAccessRecord | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;

    const accessList = await this.listAccess(ACCESS_EMAIL_SCAN_LIMIT);
    for (const record of accessList) {
      const recordEmail = record.email?.trim().toLowerCase() || '';
      if (recordEmail !== normalized) continue;
      if (excludeUserId && record.userId === excludeUserId) continue;
      return record;
    }

    return null;
  }
}
