/**
 * Booking Repository
 * Handles data persistence for bookings (Azure Table Storage with in-memory fallback)
 */

const { TableClient } = require('@azure/data-tables');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
let tableClient = null;
const inMemoryBookings = new Map();

/**
 * Get or create the Azure Table client
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
        return true;
    } else {
        inMemoryBookings.set(booking.id, {
            ...booking,
            createdAt: booking.createdAt || new Date().toISOString()
        });
        return false;
    }
}

/**
 * Get a booking by ID
 * @param {string} bookingId - Booking ID (e.g., "SN-ABC123")
 * @returns {Promise<Object|null>} - Booking data or null
 */
async function getBooking(bookingId) {
    const client = await getTableClient();
    
    if (client) {
        const entities = client.listEntities({
            queryOptions: { filter: `RowKey eq '${bookingId}'` }
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

module.exports = {
    saveBooking,
    getBooking,
    updateBooking,
    generateBookingId,
    generatePaymentToken,
    verifyPaymentToken,
    isUsingAzureStorage
};
