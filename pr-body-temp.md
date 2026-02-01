## Problem
Admin panel was returning 404 errors for all API endpoints:
- GET /api/dashboard/bookings → 404
- GET /api/dashboard/availability → 404

## Root Cause
In `.github/workflows/azure-static-web-apps.yml`, the `api_location` parameter was set to empty string (`""`), which prevented Azure Functions from being deployed.

## Solution
Changed `api_location: ""` to `api_location: "api"` in the Azure Static Web Apps deployment action.

## Impact
✅ API functions will now be deployed to production
✅ Admin panel will be able to fetch bookings and availability data
✅ All /api/dashboard/* endpoints will work correctly

## Testing
After deployment:
1. Open admin panel: https://wonderful-bay-0fb550403.4.azurestaticapps.net/admin
2. Login with test credentials
3. Verify bookings load without 404 errors
4. Verify calendar/availability loads correctly
