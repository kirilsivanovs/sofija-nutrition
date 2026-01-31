// Register all functions
require('./functions/health');
require('./functions/createBooking');
require('./functions/confirmPayment');
require('./functions/getAvailability');

// Admin functions
require('./functions/adminBookings');
require('./functions/adminSettings');
require('./functions/adminServiceSettings');
require('./functions/adminTableData');

// Services with exposed functions
require('./services/featureFlags');
