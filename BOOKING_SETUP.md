# Настройка системы бронирования и отправки счетов

## Архитектура

Решение использует:
- **Azure Static Web Apps** - хостинг фронтенда
- **Azure Functions** (встроенные в SWA) - API для бронирований
- **Resend** - бесплатная отправка email (100 писем/день)

## Настройка Resend (бесплатно)

### 1. Регистрация на Resend

1. Перейдите на [resend.com](https://resend.com)
2. Зарегистрируйтесь с помощью GitHub или email
3. Бесплатный план включает **100 emails/день**

### 2. Получение API ключа

1. В dashboard Resend перейдите в **API Keys**
2. Нажмите **Create API Key**
3. Скопируйте ключ (начинается с `re_`)

### 3. Настройка домена (опционально для продакшена)

Пока у вас нет домена, Resend будет отправлять письма только на **подтвержденные email адреса**:
- Письма владельцу бизнеса будут работать
- Для тестирования добавьте свой email в Resend → Verified Emails

Когда купите домен:
1. Resend → Domains → Add Domain
2. Добавьте DNS записи (DKIM, SPF)
3. После верификации сможете отправлять любому

### 4. Локальная разработка

Для локального запуска API нужен **Azure Functions Core Tools**:

```powershell
# Установка через npm
npm install -g azure-functions-core-tools@4

# Или через Chocolatey
choco install azure-functions-core-tools-4
```

Отредактируйте `api/local.settings.json`:
```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "",
    "RESEND_API_KEY": "re_YOUR_ACTUAL_API_KEY",
    "BUSINESS_EMAIL": "your-verified-email@example.com",
    "BUSINESS_NAME": "Sofija Ivanova - Uztura Speciāliste"
  }
}
```

### 5. Запуск локально

```powershell
# Терминал 1: Запуск Astro
npm run dev

# Терминал 2: Запуск Azure Functions
cd api
func start
```

Astro будет на http://localhost:4321
API будет на http://localhost:7071

### 6. Деплой на Azure SWA

При деплое на Azure Static Web Apps, добавьте переменные окружения:

1. Azure Portal → Ваш Static Web App → Configuration
2. Добавьте:
   - `RESEND_API_KEY` = ваш ключ
   - `BUSINESS_EMAIL` = ваш email

## Тестирование

### Локальный режим (без API)
Если API не запущен, фронтенд работает в демо-режиме:
- Бронирования сохраняются в памяти браузера
- Email не отправляются
- Показывается success modal

### С API
1. Запустите `func start` в папке api
2. Сделайте бронирование на сайте
3. Проверьте консоль на ошибки
4. Email придет на указанный адрес

## Цены на услуги

Настраиваются в `api/src/functions/createBooking.js`:

```javascript
const SERVICE_PRICES = {
    'cgm-diagnostic': { price: 150, ... },
    'consultation': { price: 80, ... },
    'follow-up': { price: 50, ... }
};
```

## Шаблон счета

Счет генерируется как HTML email с:
- Информацией о визите
- Суммой к оплате
- Реквизитами для банковского перевода
- Инструкциями по оплате

Шаблон находится в функции `sendInvoiceEmail()` в `createBooking.js`.

## Альтернативы Resend

Если нужно больше бесплатных писем:

| Сервис | Бесплатный лимит |
|--------|------------------|
| **Resend** | 100/день |
| **Brevo (Sendinblue)** | 300/день |
| **Mailgun** | 5000/месяц (3 месяца) |
| **Postmark** | 100/месяц |
| **EmailJS** | 200/месяц (работает с фронтенда) |

Для переключения на другой сервис, замените Resend SDK в `createBooking.js`.
