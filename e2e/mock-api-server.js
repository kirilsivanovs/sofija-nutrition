/**
 * Mock API Server для E2E тестов в CI
 * Простой HTTP сервер, имитирующий Azure Functions API
 * Возвращает данные в том же формате, что и реальный API
 */
import http from 'http';

const PORT = 7071;

// Генерация слотов на 90 дней вперёд
function generateMockSlots() {
  const slots = {};
  const today = new Date();
  
  for (let i = 1; i <= 90; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayOfWeek = date.getDay();
    
    // Пропускаем выходные
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    const dateStr = date.toISOString().split('T')[0];
    slots[dateStr] = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  }
  
  return slots;
}

// Mock service types (как в реальном API)
const serviceTypes = [
  {
    id: 'cgm-diagnostic',
    duration: 60,
    name: {
      lv: 'CGM diagnostika (60 min)',
      ru: 'CGM-диагностика (60 мин)',
      en: 'CGM Diagnostic (60 min)'
    }
  },
  {
    id: 'consultation',
    duration: 60,
    name: {
      lv: 'Uztura konsultācija (60 min)',
      ru: 'Консультация по питанию (60 мин)',
      en: 'Nutrition Consultation (60 min)'
    }
  },
  {
    id: 'free-consultation',
    duration: 15,
    name: {
      lv: 'Bezmaksas konsultācija (15 min)',
      ru: 'Бесплатная консультация (15 мин)',
      en: 'Free Consultation (15 min)'
    }
  }
];

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  const url = req.url.split('?')[0]; // Remove query params
  
  // Health endpoint - возвращает status: 'ok' как реальный API
  if (url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString()
    }));
    console.log(`[Mock API] GET /api/health → 200`);
    return;
  }
  
  // Availability endpoint (без даты) - возвращает slots + serviceTypes
  if (url === '/api/availability') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      slots: generateMockSlots(),
      booked: [],
      serviceTypes
    }));
    console.log(`[Mock API] GET /api/availability → 200`);
    return;
  }
  
  // Availability endpoint (с датой) - /api/availability/2026-02-05
  if (url.startsWith('/api/availability/')) {
    const dateParam = url.replace('/api/availability/', '');
    
    // Валидация даты
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Invalid date format',
        message: 'Date should be in YYYY-MM-DD format'
      }));
      console.log(`[Mock API] GET ${url} → 400 (invalid date)`);
      return;
    }
    
    const date = new Date(dateParam);
    const dayOfWeek = date.getDay();
    
    // Выходные - нет слотов
    const slots = (dayOfWeek === 0 || dayOfWeek === 6) 
      ? [] 
      : ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      date: dateParam,
      slots,
      serviceTypes
    }));
    console.log(`[Mock API] GET ${url} → 200`);
    return;
  }
  
  // Booking creation endpoint
  if (url === '/api/booking' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Booking created successfully',
        bookingId: 'mock-booking-' + Date.now()
      }));
      console.log(`[Mock API] POST /api/booking → 200`);
    });
    return;
  }
  
  // Default response for unknown endpoints
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    success: true, 
    message: 'Mock response', 
    endpoint: url 
  }));
  console.log(`[Mock API] ${req.method} ${url} → 200 (default)`);
});

server.listen(PORT, () => {
  console.log(`[Mock API] Server running at http://localhost:${PORT}`);
  console.log('[Mock API] Ready for E2E tests');
});
