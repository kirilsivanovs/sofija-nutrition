# E2E Tests Authentication Setup

## Проблема

E2E тесты требуют авторизации в админ-панели через Microsoft OAuth. В CI окружении невозможно выполнить интерактивную авторизацию, и после редиректа Microsoft приложение не может подключиться к localhost.

## Решение: Authentication State

Используем подход **Authentication State** от Playwright - авторизуемся один раз локально, сохраняем сессию и переиспользуем её во всех тестах.

### Преимущества
- ✅ Тесты запускаются быстрее (нет повторных авторизаций)
- ✅ Работает в CI без интерактивной авторизации
- ✅ Нет проблем с редиректами на localhost
- ✅ Более стабильные тесты

## Настройка

### 1. Локальная подготовка Auth State

Запустите один раз локально в headed режиме:

```bash
npx playwright test e2e/auth.setup.js --headed
```

Это:
1. Откроет браузер
2. Перейдёт в админку
3. Попросит вас войти вручную через Microsoft
4. Сохранит сессию в `.auth/admin.json`

### 2. Настройка GitHub Actions

#### Шаг 1: Получите содержимое auth state

После выполнения setup скрипта, скопируйте содержимое файла:

**Windows PowerShell:**
```powershell
Get-Content .auth/admin.json | Set-Clipboard
```

**macOS/Linux:**
```bash
cat .auth/admin.json | pbcopy  # macOS
cat .auth/admin.json | xclip -selection clipboard  # Linux
```

#### Шаг 2: Добавьте GitHub Secret

1. Откройте Settings → Secrets and variables → Actions
2. Нажмите "New repository secret"
3. Name: `AUTH_STATE`
4. Value: Вставьте содержимое `.auth/admin.json`
5. Сохраните

#### Шаг 3: Обновите GitHub Workflow

В вашем `.github/workflows/*.yml` файле добавьте environment variable:

```yaml
- name: Run E2E Tests
  env:
    AUTH_STATE: ${{ secrets.AUTH_STATE }}
  run: npm run test:e2e
```

## Как это работает

### Локально

1. `playwright.config.js` определяет setup проект
2. Перед запуском тестов выполняется `e2e/auth.setup.js`
3. Setup проверяет наличие `.auth/admin.json`
4. Если файл существует - переиспользует его
5. Если нет - запрашивает интерактивную авторизацию
6. Все тесты получают авторизованную сессию через `storageState`

### В CI (GitHub Actions)

1. `e2e/auth.setup.js` получает `AUTH_STATE` из переменной окружения
2. Записывает её в `.auth/admin.json`
3. Все тесты используют этот файл через `storageState`
4. Microsoft OAuth не вызывается - тесты сразу авторизованы

## Обновление Auth State

Когда сессия Microsoft истечёт (обычно через несколько недель/месяцев), вам нужно:

1. Запустить локально: `npx playwright test e2e/auth.setup.js --headed`
2. Войти заново
3. Обновить GitHub Secret `AUTH_STATE` новым содержимым `.auth/admin.json`

## Структура файлов

```
e2e/
  ├── auth.setup.js          # Setup проект для сохранения auth state
  └── booking-full-flow.spec.js  # Тест использует сохранённую сессию

.auth/
  └── admin.json             # Сохранённая сессия (в .gitignore)

playwright.config.js         # Конфигурация с setup проектом
```

## Безопасность

⚠️ **ВАЖНО:**
- `.auth/admin.json` содержит cookies и токены авторизации
- Файл добавлен в `.gitignore` - НЕ коммитьте его в репозиторий
- В CI используйте GitHub Secrets для безопасной передачи
- Регулярно обновляйте auth state

## Troubleshooting

### Тест падает с ошибкой авторизации в CI

**Причина:** Auth state не настроен или истёк

**Решение:**
1. Проверьте наличие GitHub Secret `AUTH_STATE`
2. Проверьте workflow файл - добавлена ли переменная окружения
3. Обновите auth state локально и обновите секрет

### Локально тест просит авторизацию каждый раз

**Причина:** Файл `.auth/admin.json` не найден или повреждён

**Решение:**
```bash
npx playwright test e2e/auth.setup.js --headed
```

### Ошибка "element(s) not found" на password input

**Причина:** Это старая проблема, которая решена через auth state

**Решение:** Используйте новый подход с auth state - проблема исчезнет

## Дополнительные ресурсы

- [Playwright Authentication Docs](https://playwright.dev/docs/auth)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
