# E2E Tests Authentication Setup

## Проблема

E2E тесты требуют авторизации для выполнения админ-действий (подтверждение/отмена бронирований). 
Стандартная Microsoft OAuth авторизация не работает в CI из-за:
- Windows Hello/Passkey нативных диалогов
- Невозможности интерактивной авторизации в headless режиме

## Решение: API Token Authentication

E2E тесты используют **двойной подход**:
1. **Клиентская часть** (бронирование) - тестируется через UI
2. **Админ-часть** (подтверждение/отмена) - тестируется **напрямую через API** с E2E токеном

### Преимущества
- ✅ Токен никогда не истекает (пока не сменишь вручную)
- ✅ Полностью автоматизированные тесты без ручного вмешательства
- ✅ Безопасно - токен хранится в секретах
- ✅ Обходит SWA auth (работает напрямую с API)
- ✅ Тестируется и UI (клиент) и API (админ)

## Настройка (одноразовая)

### Шаг 1: Сгенерируйте токен

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Пример результата: `f1b101f3ac3dbb3bda8204f1892a031ebbaccf4c5a6e023e348ed3e517d8abc0`

### Шаг 2: Добавьте токен в Azure Function App

1. Откройте [Azure Portal](https://portal.azure.com)
2. Перейдите в **Function App** → `sofija-nutrition-api`
3. **Settings** → **Environment variables** (или Configuration)
4. Добавьте переменную:
   - **Name:** `E2E_TEST_TOKEN`
   - **Value:** `<ваш токен из шага 1>`
5. Нажмите **Save** и подождите перезапуска

### Шаг 3: Добавьте токен в GitHub Secrets

1. Откройте репозиторий на GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**
4. Добавьте:
   - **Name:** `E2E_TEST_TOKEN`
   - **Secret:** `<тот же токен из шага 1>`
5. Нажмите **Add secret**

## Готово! 🎉

Теперь E2E тесты будут автоматически использовать токен:

```bash
# Локально (с токеном в env)
E2E_TEST_TOKEN=<токен> npm run test:e2e

# В CI - токен берётся из GitHub Secret автоматически
```

## Как это работает

```
┌─────────────────────────────────────────────────────────────────┐
│                        E2E ТЕСТ                                  │
├─────────────────────────────────────────────────────────────────┤
│  ЧАСТЬ 1: Клиентское бронирование (UI)                         │
│  ├─ Открывает сайт в браузере                                   │
│  ├─ Выбирает дату/время                                         │
│  ├─ Заполняет форму                                             │
│  └─ Отправляет бронирование                                     │
├─────────────────────────────────────────────────────────────────┤
│  ЧАСТЬ 2: Админ-действия (API с X-E2E-Token)                   │
│  ├─ GET /api/dashboard/bookings → находит бронирование          │
│  ├─ PATCH /api/dashboard/bookings/{id} → подтверждает           │
│  └─ PATCH /api/dashboard/bookings/{id} → отменяет               │
└─────────────────────────────────────────────────────────────────┘
```

## Безопасность

- ✅ Токен хранится только в Azure и GitHub Secrets
- ✅ API проверяет токен через middleware (`authMiddleware.js`)
- ✅ Продакшн админ-панель остаётся защищённой Microsoft OAuth
- ✅ Токен можно сменить в любой момент

## Смена токена

Если нужно обновить токен:

1. Сгенерируйте новый: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Обновите в Azure Function App Settings
3. Обновите в GitHub Secrets

## Troubleshooting

### Тесты пропускают админ-часть

Если видите "E2E_TEST_TOKEN не настроен - пропускаем админ-часть теста":
- Проверьте что токен добавлен в Azure Function App
- Проверьте что токен добавлен в GitHub Secrets
- Подождите ~2 минуты после добавления в Azure (нужен restart)

### API возвращает 401 Unauthorized

- Проверьте что токены совпадают в Azure и в GitHub/локально
- Токен передаётся в header `X-E2E-Token`

### Локальное тестирование

```bash
# Установите токен в переменную окружения
$env:E2E_TEST_TOKEN = "ваш-токен"

# Запустите тесты
npm run test:e2e
```

## Дополнительные ресурсы

- [Playwright Authentication Docs](https://playwright.dev/docs/auth)
- [Azure Functions Environment Variables](https://learn.microsoft.com/en-us/azure/azure-functions/functions-how-to-use-azure-function-app-settings)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
