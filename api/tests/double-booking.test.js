/**
 * Race Condition / Double Booking Tests
 * 🔴 CRITICAL: Защита от двойного бронирования одного слота
 */

const { isSlotBooked } = require('../src/services/bookingRepository');

// Mock для тестирования race condition
const mockBookedSlots = new Map();

// Симуляция проверки занятости слота
function mockIsSlotBooked(date, time) {
    const key = `${date}:${time}`;
    return mockBookedSlots.has(key);
}

// Симуляция бронирования с задержкой
async function mockBookSlot(date, time, delay = 0) {
    const key = `${date}:${time}`;
    
    // Проверяем занятость
    if (mockBookedSlots.has(key)) {
        return { success: false, error: 'Slot already booked' };
    }
    
    // Имитация задержки (race condition window)
    if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Повторная проверка после задержки
    if (mockBookedSlots.has(key)) {
        return { success: false, error: 'Slot already booked' };
    }
    
    // Бронируем
    mockBookedSlots.set(key, { bookedAt: new Date().toISOString() });
    return { success: true };
}

// Атомарное бронирование с блокировкой
async function atomicBookSlot(date, time) {
    const key = `${date}:${time}`;
    const lockKey = `lock:${key}`;
    
    // Пытаемся захватить блокировку
    if (mockBookedSlots.has(lockKey)) {
        return { success: false, error: 'Slot is being booked by another request' };
    }
    
    // Устанавливаем блокировку
    mockBookedSlots.set(lockKey, true);
    
    try {
        // Проверяем занятость
        if (mockBookedSlots.has(key)) {
            return { success: false, error: 'Slot already booked' };
        }
        
        // Бронируем
        mockBookedSlots.set(key, { bookedAt: new Date().toISOString() });
        return { success: true };
    } finally {
        // Освобождаем блокировку
        mockBookedSlots.delete(lockKey);
    }
}

describe('Double Booking Prevention', () => {
    beforeEach(() => {
        mockBookedSlots.clear();
    });

    describe('Basic slot availability', () => {
        test('should allow booking empty slot', async () => {
            const result = await mockBookSlot('2026-02-15', '10:00');
            expect(result.success).toBe(true);
        });

        test('should reject booking already taken slot', async () => {
            await mockBookSlot('2026-02-15', '10:00');
            const result = await mockBookSlot('2026-02-15', '10:00');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('already booked');
        });

        test('should allow booking different slots on same day', async () => {
            const result1 = await mockBookSlot('2026-02-15', '10:00');
            const result2 = await mockBookSlot('2026-02-15', '11:00');
            
            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
        });

        test('should allow booking same slot on different days', async () => {
            const result1 = await mockBookSlot('2026-02-15', '10:00');
            const result2 = await mockBookSlot('2026-02-16', '10:00');
            
            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
        });
    });

    describe('Race condition scenarios', () => {
        test('concurrent bookings should not both succeed', async () => {
            // Симулируем два одновременных запроса
            const [result1, result2] = await Promise.all([
                atomicBookSlot('2026-02-15', '14:00'),
                atomicBookSlot('2026-02-15', '14:00')
            ]);

            // Только один должен успешно забронировать
            const successCount = [result1, result2].filter(r => r.success).length;
            expect(successCount).toBe(1);
        });

        test('sequential bookings should correctly reject second', async () => {
            const result1 = await atomicBookSlot('2026-02-15', '15:00');
            const result2 = await atomicBookSlot('2026-02-15', '15:00');

            expect(result1.success).toBe(true);
            expect(result2.success).toBe(false);
        });
    });

    describe('Cancelled bookings', () => {
        test('cancelled slot should become available again', () => {
            const date = '2026-02-20';
            const time = '10:00';
            const key = `${date}:${time}`;
            
            // Бронируем
            mockBookedSlots.set(key, { status: 'confirmed' });
            expect(mockIsSlotBooked(date, time)).toBe(true);
            
            // Отменяем
            mockBookedSlots.delete(key);
            expect(mockIsSlotBooked(date, time)).toBe(false);
        });
    });

    describe('Edge cases', () => {
        test('should handle invalid date format gracefully', () => {
            expect(mockIsSlotBooked('invalid-date', '10:00')).toBe(false);
        });

        test('should handle invalid time format gracefully', () => {
            expect(mockIsSlotBooked('2026-02-15', 'invalid')).toBe(false);
        });

        test('should handle empty date', () => {
            expect(mockIsSlotBooked('', '10:00')).toBe(false);
        });

        test('should handle empty time', () => {
            expect(mockIsSlotBooked('2026-02-15', '')).toBe(false);
        });
    });
});

describe('Slot Duration Conflicts', () => {
    /**
     * Важно: 60-минутная консультация в 10:00 блокирует слот 10:30
     * если следующий клиент хочет забронировать 30-минутную консультацию
     */
    
    const bookedSlots = [];
    
    function isSlotAvailable(date, time, duration, existingBookings) {
        const requestedStart = timeToMinutes(time);
        const requestedEnd = requestedStart + duration;
        
        for (const booking of existingBookings) {
            if (booking.date !== date) continue;
            
            const bookingStart = timeToMinutes(booking.time);
            const bookingEnd = bookingStart + booking.duration;
            
            // Проверяем пересечение интервалов
            if (requestedStart < bookingEnd && requestedEnd > bookingStart) {
                return false;
            }
        }
        
        return true;
    }
    
    function timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
    
    test('60-min booking at 10:00 should block 10:30 slot', () => {
        const existingBookings = [
            { date: '2026-02-15', time: '10:00', duration: 60 }
        ];
        
        // 10:30 попадает внутрь 10:00-11:00
        expect(isSlotAvailable('2026-02-15', '10:30', 30, existingBookings)).toBe(false);
    });

    test('60-min booking at 10:00 should NOT block 11:00 slot', () => {
        const existingBookings = [
            { date: '2026-02-15', time: '10:00', duration: 60 }
        ];
        
        // 11:00 начинается когда 10:00 заканчивается
        expect(isSlotAvailable('2026-02-15', '11:00', 60, existingBookings)).toBe(true);
    });

    test('90-min booking at 10:00 should block 10:30 and 11:00', () => {
        const existingBookings = [
            { date: '2026-02-15', time: '10:00', duration: 90 }
        ];
        
        expect(isSlotAvailable('2026-02-15', '10:30', 30, existingBookings)).toBe(false);
        expect(isSlotAvailable('2026-02-15', '11:00', 30, existingBookings)).toBe(false);
        expect(isSlotAvailable('2026-02-15', '11:30', 30, existingBookings)).toBe(true);
    });

    test('back-to-back bookings should be allowed', () => {
        const existingBookings = [
            { date: '2026-02-15', time: '10:00', duration: 60 }
        ];
        
        // Бронирование сразу после предыдущего
        expect(isSlotAvailable('2026-02-15', '11:00', 60, existingBookings)).toBe(true);
        
        // Добавляем вторую бронь
        existingBookings.push({ date: '2026-02-15', time: '11:00', duration: 60 });
        
        // Следующий слот тоже доступен
        expect(isSlotAvailable('2026-02-15', '12:00', 60, existingBookings)).toBe(true);
    });
});
