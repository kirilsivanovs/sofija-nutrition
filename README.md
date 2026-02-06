# Sofija Nutrition - Booking System

Система онлайн-бронирования консультаций нутрициолога на базе Astro + Azure Functions.

## 📖 О проекте

**Описание:** Веб-приложение для онлайн-записи на консультации к нутрициологу Софии. Клиенты выбирают услугу, дату и время, оставляют контакты. Софья управляет расписанием, отпусками, ценами и настройками через админ-панель.

**Владелец:** Единственный администратор - Софья (нутрициолог)  
**Клиенты:** Физические лица, записывающиеся на консультации  
**Язык интерфейса:** Латышский (lv), русский (ru), английский (en)

### Технологический стек

| Компонент | Технология | Версия |
|-----------|------------|--------|
| **Frontend** | Astro | Latest |
| **Backend** | Azure Functions v4 | Node.js |
| **Database** | Azure Table Storage | - |
| **Email** | Azure Communication Services | - |
| **PDF** | PDFKit | Latest |
| **Hosting** | Azure Static Web Apps + Functions | - |
| **Testing** | Jest | Latest |

### Архитектура

```
┌─────────────────────────────────────────────────────┐
│ Frontend (Astro SSG)                                │
│ - Статические страницы                              │
│ - Форма бронирования                                │
│ - Админ-панель (защищена Azure AD)                  │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS REST API
┌──────────────────▼──────────────────────────────────┐
│ Backend (Azure Functions v4)                        │
│ - HTTP триггеры                                     │
│ - Бизнес-логика                                     │
│ - Email отправка                                    │
│ - PDF генерация                                     │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│ Azure Table Storage (4 таблицы, €0.10/мес)          │
│ - bookings (бронирования)                           │
│ - adminSettings (расписание, отпуска)               │
│ - Services (цены, длительность услуг)               │
│ - ServicesHistory (история изменений)               │
└─────────────────────────────────────────────────────┘
```

### Ключевые особенности

1. **Serverless архитектура** - нет постоянно работающих серверов, оплата только за запросы
2. **Кэширование** - Services кэшируются на 5 мин
3. **Валидация** - все данные проверяются на уровне API
4. **Версионирование** - история изменений цен и настроек сохраняется
5. **Мультиязычность** - lv/ru/en для всех услуг
7. **Дешевизна** - ~€0.10/мес за БД, Functions бесплатны до 1M запросов

### Услуги (настраиваются через админку)

| ID | Название | Цена | Длительность | Формат |
|----|----------|------|--------------|--------|
| `initial-consultation` | Первичная консультация | 50 EUR | 90 мин | Online/Offline |
| `cgm-diagnostic` | CGM диагностика | 150 EUR | 60 мин | Online/Offline |
| `free-consultation` | Бесплатная консультация | 0 EUR | 30 мин | Online only |

## ⚡ Быстрый старт

### Шаг 1: Установка зависимостей

```powershell
# Корневая папка (frontend)
npm install

# API (backend)
cd api
npm install
cd ..
```

### Шаг 2: Настройка Azure Storage

Создайте файл `api/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_STORAGE_CONNECTION_STRING": "ваша_строка_подключения"
  }
}
```

### Шаг 3: Инициализация таблиц

```powershell
cd api
node scripts/create-tables.js
cd ..
```

### Шаг 4: Запуск проекта

**Вариант А - Два терминала (рекомендуется):**

Терминал 1 - Backend:
```powershell
cd api
func start --cors *
```

Терминал 2 - Frontend:
```powershell
npm run dev
```

**Вариант Б - Один терминал (PowerShell):**

```powershell
# Запуск backend в фоне
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api; func start --cors *"

# Подождать 5 секунд пока API запустится
Start-Sleep -Seconds 5

# Запуск frontend
npm run dev
```

### Шаг 5: Открыть в браузере

- **Frontend:** http://localhost:4321
- **API:** http://localhost:7071
- **Health check:** http://localhost:7071/api/health

---

## � API Endpoints

### Public API (доступно всем)

| Method | Endpoint | Описание |
|--------|----------|----------|
| GET | `/api/health` | Проверка здоровья API |
| GET | `/api/availability/{date?}` | Доступные слоты на дату |
| POST | `/api/bookings` | Создать бронирование |
| GET | `/api/confirm-payment?id={bookingId}` | Подтверждение оплаты |
| GET | `/api/holidays` | Латвийские праздники |

### Admin API (требует авторизации)

**Бронирования:**
- `GET /api/dashboard/bookings` - Список всех бронирований
- `GET /api/dashboard/bookings/{id}` - Детали бронирования
- `PATCH /api/dashboard/bookings/{id}` - Обновить статус

