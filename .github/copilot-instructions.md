# Copilot Instructions for Sofija Nutrition Project

> **Philosophy**: Clean, concise, and correct code first. Quality over shortcuts.

## 🔴 CRITICAL Rules (Never Break)

### 0. Code Quality Standard
**Write code that is clean, short, and correct.**

Required:
- Single responsibility per function/component/service
- No duplication: extract shared logic early
- Prefer clear, small functions over long blocks
- Avoid `!important` (only if absolutely unavoidable and documented)
- Avoid magic numbers/strings: use constants or enums
- No dead code, commented-out code, or unused imports
- Consistent naming and structure across files

### 0.1 Mandatory Refactoring
**Every change must improve code quality in the touched area.**

Required:
- Refactor duplicated/unclear logic when you touch it
- Keep functions/components focused and short (split when they grow)
- Replace hacks with proper solutions (no quick fixes)
- If full refactor is too big, do a minimal cleanup **and** add a TODO/tech debt note

### 1. Mobile-First & Responsive Design
**EVERY feature MUST work perfectly on ALL devices** - this is non-negotiable.

#### Device Coverage
- **Mobile**: 320px - 480px (iPhone SE, Galaxy S)
- **Phablets**: 480px - 768px
- **Tablets**: 768px - 1024px (iPad)
- **Desktop**: 1024px+ (monitors)

#### Premium UX Requirements
✅ Touch targets ≥ 44x44px (Apple HIG)
✅ Text ≥ 16px on mobile (readable without zoom)
✅ No horizontal scroll on any device
✅ Fullscreen mobile menus (not cramped sidebars)
✅ iOS Safari fixes: `100dvh`, `overscroll-behavior: contain`, `-webkit-tap-highlight-color: transparent`

```css
/* Mobile First - base styles for 320px+ */
.component { padding: 16px; font-size: 14px; }

@media (min-width: 480px) { /* Phablets */ }
@media (min-width: 768px) { /* Tablets */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large desktop */ }
```

**GOLDEN RULE**: Mobile works poorly = bug. Fix before commit.

### 2. TypeScript Strict Mode
- **NO `any` types** - use `unknown` or proper interfaces
- Define interfaces for all data structures
- Use enums for constants
- **ALWAYS fix TypeScript errors before commit**
- Zero tolerance for compilation errors

### 3. Business-Critical Testing
Write tests for code that handles:
✅ **Payments/Billing** - money transactions
✅ **Booking system** - prevent double-booking
✅ **Auth/Security** - access control

**Coverage Goals:**
- Critical logic: 80%+
- Services: 70%+
- Utils: 60%+

```typescript
describe('BookingService', () => {
  it('should prevent double-booking same slot', async () => {
    // Arrange, Act, Assert
  });
});
```

### 4. Clean Commits
- Fix all linting/TypeScript errors before commit
- Remove dead code (unused imports, commented code)
- Use conventional commits: `feat:`, `fix:`, `refactor:`

---

## 🟡 RECOMMENDED Practices (Strive to Follow)

### Component Structure - Hybrid Approach

**Large components (> 150 lines)** → Split into files:
```
src/components/admin/MealsCalendar/
  MealsCalendar.astro       # HTML template
  MealsCalendar.ts          # Logic & state
  MealsCalendar.css         # Styles
```

**Small components (< 150 lines)** → Single `.astro` file OK:
```astro
---
// Button.astro
interface Props { label: string; onClick: () => void; }
const { label, onClick } = Astro.props;
---
<button class="btn" onclick={onClick}>{label}</button>
<style>
  .btn { /* styles here */ }
</style>
```

### SOLID / DRY Principles
- **Single Responsibility**: Each class/function does ONE thing
- **DRY**: Copy-pasting 2+ times? Extract to utility/service
- **Prefer**: Classes for complex logic, pure functions for simple transforms
- **Methods/Functions**: Aim for < 50 lines (use judgment, not dogma)

### Services Layer
```
src/services/admin/
  BookingService.ts     # Booking logic
  PatientService.ts     # Patient management
  ApiService.ts         # HTTP client
```

Each service:
- Clear constructor dependencies
- Typed return values (no `any`)
- Methods < 50 lines (ideal), < 80 (acceptable)

### Page Files
- Prefer < 300 lines including frontmatter
- If > 500 lines → consider extracting components
- Import and compose, don't inline everything

### Testing (Recommended)
- Complex business rules with multiple conditions
- Data transformations with edge cases
- Features that broke before (regression tests)
- Utilities used across many modules

---

## 🟢 NICE TO HAVE (When Time Permits)

### CSS Best Practices
- BEM naming: `.block__element--modifier`
- CSS custom properties for theming
- Avoid inline styles (prefer classes)
- Prefer local scope over global overrides

### Refactoring Strategy
- Extract new features into clean structure FIRST
- Gradually improve old code when touching it
- Don't rewrite everything at once

### Documentation
- JSDoc for complex functions
- README for each major module
- Inline comments for "why", not "what"

---

## ⚡ Pragmatic Exceptions

### MVP / Hotfix Mode
When shipping critical feature or fixing production bug:

✅ **STILL REQUIRED:**
- Mobile responsiveness
- TypeScript strict mode
- Basic error handling

⏸️ **CAN DEFER:**
- Perfect component structure → Create TODO
- Full test coverage → Add after ship
- Complete refactoring → Tech debt ticket

### Legacy Code Strategy (admin/index.astro - 3786 lines)

**Phase 1 (Current):** Add features inline, keep code clean
**Phase 2 (Q2 2026):** Extract top 3 most-changed sections
**Phase 3 (Q3 2026):** Full rewrite with proper architecture

**When touching legacy code:**
1. Add new feature in clean way (separate function/class)
2. Don't refactor entire file (scope creep)
3. Create tech debt ticket for future cleanup

---

## Anti-Patterns to Avoid

❌ Desktop-first design (mobile = afterthought)
❌ Tiny touch targets (< 44px) or fonts (< 14px mobile)
❌ God objects/files doing everything
❌ Copy-pasted code blocks
❌ Ignoring TypeScript errors
❌ Hover-only interactions (no touch alternative)

---

## Technology Stack
- **Frontend**: Astro 4.x, TypeScript, Tailwind CSS
- **Auth**: Azure Static Web Apps (AAD OAuth)
- **API**: Azure Functions v4
- **Database**: PostgreSQL
- **Admin Access**: ADMIN_EMAILS env variable

## Development Workflow

### Starting New Feature
1. ✅ Mobile-first design (sketch 320px layout)
2. ✅ Define TypeScript interfaces
3. ✅ Create component/service structure
4. ✅ Implement with strict typing
5. ✅ Test on mobile devices (DevTools 320px, 480px, 768px, 1024px)
6. ✅ Write tests if business-critical (payments, bookings, auth)
7. ✅ Fix all TypeScript/lint errors
8. ✅ Remove dead code
9. ✅ Commit with conventional message

### Self-Check Before Commit
1. Works on mobile 320px? ✅
2. No TypeScript errors? ✅
3. Business-critical → Has tests? ✅
4. Removed unused code? ✅

---

## Latvian UI Translations
- "Dzēst" = Delete
- "Atcelt" = Cancel
- "Saglabāt" = Save
- "Pacients" = Patient
- "Pieteikties" = Sign up / Book

---

**Remember**: Quality over shortcuts. Refactor as you touch the code.
