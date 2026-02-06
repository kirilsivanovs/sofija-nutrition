# 🛠️ Документация для разработки

> Внутренняя документация проекта. Для публичной информации см. [README.md](README.md)

## 📊 Текущий статус

- **Тесты:** 922 (896 unit + 10 integration + 16 snapshot)
- **Покрытие:** 98.2%
- **CI/CD:** GitHub Actions + Azure Static Web Apps

---

## 🏗️ Архитектура

```
HTTP Request → Function (thin) → Service (business logic) → Repository (data)
                    ↓                      ↓
              Validation            DI Container
              Rate Limiting         Config
```

### Ключевые файлы

| Файл | Назначение |
|------|------------|
| `api/src/config/index.js` | Централизованная конфигурация |
| `api/src/container.js` | DI Container |
| `api/src/services/bookingService.js` | Бизнес-логика бронирования |
| `api/src/services/availabilityService.js` | Расчёт доступных слотов |
| `api/src/utils/securityLogger.js` | Логирование безопасности |
| `api/src/utils/apiResponse.js` | Унифицированный формат ответов |
| `shared/translations.js` | Единый источник переводов (lv/ru/en) |

---

## � CI/CD Pipeline

### Умный деплой (экономия ресурсов)

**Static Web App Workflow** - триггерится только при изменениях фронтенда:
- `src/**`, `public/**`, `shared/**`
- `astro.config.mjs`, `package.json`, `tsconfig.json`

**Azure Functions Workflow** - триггерится только при изменениях API:
- `api/**`
- `.github/workflows/azure-functions-deploy.yml`

### Этапы деплоя

```
PR → main:
├── Frontend changes? → Deploy Static Web App
│   ├── Unit tests
│   ├── Build & Deploy
│   └── E2E tests
│
└── API changes? → Deploy Azure Functions
    ├── Unit tests (jest)
    ├── Build TypeScript
    └── Deploy to Azure
```

### Переменные окружения

> 📘 **Полная инструкция**: [docs/AZURE_CONFIGURATION.md](docs/AZURE_CONFIGURATION.md)

**Static Web App:**
- `PUBLIC_API_BASE_URL` = `https://sofija-nutrition-api.azurewebsites.net`

**Azure Functions:**
- `AZURE_STORAGE_CONNECTION_STRING` (обязательно)
- `RESEND_API_KEY` (обязательно)
- `GEMINI_API_KEY`, `BUSINESS_EMAIL` (опционально)

### CORS настройка

API автоматически разрешает запросы от:
- `*.azurestaticapps.net` (preview URLs)
- `sofija-nutrition.lv` (production)
- `localhost:4321` (dev)

---

## �🔒 Безопасность

### Реализовано

- ✅ **Rate Limiting** — 5 booking/min, 60 availability/min
- ✅ **Slot Locking** — защита от race condition (ETag)
- ✅ **Input Validation** — XSS/injection защита
- ✅ **Security Headers** — HSTS, CSP, X-Frame-Options
- ✅ **Security Logger** — логирование auth failures, rate limits
- ✅ **SWA Auth** — Microsoft OAuth для админки

### Конфигурация

```javascript
// api/src/config/index.js
rateLimits: {
    createBooking: { windowMs: 60000, maxRequests: 5 },
    getAvailability: { windowMs: 60000, maxRequests: 60 },
    admin: { windowMs: 60000, maxRequests: 100 }
}
```

---

## 🗄️ База данных

**Azure Table Storage** — 5 таблиц, ~€0.10/мес

| Таблица | PK | RK | Назначение |
|---------|----|----|------------|
| `bookings` | date | guid | Бронирования |
| `adminSettings` | "config" | type | Расписание, отпуска |
| `Services` | "SERVICE" | serviceId | Услуги (кэш 5 мин) |
| `FeatureFlags` | "FEATURE" | name | Feature toggles (кэш 2 мин) |
| `ServicesHistory` | serviceId | version | История изменений |

---

## 🔧 Git Flow

1. `git checkout -b feature/название`
2. Разработать и протестировать
3. `npm test` — все тесты должны пройти
4. Создать PR → CI запустит тесты + E2E
5. После успешных проверок — auto-merge

### Branch naming

- `feature/` — новая функциональность
- `fix/` — исправление багов
- `refactor/` — рефакторинг
- `docs/` — документация

---

## ⏳ TODO (долгосрочно)

- [ ] TypeScript миграция
- [ ] Нагрузочное тестирование (k6)
- [ ] Azure Application Insights
- [ ] Автоматические релизы (release-please)

---

## 🚀 Идеи для развития

### Must-have фичи

1. **Напоминания о визите** — email за 24ч и 2ч до консультации
2. **Анкета перед консультацией** — сбор информации о клиенте
3. **Аналитика** — dashboard с метриками в Monitoring tab

### Nice-to-have

- Google Calendar интеграция
- Онлайн-оплата (Stripe/PaySera)
- Личный кабинет клиента
- SMS уведомления

---

## 📝 История изменений

| PR | Дата | Изменения |
|----|------|-----------|
| #19 | 2026-01-31 | Разделение README на public + internal |
| #18 | 2026-01-31 | Azure CLI cleanup для staging |
| #16 | 2026-01-31 | Security Logger, API Response, Email Snapshots |
| #13 | 2026-01-31 | Централизованная конфигурация |
| #11 | 2026-01-31 | Shared translations |
| #10 | 2026-01-31 | DI Container |
| #9 | 2026-01-31 | Service Layer |

---

## 🧪 Тестирование

### Команды

```powershell
cd api
npm test                    # Unit тесты (896)
npm run test:coverage       # С покрытием
npm run test:integration    # Интеграционные (Azurite)
npm run test:e2e           # E2E (Playwright)
```

### Критические тесты

- `critical-business-scenarios.test.js` — 20 бизнес-сценариев
- `slotLocking.test.js` — race condition защита
- `emailTemplates.snapshot.test.js` — 16 snapshot тестов

---

## 🔗 Полезные ссылки

- [e2e/README.md](e2e/README.md) — E2E тестирование
- [TESTS_COVERAGE.md](TESTS_COVERAGE.md) — Тестовое покрытие