**Настройки расписания:**
- `GET /api/dashboard/settings` - Получить настройки
- `PUT /api/dashboard/settings` - Обновить настройки
- `GET /api/dashboard/availability` - Расписание
- `PUT /api/dashboard/availability` - Изменить расписание
- `POST /api/dashboard/availability/vacation` - Добавить отпуск
- `DELETE /api/dashboard/availability/vacation` - Удалить отпуск
- `POST /api/dashboard/availability/block` - Заблокировать дату
- `DELETE /api/dashboard/availability/block` - Разблокировать дату

**Услуги (Services):**
- `GET /api/dashboard/services` - Список услуг
- `PUT /api/dashboard/services/{serviceId}` - Обновить услугу
- `GET /api/dashboard/services/{serviceId}/history` - История изменений
- `POST /api/dashboard/services/initialize` - Инициализация с defaults

**Таблицы:**
- `GET /api/dashboard/tables/{tableName}` - Содержимое таблицы
- `DELETE /api/dashboard/tables/{tableName}/{pk}/{rk}` - Удалить запись

---
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

---

## 📋 Полная документация команд

### Frontend (Astro)

| Команда                   | Действие                                           |
| :------------------------ | :------------------------------------------------- |
| `npm install`             | Установка зависимостей                             |
| `npm run dev`             | Запуск dev сервера на `localhost:4321`             |
| `npm run build`           | Сборка production версии в `./dist/`               |
| `npm run preview`         | Предпросмотр production сборки                     |
| `npm run astro ...`       | CLI команды Astro                                  |

### Backend (Azure Functions)

| Команда                   | Действие                                           |
| :------------------------ | :------------------------------------------------- |
| `cd api && npm install`   | Установка зависимостей API                         |
| `func start --cors *`     | Запуск API на `localhost:7071`                     |
| `npm test`                | Запуск тестов                                      |
| `npm run test:coverage`   | Запуск тестов с покрытием                          |

### Скрипты управления данными

```powershell
cd api

# Создать все таблицы в Azure Storage
node scripts/create-tables.js

# Показать список всех таблиц
node scripts/list-tables.js

# Инициализировать Services с дефолтными услугами
curl -X POST http://localhost:7071/api/dashboard/services/initialize
```

## 🏗️ Структура проекта

```text
sofija-nutrition-astro/
├── api/                           # Azure Functions (Backend)
│   ├── src/
│   │   ├── config/                # Централизованная конфигурация
│   │   │   └── index.js           # Все настройки: cache TTL, rate limits, schedule
│   │   ├── functions/             # HTTP функции
│   │   │   ├── createBooking.js   # Создание бронирования
│   │   │   ├── getAvailability.js # Получение доступных слотов
│   │   │   ├── admin*.js          # Админские функции
│   │   │   └── ...
│   │   ├── services/              # Бизнес-логика
│   │   │   ├── bookingRepository.js
│   │   │   ├── emailService.js
│   │   │   ├── availabilityService.js
│   │   │   └── ...
│   │   ├── utils/                 # Утилиты
│   │   │   ├── rateLimiter.js     # Rate limiting
│   │   │   ├── validation.js      # Валидация входных данных
│   │   │   └── ...
│   │   └── templates/             # Email шаблоны
│   ├── scripts/                   # Утилиты
│   │   ├── create-tables.js       # Создание таблиц
│   │   └── list-tables.js         # Список таблиц
│   ├── tests/                     # Unit и интеграционные тесты
│   ├── host.json                  # Конфигурация Functions
│   └── local.settings.json        # Локальные переменные (не в git)
│
├── shared/                        # Общий код frontend/backend
│   └── translations.js            # Единый источник переводов (lv/ru/en)
│
├── src/
│   ├── components/                # Astro компоненты
│   ├── layouts/                   # Layouts
│   │   └── Layout.astro
│   ├── pages/                     # Страницы (роуты)
│   │   ├── index.astro            # Главная
│   │   └── admin/                 # Админка
│   └── styles/                    # Глобальные стили
│
├── public/                        # Статика
│   ├── assets/                    # JS, CSS, images
│   │   └── shared-translations.js # Переводы для браузера
│   └── data/                      # JSON данные
│
└── README.md                      # Этот файл
```

## 🗄️ База данных (Azure Table Storage)

Проект использует **4 таблицы** (€0.10/месяц):

| Таблица | PartitionKey | RowKey | Назначение | Записей |
|---------|--------------|--------|------------|---------|
| `bookings` | userId/date | guid | Бронирования клиентов | ~100/мес |
| `adminSettings` | "config" | тип настройки | Расписание, отпуска, заблокированные даты | ~2 |
| `Services` | "SERVICE" | serviceId | Цены, длительность, названия услуг | 3 |
| `ServicesHistory` | serviceId | v{version}_{timestamp} | История изменений цен | ~50/год |

