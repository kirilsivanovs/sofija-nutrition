/**
 * API Entry Point
 * Registers all Azure Functions
 */

// Register all functions
import './functions/health.function';
import './functions/createBooking.function';
import './functions/confirmPayment.function';
import './functions/getAvailability.function';

// Food tracker functions
import './functions/food-analyze.function';
import './functions/foodAccess.function';
import './functions/meals.function';

// Admin functions
import './functions/adminBookings.function';
import './functions/adminFoodAccess.function';
import './functions/adminMeals.function';
import './functions/adminPatients.function';
import './functions/adminSettings.function';
import './functions/adminServiceSettings.function';
import './functions/adminTableData.function';

// Services with exposed functions (feature flags endpoint)
import './services/featureFlags';

// Export container for DI
export { container } from './services';
