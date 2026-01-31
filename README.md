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

---

## 🔒 Git Flow & Защита Main Branch

### Стратегия работы с ветками

**Основной принцип:** Main branch всегда должен содержать только стабильный, протестированный код.

### Процесс разработки новой фичи

#### 1️⃣ Создание feature branch

```powershell
# Обновить main до последней версии
git checkout main
git pull origin main

# Создать новую ветку от main
git checkout -b feature/название-фичи
```

**Naming convention для веток:**
- `feature/` - новая функциональность (например, `feature/sms-notifications`)
- `fix/` - исправление багов (например, `fix/timezone-issue`)
- `refactor/` - рефакторинг кода (например, `refactor/booking-service`)
- `test/` - добавление/улучшение тестов (например, `test/payment-scenarios`)

#### 2️⃣ Разработка в feature branch

```powershell
# Работаем над фичей, делаем коммиты
git add .
git commit -m "feat: добавил функцию X"

# Периодически синхронизируемся с main
git checkout main
git pull origin main
git checkout feature/название-фичи
git merge main  # Или git rebase main для чистой истории
```

#### 3️⃣ Pre-merge проверки (обязательно!)

Перед тем как мерджить в main, **обязательно** выполнить все проверки:

**A. Запустить все unit тесты:**
```powershell
cd api
npm test
```
✅ **Требование:** Все 483 теста должны пройти успешно

**B. Запустить критические бизнес-сценарии:**
```powershell
# Запустить API
cd api
func start --cors *

# В другом терминале - запустить критические тесты
npm test critical-business-scenarios.test.js
```
✅ **Требование:** Все 20 критических тестов прошли

**C. Запустить E2E тесты (Playwright):**
```powershell
# E2E тесты автоматически запустят API и Frontend
npm run test:e2e
```
✅ **Требование:** Все E2E тесты прошли (5 критических процессов)

**D. Проверить работу в браузере (ручной smoke test):**
```powershell
# Запустить полный стек
# Terminal 1: Backend
cd api
func start --cors *

# Terminal 2: Frontend
npm run dev
```

**Критические проверки вручную:**
1. ✅ Открыть http://localhost:4321
2. ✅ Выбрать услугу и дату
3. ✅ Проверить что слоты загружаются
4. ✅ Создать тестовое бронирование
5. ✅ Проверить что пришел email (в логах)
6. ✅ Проверить админ-панель (если менялась)

**D. Проверить что нет ошибок линтинга:**
```powershell
# Если есть ESLint
npm run lint

# Проверить TypeScript ошибки (если используется)
npm run type-check
```

#### 4️⃣ Создание Pull Request

```powershell
# Запушить feature branch на GitHub
git push origin feature/название-фичи
```

На GitHub:
1. Открыть Pull Request из `feature/название-фичи` в `main`
2. **Заполнить описание PR:**
   - Что изменилось
   - Зачем это нужно
   - Какие тесты добавлены/обновлены
   - Скриншоты (если UI изменения)

**Пример описания PR:**
```markdown
## 🎯 Цель
Добавить SMS уведомления для клиентов

## ✨ Что изменилось
- Добавлен сервис `smsService.js` с интеграцией Twilio
- Обновлена функция `createBooking` для отправки SMS
- Добавлены настройки SMS в admin панель

## ✅ Тесты
- [x] Все 483 unit теста проходят
- [x] Все 20 критических бизнес-тестов проходят  
- [x] Добавлены 5 новых тестов для SMS функциональности
- [x] Проверено вручную в браузере

## 📸 Скриншоты
[приложить скриншоты]
```

#### 5️⃣ Code Review (опционально, если есть команда)

Если работаете один - переходите к шагу 6.

Если есть команда:
- Дождаться review от коллеги
- Исправить замечания
- Получить approve

#### 6️⃣ CI/CD проверки (автоматические)

GitHub Actions автоматически запустит:
- ✅ Unit тесты (`npm test`)
- ✅ Build проверка (`npm run build`)
- ✅ Критические тесты

