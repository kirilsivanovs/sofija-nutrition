# Sofija Nutrition

Online booking & nutrition platform — Astro + Azure Functions + Azure Table Storage.

## Architecture

```
sofija-nutrition/
├── src/                    # Astro frontend (Static Web App)
│   ├── pages/
│   │   ├── index.astro         # Landing page (LV/EN/RU)
│   │   ├── cabinet.astro       # Patient food diary
│   │   ├── admin/              # Admin dashboard
│   │   └── privacy-policy.astro
│   ├── components/
│   │   └── admin/              # Admin panel components
│   ├── utils/
│   │   ├── apiClient.ts        # HTTP client (public + admin APIs)
│   │   ├── adminApiAdapter.ts  # Simplified admin data layer
│   │   ├── booking/            # Booking state & formatters
│   │   └── admin/              # Calendar, availability, holidays
│   └── styles/
│
├── api/                    # Azure Functions v4 (separate Function App)
│   └── src/
│       ├── functions/
│       │   ├── booking/        # Booking domain (availability, create, confirm)
│       │   ├── food/           # Food tracker domain (meals, access, AI)
│       │   ├── admin/          # Admin domain (bookings, settings, services)
│       │   └── health.function.ts
│       ├── services/           # Business logic layer
│       ├── config/             # Centralized configuration
│       ├── templates/          # Email templates
│       ├── types/              # TypeScript type definitions
│       └── utils/              # Auth, CORS, rate limiting, validation
│
├── shared/                 # Shared types, utils & translations
│   ├── types/                  # Cross-package type definitions
│   ├── utils/                  # Date formatters, validators, constants
│   └── translations.js         # i18n (LV/EN/RU)
│
├── tests/                  # Frontend unit tests (Jest)
├── e2e/                    # E2E tests (Playwright)
├── docs/                   # Internal documentation
└── .github/workflows/      # CI/CD pipelines
```

## Azure Resources

| Resource | Type | Region |
|---|---|---|
| `sofija-nutrition` | Static Web App | West Europe |
| `sofija-nutrition-api` | Function App (Node.js 20) | West Europe |
| `sofijanutristg` | Storage Account (Table Storage) | West Europe |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Astro, Tailwind CSS v4 |
| API | Azure Functions v4, TypeScript |
| Database | Azure Table Storage |
| Email | Resend |
| PDF | pdf-lib |
| Auth | Azure AD via Static Web Apps |
| Testing | Jest (unit), Playwright (E2E) |
| CI/CD | GitHub Actions |

## Quick Start

```bash
# Install all dependencies (workspaces)
npm install

# Start frontend dev server
npm run dev

# Start API locally (separate terminal)
cd api && npm start

# Run all tests
npm run test:all
```

## API Domains

### Booking (public)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/availability/{date?}` | Available time slots |
| POST | `/api/bookings` | Create booking |
| GET | `/api/confirm-payment` | Payment confirmation |

### Food Tracker (authenticated)
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/meals` | CRUD meal entries |
| PATCH/DELETE | `/api/meals/{id}` | Update/delete meal |
| GET | `/api/meals/stats` | Daily nutrition stats |
| GET | `/api/food/access` | Check diary access |

### Admin Dashboard (authenticated)
| Method | Route | Description |
|--------|-------|-------------|
| GET/PATCH | `/api/dashboard/bookings` | Manage bookings |
| GET/PUT | `/api/dashboard/availability` | Schedule settings |
| GET/PUT | `/api/dashboard/services` | Service configuration |
| GET/PUT | `/api/dashboard/food-access` | Patient diary access |
| GET | `/api/dashboard/patients` | Patient list |
| GET | `/api/dashboard/meals` | View patient meals |

## Deployment

### CI/CD Pipeline

```
PR → CI (lint + test + build) → merge to main
  ├── src/ changed  → Deploy Frontend (SWA)
  └── api/ changed  → Deploy API (Function App)
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | SWA deployment token |
| `AZURE_CREDENTIALS` | Service principal JSON for Function App deploy |

### Manual Deployment

```bash
# Build & deploy API
cd api && npm run build
func azure functionapp publish sofija-nutrition-api --javascript

# Frontend deploys automatically via SWA GitHub integration
```

## Workspace Structure

This is an **npm workspaces** monorepo:

```json
{
  "workspaces": ["api", "shared"]
}
```

- **Root** (`package.json`) — Astro frontend + workspace orchestration
- **api/** — Azure Functions API with own dependencies
- **shared/** — Shared types/utils consumed by both frontend and API

## Documentation

Detailed docs are in [`docs/`](docs/):
- [Architecture Priorities](docs/ARCHITECTURE_PRIORITIES.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Google Auth Setup](docs/GOOGLE_AUTH_SETUP.md)
- [Utilities Guide](docs/UTILITIES_GUIDE.md)
