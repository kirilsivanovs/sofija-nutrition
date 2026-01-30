/**
 * Mock API Server для E2E тестов в CI
 * Простой HTTP сервер, имитирующий Azure Functions API
 */
import http from 'http';

const PORT = 7071;

// Mock responses
const mockResponses = {
  '/api/health': {
    status: 200,
    body: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'ci-mock',
      services: {
        email: 'mock',
        storage: 'mock',
        pdf: 'mock'
      }
    }
  },
  '/api/availability': {
    status: 200,
    body: {
      success: true,
      data: {
        availableSlots: [
          { date: '2026-02-01', time: '10:00', available: true },
          { date: '2026-02-01', time: '11:00', available: true },
          { date: '2026-02-01', time: '14:00', available: true },
          { date: '2026-02-02', time: '10:00', available: true },
        ]
      }
    }
  }
};

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
  const mockResponse = mockResponses[url];
  
  if (mockResponse) {
    res.writeHead(mockResponse.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockResponse.body));
    console.log(`[Mock API] ${req.method} ${url} → ${mockResponse.status}`);
  } else {
    // For any other endpoint, return 200 OK (e.g., POST to /api/booking)
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Mock response', endpoint: url }));
    console.log(`[Mock API] ${req.method} ${url} → 200 (default mock)`);
  }
});

server.listen(PORT, () => {
  console.log(`[Mock API] Server running at http://localhost:${PORT}`);
  console.log('[Mock API] Ready for E2E tests');
});
