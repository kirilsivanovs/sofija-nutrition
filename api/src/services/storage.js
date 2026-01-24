/**
 * Simple In-Memory Storage for Bookings
 * For a small appointment booking system, in-memory storage is sufficient
 * The important data (booking confirmation) is sent via email anyway
 */

// In-memory storage
let bookings = [];

/**
 * Save a booking
 */
async function saveBooking(booking) {
    bookings.push({
        ...booking,
        createdAt: booking.createdAt || new Date().toISOString()
    });
    console.log('Booking saved:', booking.id);
    return { success: true };
}

/**
 * Get all bookings
 */
async function getAllBookings() {
    return bookings;
}

/**
 * Get bookings for a specific date
 */
async function getBookingsByDate(date) {
    return bookings.filter(b => b.date === date);
}

/**
 * Get a booking by ID
 */
async function getBookingById(id) {
    return bookings.find(b => b.id === id);
}

module.exports = {
    saveBooking,
    getAllBookings,
    getBookingsByDate,
    getBookingById
};