### Примеры данных

**Booking:**
```json
{
  "partitionKey": "2026-01-30",
  "rowKey": "abc123-def456",
  "userId": "user@email.com",
  "serviceId": "initial-consultation",
  "date": "2026-02-15",
  "time": "10:00",
  "format": "online",
  "status": "confirmed",
  "price": 50,
  "customerName": "Jānis Bērziņš",
  "customerEmail": "janis@example.com",
  "customerPhone": "+371 12345678"
}
```

**Service:**
```json
{
  "partitionKey": "SERVICE",
  "rowKey": "initial-consultation",
  "name": {
    "lv": "Pirmreizējā konsultācija",
    "ru": "Первичная консультация",
    "en": "Initial Consultation"
  },
  "price": 50,
  "duration": 90,
  "allowOnline": true,
  "allowInPerson": true,
  "version": 3
}
```

### Бизнес-логика бронирования

1. **Клиент выбирает услугу** → загружаются из `Services` (кэш 5 мин)
2. **Клиент выбирает дату** → проверяются отпуска, заблокированные даты, праздники из `adminSettings`
3. **Клиент выбирает время** → генерируются слоты с учетом:
   - Рабочих часов (9:00-18:00 по умолчанию)
   - Длительности услуги (30/60/90 мин)
   - Существующих бронирований
   - Заблокированных дат
4. **Создание бронирования:**
   - Валидация всех полей
   - Проверка что слот еще свободен
   - Сохранение в `bookings`
   - Отправка email клиенту + администратору
   - Генерация PDF с деталями
5. **Статусы:** pending → confirmed → completed / cancelled

## � Важные замечания для AI

### Архитектурные решения

1. **Почему Azure Table Storage, а не SQL?**
   - Стоимость: €0.10/мес vs €5-24/мес
   - Нагрузка: <1000 запросов/день
   - Схема: Простые key-value данные
   - Масштабирование: Автоматическое

2. **Почему нет AppConfig и AuditLogs?**
   - `AppConfig` дублировал `adminSettings` (одна и та же функциональность)
   - `AuditLogs` не использовался (0 записей), Azure Functions уже логирует все
   - Удалено для упрощения архитектуры

3. **Почему кэш именно 5 минут для Services?**
   - Услуги меняются редко (раз в месяц)
   - 5 минут = баланс между свежестью и экономией

4. **Почему один администратор?**
   - Проект для индивидуального предпринимателя
   - Нет необходимости в RBAC
   - Авторизация через Azure AD (Microsoft account)

### Соглашения о коде

1. **Именование:**
   - Файлы: camelCase (`createBooking.js`)
   - Функции: camelCase (`getAvailability`)
   - Константы: UPPER_SNAKE_CASE (`SERVICES_TABLE`)
   - Таблицы: PascalCase (`Services`)

2. **Структура функций:**
   ```javascript
   // 1. Импорты
   const { app } = require('@azure/functions');
   const { TableClient } = require('@azure/data-tables');
   
   // 2. Константы
   const TABLE_NAME = 'Services';
   
   // 3. Хелперы (опционально)
   async function helperFunction() { }
   
   // 4. Регистрация в app
   app.http('functionName', {
       methods: ['GET'],
       route: 'route/path',
       handler: async (request, context) => {
           // логика
       }
   });
   ```

3. **Валидация данных:**
   - Всегда проверять входящие данные
   - Возвращать 400 с понятными ошибками
   - Пример: `if (!body.email) errors.push('Email is required')`

4. **Ответы API:**
   ```javascript
   // Успех
   return { status: 200, jsonBody: { success: true, data: {} } };
   
   // Ошибка валидации
   return { status: 400, jsonBody: { success: false, errors: [] } };
   
   // Серверная ошибка
   return { status: 500, jsonBody: { success: false, error: message } };
   ```

### Ограничения и известные проблемы

1. **Нет аутентификации на API** - admin endpoints доступны без проверки (TODO: добавить Azure AD)
2. **Email без очереди** - отправка синхронная, может быть медленной
3. **Нет rate limiting** - можно спамить бронирования
4. **Нет проверки двойного бронирования** - race condition возможен
5. **Локализация хардкодед** - нет динамической смены языка
6. **Timezone хардкодед** - Европа/Рига (UTC+2/+3)

### Production окружение

**URL:** https://sofija-nutrition.azurestaticapps.net (или другой домен)

**Переменные окружения (Azure):**
```
AZURE_STORAGE_CONNECTION_STRING=<connection_string>
EMAIL_CONNECTION_STRING=<azure_communication_services>
```

**Стоимость production:**
- Azure Table Storage: €0.10/мес
- Azure Functions: €0 (до 1M запросов)
- Azure Static Web Apps: €0 (free tier)
- Email: €0 (до 100 писем/день)
- **ИТОГО: ~€0.10/мес**

