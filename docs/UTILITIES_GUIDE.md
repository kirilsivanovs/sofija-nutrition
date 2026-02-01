# SOLID/DRY Utilities - Usage Guide

This document describes the new utility layer that implements SOLID and DRY principles for the Sofija Nutrition application.

## 📚 Table of Contents

- [API Client](#api-client)
- [Constants](#constants)
- [Error Handling](#error-handling)
- [Booking Utilities](#booking-utilities)
- [Admin API Adapter](#admin-api-adapter)
- [Migration Guide](#migration-guide)

---

## 🔌 API Client

**Location:** `src/utils/apiClient.ts`

Centralized HTTP client with retry logic, timeout handling, and type safety.

### Features

- ✅ Automatic retries with exponential backoff
- ✅ Configurable timeout (default: 30s)
- ✅ Unified error handling
- ✅ TypeScript type safety
- ✅ Eliminates duplicate fetch calls

### Public API

```typescript
import { api } from '@/utils/apiClient';

// Get availability for a date
const availability = await api.getAvailability('2026-02-15', 'initial');

// Create a booking
const result = await api.createBooking({
    serviceId: 'initial',
    date: '2026-02-15',
    time: '10:00',
    consultationFormat: 'online',
    customer: {
        name: 'Anna Bērziņa',
        email: 'anna@example.com',
    },
    language: 'lv',
});

// Confirm payment
await api.confirmPayment(token);
```

### Admin API

```typescript
import { adminApi } from '@/utils/apiClient';

// Get all bookings
const bookings = await adminApi.getBookings();

// Update booking status
await adminApi.updateBookingStatus(id, 'confirmed');

// Get/update schedule
const schedule = await adminApi.getSchedule();
await adminApi.updateSchedule(newSchedule);

// Get/update services
const services = await adminApi.getServices();
await adminApi.updateServices(newServices);

// Blocked dates and vacations
const blocked = await adminApi.getBlockedDates();
await adminApi.updateBlockedDates(['2026-12-25', '2026-12-26']);

const vacations = await adminApi.getVacations();
await adminApi.updateVacations([
    { start: '2026-07-01', end: '2026-07-15' }
]);

// Get holidays
const holidays = await adminApi.getHolidays(2026);
```

### Error Handling

```typescript
import { isAPIError, formatAPIError } from '@/utils/apiClient';

try {
    await api.createBooking(data);
} catch (error) {
    if (isAPIError(error)) {
        console.error(`API Error [${error.code}]:`, error.message);
        // error.status, error.details available
    }
    
    // User-friendly message
    showToast(formatAPIError(error), 'error');
}
```

### Custom Retry Configuration

```typescript
import { get } from '@/utils/apiClient';

// Custom retry settings
const response = await get('/custom/endpoint', {
    retry: true,
    maxRetries: 5,
    timeout: 60000, // 60 seconds
});
```

---

## 📋 Constants

**Location:** `src/utils/constants.ts`

Single source of truth for all application constants.

### API Configuration

```typescript
import { API_CONFIG, ENDPOINTS } from '@/utils/constants';

const baseUrl = API_CONFIG.BASE_URL;
const timeout = API_CONFIG.TIMEOUT;

// Endpoints
const bookingsUrl = ENDPOINTS.BOOKINGS;
const adminBookingsUrl = ENDPOINTS.ADMIN.BOOKINGS;
```

### Service IDs

```typescript
import { SERVICE_IDS } from '@/utils/constants';

const serviceId = SERVICE_IDS.INITIAL; // 'initial'
const followup = SERVICE_IDS.FOLLOWUP; // 'followup'
```

### Status Values

```typescript
import { BOOKING_STATUS, CONSULTATION_FORMAT } from '@/utils/constants';

const status = BOOKING_STATUS.CONFIRMED; // 'confirmed'
const format = CONSULTATION_FORMAT.ONLINE; // 'online'
```

### Validation Rules

```typescript
import { VALIDATION } from '@/utils/constants';

const namePattern = VALIDATION.NAME.PATTERN;
const minLength = VALIDATION.NAME.MIN_LENGTH;
const errorMessage = VALIDATION.NAME.ERROR_MESSAGE;
```

### UI Constants

```typescript
import { UI, COLORS } from '@/utils/constants';

const toastDuration = UI.TOAST_DURATION; // 5000ms
const mobileBreakpoint = UI.MOBILE_BREAKPOINT; // 768px

const primaryColor = COLORS.PRIMARY; // '#2d4e3f'
const successColor = COLORS.SUCCESS; // '#22c55e'
```

---

## ⚠️ Error Handling

**Location:** `src/utils/errors.ts`

Centralized error formatting and user-friendly messages.

### Format Errors

```typescript
import { formatError, formatErrorWithCode } from '@/utils/errors';

try {
    // ... operation
} catch (error) {
    // Basic formatting
    const message = formatError(error);
    
    // With error code mapping to user-friendly message
    const friendlyMessage = formatErrorWithCode(error);
}
```

### Validation Errors

```typescript
import { 
    createValidationError, 
    formatValidationErrors,
    hasFieldError,
    getFieldError 
} from '@/utils/errors';

const errors = [
    createValidationError('email', 'Invalid email address'),
    createValidationError('phone', 'Phone number required'),
];

// Format for display
const message = formatValidationErrors(errors);

// Check specific field
if (hasFieldError(errors, 'email')) {
    const emailError = getFieldError(errors, 'email');
}
```

### Error Recovery

```typescript
import { isRecoverableError, getRetryDelay } from '@/utils/errors';

try {
    // ... operation
} catch (error) {
    if (isRecoverableError(error)) {
        const delay = getRetryDelay(error);
        setTimeout(() => retry(), delay);
    } else {
        showFatalError(error);
    }
}
```

---

## 🎫 Booking Utilities

**Location:** `src/utils/booking/`

Comprehensive utilities for booking operations.

### Validation

```typescript
import { validateBookingForm, validateEmail, validateDate } from '@/utils/booking';

const formData = {
    service: 'initial',
    date: '2026-02-15',
    time: '10:00',
    consultationFormat: 'online',
    name: 'Anna Bērziņa',
    email: 'anna@example.com',
    phone: '+371 20000000',
};

// Validate entire form
const errors = validateBookingForm(formData);
if (errors.length > 0) {
    errors.forEach(error => {
        console.log(`${error.field}: ${error.message}`);
    });
}

// Validate individual fields
const emailError = validateEmail('invalid-email');
if (emailError) {
    console.log(emailError.message);
}
```

### Formatting

```typescript
import { 
    formatDate, 
    formatDateLong,
    formatTime,
    formatPrice,
    formatBookingStatus 
} from '@/utils/booking';

// Dates
formatDate('2026-02-15'); // '15.02.2026'
formatDateLong('2026-02-15', 'lv'); // '15. Februāris 2026'
formatDateWithWeekday('2026-02-15'); // 'Pirmdiena, 15. Februāris 2026'

// Time
formatTime('10:00'); // '10:00'
formatTimeRange('10:00', 60); // '10:00 - 11:00'

// Price
formatPrice(65); // '€65.00'

// Status
formatBookingStatus('confirmed', 'lv'); // 'Apstiprināts'
```

### State Management

```typescript
import { 
    getBookingState,
    setField,
    nextStep,
    previousStep,
    subscribe 
} from '@/utils/booking';

// Set form fields
setField('service', 'initial');
setField('date', '2026-02-15');
setFields({ name: 'Anna', email: 'anna@example.com' });

// Navigation
nextStep();
previousStep();
goToStep(2);

// Get state
const state = getBookingState();
console.log(state.currentStep); // 2

// Subscribe to changes
const unsubscribe = subscribe((state) => {
    console.log('State changed:', state);
});

// Persistence
saveToStorage(); // Save to localStorage
loadFromStorage(); // Load from localStorage
clearStorage(); // Clear stored data
```

---

## 🔧 Admin API Adapter

**Location:** `src/utils/adminApiAdapter.ts`

Simplified API for admin operations.

### Load Calendar Data

```typescript
import { loadCalendarData } from '@/utils/adminApiAdapter';

const year = 2026;
const data = await loadCalendarData(year);

// Returns all data in one call:
// {
//   bookings: [...],
//   holidays: { '2026-01-01': 'Jaunais Gads', ... },
//   schedule: { monday: { enabled: true, start: '09:00', ... }, ... },
//   blockedDates: Set(['2026-12-25', ...]),
//   vacations: [{ start: '2026-07-01', end: '2026-07-15' }]
// }
```

### Booking Operations

```typescript
import { confirmBooking, cancelBooking } from '@/utils/adminApiAdapter';

// Confirm booking
await confirmBooking(bookingId);

// Cancel booking
await cancelBooking(bookingId);
```

### Settings Operations

```typescript
import { 
    saveSchedule,
    saveServices,
    saveBlockedDates,
    saveVacations 
} from '@/utils/adminApiAdapter';

// Save schedule
await saveSchedule({
    monday: { enabled: true, start: '09:00', end: '17:00' },
    // ...
});

// Save blocked dates
await saveBlockedDates(['2026-12-25', '2026-12-26']);

// Save vacations
await saveVacations([
    { start: '2026-07-01', end: '2026-07-15' }
]);
```

### Utility Functions

```typescript
import { findFirstUpcomingBooking } from '@/utils/adminApiAdapter';

const firstBooking = await findFirstUpcomingBooking();
if (firstBooking) {
    console.log('Next booking:', firstBooking.date);
}
```

---

## 🔄 Migration Guide

### Before (Old Code)

```javascript
// Duplicate fetch calls everywhere
const response = await fetch(API_BASE + '/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

if (!response.ok) {
    throw new Error('Booking failed');
}

const result = await response.json();
```

### After (New Utilities)

```typescript
import { api } from '@/utils/apiClient';

// Single line, with retry logic and error handling
const result = await api.createBooking(data);
```

### Admin Panel Migration

**Before:**

```javascript
const [bookingsRes, holidaysRes, scheduleRes] = await Promise.all([
    fetch(API_BASE + '/dashboard/bookings'),
    fetch(API_BASE + '/holidays?year=' + year),
    fetch(API_BASE + '/dashboard/availability')
]);

const bookingsData = await bookingsRes.json();
const holidaysData = await holidaysRes.json();
const scheduleData = await scheduleRes.json();

allBookings = bookingsData.bookings || [];
holidays = {};
if (holidaysData.holidays) {
    holidaysData.holidays.forEach(h => { holidays[h.date] = h.name; });
}
schedule = scheduleData.schedule || {};
```

**After:**

```typescript
import { loadCalendarData } from '@/utils/adminApiAdapter';

const data = await loadCalendarData(year);
allBookings = data.bookings;
holidays = data.holidays;
schedule = data.schedule;
```

**Reduction: 15 lines → 4 lines**

---

## 📊 Benefits Summary

| Aspect | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Lines of code** | ~200 duplicate fetch calls | Centralized API client | -150 lines |
| **Error handling** | Inconsistent, manual | Automatic, typed | 100% consistent |
| **Retry logic** | None | Exponential backoff | Resilient |
| **Type safety** | None | Full TypeScript | Type-safe |
| **Maintainability** | Scattered logic | Single source | Easy updates |

---

## 🎯 Next Steps

1. Migrate `public/assets/booking.js` to use new utilities
2. Create UI component library (Button, Input, Modal, Toast)
3. Add unit tests for utilities
4. Document component usage patterns

---

## 📝 Notes

- All utilities are tree-shakeable - only import what you use
- Error messages are in Latvian by default (configurable)
- All functions are fully typed with TypeScript
- Works in both browser and server environments (where applicable)
