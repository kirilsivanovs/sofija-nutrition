# 🔧 Исправления E2E тестов - Summary

## ❌ Проблема

E2E тесты падали с ошибкой:
```
Error: expect(locator).toBeVisible() failed
Locator: locator('input[type="password"], input[name="passwd"]')
Expected: visible
Timeout: 15000ms
Error: element(s) not found
```

**Причина:** После Microsoft OAuth авторизации происходил редирект на `localhost`, который не работал в CI окружении (ERR_CONNECTION_REFUSED).

## ✅ Решение

Реализован **Authentication State** подход из документации Playwright:
- Авторизация выполняется один раз локально
- Сессия сохраняется в файл `.auth/admin.json`
- В CI сессия передаётся через GitHub Secret
- Все тесты переиспользуют сохранённую сессию
- Никаких интерактивных авторизаций в CI!

## 📝 Внесённые изменения

### 1. `playwright.config.js`
- ✅ Добавлен setup проект для auth.setup.js
- ✅ Chromium проект настроен на использование `.auth/admin.json`
- ✅ Добавлена зависимость от setup проекта

### 2. `e2e/auth.setup.js`
- ✅ Улучшена обработка CI vs локальной среды
- ✅ В CI читает `AUTH_STATE` из переменной окружения
- ✅ Локально запрашивает интерактивную авторизацию
- ✅ Добавлены инструкции в консоли

### 3. `e2e/booking-full-flow.spec.js`
- ✅ Удалена вся логика inline авторизации
- ✅ Удалены неиспользуемые импорты
- ✅ Упрощён код - теперь просто `page.goto('/admin')`
- ✅ Auth state загружается автоматически из config

### 4. `.gitignore`
- ✅ Добавлена директория `/.auth/` в игнор

### 5. `.github/workflows/azure-static-web-apps.yml`
- ✅ Добавлена переменная окружения `AUTH_STATE` в E2E тесты

### 6. `E2E_AUTH_SETUP.md`
- ✅ Создана полная документация по настройке
- ✅ Инструкции для локальной и CI среды
- ✅ Troubleshooting секция

## 🚀 Что нужно сделать СЕЙЧАС

### Шаг 1: Получить Auth State локально

```bash
# Запустить setup скрипт
npx playwright test e2e/auth.setup.js --headed

# После успешной авторизации, скопировать содержимое файла
Get-Content .auth/admin.json | Set-Clipboard  # Windows PowerShell
```

### Шаг 2: Добавить GitHub Secret

1. Откройте: https://github.com/[your-repo]/settings/secrets/actions
2. Нажмите "New repository secret"
3. Name: `AUTH_STATE`
4. Value: Вставьте содержимое `.auth/admin.json`
5. Сохраните

### Шаг 3: Закоммитить изменения

```bash
git add .
git commit -m "fix: implement Playwright auth state for E2E tests

- Use saved authentication state instead of inline OAuth
- Add setup project for auth.setup.js
- Remove manual Microsoft login flow from tests
- Add AUTH_STATE environment variable to CI
- Fix ERR_CONNECTION_REFUSED issue in CI"

git push
```

### Шаг 4: Проверить работу в CI

После push'а:
1. Откройте Actions в GitHub
2. Дождитесь выполнения workflow
3. E2E тесты должны пройти успешно ✅

## 📊 Преимущества

| До | После |
|---|---|
| ❌ Inline OAuth в каждом тесте | ✅ Один раз сохранили сессию |
| ❌ Не работает в CI | ✅ Работает везде |
| ❌ Медленные тесты | ✅ Быстрые тесты |
| ❌ ERR_CONNECTION_REFUSED | ✅ Никаких редиректов |
| ❌ Хардкод credentials | ✅ Безопасно через Secrets |

## 🔄 Обслуживание

**Когда auth state истечёт** (через несколько недель/месяцев):

1. Запустите локально:
   ```bash
   npx playwright test e2e/auth.setup.js --headed
   ```
2. Обновите GitHub Secret `AUTH_STATE`
3. Готово!

## 📚 Дополнительные ресурсы

- [E2E_AUTH_SETUP.md](./E2E_AUTH_SETUP.md) - полная документация
- [Playwright Auth Docs](https://playwright.dev/docs/auth)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Статус:** ✅ Готово к тестированию
**Следующий шаг:** Выполните Шаг 1-3 выше
