# Fix: Deploy API as managed functions in Azure SWA (FREE tier)

## 🎯 Цель

Исправить 404 ошибки API путем настройки managed functions в Azure Static Web Apps (бесплатный tier).

## 🐛 Проблемы

- ❌ 404 на `/api/dashboard/food-access`
- ❌ 404 на `/api/dashboard/patients`  
- ❌ 404 на `/api/food/access` (cabinet)
- ❌ API функции не деплоились (api_location было пустым)

## 🔧 Решение

### 1. Настроен деплой managed functions
- ✅ Изменён `api_location` с пустого на `api/dist`
- ✅ Добавлен pre-build step для API в GitHub Actions
- ✅ API функции теперь деплоятся вместе со static web app

### 2. Обновлены API URLs
- ✅ Изменены URL с внешнего Function App на относительные пути
- ✅ Локально: `http://localhost:7071/api`
- ✅ Production: `/api` (managed functions)

### 3. Настроена аутентификация
- ✅ Добавлены маршруты `/cabinet` и `/portal` с требованием авторизации
- ✅ Временно отключён Google login (требует настройки в Azure Portal)
- ✅ Работает Microsoft AAD authentication
- 📄 Добавлена документация для настройки Google OAuth

## 💰 Стоимость

**БЕСПЛАТНО** - managed functions включены в FREE tier Azure Static Web Apps

## ✅ Проверки

- [x] API функции собираются корректно
- [x] Все 15 функций скомпилированы в `api/dist/functions`
- [x] Конфигурация аутентификации обновлена
- [x] Конфликтов с main нет

## 🚀 После мержа

Автоматически запустится деплой с managed functions:
- ✅ Frontend deploy на Azure SWA
- ✅ API functions deploy в managed environment
- ✅ Все endpoints будут доступны через `/api/*`
