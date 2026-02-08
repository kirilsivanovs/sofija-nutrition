/**
 * Jest test setup - подавляем информационные логи для чистого вывода
 */

// Сохраняем оригинальные функции
const originalLog = console.log;
const originalWarn = console.warn;

const redactString = (value) => {
  return value
    .replace(/authorization:\s*bearer\s+[^\s]+/ig, 'authorization: Bearer [REDACTED]')
    .replace(/x-e2e-token\s*[:=]\s*[^\s]+/ig, 'x-e2e-token=[REDACTED]')
    .replace(/e2e[_-]?test[_-]?token\s*[:=]\s*[^\s]+/ig, 'E2E_TEST_TOKEN=[REDACTED]')
    .replace(/([?&]apiKey=)[^&\s]+/ig, '$1[REDACTED]')
    .replace(/([?&]key=)[^&\s]+/ig, '$1[REDACTED]')
    .replace(/(apiKey\s*[:=]\s*)[^\s]+/ig, '$1[REDACTED]')
    .replace(/(\bkey\s*[:=]\s*)[^\s]+/ig, '$1[REDACTED]');
};

const redactArg = (arg) => {
  if (typeof arg === 'string') return redactString(arg);
  if (!arg || typeof arg !== 'object') return arg;

  const clone = Array.isArray(arg) ? [...arg] : { ...arg };
  const sensitiveKeys = [
    'authorization',
    'Authorization',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'e2eToken',
    'E2E_TEST_TOKEN'
  ];

  for (const key of sensitiveKeys) {
    if (Object.prototype.hasOwnProperty.call(clone, key)) {
      clone[key] = '[REDACTED]';
    }
  }

  return clone;
};

// Подавляем известные информационные сообщения
console.log = (...args) => {
  const message = args[0]?.toString() || '';
  
  // Пропускаем шумные но неважные логи
  const suppressPatterns = [
    'BookingRepository initialized',
    'Azure Storage:',
    'Booking saved to IN-MEMORY',
    'Total bookings in memory',
    'Sending email',
    'From:',
    'To:',
    'Subject:',
    'Attachments:',
    'Email sent successfully',
    'Could not fetch bookings'
  ];
  
  if (suppressPatterns.some(p => message.includes(p))) {
    return; // Пропускаем
  }
  
  originalLog.apply(console, args.map(redactArg));
};

console.warn = (...args) => {
  const message = args[0]?.toString() || '';
  
  // Пропускаем известные warnings
  const suppressPatterns = [
    'local.settings.json not found',
    'Skipping - no real storage'
  ];
  
  if (suppressPatterns.some(p => message.includes(p))) {
    return;
  }
  
  originalWarn.apply(console, args.map(redactArg));
};
