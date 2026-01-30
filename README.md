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
│ Azure Table Storage (5 таблиц, €0.10/мес)          │
│ - bookings (бронирования)                           │
│ - adminSettings (расписание, отпуска)               │
│ - Services (цены, длительность услуг)               │
│ - FeatureFlags (вкл/выкл функций)                   │
│ - ServicesHistory (история изменений)               │
└─────────────────────────────────────────────────────┘
```

### Ключевые особенности

1. **Serverless архитектура** - нет постоянно работающих серверов, оплата только за запросы
2. **Feature Flags** - включение/выключение функций без деплоя (кэш 2 мин)
3. **Кэширование** - Services кэшируются на 5 мин (↓80% запросов к БД)
4. **Валидация** - все данные проверяются на уровне API
5. **Версионирование** - история изменений цен и настроек сохраняется
6. **Мультиязычность** - lv/ru/en для всех услуг
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

**Feature Flags:**
- `GET /api/dashboard/features` - Список флагов
- `PUT /api/dashboard/features/{featureId}` - Изменить флаг
- `POST /api/dashboard/features/initialize` - Инициализация флагов

**Мониторинг:**
- `GET /api/dashboard/monitoring` - Метрики и статистика
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

# Инициализировать FeatureFlags
curl -X POST http://localhost:7071/api/dashboard/features/initialize
```

## 🏗️ Структура проекта

```text
sofija-nutrition-astro/
├── api/                           # Azure Functions (Backend)
│   ├── src/
│   │   ├── functions/             # HTTP функции
│   │   │   ├── createBooking.js   # Создание бронирования
│   │   │   ├── getAvailability.js # Получение доступных слотов
│   │   │   ├── admin*.js          # Админские функции
│   │   │   └── ...
│   │   ├── services/              # Бизнес-логика
│   │   │   ├── bookingRepository.js
│   │   │   ├── emailService.js
│   │   │   ├── featureFlags.js
│   │   │   └── ...
│   │   └── templates/             # Email шаблоны
│   ├── scripts/                   # Утилиты
│   │   ├── create-tables.js       # Создание таблиц
│   │   └── list-tables.js         # Список таблиц
│   ├── tests/                     # Интеграционные тесты
│   ├── host.json                  # Конфигурация Functions
│   └── local.settings.json        # Локальные переменные (не в git)
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
│   └── data/                      # JSON данные
│
└── README.md                      # Этот файл
```

## 🗄️ База данных (Azure Table Storage)

Проект использует **5 таблиц** (€0.10/месяц):

| Таблица | PartitionKey | RowKey | Назначение | Записей |
|---------|--------------|--------|------------|---------|
| `bookings` | userId/date | guid | Бронирования клиентов | ~100/мес |
| `adminSettings` | "config" | тип настройки | Расписание, отпуска, заблокированные даты | ~2 |
| `Services` | "SERVICE" | serviceId | Цены, длительность, названия услуг | 3 |
| `FeatureFlags` | "FEATURE" | featureName | Вкл/выкл функций без деплоя | 5 |
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

**FeatureFlag:**
```json
{
  "partitionKey": "FEATURE",
  "rowKey": "online_payments",
  "featureName": "online_payments",
  "description": "Enable online payment processing",
  "isEnabled": false
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

### Feature Flags (важно для AI)

**Назначение:** Включение/выключение функций БЕЗ деплоя кода.

**Кэш:** 2 минуты (короткий TTL для быстрой реакции).

**Как использовать в коде:**
```javascript
const { isFeatureEnabled } = require('./services/featureFlags');

