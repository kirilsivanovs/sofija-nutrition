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
require('./functions/adminMonitoring');

// Services with exposed functions
require('./services/featureFlags');
