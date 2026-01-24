/**
 * Storage Service for Bookings
 * Uses Azure Table Storage in production, in-memory for local development
 */

const { TableClient, AzureNamedKeyCredential } = require('@azure/data-tables');

// In-memory storage for local development
let localBookings = [];

// Table client instance
let tableClient = null;

/**
 * Initialize the storage client
 */
function initStorage() {
    const connectionString = process.env.AzureWebJobsStorage;
    
    // If no connection string or using local development storage
    if (!connectionString || connectionString === '' || connectionString === 'UseDevelopmentStorage=true') {
        console.log('Using in-memory storage for bookings');
        return null;
    }
    
    try {
        tableClient = TableClient.fromConnectionString(connectionString, 'Bookings');
        console.log('Azure Table Storage initialized');
        return tableClient;
    } catch (error) {
        console.error('Failed to initialize Azure Table Storage:', error);
        return null;
    }
}

/**
 * Ensure the table exists (call once on startup)
 */
async function ensureTable() {
    if (!tableClient) return;
    
    try {
        await tableClient.createTable();
        console.log('Bookings table created or already exists');
    } catch (error) {
        // Table likely already exists
        if (error.statusCode !== 409) {
            console.error('Error creating table:', error);
        }
    }
}

/**
 * Save a booking
 */
async function saveBooking(booking) {
    const entity = {
        partitionKey: booking.date, // Partition by date for efficient queries
        rowKey: booking.id,
        ...booking,
        createdAt: booking.createdAt || new Date().toISOString()
    };
    
    if (tableClient) {
        try {
            await tableClient.createEntity(entity);
            console.log('Booking saved to Azure Table Storage:', booking.id);
            return { success: true };
        } catch (error) {
            console.error('Failed to save booking to Azure:', error);
            // Fallback to local storage
            localBookings.push(booking);
            return { success: true, fallback: true };
        }
    } else {
        // Local development - use in-memory storage
        localBookings.push(booking);
        console.log('Booking saved to local memory:', booking.id);
        return { success: true, local: true };
    }
}

/**
 * Get all bookings (for availability check)
 */
async function getAllBookings() {
    if (tableClient) {
        try {
            const bookings = [];
            const entities = tableClient.listEntities();
            
            for await (const entity of entities) {
                bookings.push({
                    date: entity.date || entity.partitionKey,
                    time: entity.time,
                    name: entity.name,
                    email: entity.email,
                    type: entity.serviceType,
                    id: entity.rowKey
                });
            }
            
            return bookings;
        } catch (error) {
            console.error('Failed to get bookings from Azure:', error);
            return localBookings;
        }
    } else {
        return localBookings;
    }
}

/**
 * Get bookings for a specific date
 */
async function getBookingsByDate(date) {
    if (tableClient) {
        try {
            const bookings = [];
            const entities = tableClient.listEntities({
                queryOptions: { filter: `PartitionKey eq '${date}'` }
            });
            
            for await (const entity of entities) {
                bookings.push({
                    date: entity.date || entity.partitionKey,
                    time: entity.time,
                    name: entity.name,
                    email: entity.email,
                    type: entity.serviceType,
                    id: entity.rowKey
                });
            }
            
            return bookings;
        } catch (error) {
            console.error('Failed to get bookings by date from Azure:', error);
            return localBookings.filter(b => b.date === date);
        }
    } else {
        return localBookings.filter(b => b.date === date);
    }
}

/**
 * Get booking by ID
 */
async function getBookingById(date, id) {
    if (tableClient) {
        try {
            const entity = await tableClient.getEntity(date, id);
            return {
                id: entity.rowKey,
                date: entity.date || entity.partitionKey,
                time: entity.time,
                name: entity.name,
                email: entity.email,
                serviceType: entity.serviceType,
                serviceName: entity.serviceName,
                price: entity.price,
                status: entity.status
            };
        } catch (error) {
            console.error('Failed to get booking by ID:', error);
            return null;
        }
    } else {
        return localBookings.find(b => b.id === id);
    }
}

/**
 * Update booking status
 */
async function updateBookingStatus(date, id, status) {
    if (tableClient) {
        try {
            const entity = await tableClient.getEntity(date, id);
            entity.status = status;
            entity.updatedAt = new Date().toISOString();
            await tableClient.updateEntity(entity, 'Merge');
            return { success: true };
        } catch (error) {
            console.error('Failed to update booking status:', error);
            return { success: false, error: error.message };
        }
    } else {
        const booking = localBookings.find(b => b.id === id);
        if (booking) {
            booking.status = status;
            booking.updatedAt = new Date().toISOString();
            return { success: true };
        }
        return { success: false, error: 'Booking not found' };
    }
}

// Initialize on module load
initStorage();

module.exports = {
    initStorage,
    ensureTable,
    saveBooking,
    getAllBookings,
    getBookingsByDate,
    getBookingById,
    updateBookingStatus
};