if (await isFeatureEnabled('online_payments')) {
    // показать форму оплаты
}
```

**Доступные флаги:**
- `online_payments` (OFF) - Онлайн-оплата через Stripe/PayPal
- `email_reminders` (ON) - Автоматические напоминания за 24ч
- `cgm_diagnostic_booking` (ON) - Бронирование CGM диагностики
- `free_consultation_booking` (ON) - Бесплатные консультации
- `maintenance_mode` (OFF) - Режим обслуживания (блокирует сайт)

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
   - FeatureFlags кэшируются 2 минуты (нужна быстрая реакция)

4. **Почему один администратор?**
   - Проект для индивидуального предпринимателя
   - Нет необходимости в RBAC
   - Авторизация через Azure AD (Microsoft account)

### Соглашения о коде

1. **Именование:**
   - Файлы: camelCase (`createBooking.js`)
   - Функции: camelCase (`getAvailability`)
   - Константы: UPPER_SNAKE_CASE (`SERVICES_TABLE`)
   - Таблицы: PascalCase (`Services`, `FeatureFlags`)

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

**Deployment:**
1. Пуш в `main` ветку
2. GitHub Actions автоматически деплоит
3. Frontend → Azure Static Web Apps
4. Backend → Azure Functions (автоматически вместе с SWA)

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

### Нет данных в Services/FeatureFlags

```powershell
# API должен быть запущен!
curl -X POST http://localhost:7071/api/dashboard/services/initialize
curl -X POST http://localhost:7071/api/dashboard/features/initialize
```

## 📚 Документация

**Вся необходимая информация находится в этом README.**

- [TESTS_COVERAGE.md](TESTS_COVERAGE.md) - 📊 Тестовое покрытие критических бизнес-сценариев (98.2%, 483/492 тестов)

Для углубленного изучения:
- [Astro Documentation](https://docs.astro.build)
- [Azure Functions Documentation](https://learn.microsoft.com/azure/azure-functions/)
- [Azure Table Storage](https://learn.microsoft.com/azure/storage/tables/)

## 🧠 Быстрый контекст для AI (TL;DR)

**Что это:** Booking system для нутрициолога Софии. Клиенты записываются на консультации онлайн.

**Стек:** Astro (frontend) + Azure Functions v4 (backend) + Azure Table Storage (5 таблиц, €0.10/мес)

**Тестовое покрытие:** 98.2% (483/492 тестов) ✅ Все критические сценарии покрыты

**Главные файлы:**
- `api/src/functions/createBooking.js` - создание бронирования
- `api/src/functions/getAvailability.js` - доступные слоты (кэш 5 мин)
- `api/src/services/featureFlags.js` - feature toggles (кэш 2 мин)
- `api/src/services/bookingRepository.js` - работа с БД
- `api/src/services/emailService.js` - отправка email

**Таблицы:**
1. `bookings` - бронирования (PK: date, RK: guid)
2. `adminSettings` - расписание, отпуска (PK: "config")
3. `Services` - услуги с ценами (PK: "SERVICE", кэш 5 мин)
4. `FeatureFlags` - вкл/выкл функций (PK: "FEATURE", кэш 2 мин)
5. `ServicesHistory` - история изменений (PK: serviceId)

**Важно знать:**
- Один админ (Софья), авторизация через Azure AD
- Мультиязычность: lv/ru/en
- Feature flags позволяют вкл/выкл без деплоя
- Кэширование: Services 5 мин, FeatureFlags 2 мин
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

# Изменить feature flag
PUT http://localhost:7071/api/dashboard/features/online_payments
Body: { isEnabled: true }
```

**Соглашения:**
- Файлы: camelCase
- Таблицы: PascalCase
- Константы: UPPER_SNAKE_CASE
- Всегда валидировать входные данные
- Всегда возвращать `{ success: true/false, data/errors }`

## 🎯 Feature Flags - Примеры использования

```powershell
# Посмотреть все флаги
curl http://localhost:7071/api/dashboard/features

# Включить онлайн-оплату
curl -X PUT http://localhost:7071/api/dashboard/features/online_payments `
  -H "Content-Type: application/json" `
  -d '{"isEnabled": true}'
```

**Доступные флаги:**
- `online_payments` - Онлайн-оплата (OFF по умолчанию)
- `email_reminders` - Email напоминания (ON)
- `cgm_diagnostic_booking` - Бронирование CGM диагностики (ON)
- `free_consultation_booking` - Бесплатные консультации (ON)
- `maintenance_mode` - Режим обслуживания (OFF)

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

# Мониторинг (статистика бронирований)
GET http://localhost:7071/api/dashboard/monitoring

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

### Сценарий 3: Добавить новый feature flag

1. Добавить в `api/src/services/featureFlags.js` в список DEFAULT_FLAGS
2. Запустить инициализацию:
```bash
curl -X POST http://localhost:7071/api/dashboard/features/initialize
```
3. Использовать в коде:
```javascript
if (await isFeatureEnabled('my_new_feature')) { ... }
```

### Сценарий 4: Дебаг проблем с бронированием

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

## 👀 Полезные ссылки
  -H "Content-Type: application/json" `
  -d '{"isEnabled": true}'
```

Доступные флаги:
- `online_payments` - Онлайн-оплата (OFF по умолчанию)
- `email_reminders` - Email напоминания (ON)
- `cgm_diagnostic_booking` - Бронирование CGM диагностики (ON)
- `free_consultation_booking` - Бесплатные консультации (ON)
- `maintenance_mode` - Режим обслуживания (OFF)

## 👀 Полезные ссылки

- [Astro Documentation](https://docs.astro.build)
- [Azure Functions Documentation](https://learn.microsoft.com/azure/azure-functions/)
- [Azure Table Storage](https://learn.microsoft.com/azure/storage/tables/)