**ВАЖНО:** Мерджить можно только если все CI checks прошли успешно ✅

#### 7️⃣ Merge в Main

**Только после того как:**
- ✅ Все unit тесты прошли (483/483)
- ✅ Все критические тесты прошли (20/20)
- ✅ E2E smoke test пройден вручную
- ✅ CI/CD checks прошли на GitHub
- ✅ Code review пройден (если есть команда)

**Способы merge:**

**A. Через GitHub UI (рекомендуется):**
1. Нажать "Merge Pull Request"
2. Выбрать стратегию:
   - **Squash and merge** - все коммиты сольются в один (рекомендуется для feature веток)
   - **Rebase and merge** - чистая история, коммиты по одному
   - **Merge commit** - сохранить все коммиты

**B. Через командную строку:**
```powershell
git checkout main
git pull origin main
git merge feature/название-фичи --no-ff  # Создаст merge commit
git push origin main
```

#### 8️⃣ Очистка

```powershell
# Удалить локальную feature ветку
git branch -d feature/название-фичи

# Удалить remote feature ветку
git push origin --delete feature/название-фичи
```

### 🚨 Правила защиты Main Branch

**ЗАПРЕЩЕНО:**
- ❌ Делать `git push` напрямую в main без тестов
- ❌ Мерджить если хотя бы 1 тест упал
- ❌ Мерджить если CI/CD check не прошел
- ❌ Пушить код который не запускается локально
- ❌ Коммитить закомментированный код или TODO без задачи

**ОБЯЗАТЕЛЬНО:**
- ✅ Всегда работать в feature ветке
- ✅ Запускать тесты перед merge
- ✅ Проверять вручную критические сценарии
- ✅ Писать осмысленные commit messages
- ✅ Обновлять документацию при изменении API

### 📊 Чеклист перед Merge в Main

Используйте этот чеклист для каждого PR:

```markdown
## Pre-Merge Checklist

### Тесты
- [ ] `npm test` - все 483 unit теста прошли ✅
- [ ] Критические бизнес-тесты прошли (20/20) ✅
- [ ] **E2E тесты прошли (`npm run test:e2e`) ✅**
- [ ] Добавлены тесты для новой функциональности ✅
- [ ] Coverage не упал (минимум 80%) ✅

### Ручная проверка
- [ ] E2E тесты покрывают критические сценарии ✅
- [ ] Нет ошибок в консоли браузера (при ручной проверке) ✅
- [ ] Нет ошибок в логах API (при ручной проверке) ✅

### Код
- [ ] Код отформатирован ✅
- [ ] Нет console.log для дебага ✅
- [ ] Нет закомментированного кода ✅
- [ ] Переменные названы понятно ✅
- [ ] Функции не больше 50 строк ✅
- [ ] Обработаны все ошибки (try/catch) ✅

### Документация
- [ ] README обновлен (если нужно) ✅
- [ ] Комментарии к сложным участкам кода ✅
- [ ] API документация актуальна ✅

### Git
- [ ] Commit messages осмысленные ✅
- [ ] Ветка синхронизирована с main ✅
- [ ] Нет конфликтов ✅
- [ ] CI/CD проверки прошли на GitHub ✅

### Безопасность
- [ ] Нет хардкодных паролей/ключей ✅
- [ ] Секреты в .env/.gitignore ✅
- [ ] Валидация всех входных данных ✅
```

### 🔄 Автоматизация (будущее)

**GitHub Branch Protection Rules** (настроить в Settings > Branches):
- ✅ Require pull request before merging
- ✅ Require status checks to pass (CI/CD)
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings

**Pre-commit hooks** (husky):
```powershell
# Установить husky для автоматической проверки
npm install --save-dev husky
npx husky init

# В .husky/pre-commit:
npm test
```

### 📈 Метрики качества

**Target показатели:**
- Test coverage: ≥ 80%
- Unit tests passing: 100% (483/483)
- Critical tests: 100% (20/20)
- **E2E tests passing: 100% (5 critical flows)**
- Build time: < 2 min
- Zero console errors in production

---

