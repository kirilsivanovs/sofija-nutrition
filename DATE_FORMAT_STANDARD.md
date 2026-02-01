# Date Format Standards

## Summary
All dates in the application follow a consistent standard:
- **Display Format (User-facing)**: `dd/mm/yyyy` (19/02/2026)
- **API Format (Internal/Storage)**: `yyyy-mm-dd` (2026-02-19)

## Admin Panel (`src/pages/admin/index.astro`)

### Date Formatting Functions

```javascript
// Convert yyyy-mm-dd → dd/mm/yyyy (for display)
function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Convert dd/mm/yyyy → yyyy-mm-dd (for API)
function formatDateReverse(dateStr) {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
}

// Convert Date object → yyyy-mm-dd
function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
```

### Usage Examples

#### Date Input Fields
```html
<input type="text" class="date-input" placeholder="dd/mm/yyyy" maxlength="10">
```

#### Display in Lists
```javascript
// Vacation periods
list.innerHTML = periods.map(v => `
    <strong>${formatDate(v.startDate)}</strong> — <strong>${formatDate(v.endDate)}</strong>
`).join('');

// Blocked dates
list.innerHTML = dates.map(d => `
    <span>${formatDate(d.date)}</span>
`).join('');
```

#### Sending to API
```javascript
// User input: 19/02/2026
const userInput = document.getElementById('vacation-start').value;  // "19/02/2026"

// Convert to API format
const apiDate = formatDateReverse(userInput);  // "2026-02-19"

// Send to API
await fetch(API_BASE + '/dashboard/availability/vacation', {
    method: 'POST',
    body: JSON.stringify({ startDate: apiDate, endDate: apiDate })
});
```

#### Calendar Day Details
```javascript
const dateStr = '2026-02-19';  // yyyy-mm-dd from calendar
title.textContent = `${dayNames[date.getDay()]}, ${formatDate(dateStr)}`;
// Result: "Trešdiena, 19/02/2026"
```

## Client Booking Module (`public/assets/booking.js`)

### Date Formatting Functions

```javascript
// Date object → yyyy-mm-dd (for API)
formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// yyyy-mm-dd → Localized display (e.g., "19 februāris")
formatDateDisplay(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = this.t('months')[date.getMonth()];
    return `${day} ${month}`;
}
```

## Backend API (`api/src/`)

### Shared Utilities (`shared/utils/dateFormatters.ts`)

```typescript
// Convert yyyy-mm-dd → dd/mm/yyyy
export function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Convert dd/mm/yyyy → yyyy-mm-dd
export function formatDateReverse(dateStr: string): string {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
}

// Date object → yyyy-mm-dd
export function formatDateISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
```

### Storage Format
All dates stored in Azure Table Storage use `yyyy-mm-dd` format:
```typescript
interface Booking {
    date: string;  // "2026-02-19"
    // ...
}

interface BlockedDate {
    date: string;  // "2026-02-19"
    // ...
}

interface VacationPeriod {
    startDate: string;  // "2026-02-19"
    endDate: string;    // "2026-02-28"
    // ...
}
```

## Testing (`tests/admin-calendar-dates.test.js`)

All date formatting is covered by unit tests:
- ✅ Calendar date selection (19/02/2026 → 19/02/2026)
- ✅ Vacation period round trips (input → API → display)
- ✅ Blocked dates round trips
- ✅ Consistency across admin panel
- ✅ Edge cases (empty, null, undefined)
- ✅ Standardization (NO mm/dd/yyyy format)

Run tests:
```bash
npm test -- admin-calendar-dates
```

## Important Rules

### ✅ DO
- Use `dd/mm/yyyy` for ALL user-facing displays in admin panel
- Use `yyyy-mm-dd` for ALL API communication and storage
- Use `formatDate()` to convert API → Display
- Use `formatDateReverse()` to convert Display → API
- Add `placeholder="dd/mm/yyyy"` to date input fields
- Use `type="text"` with custom validation for date inputs

### ❌ DON'T
- Never use `mm/dd/yyyy` (US format) anywhere
- Never use `type="date"` HTML inputs (browser locale override)
- Never use `toLocaleDateString()` (inconsistent across browsers)
- Never display `yyyy-mm-dd` to users directly
- Never send `dd/mm/yyyy` to API endpoints

## Date Input Validation

Date inputs use automatic formatting:
```javascript
document.querySelectorAll('.date-input').forEach(input => {
    input.addEventListener('input', function(e) {
        let value = this.value.replace(/[^\d]/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        if (value.length >= 5) {
            value = value.slice(0, 5) + '/' + value.slice(5, 9);
        }
        this.value = value;
    });
    // ...
});
```

User types: `19022026` → Auto-formats to: `19/02/2026`

## Migration Notes

All date inputs were changed from `type="date"` to `type="text"` because:
1. Native `<input type="date">` uses browser locale (mm/dd/yyyy in some regions)
2. Cannot override browser date format
3. Inconsistent UX across different browsers/locales

Solution: Custom text inputs with JavaScript formatting provide consistent dd/mm/yyyy display.
