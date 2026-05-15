/**
 * Booking Repository (TypeScript)
 * Handles data persistence for bookings (Azure Table Storage with in-memory fallback)
 */

import { TableClient } from '@azure/data-tables';
import type { Booking, BookingStatus } from '../types';
import { env, tables, booking as bookingConfig } from '../config';
import { sanitizeODataValue, validateDateFormat, validateTimeFormat } from '../utils/odataSanitizer';
import { createLogger } from '../utils/logger';

const logger = createLogger('BookingRepository');

// ============================================
// Types
// ============================================

export interface SlotLock {
  lockId: string;
  expiresAt: number;
}

export interface AcquireLockResult {
  success: boolean;
  lockId: string | null;
}

export interface SaveBookingResult {
  success: boolean;
  isAzure: boolean;
}

// ============================================
// State
// ============================================

const connectionString = env.azureStorageConnectionString;
let tableClient: TableClient | null = null;
let lockTableClient: TableClient | null = null;
const inMemoryBookings = new Map<string, Booking>();
const inMemoryLocks = new Map<string, SlotLock>();

// Lock configuration from centralized config
const LOCK_TTL_MS = bookingConfig.lockTtlMs;

logger.info('Initialized', { azureStorage: !!connectionString });

// ============================================
// Table Client Management
// ============================================

/**
 * Get or create the Azure Table client for bookings
 */
async function getTableClient(): Promise<TableClient | null> {
  if (!tableClient && connectionString) {
    tableClient = TableClient.fromConnectionString(connectionString, 'bookings');
    try {
      await tableClient.createTable();
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      // 409 = table already exists, which is fine
      if (err.statusCode !== 409) {
        console.error('Error creating table:', err.message);
      }
    }
  }
  return tableClient;
}

/**
 * Get or create the Azure Table client for slot locks
 */
async function getLockTableClient(): Promise<TableClient | null> {
  if (!lockTableClient && connectionString) {
    lockTableClient = TableClient.fromConnectionString(connectionString, 'slotlocks');
    try {
      await lockTableClient.createTable();
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      // 409 = table already exists, which is fine
      if (err.statusCode !== 409) {
        console.error('Error creating locks table:', err.message);
      }
    }
  }
  return lockTableClient;
}

// ============================================
// Slot Locking
// ============================================

/**
 * Acquire a lock on a time slot to prevent race conditions
 * Uses optimistic locking - only one request can acquire the lock
 */
export async function acquireSlotLock(date: string, time: string): Promise<AcquireLockResult> {
  const lockKey = `${date}_${time}`;
  const lockId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = Date.now();

  const client = await getLockTableClient();

  if (client) {
    try {
      // Try to create a new lock entity
      // If it already exists, Azure will throw 409 Conflict
      const lockEntity = {
        partitionKey: 'LOCK',
        rowKey: lockKey,
        lockId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(now + LOCK_TTL_MS).toISOString()
      };

      await client.createEntity(lockEntity);
      logger.debug(`Lock acquired for ${lockKey}`);
      return { success: true, lockId };
    } catch (error: unknown) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 409) {
        // Lock already exists - check if expired
        try {
          const existingLock = await client.getEntity('LOCK', lockKey);
          const expiresAt = new Date(existingLock.expiresAt as string).getTime();

          if (now > expiresAt) {
            // Lock expired, try to replace it
            const newLock = {
              partitionKey: 'LOCK',
              rowKey: lockKey,
              lockId,
              createdAt: new Date().toISOString(),
              expiresAt: new Date(now + LOCK_TTL_MS).toISOString()
            };
            await client.updateEntity(newLock, 'Replace', { etag: existingLock.etag });
            logger.debug(`Expired lock replaced for ${lockKey}`);
            return { success: true, lockId };
          }
        } catch {
          // Another request beat us to it
          logger.warn(`Could not replace expired lock for ${lockKey}`);
        }

        logger.debug(`Lock already held for ${lockKey}`);
        return { success: false, lockId: null };
      }
      throw error;
    }
  } else {
    // In-memory locking
    const existingLock = inMemoryLocks.get(lockKey);

    if (existingLock) {
      // Check if expired
      if (now > existingLock.expiresAt) {
        inMemoryLocks.delete(lockKey);
      } else {
        logger.debug(`In-memory lock already held for ${lockKey}`);
        return { success: false, lockId: null };
      }
    }

    inMemoryLocks.set(lockKey, {
      lockId,
      expiresAt: now + LOCK_TTL_MS
    });
    logger.debug(`In-memory lock acquired for ${lockKey}`);
    return { success: true, lockId };
  }
}

/**
 * Release a slot lock
 */