## 🎭 E2E Тестирование

Для максимальной защиты критических бизнес-процессов используется **Playwright** (современная альтернатива Selenium).

### Почему Playwright?

✅ **Быстрее** - в 2-3 раза быстрее Selenium  
✅ **Надежнее** - автоматические ожидания и retry  
✅ **Современнее** - активно развивается Microsoft  
✅ **Проще** - отличный debugging с UI mode  
✅ **Полнее** - автоматические скриншоты/видео при падении  

### Критические процессы покрытые E2E тестами

1. **Просмотр услуг и выбор даты** - клиенты могут выбрать услугу и дату
2. **Загрузка временных слотов** - клиенты видят доступное время
3. **Создание бронирования** - клиенты могут забронировать консультацию
4. **API работает** - backend отвечает корректно
5. **Мультиязычность** - все языки (lv/ru/en) работают

### Запуск E2E тестов

```powershell
# Запуск всех E2E тестов (headless)
npm run test:e2e

# UI mode для debugging (рекомендуется)
npm run test:e2e:ui

# С видимым браузером
npm run test:e2e:headed

# Debug режим (пошаговое выполнение)
npm run test:e2e:debug

# Посмотреть отчет
npm run test:e2e:report
```

**📚 Полная документация:** [e2e/README.md](e2e/README.md)

---

---

## 🗺️ Roadmap: План развития проекта

### Приоритеты и статусы

| Приоритет | Обозначение |
|-----------|-------------|
| 🔴 **CRITICAL** | Блокирует production / безопасность |
| 🟠 **HIGH** | Важно для стабильности и качества |
| 🟡 **MEDIUM** | Улучшение DX и maintainability |
| 🟢 **LOW** | Nice-to-have, будущие улучшения |

---

### 🔒 1. Безопасность (Security)

#### ✅ DONE - Защита main branch от прямых пушей

**Статус:** ✅ Выполнено

**Реализовано:**
- ✅ Require a pull request before merging
- ✅ Require status checks: "Build and Deploy"
- ✅ Require branches to be up to date
- ✅ enforce_admins: true (даже админ не может обойти правила)
- ✅ delete_branch_on_merge: true (автоудаление feature веток)

---

#### ✅ DONE - Rate Limiting для API

