# Shared Utilities & Types

Общая библиотека для frontend и backend приложения Sofija Nutrition.

## 📁 Структура

```
shared/
├── utils/
│   ├── dateFormatters.ts    # Форматирование дат и времени
│   ├── validators.ts         # Валидация данных
│   ├── constants.ts          # Константы приложения
│   └── index.ts             # Barrel export
├── types/
│   ├── booking.ts           # Типы для бронирований
│   ├── availability.ts      # Типы для расписания
│   ├── settings.ts          # Типы для настроек
│   └── index.ts            # Barrel export
└── index.ts                # Главный entry point
```

## 🚀 Использование

### Date Formatters

```typescript
import { formatDate, formatTime, formatDateISO } from '@sofija-nutrition/shared';

// yyyy-mm-dd → dd/mm/yyyy
formatDate('2024-02-01'); // '01/02/2024'

// dd/mm/yyyy → yyyy-mm-dd
formatDateReverse('01/02/2024'); // '2024-02-01'

// Ensure 24-hour format
formatTime('9:5'); // '09:05'
formatTime('09:05 AM'); // '09:05'

// Date object → yyyy-mm-dd
formatDateISO(new Date(2024, 1, 1)); // '2024-02-01'
```

### Validators

```typescript
import { isValidDate, isValidTime, isValidEmail } from '@sofija-nutrition/shared';

isValidDate('2024-02-01'); // true
isValidDate('2024-13-01'); // false (invalid month)

isValidTime('09:30'); // true
isValidTime('25:00'); // false (invalid hour)

isValidEmail('user@example.com'); // true
isValidEmail('invalid-email'); // false
```

### Constants

```typescript
import { 
  DATE_FORMATS, 
  BOOKING_STATUS, 
  VALIDATION_RULES 
} from '@sofija-nutrition/shared';

console.log(DATE_FORMATS.ISO); // 'yyyy-mm-dd'
console.log(BOOKING_STATUS.CONFIRMED); // 'confirmed'
console.log(VALIDATION_RULES.NAME.MIN_LENGTH); // 2
```

### Types

```typescript
import type { 
  Booking, 
  Schedule, 
  Service 
} from '@sofija-nutrition/shared';

const booking: Booking = {
  id: '123',
  date: '2024-02-01',
  time: '09:00',
  service: 'consultation',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+37112345678',
  status: 'pending',
  paymentConfirmed: false,
  createdAt: new Date().toISOString()
};
```

## 🧪 Тестирование

```bash
cd shared
npm test
```

## 📝 Принципы

1. **DRY (Don't Repeat Yourself)** - один источник истины для форматирования и валидации
2. **Type Safety** - строгая типизация для предотвращения ошибок
3. **Consistency** - единообразное поведение на frontend и backend
4. **Testability** - легко тестируемый код

## 🔄 Интеграция

### В backend (Azure Functions)

```typescript
import { formatDate, isValidEmail } from '../../../shared';
```

### Во frontend (Astro)

```typescript
import { formatDate, isValidEmail } from '../../shared';
```

## 📚 Документация функций

Все функции имеют JSDoc комментарии с примерами использования. Используйте автодополнение в VS Code для просмотра документации.
