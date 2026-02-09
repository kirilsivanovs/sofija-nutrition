# Copilot Instructions for Sofija Nutrition Project

## Code Style & Architecture Principles

### ⚠️ CRITICAL RULE: Refactor on Every Change
**ALWAYS refactor when adding features to existing code:**
- If adding 50+ lines to a file > 500 lines → extract to component/service FIRST
- If file has > 1000 lines → MANDATORY refactoring before adding code
- If duplicating logic → create shared utility/service
- NO EXCEPTIONS - this is the highest priority rule

### ООП / SOLID / DRY
- **Always** extract business logic into classes/services
- **Never** create functions longer than 40-50 lines - refactor into methods
- **Avoid** code duplication - extract common logic into utilities
- **Single Responsibility**: each class/function does ONE thing (CRITICAL)
- **DRY**: если копируешь код 2+ раза - создай функцию/утилиту (CRITICAL)
- **Практичность > Теория**: переписывай код на более оптимальный без колебаний

### Component Structure (Angular-like)
Components must be split into separate files:
```
src/components/admin/ComponentName/
  ComponentName.astro       # HTML template only
  ComponentName.ts          # Logic, state, event handlers
  ComponentName.css         # Styles (NO <style> tags in .astro)
```

**Example:**
```typescript
// MealsCalendar.ts
export class MealsCalendarController {
  constructor(private api: ApiService) {}
  
  async loadMonth(date: Date): Promise<void> {
    // logic here
  }
}
```

```astro
---
// MealsCalendar.astro
import './MealsCalendar.css';
import { MealsCalendarController } from './MealsCalendar.ts';
---
<div class="meals-calendar">
  <!-- HTML only -->
</div>
```

### File Organization

#### Services Layer
```
src/services/admin/
  MealsService.ts           # Meals data fetching & processing
  PatientService.ts         # Patient management
  CalendarService.ts        # Calendar rendering & navigation
  BookingService.ts         # Booking logic
```

Each service class should:
- Have clear constructor dependencies
- Return typed results (no `any`)
- Handle errors internally or throw typed exceptions
- Have methods < 30 lines

#### Utils Layer
```
src/utils/admin/
  dateFormatters.ts         # Date formatting utilities
  validators.ts             # Input validation
  apiClient.ts              # HTTP client wrapper
```

Utils = pure functions, no state.

### CSS Guidelines
- **NO inline styles** in Astro files
- Use CSS modules or separate `.css` files
- BEM naming: `.block__element--modifier`
- CSS custom properties for theming
- Mobile-first approach

### ⚠️ CRITICAL: Mobile-First & Responsive Design
**EVERY module MUST be optimized for ALL devices:**

#### Mandatory Device Testing
- **Mobile phones**: 320px - 480px (iPhone SE, Galaxy S, etc.)
- **Phablets/Large phones**: 480px - 768px
- **Tablets**: 768px - 1024px (iPad, Android tablets)
- **Desktops**: 1024px+ (laptops, monitors)

#### Breakpoint Strategy
```css
/* Mobile First - base styles for 320px+ */
.component { 
  padding: 16px;
  font-size: 14px;
}

/* Phablets 480px+ */
@media (min-width: 480px) { }

/* Tablets 768px+ */
@media (min-width: 768px) { }

/* Desktop 1024px+ */
@media (min-width: 1024px) { }

/* Large desktop 1280px+ */
@media (min-width: 1280px) { }
```

#### Premium UX Checklist
✅ Touch targets minimum 44x44px (Apple HIG standard)
✅ Readable text without zoom (min 16px body text on mobile)
✅ No horizontal scroll on ANY device
✅ Fullscreen mobile menus (booking-style) instead of cramped sidebars
✅ Smooth animations (60fps, use transform/opacity)
✅ iOS Safari fixes:
  - Use `100dvh` instead of `100vh`
  - `-webkit-overflow-scrolling: touch`
  - `overscroll-behavior: contain`
  - `-webkit-tap-highlight-color: transparent`

#### When Implementing Features
1. **Start with mobile design** (320px) → scale UP
2. Test on REAL devices or browser DevTools mobile emulation
3. Check touch interactions (hover states should have touch alternatives)
4. Verify text legibility and spacing
5. Ensure forms are usable with on-screen keyboards
6. Test landscape orientation on mobile

#### Anti-Patterns
❌ Desktop-first approach (causes mobile as afterthought)
❌ Fixed pixel widths without media queries
❌ Small touch targets (< 44px)
❌ Tiny fonts (< 14px on mobile)
❌ Horizontal scroll
❌ Hover-only interactions (mobile has no hover)

**ЗОЛОТОЕ ПРАВИЛО**: Если фича работает плохо на мобильном → это баг, не "будем потом фиксить".