**Статус:** ✅ Реализовано (PR #4)

**Решение реализовано в:** `api/src/utils/rateLimiter.js`

```javascript
const RATE_LIMITS = {
    createBooking: { windowMs: 60000, maxRequests: 5 },    // 5 бронирований/мин
    getAvailability: { windowMs: 60000, maxRequests: 60 }, // 60 запросов/мин
    admin: { windowMs: 60000, maxRequests: 100 },
    default: { windowMs: 60000, maxRequests: 100 }
};
};

function checkRateLimit(request, endpoint) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    
    // Очистить старые записи
    if (requestCounts.has(key)) {
        const { count, firstRequest } = requestCounts.get(key);
        if (now - firstRequest > WINDOW_MS) {
            requestCounts.delete(key);
        }
    }
    
    const current = requestCounts.get(key) || { count: 0, firstRequest: now };
    current.count++;
    requestCounts.set(key, current);
    
    const limit = MAX_REQUESTS[endpoint] || MAX_REQUESTS.default;
    return current.count <= limit;
}
```

---

#### ✅ DONE - Валидация и санитизация входных данных

**Статус:** ✅ Реализовано (PR #4)

**Решение реализовано в:** `api/src/utils/validation.js`

Функции:
- `escapeHtml()` - защита от XSS
- `stripDangerous()` - удаление script тегов и event handlers
- `sanitizeName()`, `sanitizeEmail()`, `sanitizePhone()` - валидация полей
- `validateBookingInput()` - комплексная валидация бронирования

```javascript
// Пример использования в createBooking.js
const { validateBookingInput, validationErrorResponse } = require('../utils/validation');

const validation = validateBookingInput(body);
if (!validation.valid) {
    return validationErrorResponse(validation.errors);
});
}
```

---

#### ✅ DONE - Защита от двойного бронирования (Race Condition)

**Статус:** ✅ Реализовано

**Решение реализовано в:** `api/src/services/bookingRepository.js`

- `acquireSlotLock(date, time)` — создаёт LOCK запись с ETag
- `releaseSlotLock(date, time)` — удаляет блокировку
- TTL 30 секунд для автоматического освобождения
- 13 тестов в `api/tests/slotLocking.test.js`

**Проблема (решена):** Два пользователя могут одновременно забронировать один слот.

**Решение:** Использовать Azure Table Storage ETag для оптимистичной блокировки:

```javascript
// Создать "lock" запись перед бронированием
async function lockTimeSlot(date, time) {
    const lockEntity = {
        partitionKey: 'LOCK',
        rowKey: `${date}_${time}`,
        lockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30000).toISOString() // 30 сек
    };
    
    try {
        await tableClient.createEntity(lockEntity);
        return true; // Успешно заблокировали
    } catch (error) {
        if (error.statusCode === 409) {
            return false; // Уже заблокировано другим запросом
        }
        throw error;
    }
}
```

---

#### ✅ DONE - HTTPS и Security Headers

**Статус:** ✅ Полностью реализовано

**Реализовано в:** `public/staticwebapp.config.json`

```json
"globalHeaders": {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
}
```

---

#### 🟡 MEDIUM - Логирование безопасности

**Статус:** ⏳ TODO

**Решение:** Логировать подозрительные активности:
- Множественные неудачные попытки авторизации
- Попытки доступа к admin API без токена
- Необычно большое количество запросов с одного IP

---

### 🏗️ 2. Архитектура (Architecture)

#### ✅ DONE - Централизованная обработка ошибок

**Статус:** ✅ Реализовано

**Реализовано в:** `api/src/utils/errorHandler.js`

- `AppError` класс для operational errors
- `withErrorHandling()` wrapper для Azure Functions
- `Errors` фабрика: `validation()`, `unauthorized()`, `slotTaken()`, `notFound()`
- 25 тестов в `api/tests/errorHandler.test.js`

**Проблема (решена):** Каждая функция имеет свой try/catch с дублированием кода.

**Решение:** Создать middleware для обработки ошибок:

```javascript
// api/src/utils/errorHandler.js
class AppError extends Error {
    constructor(message, statusCode, errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true;
    }
}

function withErrorHandling(handler) {
    return async (request, context) => {
        try {
            return await handler(request, context);
        } catch (error) {
            context.error('Unhandled error:', error);
            
            if (error.isOperational) {
                return {
                    status: error.statusCode,
                    jsonBody: { 
                        success: false, 
                        error: error.message,
                        code: error.errorCode 
                    }
                };
            }
            
            // Не показывать детали внутренних ошибок
            return {
                status: 500,
                jsonBody: { 
                    success: false, 
                    error: 'Internal server error',
                    code: 'INTERNAL_ERROR'
                }
            };
        }
    };
}

module.exports = { AppError, withErrorHandling };
```

**Использование:**
```javascript
app.http('createBooking', {
    handler: withErrorHandling(async (request, context) => {
        // Теперь можно просто throw new AppError(...)
        if (!body.email) {
            throw new AppError('Email is required', 400, 'VALIDATION_ERROR');
        }
    })
});
```

---

#### 🟠 HIGH - Слой сервисов (Service Layer)

**Статус:** ✅ DONE

**Проблема:** Бизнес-логика смешана с HTTP handlers. Сложно тестировать и переиспользовать.

**Решение:** Выделена бизнес-логика в отдельные сервисы:

```
api/src/
├── functions/           # HTTP handlers (тонкие, только routing)
│   ├── createBooking.js # ~70 строк (было 234) - только HTTP concerns
│   └── getAvailability.js # ~40 строк (было 380) - только HTTP concerns
├── services/            # Бизнес-логика
│   ├── bookingService.js     # createBooking(), confirmPayment(), cancelBooking(), BookingError
│   ├── availabilityService.js # getAvailability(), isSlotAvailable(), getServiceSettings()
│   ├── bookingRepository.js   # CRUD операции с Azure Table Storage
│   ├── emailService.js        # Отправка email через Resend
│   ├── pdfService.js          # Генерация PDF счетов
│   └── latvianHolidays.js     # Проверка праздничных дней
└── utils/               # Хелперы
```

**Что сделано:**

1. **BookingService** (`api/src/services/bookingService.js`):
   - `createBooking(input, options)` - полный флоу создания бронирования
   - `confirmPayment(token)` - подтверждение оплаты
   - `cancelBooking(id, reason)` - отмена с email уведомлением
   - `BookingError` - типизированные ошибки с кодами и локализацией
   - `BookingErrorCodes` - константы ошибок (SLOT_ALREADY_BOOKED, WEEKEND_NOT_ALLOWED и т.д.)

2. **AvailabilityService** (`api/src/services/availabilityService.js`):
   - `getAvailability({ specificDate, daysAhead })` - получение доступных слотов
   - `isSlotAvailable(date, time)` - проверка конкретного слота
   - `getServiceSettings()` - загрузка услуг с кэшированием (5 мин TTL)
   - `getScheduleSettings()` - расписание работы
   - `getBlockedDates()` / `getVacationPeriods()` - заблокированные даты

3. **HTTP Handlers** стали тонкими (~70 строк вместо 234):
   - Парсинг request
   - Rate limiting
   - Валидация
   - Вызов сервиса
   - Формирование response

4. **Тесты** (`api/tests/bookingService.test.js`, `api/tests/availabilityService.test.js`):
   - 23 новых теста для сервисов
   - Покрытие BookingError, BookingErrorCodes
   - Покрытие generateSlotsFromSchedule, isDateInVacation

**Пример использования:**

```javascript
// api/src/functions/createBooking.js - тонкий HTTP handler
const { createBooking, BookingError } = require('../services/bookingService');

app.http('createBooking', {
    handler: async (request, context) => {
        // Rate limiting и валидация (HTTP concerns)
        const rateCheck = checkRateLimit(request, 'createBooking');
        if (!rateCheck.allowed) return rateLimitExceededResponse(rateCheck);
        
        const validation = validateBookingInput(await request.json());
        if (!validation.valid) return validationErrorResponse(validation.errors);

        try {
            // Делегирование бизнес-логики сервису
            const result = await createBooking(validation.data, {
                onLog: (msg) => context.log(msg),
                onError: (msg) => context.log.error(msg)
            });
            
            return { status: 200, jsonBody: result };
        } catch (error) {
            if (error instanceof BookingError) {
                return error.toResponse(); // { status: 409, jsonBody: { code: 'SLOT_TAKEN', ... } }
            }
            return { status: 500, jsonBody: { error: 'Internal error' } };
        }
    }
});
```

---

#### 🟡 MEDIUM - Dependency Injection

**Статус:** ✅ DONE

**Проблема:** Зависимости создаются внутри модулей, сложно тестировать и подменять.

**Решение:** Простой DI container реализован в `api/src/container.js`:

```javascript
// api/src/container.js
const { Container, container } = require('./container');

// Регистрация сервиса
container.register('config', () => require('./config'), { singleton: true });
container.register('bookingService', () => require('./services/bookingService'), { singleton: true });

// Резолвинг
const bookingService = container.resolve('bookingService');
```

**Что реализовано:**

1. **Container класс** (`api/src/container.js`):
   - `register(name, factory, { singleton })` - регистрация фабрики
   - `resolve(name)` - получение экземпляра
   - `has(name)` - проверка регистрации
   - `clear()` / `clearSingletons()` - очистка для тестов

2. **Регистрация сервисов** (`api/src/services.js`):
   - Автоматическая регистрация всех сервисов при импорте
   - config, translations, bookingRepository, emailService, pdfService
   - availabilityService, bookingService, featureFlags

3. **Тесты** (`api/tests/container.test.js`, `api/tests/services-registration.test.js`):
   - 22 новых теста для DI container
   - Покрытие singleton, factory, dependency chain

**Преимущества:**
- Легко подменять зависимости в тестах
- Централизованная конфигурация сервисов
- Поддержка singleton паттерна
- Минимальный overhead (~80 строк кода)

---

#### 🟡 MEDIUM - Типизация (TypeScript)

**Статус:** ⏳ TODO (долгосрочно)

**Проблема:** JavaScript без типов → ошибки обнаруживаются в runtime.

**Решение поэтапно:**
1. Добавить JSDoc для всех функций (быстро)
2. Добавить `@ts-check` в критичные файлы
3. Постепенно мигрировать на TypeScript

```javascript
// С JSDoc уже получаем подсказки в IDE
/**
 * @typedef {Object} Booking
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} date
 * @property {string} time
 * @property {'pending'|'confirmed'|'cancelled'} status
 */

/**
 * Save booking to storage
 * @param {Booking} booking
 * @returns {Promise<boolean>}
 */
async function saveBooking(booking) {
    // ...
}
```

---

### 🔄 3. Рефакторинг (Refactoring)

#### 🟠 HIGH - Убрать дублирование переводов

**Статус:** ⏳ TODO

**Проблема:** Переводы есть в нескольких местах:
- `api/src/translations.js`
- `public/assets/booking.js` (hardcoded)
- Email templates

**Решение:** Единый источник переводов:

```javascript
// shared/translations.js (общий для frontend и backend)
module.exports = {
    lv: {
        services: { ... },
        booking: { ... },
        email: { ... },
        errors: { ... }
    },
    ru: { ... },
    en: { ... }
};
```

---

#### 🟠 HIGH - Выделить конфигурацию

**Статус:** ⚠️ Частично

**Проблема:** Часть конфигов в `config.js`, часть захардкожена.

**Решение:** Все конфиги в одном месте:

```javascript
// api/src/config/index.js
module.exports = {
    app: {
        name: 'Sofija Nutrition',
        timezone: 'Europe/Riga',
        defaultLanguage: 'lv'
    },
    cache: {
        servicesTTL: 5 * 60 * 1000,      // 5 минут
        featureFlagsTTL: 2 * 60 * 1000,  // 2 минуты
        availabilityTTL: 60 * 1000       // 1 минута
    },
    booking: {
        workingHours: { start: '09:00', end: '18:00' },
        slotDuration: 30,                 // минут
        maxBookingsPerDay: 8,
        bookingWindowDays: 60             // на сколько дней вперед
    },
    rateLimit: {
        createBooking: { max: 5, windowMs: 60000 },
        getAvailability: { max: 30, windowMs: 60000 }
    }
};
```

---

#### 🟡 MEDIUM - Унифицировать формат ответов API

**Статус:** ⚠️ Частично

**Проблема:** Разные endpoints возвращают данные по-разному.

**Решение:** Стандартный формат:

```javascript
// Успешный ответ
{
    "success": true,
    "data": { ... },
    "meta": {
        "timestamp": "2026-01-31T10:00:00Z",
        "requestId": "abc123"
    }
}

// Ошибка
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Email is required",
        "details": [
            { "field": "email", "message": "Email is required" }
        ]
    },
    "meta": { ... }
}
```

---

#### 🟡 MEDIUM - Вынести magic numbers в константы

**Статус:** ⏳ TODO

```javascript
// До
if (dayOfWeek === 0 || dayOfWeek === 6) { ... }
const cache = new Map(); // TTL 5 * 60 * 1000

// После
const DAYS = { SUNDAY: 0, MONDAY: 1, ..., SATURDAY: 6 };
const CACHE_TTL = { SERVICES: 5 * 60 * 1000, FEATURES: 2 * 60 * 1000 };

if (dayOfWeek === DAYS.SUNDAY || dayOfWeek === DAYS.SATURDAY) { ... }
```

---

### 🧪 4. Тестирование (Testing)

#### 🟠 HIGH - Integration тесты с реальной БД

**Статус:** ⏳ TODO

**Проблема:** Unit тесты используют моки. Нужны тесты с Azurite (локальный эмулятор).

**Решение:**
```bash
# Запуск Azurite
npm install -g azurite
azurite --silent --location ./azurite-data

# Тесты с реальным storage
npm run test:integration
```

---

#### 🟡 MEDIUM - Snapshot тесты для email templates

**Статус:** ⏳ TODO

```javascript
// api/tests/email-templates.snapshot.test.js
const { generateClientEmailHTML } = require('../src/templates/emailTemplates');

test('client email matches snapshot', () => {
    const html = generateClientEmailHTML(mockTranslations, mockBooking);
    expect(html).toMatchSnapshot();
});
```

---

#### 🟡 MEDIUM - Нагрузочное тестирование

**Статус:** ⏳ TODO

**Инструмент:** k6 или Artillery

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 50,           // 50 виртуальных пользователей
    duration: '1m',    // 1 минута
};

export default function () {
    const res = http.get('https://api.sofija-nutrition.lv/api/availability');
    check(res, { 'status was 200': (r) => r.status === 200 });
    sleep(1);
}
```

---

### 🚀 5. DevOps & CI/CD

#### 🔴 CRITICAL - Настроить Branch Protection (повтор для видимости)

См. раздел "Безопасность" выше.

---

#### 🟠 HIGH - Staging окружение

**Статус:** ⏳ TODO

**Проблема:** Сейчас только production. Нет возможности тестировать перед релизом.

**Решение:** Azure Static Web Apps автоматически создает Preview environments для PR.

Добавить в workflow:
```yaml
- name: Comment PR with preview URL
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `🚀 Preview deployed: ${process.env.PREVIEW_URL}`
      })
