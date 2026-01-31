/**
 * Booking Repository
 * Handles data persistence for bookings (Azure Table Storage with in-memory fallback)
 */

const { TableClient } = require('@azure/data-tables');
const { sanitizeODataValue, validateDateFormat, validateTimeFormat } = require('../utils/odataSanitizer');
const { env, tables, booking: bookingConfig } = require('../config');

const connectionString = env.azureStorageConnectionString;
let tableClient = null;
let lockTableClient = null;
const inMemoryBookings = new Map();
const inMemoryLocks = new Map();

// Lock configuration from centralized config
const LOCK_TTL_MS = bookingConfig.lockTtlMs;

console.log('📦 BookingRepository initialized');
console.log('   Azure Storage:', connectionString ? '✅ Configured' : '⚠️ Not configured (using in-memory)');

/**
 * Get or create the Azure Table client for bookings
 */
async function getTableClient() {
    if (!tableClient && connectionString) {
        tableClient = TableClient.fromConnectionString(connectionString, 'bookings');
        try {
            await tableClient.createTable();
        } catch (error) {
            // 409 = table already exists, which is fine
            if (error.statusCode !== 409) {
                console.error('Error creating table:', error.message);
            }
        }
    }
    return tableClient;
}

/**
 * Get or create the Azure Table client for slot locks
 */
async function getLockTableClient() {
    if (!lockTableClient && connectionString) {
        lockTableClient = TableClient.fromConnectionString(connectionString, 'slotlocks');
        try {
            await lockTableClient.createTable();
        } catch (error) {
            // 409 = table already exists, which is fine
            if (error.statusCode !== 409) {
                console.error('Error creating locks table:', error.message);
            }
        }
    }
    return lockTableClient;
}

/**
 * Acquire a lock on a time slot to prevent race conditions
 * Uses optimistic locking - only one request can acquire the lock
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:MM format
 * @returns {Promise<{success: boolean, lockId: string|null}>}
 */
async function acquireSlotLock(date, time) {
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
            console.log(`🔒 Lock acquired for ${lockKey}`);
            return { success: true, lockId };
        } catch (error) {
            if (error.statusCode === 409) {
                // Lock already exists - check if expired
                try {
                    const existingLock = await client.getEntity('LOCK', lockKey);
                    const expiresAt = new Date(existingLock.expiresAt).getTime();
                    
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
                        console.log(`🔒 Expired lock replaced for ${lockKey}`);
                        return { success: true, lockId };
                    }
                } catch (replaceError) {
                    // Another request beat us to it
                    console.log(`⚠️ Could not replace expired lock for ${lockKey}`);
                }
                
                console.log(`🔒 Lock already held for ${lockKey}`);
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
                console.log(`🔒 In-memory lock already held for ${lockKey}`);
                return { success: false, lockId: null };
            }
        }
        
        inMemoryLocks.set(lockKey, {
            lockId,
            expiresAt: now + LOCK_TTL_MS
        });
        console.log(`🔒 In-memory lock acquired for ${lockKey}`);
        return { success: true, lockId };
    }
}

/**
 * Release a slot lock
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:MM format
 * @param {string} lockId - The lock ID returned from acquireSlotLock
 */
async function releaseSlotLock(date, time, lockId) {
    const lockKey = `${date}_${time}`;
    
    const client = await getLockTableClient();
    
    if (client) {
        try {
            const existingLock = await client.getEntity('LOCK', lockKey);
            
            // Only release if we own the lock
            if (existingLock.lockId === lockId) {
                await client.deleteEntity('LOCK', lockKey, { etag: existingLock.etag });
                console.log(`🔓 Lock released for ${lockKey}`);
            }
        } catch (error) {
            // Lock might have expired or been replaced
            console.log(`⚠️ Could not release lock for ${lockKey}:`, error.message);
        }
    } else {
        // In-memory lock release
        const existingLock = inMemoryLocks.get(lockKey);
        if (existingLock && existingLock.lockId === lockId) {
            inMemoryLocks.delete(lockKey);
            console.log(`🔓 In-memory lock released for ${lockKey}`);
        }
    }
}

/**
 * Save or update a booking
 * @param {Object} booking - Booking data
 * @returns {Promise<boolean>} - true if saved to Azure, false if in-memory
 */
async function saveBooking(booking) {
    const client = await getTableClient();
    
    if (client) {
        const entity = {
            partitionKey: booking.date,
            rowKey: booking.id,
            ...booking,
            createdAt: booking.createdAt || new Date().toISOString()
        };
        await client.upsertEntity(entity);
        console.log('✅ Booking saved to Azure Storage:', booking.id);
        return true;
    } else {
        inMemoryBookings.set(booking.id, {
            ...booking,
            createdAt: booking.createdAt || new Date().toISOString()
        });
        console.log('⚠️ Booking saved to IN-MEMORY storage (not persistent!):', booking.id);
        console.log('Total bookings in memory:', inMemoryBookings.size);
        return false;
    }
}

/**
 * Get a booking by ID
 * @param {string} bookingId - Booking ID (e.g., "SN-ABC123")
 * @returns {Promise<Object|null>} - Booking data or null
 */
async function getBooking(bookingId) {
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
            return entity;
        }
        return null;
    } else {
        return inMemoryBookings.get(bookingId) || null;
    }
}

/**
 * Update an existing booking
 * @param {Object} booking - Updated booking data
 * @returns {Promise<boolean>} - true if saved to Azure, false if in-memory
 */
async function updateBooking(booking) {
    return saveBooking(booking);
}

/**
 * Generate a unique booking ID
 * @returns {string} - Booking ID (e.g., "SN-MKSJWTV2")
 */
function generateBookingId() {
    return `SN-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Generate a payment confirmation token
 * @param {string} bookingId - Booking ID
 * @param {string} email - Client email
 * @returns {string} - Base64 encoded token
 */
function generatePaymentToken(bookingId, email) {
    return Buffer.from(`${bookingId}:${email}`).toString('base64');
}

/**
 * Verify a payment confirmation token
 * @param {string} token - Token to verify
 * @param {string} bookingId - Expected booking ID
 * @param {string} email - Expected email
 * @returns {boolean} - true if valid
 */
function verifyPaymentToken(token, bookingId, email) {
    const expected = Buffer.from(`${bookingId}:${email}`).toString('base64');
    return token === expected;
}

/**
 * Check if using Azure Table Storage or in-memory
 * @returns {boolean}
 */
function isUsingAzureStorage() {
    return !!connectionString;
}

/**
 * Check if a time slot is already booked (not cancelled)
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:MM format
 * @returns {Promise<boolean>} - true if slot is already booked
 */
async function isSlotBooked(date, time) {
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
 * @returns {Array} - Array of all bookings in memory
 */
function getAllInMemoryBookings() {
    return Array.from(inMemoryBookings.values());
}

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
