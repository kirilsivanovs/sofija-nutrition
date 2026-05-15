/**
 * Admin Service Settings Functions
 * Handle admin operations for managing services
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { TableClient } from '@azure/data-tables';
import { checkAuthorization, unauthorizedResponse } from '../../utils/authMiddleware';
import { sanitizeODataValue } from '../../utils/odataSanitizer';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const SERVICES_TABLE = 'Services';
const PARTITION_KEY = 'SERVICE';

interface ServiceName {
  lv: string;
  ru: string;
  en: string;
}

interface ServiceEntity {
  partitionKey: string;
  rowKey: string;
  serviceId: string;
  serviceName_LV: string;
  serviceName_RU: string;
  serviceName_EN: string;
  priceEUR: number;
  durationMinutes: number;
  allowOnlineFormat: boolean;
  allowInPersonFormat: boolean;
  isActive: boolean;
  displayOrder: number;
  version?: number;
  createdAt?: string;
  lastModifiedAt?: string;
}

interface ServiceResponse {
  id: string;
  name: ServiceName;
  price: number;
  duration: number;
  allowOnline: boolean;
  allowInPerson: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  lastModifiedAt?: string;
}

interface UpdateServiceBody {
  name: ServiceName;
  price: number;
  duration: number;
  allowOnline: boolean;
  allowInPerson: boolean;
  isActive?: boolean;
  displayOrder?: number;
}

interface ServiceHistoryEntry {
  version: number;
  modifiedAt?: string;
  modifiedBy: string;
  changeType: string;
  data: {
    name: ServiceName;
    price: number;
    duration: number;
    allowOnline: boolean;
    allowInPerson: boolean;
    isActive: boolean;
    displayOrder: number;
  };
}

// Get all active services
app.http('adminGetServiceSettings', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'dashboard/services',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const auth = checkAuthorization(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    try {
      const tableClient = TableClient.fromConnectionString(connectionString, SERVICES_TABLE);
      const services: ServiceResponse[] = [];

      for await (const entity of tableClient.listEntities<ServiceEntity>()) {
        if (entity.partitionKey === PARTITION_KEY) {
          services.push({
            id: entity.serviceId,
            name: {
              lv: entity.serviceName_LV,
              ru: entity.serviceName_RU,
              en: entity.serviceName_EN,
            },
            price: entity.priceEUR,
            duration: entity.durationMinutes,
            allowOnline: entity.allowOnlineFormat === true,
            allowInPerson: entity.allowInPersonFormat === true,
            isActive: entity.isActive !== false,
            displayOrder: entity.displayOrder || 0,
            createdAt: entity.createdAt,
            lastModifiedAt: entity.lastModifiedAt,
          });
        }
      }

      services.sort((a, b) => a.displayOrder - b.displayOrder);

      return {
        status: 200,
        jsonBody: { services },
      };
    } catch (error) {
      const err = error as Error;
      context.error('Error fetching services:', err);
      return {
        status: 500,
        jsonBody: { error: err.message },
      };
    }
  },
});

// Update service settings
app.http('adminUpdateServiceSettings', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'dashboard/services/{serviceId}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const auth = checkAuthorization(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    try {
      const serviceId = request.params.serviceId;
      const body = (await request.json()) as UpdateServiceBody;

      // Validation
      const errors: string[] = [];

      if (!body.name || !body.name.lv || !body.name.ru || !body.name.en) {
        errors.push('Service name is required in all languages (lv, ru, en)');
      }

      if (typeof body.price !== 'number' || body.price < 0) {
        errors.push('Price must be a positive number');
      }

      if (typeof body.duration !== 'number' || body.duration < 5 || body.duration > 180) {
        errors.push('Duration must be between 5 and 180 minutes');
      }

      if (!body.allowOnline && !body.allowInPerson) {
        errors.push('At least one format (online or in-person) must be enabled');
      }

      if (
        body.displayOrder !== undefined &&
        (typeof body.displayOrder !== 'number' || body.displayOrder < 0)
      ) {
        errors.push('Display order must be a non-negative number');
      }

      if (errors.length > 0) {
        return {
          status: 400,
          jsonBody: {
            error: 'Validation failed',
            details: errors,
          },
        };
      }

      const tableClient = TableClient.fromConnectionString(connectionString, SERVICES_TABLE);

      let existingEntity: ServiceEntity | null = null;
      try {
        existingEntity = await tableClient.getEntity<ServiceEntity>(PARTITION_KEY, serviceId!);
      } catch {
        existingEntity = null;
      }

      const now = new Date().toISOString();

      const entity: ServiceEntity = {
        partitionKey: PARTITION_KEY,
        rowKey: serviceId!,
        serviceId: serviceId!,
        serviceName_LV: body.name.lv,
        serviceName_RU: body.name.ru,
        serviceName_EN: body.name.en,
        priceEUR: body.price,
        durationMinutes: body.duration,
        allowOnlineFormat: body.allowOnline === true,
        allowInPersonFormat: body.allowInPerson === true,
        isActive: body.isActive !== false,
        displayOrder: body.displayOrder || 0,
        version: (existingEntity?.version || 0) + 1,
        createdAt: existingEntity?.createdAt || now,
        lastModifiedAt: now,
      };

      await tableClient.upsertEntity(entity, 'Replace');

      // Save to history if updating
      if (existingEntity) {
        const historyTableClient = TableClient.fromConnectionString(
          connectionString,
          'ServicesHistory'
        );
        const historyEntry = {
          ...entity,
          partitionKey: serviceId!,
          rowKey: `v${entity.version}_${Date.now()}`,
          modifiedBy: 'admin',
          changeType: 'update',
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
            displayOrder: entity.displayOrder,
          },
        },
      };
    } catch (error) {
      const err = error as Error;
      context.error('Error updating service:', err);
      return {
        status: 500,
        jsonBody: { error: err.message },
      };
    }
  },
});

// Get service history
app.http('adminGetServiceHistory', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'dashboard/services/{serviceId}/history',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const auth = checkAuthorization(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    try {
      const serviceId = request.params.serviceId;

      const sanitizedServiceId = sanitizeODataValue(serviceId || '');
      if (!sanitizedServiceId) {
        return {
          status: 400,
          jsonBody: { success: false, error: 'Invalid service ID format' },
        };
      }

      const historyTableClient = TableClient.fromConnectionString(
        connectionString,
        'ServicesHistory'
      );
      const history: ServiceHistoryEntry[] = [];

      for await (const entity of historyTableClient.listEntities<
        ServiceEntity & { modifiedBy?: string; changeType?: string }
      >()) {
        // Filter by partition key manually
        if (entity.partitionKey !== sanitizedServiceId) continue;
        history.push({
          version: entity.version || 0,
          modifiedAt: entity.lastModifiedAt,
          modifiedBy: entity.modifiedBy || 'admin',
          changeType: entity.changeType || 'update',
          data: {
            name: {
              lv: entity.serviceName_LV,
              ru: entity.serviceName_RU,
              en: entity.serviceName_EN,
            },
            price: entity.priceEUR,
            duration: entity.durationMinutes,
            allowOnline: entity.allowOnlineFormat,
            allowInPerson: entity.allowInPersonFormat,
            isActive: entity.isActive,
            displayOrder: entity.displayOrder,
          },
        });
      }

      history.sort((a, b) => b.version - a.version);

      return {
        status: 200,
        jsonBody: {
          serviceId,
          history,
          total: history.length,
        },
      };
    } catch (error) {
      const err = error as Error;
      context.error('Error fetching service history:', err);
      return {
        status: 500,
        jsonBody: { error: err.message },
      };
    }
  },
});

// Initialize default services
app.http('adminInitializeServices', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'dashboard/services/initialize',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const auth = checkAuthorization(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    try {
      const tableClient = TableClient.fromConnectionString(connectionString, SERVICES_TABLE);

      const now = new Date().toISOString();

      const defaultServices: ServiceEntity[] = [
        {
          partitionKey: PARTITION_KEY,
          rowKey: 'cgm-diagnostic',
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
          lastModifiedAt: now,
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
          lastModifiedAt: now,
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
          lastModifiedAt: now,
        },
      ];

      let createdCount = 0;
      for (const service of defaultServices) {
        try {
          await tableClient.createEntity(service);
          createdCount++;
        } catch (e) {
          const err = e as { statusCode?: number };
          if (err.statusCode === 409) {
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
          services: defaultServices.map((s) => ({
            id: s.serviceId,
            name: { lv: s.serviceName_LV, ru: s.serviceName_RU, en: s.serviceName_EN },
            price: s.priceEUR,
            duration: s.durationMinutes,
          })),
        },
      };
    } catch (error) {
      const err = error as Error;
      context.error('Error initializing services:', err);
      return {
        status: 500,
        jsonBody: { error: err.message },
      };
    }
  },
});