```

---

#### 🟡 MEDIUM - Автоматические релизы

**Статус:** ⏳ TODO

**Решение:** Semantic versioning + автоматические release notes:

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/release-please-action@v4
        with:
          release-type: node
```

---

#### 🟡 MEDIUM - Мониторинг и алерты

**Статус:** ⏳ TODO

**Решение:** Azure Application Insights:
- Трекинг ошибок
- Performance метрики
- Алерты при проблемах

---

### 📋 6. Приоритеты на ближайшие спринты

#### Sprint 1 (1-2 недели) - Безопасность

1. ✅ Настроить Branch Protection Rules
2. ⏳ Добавить Rate Limiting
3. ⏳ Добавить валидацию с `validator`
4. ⏳ Защита от race condition

#### Sprint 2 (2-3 недели) - Архитектура

1. ⏳ Централизованная обработка ошибок
2. ⏳ Выделить BookingService
3. ⏳ Унифицировать ответы API
4. ⏳ Вынести конфигурацию

#### Sprint 3 (1-2 недели) - Рефакторинг

1. ⏳ Единый источник переводов
2. ⏳ Убрать magic numbers
3. ⏳ Добавить JSDoc типизацию

#### Sprint 4 (1 неделя) - DevOps

1. ⏳ Staging окружение
2. ⏳ Мониторинг
3. ⏳ Автоматические релизы

---

### ✅ Уже реализовано

- ✅ **Авторизация:** SWA Auth (Microsoft OAuth) + E2E Token
- ✅ **CI/CD:** GitHub Actions с unit + E2E тестами
- ✅ **Auto-merge:** PR автоматически мерджится после успешных тестов
- ✅ **Тестовое покрытие:** 495 unit тестов, E2E для критических сценариев
- ✅ **Email уведомления:** Подтверждение, отмена бронирования
- ✅ **Feature Flags:** Управление функциями без деплоя
- ✅ **Кэширование:** Services 5 мин, FeatureFlags 2 мин
- ✅ **Мультиязычность:** LV, RU, EN
- ✅ **CORS:** Настроен для всех окружений
- ✅ **Security Headers:** X-Frame-Options, X-Content-Type-Options

---

## 👀 Полезные ссылки

- [Astro Documentation](https://docs.astro.build)
- [Azure Functions Documentation](https://learn.microsoft.com/azure/azure-functions/)
- [Azure Table Storage](https://learn.microsoft.com/azure/storage/tables/)
