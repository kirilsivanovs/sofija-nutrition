/**
 * Jest test setup - подавляем информационные логи для чистого вывода
 */

// Сохраняем оригинальные функции
const originalLog = console.log;
const originalWarn = console.warn;

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
  
  originalLog.apply(console, args);
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
  
  originalWarn.apply(console, args);
};
