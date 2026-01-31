# Sofija Nutrition - Booking System

Система онлайн-бронирования консультаций нутрициолога.

## 🌐 О проекте

Веб-приложение для онлайн-записи на консультации к нутрициологу. Клиенты выбирают услугу, дату и время, оставляют контакты.

**Язык интерфейса:** Латышский, Русский, English

## 🛠️ Технологии

- **Frontend:** Astro
- **Backend:** Azure Functions
- **Database:** Azure Table Storage
- **Hosting:** Azure Static Web Apps

## ⚡ Быстрый старт

```powershell
# Установка
npm install
cd api && npm install

# Запуск
cd api && func start --cors *  # Terminal 1
npm run dev                     # Terminal 2
```

**Frontend:** http://localhost:4321  
**API:** http://localhost:7071

## 📋 API Endpoints

### Публичные

| Method | Endpoint | Описание |
|--------|----------|----------|
| GET | `/api/health` | Health check |
| GET | `/api/availability/{date}` | Доступные слоты |
| POST | `/api/bookings` | Создать бронирование |

### Админ (требует авторизации)

| Method | Endpoint | Описание |
|--------|----------|----------|
| GET | `/api/dashboard/bookings` | Список бронирований |
| GET | `/api/dashboard/services` | Список услуг |
| PUT | `/api/dashboard/settings` | Обновить настройки |

## ✅ Тесты

```powershell
cd api
npm test           # Unit тесты
npm run test:e2e   # E2E тесты
```

## 📚 Документация

- [DEVELOPMENT.md](DEVELOPMENT.md) — Документация для разработки
- [e2e/README.md](e2e/README.md) — E2E тестирование

## 👀 Ссылки

- [Astro](https://docs.astro.build)
- [Azure Functions](https://learn.microsoft.com/azure/azure-functions/)