### TypeScript Standards
- **Strict mode enabled**
- **NO `any` types** - use `unknown` or proper interfaces
- Define interfaces for all data structures
- Use enums for constants
- Prefer `const` over `let`
- **ALWAYS run error check after changes** - fix TypeScript/linting errors immediately
- Zero tolerance for compilation errors in committed code

### Page Files (`src/pages/*.astro`)
Pages should be THIN:
- Import and compose components
- Handle routing
- Pass props down
- Max 200 lines including frontmatter

**Current Problem:** `admin/index.astro` has 3786 lines - needs refactoring.

### Anti-Patterns to Avoid
❌ Massive monolith files (> 300 lines)
❌ Mixing concerns (data fetching + rendering + styling in one function)
❌ Copy-pasted code blocks
❌ Unclear function names (`doStuff()`, `processData()`)
❌ God objects that do everything
❌ Direct DOM manipulation without event delegation
❌ Dead code (unused imports, functions, variables, commented code)

### Refactoring Strategy
When adding features to existing monoliths:
1. Extract the NEW feature into proper structure first
2. Create service class for business logic
3. Create component with HTML/CSS/TS split
4. Import and use in page file
5. Gradually extract old code when touching it
6. **ALWAYS remove dead code**: unused imports, commented code, unreachable functions

### Testing
- Unit tests for services (`*.service.test.ts`)
- Component tests for UI logic
- E2E tests for critical flows
- Mock external dependencies

### ⚠️ CRITICAL: Testing Coverage Strategy
**Business-critical logic MUST have unit tests.**

#### When to Write Tests (MANDATORY)
✅ **Payment/Billing logic** - money transactions, pricing calculations
✅ **Booking system** - slot availability, double-booking prevention, cancellations
✅ **Authentication/Authorization** - user access control, admin checks
✅ **Data validation** - form validators, API input sanitization
✅ **Email/Notification sending** - template rendering, recipient logic
✅ **Calendar/Time calculations** - timezone handling, date math, availability
✅ **Patient data access** - GDPR compliance, data access rules
✅ **CGM data processing** - glucose calculations, report generation

#### When to Write Tests (RECOMMENDED)
- Complex business rules with multiple conditions
- Data transformations with edge cases
- Features that broke before (regression prevention)
- Utility functions used across many modules

#### Test Structure
```typescript
describe('BookingService', () => {
  describe('isSlotAvailable', () => {
    it('should prevent double-booking same slot', async () => {
      // Arrange
      const service = new BookingService(mockRepo);
      const slot = { date: '2026-02-10', time: '10:00' };
      
      // Act
      await service.book(slot, 'patient1');
      const result = await service.isSlotAvailable(slot);
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should handle timezone edge cases', () => {
      // Test critical edge case
    });
  });
});
```

#### Coverage Goals
- **Critical business logic**: 90%+ coverage
- **Services layer**: 80%+ coverage
- **Utils/helpers**: 70%+ coverage
- **UI components**: Focus on business logic, not rendering

#### Self-Check Questions
Before committing code, ask yourself:
1. **Is this code handling money/payments?** → Write tests
2. **Could this cause a booking conflict?** → Write tests
3. **Does this prevent unauthorized access?** → Write tests
4. **Is this math complex or error-prone?** → Write tests
5. **Would a bug here break user trust?** → Write tests

**ЗОЛОТОЕ ПРАВИЛО**: Если логика критична для бизнеса → покрываем тестами. Не ждем багов в production.

### Commit Messages
- `feat: add patient deletion with confirmation`
- `refactor: extract MealsService from admin page`
- `fix: calendar navigation off-by-one error`
- `style: split PatientList into separate files`

## Technology Stack
- **Frontend**: Astro 4.x, TypeScript, Tailwind CSS
- **Auth**: Azure Static Web Apps (AAD OAuth)
- **API**: Azure Functions v4
- **Database**: PostgreSQL (via repositories)
- **Admin Access**: ADMIN_EMAILS env variable

## When Starting New Features
1. ✅ Check if service class exists or create one
2. ✅ Create component folder with 3 files (HTML/CSS/TS)
3. ✅ Define TypeScript interfaces for data
4. ✅ Write service methods with proper typing
5. ✅ Create component controller class
6. ✅ Import and compose in page file
7. ✅ **Test on mobile devices** (320px, 480px, 768px, 1024px+)
8. ✅ **Write unit tests** if logic is business-critical
9. ✅ Verify accessibility (ARIA labels, keyboard navigation)

## Latvian Translations
UI is in Latvian - preserve language:
- "Dzēst" = Delete
- "Atcelt" = Cancel
- "Saglabāt" = Save
- "Pacients" = Patient

---
**Always follow these rules. If refactoring existing code, extract incrementally - don't rewrite everything at once.**