export async function releaseSlotLock(date: string, time: string, lockId: string): Promise<void> {
  const lockKey = `${date}_${time}`;

  const client = await getLockTableClient();

  if (client) {
    try {
      const existingLock = await client.getEntity('LOCK', lockKey);

      // Only release if we own the lock
      if (existingLock.lockId === lockId) {
        await client.deleteEntity('LOCK', lockKey, { etag: existingLock.etag });
        logger.debug(`Lock released for ${lockKey}`);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      // Lock might have expired or been replaced
      logger.warn(`Could not release lock for ${lockKey}`, err.message);
    }
  } else {
    // In-memory lock release
    const existingLock = inMemoryLocks.get(lockKey);
    if (existingLock && existingLock.lockId === lockId) {
      inMemoryLocks.delete(lockKey);
      logger.debug(`In-memory lock released for ${lockKey}`);
    }
  }
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Save or update a booking
 */
export async function saveBooking(booking: { id: string; date: string; [key: string]: unknown }): Promise<boolean> {
  const client = await getTableClient();

  if (client) {
    const entity = {
      partitionKey: booking.date,
      rowKey: booking.id,
      ...booking,
      createdAt: booking.createdAt || new Date().toISOString()
    };
    await client.upsertEntity(entity);
    logger.info('Booking saved to Azure Storage', booking.id);
    return true;
  } else {
    inMemoryBookings.set(booking.id, {
      ...booking,
      createdAt: booking.createdAt || new Date().toISOString()
    } as Booking);
    logger.warn('Booking saved to IN-MEMORY storage (not persistent!)', { id: booking.id, total: inMemoryBookings.size });
    return false;
  }
}

/**
 * Get a booking by ID
 */
export async function getBooking(bookingId: string): Promise<Booking | null> {
  // Sanitize bookingId to prevent OData injection
  const sanitizedId = sanitizeODataValue(bookingId);
  if (!sanitizedId) {
    console.warn('Invalid booking ID format:', bookingId);
    return null;
  }

  const client = await getTableClient();

  if (client) {
    const entities = client.listEntities({
      queryOptions: { filter: `RowKey eq '${sanitizedId}'` }
    });
    for await (const entity of entities) {
      return entity as unknown as Booking;
    }
    return null;
  } else {
    return inMemoryBookings.get(bookingId) || null;
  }
}

/**
 * Update an existing booking
 */
export async function updateBooking(booking: { id: string; date: string; [key: string]: unknown }): Promise<boolean> {
  return saveBooking(booking);
}

/**
 * Generate a unique booking ID
 */
export function generateBookingId(): string {
  return `SN-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Generate a payment confirmation token
 */
export function generatePaymentToken(bookingId: string, email: string): string {
  return Buffer.from(`${bookingId}:${email}`).toString('base64');
}

/**
 * Verify a payment confirmation token
 */
export function verifyPaymentToken(token: string, bookingId: string, email: string): boolean {
  const expected = Buffer.from(`${bookingId}:${email}`).toString('base64');
  return token === expected;
}

/**
 * Check if using Azure Table Storage or in-memory
 */
export function isUsingAzureStorage(): boolean {
  return !!connectionString;
}

/**
 * Check if a time slot is already booked (not cancelled)
 */
export async function isSlotBooked(date: string, time: string): Promise<boolean> {
  // Validate and sanitize inputs to prevent OData injection
  const sanitizedDate = validateDateFormat(date);
  const sanitizedTime = validateTimeFormat(time);

  if (!sanitizedDate) {
    console.warn('Invalid date format for slot check:', date);
    return false; // Invalid date format - treat as not booked
  }

  const client = await getTableClient();

  if (client) {
    // Query all bookings for this date using sanitized value
    const entities = client.listEntities({
      queryOptions: { filter: `PartitionKey eq '${sanitizedDate}'` }
    });

    for await (const entity of entities) {
      // Check if same time and not cancelled
      if (entity.time === sanitizedTime && entity.status !== 'cancelled') {
        return true;
      }
    }
    return false;
  } else {
    // In-memory check
    for (const [, booking] of inMemoryBookings) {
      if (booking.date === date && booking.time === time && booking.status !== 'cancelled') {
        return true;
      }
    }
    return false;
  }
}

/**
 * Get all bookings from in-memory storage (for debugging)
 */
export function getAllInMemoryBookings(): Booking[] {
  return Array.from(inMemoryBookings.values());
}

// ============================================
// CommonJS exports for backward compatibility
// ============================================

module.exports = {
  saveBooking,
  getBooking,
  updateBooking,
  generateBookingId,
  generatePaymentToken,
  verifyPaymentToken,
  isUsingAzureStorage,
  isSlotBooked,
  getAllInMemoryBookings,
  acquireSlotLock,
  releaseSlotLock,
  LOCK_TTL_MS
};
