# 🔧 Azure Configuration Guide

Полная инструкция по настройке переменных окружения в Azure.

---

## 📋 Оглавление

1. [Azure Static Web App (фронтенд)](#1-azure-static-web-app-фронтенд)
2. [Azure Functions (API)](#2-azure-functions-api)
3. [Проверка настроек](#3-проверка-настроек)

---

## 1. Azure Static Web App (фронтенд)

### Где настраивать

1. Открой [Azure Portal](https://portal.azure.com)
2. Найди **Static Web Apps** → `sofija-nutrition` (или твоё название)
3. Слева выбери **Settings** → **Environment variables**
4. Выбери вкладку **Production variables**

### Что настроить

| Переменная | Значение | Зачем нужна |
|------------|----------|-------------|
| `PUBLIC_API_BASE_URL` | `https://sofija-nutrition-api.azurewebsites.net` | URL твоего Azure Functions API |

### Как добавить

1. Нажми **+ Add**
2. **Name**: `PUBLIC_API_BASE_URL`
3. **Value**: `https://sofija-nutrition-api.azurewebsites.net`
4. Нажми **OK**
5. Нажми **Save** вверху страницы

### ⚠️ Удали эти переменные (если есть)

Они **НЕ должны** быть в Static Web App:

- ❌ `AzureWebJobsStorage` - это для Azure Functions
- ❌ `BUSINESS_EMAIL` - это для API
- ❌ `RESEND_API_KEY` - **секретный ключ!** Опасно держать во фронтенде
- ❌ `AZURE_STORAGE_CONNECTION_STRING` - секретный, для API

**Как удалить:**
1. Нажми на переменную
2. Нажми **Delete** (корзина) справа
3. Нажми **Save**

---

## 2. Azure Functions (API)

### Где настраивать

1. Открой [Azure Portal](https://portal.azure.com)
2. Найди **Function App** → `sofija-nutrition-api` (или твоё название)
3. Слева выбери **Settings** → **Environment variables**
4. Откроется страница с двумя вкладками:
   - **App settings** ← **сюда добавляем переменные**
   - **Connection strings** (не используем)

> 💡 **Если видишь "Configuration (preview)"** - это старый интерфейс, используй его. Там будет вкладка **Application settings**.

### Обязательные переменные

| Переменная | Пример значения | Зачем нужна |
|------------|-----------------|-------------|
| `AZURE_STORAGE_CONNECTION_STRING` | `DefaultEndpointsProtocol=https;AccountName=...` | Для Table Storage (данные бронирований, пациентов, еды) |
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxxxxxx` | Для отправки email подтверждений |
| `ADMIN_EMAIL` | `ivanovs.kirils95@gmail.com` | Email админа для уведомлений о новых бронированиях |

### Опциональные переменные

| Переменная | Пример значения | Зачем нужна |
|------------|-----------------|-------------|
| `E2E_TEST_TOKEN` | `random-hex-string` | Для E2E тестов (если запускаешь `npm run test:e2e`) |
| `GEMINI_API_KEY` | `AIza...` | Для AI анализа еды (food diary фичи) |
| `USE_GEMINI` | `true` | Включить Gemini AI |

### Как добавить переменную

1. В **App settings** нажми **+ Add** или **+ New application setting**
2. **Name**: название переменной (например `RESEND_API_KEY`)
3. **Value**: значение переменной
4. Нажми **OK** или **Apply**
5. После добавления всех переменных нажми **Apply** внизу страницы
6. Затем нажми **Confirm** во всплывающем окне
7. **Подожди 1-2 минуты** пока Functions перезапустится

### 🔑 Где взять значения

#### AZURE_STORAGE_CONNECTION_STRING

1. В Azure Portal → **Storage accounts**
2. Выбери свой Storage Account (например `sofijanutrition`)
3. Слева **Security + networking** → **Access keys**
4. Скопируй **Connection string** из key1 или key2

#### RESEND_API_KEY

1. Иди на [resend.com](https://resend.com)
2. Зарегистрируйся/войди
3. **API Keys** → **Create API Key**
4. Дай имя (например `sofija-nutrition-production`)
5. Скопируй ключ (начинается с `re_`)

#### GEMINI_API_KEY (опционально для AI фич)

1. Иди на [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Создай API key
3. Скопируй ключ

### ⚙️ Автоматические переменные (не трогай!)

Azure Functions автоматически создаёт эти переменные - у тебя они уже есть:

- `AzureWebJobsStorage` - для внутренних нужд Functions
- `APPLICATIONINSIGHTS_CONNECTION_STRING` - мониторинг и логи
- `WEBSITE_CONTENTAZUREFILECONNECTIONSTRING` - хранилище функций
- `WEBSITE_CONTENTSHARE` - файлы приложения
- `WEBSITE_MOUNT_ENABLED` - монтирование файлов
- `WEBSITE_RUN_FROM_PACKAGE` - запуск из пакета
- `FUNCTIONS_WORKER_RUNTIME` = `node`
- `FUNCTIONS_EXTENSION_VERSION` = `~4`

**Не удаляй их!** Они нужны для работы Azure Functions.

---

## 3. Проверка настроек

### Проверь Static Web App

1. Открой сайт: `https://wonderful-bay-0fb550403.4.azurestaticapps.net` (твой URL)
2. Открой DevTools (F12) → Console
3. Не должно быть ошибок CORS или 404

### Проверь API

1. Открой в браузере: `https://sofija-nutrition-api.azurewebsites.net/api/health`
2. Должен вернуть: `{"status":"ok"}`

### Проверь интеграцию

1. Открой `/cabinet` на сайте
2. Авторизуйся
3. Попробуй добавить запись в дневник питания
4. Не должно быть ошибок в консоли

---

## 🆘 Troubleshooting

### Ошибка: "Failed to load resource: 404"

**Проблема**: API не отвечает

**Решение**:
1. Проверь что API задеплоен (GitHub Actions → Deploy Azure Functions)
2. Проверь `PUBLIC_API_BASE_URL` в Static Web App
3. Проверь что Functions запущен (в Azure Portal должен быть статус "Running")

### Ошибка: CORS

**Проблема**: Static Web App не может обращаться к API

**Решение**:
1. Проверь `api/host.json` - должно быть:
   ```json
   "cors": {
     "allowedOrigins": [
       "https://wonderful-bay-0fb550403.4.azurestaticapps.net",
       "https://*.azurestaticapps.net",
       "https://sofija-nutrition.lv"
     ]
   }
   ```
2. Задеплой API заново

### Ошибка: "Storage is not configured"

**Проблема**: Не настроена `AZURE_STORAGE_CONNECTION_STRING`

**Решение**:
1. Добавь переменную в Function App (см. выше)
2. Перезапусти Function App:
   - Azure Portal → Function App → **Overview**
   - Нажми **Restart**

---

## 📝 Summary

### Static Web App (1 переменная)
```
PUBLIC_API_BASE_URL = https:/3 переменные)
```
AZURE_STORAGE_CONNECTION_STRING = DefaultEndpointsProtocol=https;...
RESEND_API_KEY = re_xxxxx...
ADMIN_EMAIL = ivanovs.kirils95@gmail.com
```

### Опционально для Functions
```
E2E_TEST_TOKEN = random-hex-string  (для тестов)
GEMINI_API_KEY = AIza...  (для AI фич)
BUSINESS_EMAIL = info@sofija-nutrition.lv
BUSINESS_NAME = Sofija Nutrition
GEMINI_API_KEY = AIza...
USE_GEMINI = true
```

---

## 🔗 Полезные ссылки

- [Azure Portal](https://portal.azure.com)
- [Resend Dashboard](https://resend.com/emails)
- [Google AI Studio](https://aistudio.google.com)
- [Azure Functions Documentation](https://docs.microsoft.com/en-us/azure/azure-functions/)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
