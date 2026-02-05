# Настройка Google Authentication для Azure Static Web Apps

## Проблема
При попытке входа через Google аккаунт пользователь попадает на пустую страницу `https://identity.4.azurestaticapps.net/.auth/login/google?post_login_redirect_uri=/.auth/login/done`

## Причина
Google OAuth provider не настроен в Azure Static Web Apps.

## Решение

### 1. Создать Google OAuth Client

1. Перейти в [Google Cloud Console](https://console.cloud.google.com/)
2. Выбрать проект или создать новый
3. Перейти в **APIs & Services** → **Credentials**
4. Нажать **Create Credentials** → **OAuth client ID**
5. Выбрать **Application type**: Web application
6. Настроить:
   - **Name**: Sofija Nutrition
   - **Authorized JavaScript origins**:
     ```
     https://sofija-nutrition.azurestaticapps.net
     https://identity.4.azurestaticapps.net
     ```
   - **Authorized redirect URIs**:
     ```
     https://sofija-nutrition.azurestaticapps.net/.auth/login/google/callback
     https://identity.4.azurestaticapps.net/.auth/login/google/callback
     ```
7. Сохранить **Client ID** и **Client Secret**

### 2. Настроить в Azure Static Web Apps

1. Перейти в Azure Portal → Static Web Apps → `sofija-nutrition`
2. В левом меню выбрать **Authentication**
3. Нажать **Add** → **Custom provider**
4. Настроить:
   - **Provider name**: `google`
   - **Client ID**: [из шага 1]
   - **Client Secret**: [из шага 1]
   - **OpenID Connect Issuer URL**: `https://accounts.google.com`
   - **Scopes**: `openid profile email`
5. Сохранить

### 3. Проверить конфигурацию

После настройки Google provider в Azure, ссылка `/.auth/login/google?post_login_redirect_uri=/cabinet` должна:
1. Перенаправить на Google OAuth
2. После успешного входа вернуть на `/cabinet`
3. На `/cabinet` вызов `/.auth/me` вернет данные пользователя

## Временное решение

До настройки Google OAuth:
- Оставить только Microsoft AAD login (уже настроен)
- Скрыть кнопку Google login на страницах `/cabinet` и `/portal`

## Проверка работы

После настройки проверить:
```bash
# Проверить что возвращает /.auth/me после входа
curl https://sofija-nutrition.azurestaticapps.net/.auth/me

# Должен вернуть JSON с clientPrincipal
{
  "clientPrincipal": {
    "userId": "...",
    "userRoles": ["authenticated", "anonymous"],
    "claims": [...],
    "identityProvider": "google",
    "userDetails": "..."
  }
}
```
