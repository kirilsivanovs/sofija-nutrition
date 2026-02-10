/**
 * API Entry Point
 * Registers all Azure Functions organized by domain
 */

// ============================================
// Booking Domain
// ============================================
import './functions/booking/getAvailability.function';
import './functions/booking/createBooking.function';
import './functions/booking/confirmPayment.function';

// ============================================
// Food Tracker Domain
// ============================================
import './functions/food/meals.function';
import './functions/food/foodAccess.function';
import './functions/food/food-analyze.function';
import './functions/food/food-estimate.function';

// ============================================
// Admin Domain
// ============================================
import './functions/admin/me.function';
import './functions/admin/bookings.function';
import './functions/admin/settings.function';
import './functions/admin/serviceSettings.function';
import './functions/admin/tableData.function';
import './functions/admin/patients.function';
import './functions/admin/foodAccess.function';
import './functions/admin/meals.function';

// ============================================
// Infrastructure
// ============================================
import './functions/health.function';

// Export container for DI
export { container } from './services';
