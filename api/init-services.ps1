#!/usr/bin/env pwsh
# Инициализация таблицы Services

$uri = "http://localhost:7071/api/dashboard/services/initialize"

Write-Host "Инициализация таблицы Services..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $uri -Method POST -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Успешно!" -ForegroundColor Green
    Write-Host "Создано услуг: $($content.servicesCreated)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Созданные услуги:" -ForegroundColor Yellow
    $content.services | ForEach-Object {
        Write-Host "  - $($_.id): $($_.name.lv) ($($_.duration) мин, €$($_.price))" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Ошибка: $_" -ForegroundColor Red
    exit 1
}