## �🚨 Troubleshooting

### API не запускается

```powershell
# Проверить, что порт 7071 свободен
Get-Process | Where-Object {$_.ProcessName -like '*func*'} | Stop-Process -Force

# Перезапустить
cd api
func start --cors *
```

### Ошибка "Cannot find module"

```powershell
# Переустановить зависимости
cd api
Remove-Item -Recurse -Force node_modules
npm install
```

### Таблицы не созданы

```powershell
cd api
node scripts/create-tables.js
```

### Нет данных в Services

```powershell
# API должен быть запущен!
curl -X POST http://localhost:7071/api/dashboard/services/initialize
```

## 📚 Документация

**Вся необходимая информация находится в этом README.**

- [TESTS_COVERAGE.md](TESTS_COVERAGE.md) - 📊 Тестовое покрытие критических бизнес-сценариев (98.2%, 896 unit + 10 integration + 16 snapshot = 922 тестов)

Для углубленного изучения:
- [Astro Documentation](https://docs.astro.build)
- [Azure Functions Documentation](https://learn.microsoft.com/azure/azure-functions/)
- [Azure Table Storage](https://learn.microsoft.com/azure/storage/tables/)

## 🧠 Быстрый контекст для AI (TL;DR)

**Что это:** Booking system для нутрициолога Софии. Клиенты записываются на консультации онлайн.

**Стек:** Astro (frontend) + Azure Functions v4 (backend) + Azure Table Storage (5 таблиц, €0.10/мес)

**Тестовое покрытие:** 98.2% (896 unit + 10 integration + 16 snapshot = 922 тестов) ✅ Все критические сценарии покрыты

**Архитектура (Service Layer + DI):**
- HTTP handlers (тонкие) → Services (бизнес-логика) → Repository (данные)
- DI Container для управления зависимостями (`api/src/container.js`)
- Централизованная конфигурация (`api/src/config/index.js`)

**Главные файлы:**
- `api/src/functions/createBooking.js` - HTTP handler для бронирования
- `api/src/services/bookingService.js` - бизнес-логика бронирования
- `api/src/services/availabilityService.js` - расчёт доступных слотов
- `api/src/services/emailService.js` - отправка email через Resend
- `api/src/services/pdfService.js` - генерация PDF счетов
- `api/src/utils/securityLogger.js` - логирование безопасности
- `api/src/utils/apiResponse.js` - унифицированный формат ответов
- `shared/translations.js` - единый источник переводов (lv/ru/en)

**Таблицы:**
1. `bookings` - бронирования (PK: date, RK: guid)
2. `adminSettings` - расписание, отпуска (PK: "config")
3. `Services` - услуги с ценами (PK: "SERVICE", кэш 5 мин)
4. `ServicesHistory` - история изменений (PK: serviceId)

**Безопасность:**
- SWA Auth (Microsoft OAuth) + E2E Token для админки
- Rate Limiting (5 бронирований/мин, 60 availability/мин)
- Slot Locking (защита от race condition)
- Security Logger (auth failures, rate limits, injection attempts)
- CSP, HSTS, X-Frame-Options, XSS Protection

**Важно знать:**
- Один админ (Софья), авторизация через Azure AD
- Мультиязычность: lv/ru/en (единый источник — `shared/translations.js`)
- Кэширование: Services 5 мин
- Валидация на уровне API обязательна
- Нет дублирования кода и данных (архитектура оптимизирована)

**Запуск:**
```bash
# Backend (терминал 1)
cd api && func start --cors *

# Frontend (терминал 2)
npm run dev
```

**API примеры:**
```bash
# Получить доступные слоты
GET http://localhost:7071/api/availability/2026-02-15

# Создать бронирование
POST http://localhost:7071/api/bookings
Body: { serviceId, date, time, format, customer... }

# Получить услуги
GET http://localhost:7071/api/dashboard/services
```

**Соглашения:**
- Файлы: camelCase
- Таблицы: PascalCase
- Константы: UPPER_SNAKE_CASE
- Всегда валидировать входные данные
- Всегда возвращать `{ success: true/false, data/errors }`

## 🔧 Частые задачи

### Добавить новую услугу

1. Через API (рекомендуется):
```bash
PUT http://localhost:7071/api/dashboard/services/new-service-id
{
  "name": {
    "lv": "Jauna pakalpojuma",
    "ru": "Новая услуга",
    "en": "New Service"
  },
  "price": 75,
  "duration": 60,
  "allowOnline": true,
  "allowInPerson": false,
  "displayOrder": 4
}
```

2. Напрямую в таблицу `Services`:
```powershell
# Добавить запись в Azure Storage Explorer
```

### Изменить рабочие часы

```bash
PUT http://localhost:7071/api/dashboard/settings
{
  "workingHours": {
    "start": "09:00",
    "end": "17:00"
  }
}
```

### Добавить отпуск

```bash
POST http://localhost:7071/api/dashboard/availability/vacation
{
  "startDate": "2026-07-01",
  "endDate": "2026-07-14",
  "reason": "Summer vacation"
}
```

### Проверить здоровье системы

```bash
# Health check
GET http://localhost:7071/api/health

# Проверить что в таблице
GET http://localhost:7071/api/dashboard/tables/Services
```

## 📊 Типичные сценарии разработки

### Сценарий 1: Добавить новый endpoint

1. Создать файл `api/src/functions/myNewFunction.js`
2. Импортировать и зарегистрировать в `api/src/index.js`
3. Написать тест в `api/tests/`
4. Запустить `npm test`

### Сценарий 2: Изменить валидацию

1. Найти функцию в `api/src/functions/`
2. Обновить проверки (обычно в начале handler)
3. Убедиться что возвращается массив `errors`
4. Протестировать локально

### Сценарий 3: Дебаг проблем с бронированием

1. Проверить логи в терминале где запущен `func start`
2. Проверить таблицу bookings:
```bash
GET http://localhost:7071/api/dashboard/tables/bookings
```
3. Проверить что Services загружены:
```bash
GET http://localhost:7071/api/dashboard/services
```
4. Проверить доступность на конкретную дату:
```bash
GET http://localhost:7071/api/availability/2026-02-15
```
---

## ✅ Тесты

**Покрытие:** 922 теста (896 unit + 10 integration + 16 snapshot)

```powershell
cd api
npm test              # Unit тесты
npm run test:integration  # С Azurite
```

---

## 🔒 Git Flow

1. `git checkout -b feature/название` — создать ветку
2. Разработать и протестировать
3. `npm test` — все тесты должны пройти
4. Создать PR → CI запустит тесты + E2E
5. После успешных проверок — merge

---

## ⏳ TODO

- TypeScript миграция
- Нагрузочное тестирование (k6)
- Azure Application Insights

---

## 📱 ROADMAP: Food Tracker App (AI-Powered)

### 🎯 Концепция

Мобильное приложение для клиентов Софии, позволяющее:
1. **Сфотографировать еду** с телефона
2. **AI автоматически распознает** тип продуктов и примерный вес (граммы)
3. **Записать как приём пищи** с возможностью подкорректировать граммовки
4. **Подтвердить** и сохранить в историю питания

**Проблема:** Людям лень вручную записывать приёмы пищи  
**Решение:** Максимально простой процесс — сфотографировал → проверил → подтвердил

---

### 🏗️ Архитектура решения

```
┌─────────────────────────────────────────────────────────────┐
│            PWA (Progressive Web App)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📱 Mobile-First UI (React/Preact + Tailwind)       │   │
│  │  - Camera API (фото еды)                            │   │
│  │  - Offline support (Service Worker)                 │   │
│  │  - Push Notifications (напоминания о еде)           │   │
│  │  - Add to Home Screen (иконка на телефоне)          │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│            Azure Functions (Serverless API)                  │
│  - POST /api/food/analyze      → AI анализ фото             │
│  - POST /api/meals             → Сохранить приём пищи       │
│  - GET  /api/meals/{date}      → История за день            │
│  - GET  /api/meals/stats       → Статистика КБЖУ            │
│  - GET  /api/user/profile      → Профиль пользователя       │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Azure OpenAI  │  │ Azure Table   │  │ Azure Blob    │
│ GPT-4 Vision  │  │ Storage       │  │ Storage       │
│ (анализ фото) │  │ (данные)      │  │ (фото)        │
│ ~$0.01/фото   │  │ ~$0.10/мес    │  │ ~$0.02/GB     │
└───────────────┘  └───────────────┘  └───────────────┘
```

---

### 💡 Почему PWA, а не Native App?

| Критерий | PWA | Native (React Native/Flutter) |
|----------|-----|-------------------------------|
| **Стоимость разработки** | ✅ Низкая (1 codebase) | ❌ Выше (даже с cross-platform) |
| **App Store/Play Market** | ✅ Не нужен | ❌ $99/год (Apple) + $25 (Google) |
| **Иконка на телефоне** | ✅ "Add to Home Screen" | ✅ Да |
| **Camera API** | ✅ Да (MediaDevices API) | ✅ Да |
| **Push Notifications** | ✅ Да (Web Push) | ✅ Да |
| **Offline работа** | ✅ Service Worker | ✅ Да |
| **Обновления** | ✅ Мгновенные | ❌ Через store review |
| **Деплой** | ✅ Azure Static Web Apps (бесплатно) | ❌ Сложнее |
| **Переиспользование** | ✅ Тот же стек (React/TS) | ⚠️ Частичное |

**Вывод:** PWA идеально подходит для MVP и стадии разработки

---

### 📊 Структура данных

#### Таблица: `Users`
```typescript
interface User {
  PartitionKey: string;      // "user"
  RowKey: string;            // unique user ID (UUID)
  email: string;
  displayName: string;
  targetCalories?: number;   // дневная норма ккал
  targetProtein?: number;    // норма белка (г)
  targetFat?: number;        // норма жиров (г)
  targetCarbs?: number;      // норма углеводов (г)
  createdAt: string;         // ISO date
  linkedClientId?: string;   // связь с bookings (если клиент Софии)
}
```

#### Таблица: `Meals`
```typescript
interface Meal {
  PartitionKey: string;      // `${userId}_${YYYY-MM-DD}`
  RowKey: string;            // timestamp or meal ID
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  photoUrl?: string;         // Blob Storage URL
  items: MealItem[];         // распознанные продукты
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  confirmed: boolean;        // подтверждено пользователем
  createdAt: string;
  confirmedAt?: string;
}

interface MealItem {
  name: string;              // "Куриная грудка"
  nameEn: string;            // "Chicken breast"
  weight: number;            // граммы
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  confidence: number;        // уверенность AI (0-1)
  userAdjusted: boolean;     // пользователь изменил
}
```

#### Таблица: `FoodDatabase` (кэш для быстрого lookup)
```typescript
interface FoodItem {
  PartitionKey: string;      // category ("meat", "dairy", etc.)
  RowKey: string;            // normalized name
  name_lv: string;
  name_ru: string;
  name_en: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
}
```

---

### 🤖 AI Integration: Варианты распознавания еды

#### 🆓 Бесплатные варианты (для разработки и MVP)

| Сервис | Лимиты бесплатно | Стоимость после лимита | Рекомендация |
|--------|------------------|------------------------|--------------|
| **Google Gemini 1.5 Flash** | 15 req/min, 1500 req/day | $0.00015/image | ✅ **Лучший выбор для MVP** |
| **Google Gemini 1.5 Pro** | 2 req/min, 50 req/day | $0.00125/image | Для сложных случаев |
| **OpenAI GPT-4o-mini** | — | $0.002/image | Если уже есть OpenAI аккаунт |
| **Azure OpenAI GPT-4V** | — | $0.01/image | ❌ Дорого для MVP |
| **Clarifai Food Model** | 1000 req/мес | $1.20/1000 после | Специализирован на еде |

#### 💡 Рекомендуемая стратегия

```typescript
// 1. Начать с Google Gemini (бесплатно)
// 2. При превышении лимитов → переключиться на GPT-4o-mini
// 3. В production → Gemini Flash (очень дешево)

const AI_PROVIDERS = {
  gemini: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.0-flash',
    cost: 0.00015, // per image
    freeLimit: 1500 // per day
  },
  openai: {
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    cost: 0.002,
    freeLimit: 0
  }
};
```

#### Prompt для анализа фото еды:

```typescript
const systemPrompt = `You are a nutrition analysis AI. Analyze food photos and return structured JSON.

For each food item visible in the photo:
1. Identify the food item
2. Estimate the weight in grams based on visual cues (plate size, portions)
3. Calculate nutritional values per estimated weight

Return JSON format:
{
  "items": [
    {
      "name": "название на русском",
      "nameEn": "english name",
      "weight": 150,  // estimated grams
      "calories": 248,
      "protein": 31,
      "fat": 13,
      "carbs": 0,
      "confidence": 0.85
    }
  ],
  "totalCalories": 248,
  "totalProtein": 31,
  "totalFat": 13,
  "totalCarbs": 0,
  "mealType": "lunch"  // breakfast/lunch/dinner/snack based on time or content
}

Be conservative with estimates. If unsure, provide lower confidence score.
Use standard nutritional databases (USDA) for calculations.`;
```

#### API Endpoint:

```typescript
// api/src/functions/food-analyze.ts
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

export async function analyzeFoodPhoto(
  photoBase64: string
): Promise<FoodAnalysisResult> {
  const client = new OpenAIClient(
    process.env.AZURE_OPENAI_ENDPOINT,
    new AzureKeyCredential(process.env.AZURE_OPENAI_KEY)
  );

  const response = await client.getChatCompletions(
    "gpt-4-vision",  // deployment name
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyze this meal:" },
          { 
            type: "image_url", 
            imageUrl: { url: `data:image/jpeg;base64,${photoBase64}` }
          }
        ]
      }
    ],
    { maxTokens: 1000, temperature: 0.3 }
  );

  return JSON.parse(response.choices[0].message.content);
}
```

---

### 💰 Расчёт стоимости (обновлённый)

#### Вариант A: Полностью бесплатно (для MVP и тестирования)

| Сервис | Использование | Стоимость/мес |
|--------|---------------|---------------|
| **Azure Static Web Apps** | Free tier | $0 |
| **Azure Functions** | <1M запросов | $0 (free tier) |
| **Azure Table Storage** | ~1GB данных | ~$0.10 |
| **Azure Blob Storage** | ~5GB фото | ~$0.10 |
| **Google Gemini 1.5 Flash** | 1500 фото/день (бесплатно) | $0 |
| **ИТОГО** | | **~$0.20/мес** ✅ |

#### Вариант B: Масштабируемый (для production)

| Сервис | Использование | Стоимость/мес |
|--------|---------------|---------------|
| **Azure Static Web Apps** | Free tier | $0 |
| **Azure Functions** | ~50K запросов | $0 (free tier) |
| **Azure Table Storage** | ~5GB данных | ~$0.50 |
| **Azure Blob Storage** | ~50GB фото | ~$1.00 |
| **Gemini 1.5 Flash** | 10,000 фото × $0.00015 | ~$1.50 |
| **ИТОГО** | | **~$3/мес** |

#### Сравнение AI моделей (на 1000 фото/мес)

| Модель | Стоимость | Скорость | Точность | Рекомендация |
|--------|-----------|----------|----------|--------------|
| Gemini 1.5 Flash | $0.15 | ⚡⚡⚡ Быстро | ⭐⭐⭐ Хорошо | ✅ MVP + Production |
| GPT-4o-mini | $2.00 | ⚡⚡ Средне | ⭐⭐⭐⭐ Отлично | Запасной вариант |
| GPT-4 Vision | $10.00 | ⚡ Медленно | ⭐⭐⭐⭐⭐ Превосходно | ❌ Дорого |
| Clarifai Food | $1.20 | ⚡⚡⚡ Быстро | ⭐⭐⭐ Хорошо | Специализирован |

> 💡 **Вывод:** Начните с Google Gemini бесплатно, это сэкономит ~$60/год на стадии разработки!

---

### 📁 Структура проекта

```
sofija-nutrition-astro/
├── api/                          # Существующий backend
│   └── src/
│       └── functions/
│           ├── food-analyze.ts   # 🆕 AI анализ фото
│           ├── meals.ts          # 🆕 CRUD приёмов пищи
│           └── user-profile.ts   # 🆕 Профиль пользователя
│
├── food-tracker/                 # 🆕 Новый PWA
│   ├── public/
│   │   ├── manifest.json         # PWA manifest
│   │   ├── sw.js                 # Service Worker
│   │   └── icons/                # App icons (192x192, 512x512)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Camera.tsx        # Компонент камеры
│   │   │   ├── FoodEditor.tsx    # Редактор граммовок
│   │   │   ├── MealCard.tsx      # Карточка приёма пищи
│   │   │   ├── DailyStats.tsx    # Статистика за день
│   │   │   └── NutritionBar.tsx  # Прогресс КБЖУ
│   │   ├── pages/
│   │   │   ├── index.tsx         # Главная (today's meals)
│   │   │   ├── camera.tsx        # Фото еды
│   │   │   ├── history.tsx       # История
│   │   │   └── profile.tsx       # Настройки
│   │   ├── hooks/
│   │   │   ├── useCamera.ts      # Camera API
│   │   │   └── useMeals.ts       # Meals state
│   │   ├── services/
│   │   │   └── api.ts            # API client
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts            # Vite + PWA plugin
│   └── tsconfig.json
│
└── shared/                       # Общие типы
    └── types/
        └── food.ts               # 🆕 Food-related types
```

---

### 🎨 UI/UX Flow

```
┌─────────────────────────────────────────────────────────────┐
│  📱 Home Screen                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Today: 1,450 / 2,000 kcal                          │    │
│  │  ████████████████░░░░░░░░░░ 72%                     │    │
│  │                                                      │    │
│  │  P: 85g/120g  F: 45g/65g  C: 180g/250g             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  🍳 Breakfast  ────────────────────────────  320 kcal       │
│     └── Scrambled eggs (150g), Toast (30g)                  │
│                                                              │
│  🥗 Lunch  ─────────────────────────────────  580 kcal      │
│     └── Chicken salad (300g), Dressing (20g)                │
│                                                              │
│  🍎 Snack  ─────────────────────────────────  150 kcal      │
│     └── Apple (180g), Almonds (20g)                         │
│                                                              │
│                    ╔═══════════════╗                         │
│                    ║  📷 ADD MEAL  ║                         │
│                    ╚═══════════════╝                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  📸 Camera View                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │           [  Live Camera Preview  ]                 │    │
│  │                                                      │    │
│  │                    ◉                                │    │
│  │              (Capture Button)                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  💡 Tip: Center your plate in frame                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  🔍 AI Analysis (loading...)                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │        [  Your Photo Preview  ]                     │    │
│  │                                                      │    │
│  │              ⏳ Analyzing...                        │    │
│  │         "Identifying food items..."                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  ✏️ Edit & Confirm                                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │        [  Your Photo  ]                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Detected items (tap to edit):                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🍗 Chicken Breast        [  150g  ] [-] [+]       │    │
│  │     248 kcal | P:31g F:13g C:0g        (85% conf)  │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  🥦 Broccoli              [  100g  ] [-] [+]       │    │
│  │     34 kcal | P:3g F:0g C:7g           (92% conf)  │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  🍚 Rice                  [  120g  ] [-] [+]       │    │
│  │     156 kcal | P:3g F:0g C:34g         (88% conf)  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ──────────────────────────────────────────────────────     │
│  Total: 438 kcal | P:37g F:13g C:41g                        │
│                                                              │
│        [  ➕ Add Item  ]    [  ✅ CONFIRM MEAL  ]           │
└─────────────────────────────────────────────────────────────┘
```

---

### 🚀 План реализации (Phases)

#### Phase 1: MVP (2-3 недели)
- [ ] Создать PWA scaffold (Vite + React + Tailwind)
- [ ] Настроить manifest.json и Service Worker
- [ ] Реализовать Camera API (фото с телефона)
- [ ] Azure OpenAI GPT-4V интеграция
- [ ] Базовый UI: камера → анализ → подтверждение
- [ ] Сохранение в Azure Table Storage
- [ ] Простой список приёмов пищи за день
- [ ] Деплой на Azure Static Web Apps

#### Phase 2: Улучшения (2-3 недели)
- [ ] Редактирование граммовок (+/- кнопки, ручной ввод)
- [ ] Ручное добавление продуктов (поиск по базе)
- [ ] История по дням (календарь)
- [ ] Статистика КБЖУ (прогресс-бары)
- [ ] Установка дневных целей
- [ ] Удаление/редактирование записей

#### Phase 3: Интеграции (2-3 недели)
- [ ] Авторизация (Azure AD B2C или простой email/password)
- [ ] Связь с существующей системой бронирований
- [ ] Панель нутрициолога: просмотр дневников клиентов
- [ ] Push уведомления (напоминания о еде)
- [ ] Экспорт данных (PDF отчёт за неделю/месяц)

#### Phase 4: Оптимизации (ongoing)
- [ ] Кэширование частых продуктов
- [ ] Оффлайн режим (сохранение локально → синхронизация)
- [ ] Улучшение точности AI (fine-tuning на реальных данных)
- [ ] Голосовой ввод продуктов
- [ ] Сканирование штрих-кодов

---

### 🛠️ Технологии для PWA

```json
// food-tracker/package.json
{
  "name": "sofija-food-tracker",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.5.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.19.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0"
  }
}
```

```javascript
// food-tracker/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sofija Food Tracker',
        short_name: 'FoodTracker',
        description: 'AI-powered food diary',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ]
});
```

---

### 🔐 Авторизация (Варианты)

#### Вариант A: Простой (Magic Link)
- Пользователь вводит email
- Получает ссылку для входа
- Сессия хранится в localStorage + JWT
- **Плюсы:** Просто, бесплатно
- **Минусы:** Менее безопасно

#### Вариант B: Azure AD B2C (рекомендуется)
- Полноценная OAuth2 авторизация
- Social logins (Google, Facebook)
- **Плюсы:** Безопасно, масштабируемо
- **Минусы:** ~$0.00325 за активного пользователя

#### Вариант C: Связь с существующей системой
- Клиент получает ссылку после бронирования
- Активация по booking ID
- **Плюсы:** Интеграция с текущей системой
- **Минусы:** Только для существующих клиентов

---

### 📝 Команды для запуска

```powershell
# Создать проект
cd c:\Users\kirils.ivanovs\source\repos\sofija-nutrition-astro
mkdir food-tracker
cd food-tracker
npm create vite@latest . -- --template react-ts

# Установить зависимости
npm install react-router-dom @tanstack/react-query zustand date-fns
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
npx tailwindcss init -p

# Запуск разработки
npm run dev
```

---

### 🔗 Полезные ресурсы

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Azure OpenAI GPT-4 Vision](https://learn.microsoft.com/azure/ai-services/openai/how-to/gpt-with-vision)
- [Camera API (MediaDevices)](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)

---

## 👀 Полезные ссылки

- [Astro Documentation](https://docs.astro.build)
- [Azure Functions](https://learn.microsoft.com/azure/azure-functions/)
- [Azure Table Storage](https://learn.microsoft.com/azure/storage/tables/)
- [E2E тесты](e2e/README.md)
