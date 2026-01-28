# Test Quick Reference Card

One-page reference for common testing operations.

## Installation

```bash
# Full setup (first time)
./scripts/setup-tests.sh

# Manual
npm install
npx playwright install
cp tests/e2e/.env.example tests/e2e/.env
```

## Running Tests

### Unit Tests

```bash
npm test                    # Run all unit tests
npm run test:watch         # Watch mode (auto-rerun)
npm run test:ui            # Interactive UI
npm run test:coverage      # With coverage report
npm test clt-calculations  # Specific test file
```

### Integration Tests

```bash
npm test integration       # All integration tests
npm test signings-api      # Specific API tests
```

### E2E Tests

```bash
npm run test:e2e           # All browsers
npm run test:e2e:ui        # Interactive UI mode
npm run test:e2e:debug     # Step-through debugger
npm run test:e2e:report    # View last report

# Specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Specific test
npx playwright test time-tracking.spec.ts
npx playwright test -g "should clock in"
```

### All Tests

```bash
npm run test:all           # Run everything
```

## File Locations

```
Test Files:
  src/__tests__/unit/clt-calculations.test.ts      (Unit tests)
  src/__tests__/integration/signings-api.test.ts   (API tests)
  tests/e2e/time-tracking.spec.ts                  (E2E tests)

Configuration:
  vitest.config.ts                                  (Vitest config)
  playwright.config.ts                              (Playwright config)
  tests/e2e/.env                                    (E2E environment)

Documentation:
  TESTING_GUIDE.md                                  (Main guide)
  tests/README.md                                   (Test docs)
  INSTALLATION_STEPS.md                             (Setup help)
  claudedocs/test-suite-summary.md                  (Summary)
  claudedocs/DELIVERABLES.md                        (Deliverables)
```

## Test Coverage

| Type | File | Tests | Coverage |
|------|------|-------|----------|
| Unit | clt-calculations.test.ts | 40+ | ✅ 100% CLT logic |
| Integration | signings-api.test.ts | 20+ | ✅ 100% endpoints |
| E2E | time-tracking.spec.ts | 15+ | ✅ Critical paths |

## Common Commands

### Development Workflow

```bash
# 1. Start dev server (Terminal 1)
npm run dev

# 2. Run tests in watch mode (Terminal 2)
npm run test:watch

# 3. Make changes and tests auto-run
```

### Before Commit

```bash
# Run all tests
npm run test:all

# Check coverage
npm run test:coverage

# Lint code
npm run lint
```

### Debugging

```bash
# Unit test debug
npm test -- -t "specific test name"
npm test -- --reporter=verbose

# E2E debug
npm run test:e2e:debug
npx playwright test --debug

# View trace
npx playwright show-trace trace.zip
```

## Environment Setup

### E2E Tests (.env)

```env
BASE_URL=http://localhost:3000
TEST_EMAIL=test@example.com
TEST_PASSWORD=test123456
```

## Quick Troubleshooting

### Problem: Tests not found
**Solution**: `npm install` to install dependencies

### Problem: Playwright browsers missing
**Solution**: `npx playwright install`

### Problem: Port 3000 in use
**Solution**: `lsof -ti:3000 | xargs kill -9`

### Problem: Tests timeout
**Solution**: Check dev server is running, increase timeout in config

### Problem: Flaky E2E tests
**Solution**: Add proper waits, avoid fixed timeouts, use deterministic data

### Problem: npm install fails (ENOTEMPTY)
**Solution**: See `INSTALLATION_STEPS.md` for manual steps

## Test Patterns

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest'

describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = createTestData()

    // Act
    const result = functionUnderTest(input)

    // Assert
    expect(result).toBe(expectedValue)
  })
})
```

### Integration Test Example

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server')

describe('API Endpoint', () => {
  it('should handle request correctly', async () => {
    const request = new NextRequest('http://localhost/api/endpoint')
    const response = await GET(request)
    expect(response.status).toBe(200)
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('user flow', async ({ page }) => {
  await page.goto('http://localhost:3000/page')
  await page.click('button')
  await expect(page.locator('h1')).toContainText('Expected')
})
```

## Coverage Reports

```bash
# Generate coverage
npm run test:coverage

# View HTML report
open coverage/index.html

# Check coverage summary
npm test -- --coverage --reporter=text
```

## CI/CD Snippets

### GitHub Actions

```yaml
- run: npm ci
- run: npm test -- --coverage
- run: npx playwright install --with-deps
- run: npm run test:e2e
```

### Vercel

```json
{
  "buildCommand": "npm run build && npm test"
}
```

## Performance

| Test Type | Duration |
|-----------|----------|
| Unit | < 5s |
| Integration | < 10s |
| E2E (single) | < 30s |
| E2E (all) | < 3min |

## Key Features Tested

✅ CLT calculations (hours, overtime, night shift, DSR)
✅ API endpoints (create, read, validate)
✅ User flows (login, clock in/out, breaks)
✅ Accessibility (keyboard, ARIA, screen readers)
✅ Responsive design (desktop, mobile, tablet)
✅ Multi-browser (Chrome, Firefox, Safari, iOS, Android)

## Documentation Links

- **Main Guide**: `TESTING_GUIDE.md`
- **Setup Help**: `INSTALLATION_STEPS.md`
- **Test Docs**: `tests/README.md`
- **Summary**: `claudedocs/test-suite-summary.md`
- **Deliverables**: `claudedocs/DELIVERABLES.md`

---

**Quick Help**: For detailed information, see `TESTING_GUIDE.md`
