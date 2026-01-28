# Testing Guide - RH-Rickgay

Complete testing setup and execution guide for the time tracking system.

## Quick Start

### 1. Install Dependencies

```bash
# Automated setup (recommended)
./scripts/setup-tests.sh

# Manual setup
npm install
npx playwright install
```

### 2. Configure Environment

Create `tests/e2e/.env` with your test credentials:

```env
BASE_URL=http://localhost:3000
TEST_EMAIL=test@example.com
TEST_PASSWORD=test123456
```

### 3. Run Tests

```bash
# Run all tests
npm run test:all

# Run only unit tests
npm test

# Run only E2E tests
npm run test:e2e
```

## Test Organization

### Unit Tests (`src/__tests__/unit/`)

**Purpose**: Test individual functions and calculations in isolation

**File**: `clt-calculations.test.ts`

**Covers**:
- Working hours calculation
- Overtime 50% (weekdays)
- Overtime 100% (Sundays/holidays)
- Night shift bonus (22h-5h with 52.5min reduction)
- DSR (Weekly Rest Pay)
- Monthly consolidation
- Monetary value calculations

**Run**:
```bash
npm test clt-calculations
```

**Example Test**:
```typescript
it('should calculate 50% overtime for weekdays', () => {
  const record: DailyTimeRecord = {
    date: new Date('2024-01-15T00:00:00'), // Monday
    clockIn: new Date('2024-01-15T08:00:00'),
    clockOut: new Date('2024-01-15T19:00:00'), // 11 hours total
    breakStart: new Date('2024-01-15T12:00:00'),
    breakEnd: new Date('2024-01-15T13:00:00'),
    isWorkday: true,
    isHoliday: false,
    isSunday: false,
  }

  const result = calculateDailyJourney(record)

  expect(result.netWorkedMinutes).toBe(600) // 10 hours net
  expect(result.overtime50Minutes).toBe(120) // 2 hours overtime
})
```

### Integration Tests (`src/__tests__/integration/`)

**Purpose**: Test API endpoints with mocked Supabase

**File**: `signings-api.test.ts`

**Covers**:
- POST /api/signings (create time entry)
- GET /api/signings/today (get today's records)
- GET /api/signings (list entries)
- Authentication checks
- Permission validation
- Action sequence validation
- Duplicate prevention

**Run**:
```bash
npm test signings-api
```

**Example Test**:
```typescript
it('should create clock_in entry successfully', async () => {
  const request = new NextRequest('http://localhost:3000/api/signings', {
    method: 'POST',
    body: JSON.stringify({
      employee_id: 'emp-123',
      company_id: 'company-123',
      record_type: 'clock_in',
      source: 'web',
    }),
  })

  const response = await POST(request)
  const data = await response.json()

  expect(response.status).toBe(201)
  expect(data.success).toBe(true)
})
```

### E2E Tests (`tests/e2e/`)

**Purpose**: Test complete user workflows in real browser

**File**: `time-tracking.spec.ts`

**Covers**:
- Login flow
- Clock in/out cycle
- Break management
- Timeline display
- Hours calculation
- Action validation
- Responsive design
- Accessibility

**Run**:
```bash
# All browsers
npm run test:e2e

# Specific browser
npx playwright test --project=chromium

# With UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

**Example Test**:
```typescript
test('should clock in successfully', async ({ page }) => {
  await page.goto(`${BASE_URL}/ponto`)

  const clockInButton = page.locator('button:has-text("Entrada")')
  await clockInButton.click()

  await page.waitForSelector('[role="status"]')

  const toast = page.locator('[role="status"]')
  await expect(toast).toContainText(/entrada.*registrada/i)
})
```

## Test Coverage

### What's Tested

✅ **CLT Calculations**
- [x] Working hours calculation
- [x] Break time handling
- [x] Overtime 50% (weekdays)
- [x] Overtime 100% (Sundays/holidays)
- [x] Night shift bonus (22h-5h)
- [x] Night hour reduction (52.5min = 1h)
- [x] 10-minute tolerance
- [x] DSR calculation
- [x] Monthly consolidation
- [x] Monetary values

✅ **API Endpoints**
- [x] POST /api/signings - Create entry
- [x] GET /api/signings/today - Today's records
- [x] GET /api/signings - List entries
- [x] Authentication validation
- [x] Permission checks
- [x] Action sequence validation
- [x] Duplicate detection (1-minute window)

✅ **User Flows**
- [x] Login
- [x] Clock in
- [x] Clock out
- [x] Start break
- [x] End break
- [x] View timeline
- [x] Calculate hours
- [x] Validate actions
- [x] Handle errors

✅ **Cross-browser**
- [x] Chrome
- [x] Firefox
- [x] Safari
- [x] Mobile Chrome
- [x] Mobile Safari
- [x] iPad

✅ **Accessibility**
- [x] Keyboard navigation
- [x] ARIA labels
- [x] Screen reader support

## Development Workflow

### 1. Write Tests First (TDD)

```typescript
// 1. Write failing test
it('should calculate DSR correctly', () => {
  const dsr = calculateDSR(500, 22, 5)
  expect(dsr).toBeCloseTo(113.64, 2)
})

// 2. Run test (should fail)
npm test

// 3. Implement function
export function calculateDSR(...) {
  // implementation
}

// 4. Run test (should pass)
npm test
```

### 2. Run Tests in Watch Mode

```bash
npm run test:watch
```

Changes automatically trigger test reruns.

### 3. Check Coverage

```bash
npm run test:coverage
```

Open `coverage/index.html` to see detailed report.

### 4. Debug Failing Tests

**Unit/Integration**:
```bash
# Run specific test
npm test -- -t "calculate DSR"

# Enable verbose output
npm test -- --reporter=verbose
```

**E2E**:
```bash
# Debug mode (step through)
npm run test:e2e:debug

# Specific test
npx playwright test -g "should clock in"
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/tests.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Vercel Integration

Add to `vercel.json`:

```json
{
  "buildCommand": "npm run build && npm test"
}
```

## Best Practices

### Writing Good Tests

1. **Descriptive Names**
   ```typescript
   // Good
   it('should calculate 50% overtime for weekdays')

   // Bad
   it('test overtime')
   ```

2. **Arrange-Act-Assert**
   ```typescript
   // Arrange
   const record = createTestRecord()

   // Act
   const result = calculateDailyJourney(record)

   // Assert
   expect(result.overtime50Minutes).toBe(120)
   ```

3. **Test One Thing**
   ```typescript
   // Good
   it('should calculate overtime')
   it('should apply tolerance')

   // Bad
   it('should calculate overtime and apply tolerance and validate breaks')
   ```

4. **Independent Tests**
   ```typescript
   // Good - each test is isolated
   beforeEach(() => {
     // Fresh setup for each test
   })

   // Bad - tests depend on each other
   let globalState = {}
   ```

### Mocking Strategy

**Unit Tests**: Mock everything external
```typescript
vi.mock('@/lib/supabase/server')
```

**Integration Tests**: Mock Supabase, real business logic
```typescript
mockSupabaseClient.from().select()
```

**E2E Tests**: Real everything (use test database)
```typescript
// No mocks - test real user experience
```

## Troubleshooting

### Common Issues

**"Cannot find module" error**
```bash
npm install
```

**Playwright browsers not installed**
```bash
npx playwright install
```

**Port 3000 in use**
```bash
# Kill process
lsof -ti:3000 | xargs kill -9

# Or change port
PORT=3001 npm run dev
```

**Tests timing out**
- Check network connection
- Verify dev server is running
- Increase timeout in config

**Flaky E2E tests**
- Add proper waits (`waitForSelector`)
- Avoid fixed timeouts
- Use deterministic test data

### Getting Help

1. Check test output for errors
2. Review logs: `test-results/`
3. View Playwright report: `npm run test:e2e:report`
4. Check coverage: `coverage/index.html`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [CLT Labor Law (Portuguese)](https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm)

## Maintenance

### Updating Test Data

Fixtures are in `src/__tests__/fixtures/`:
- `users.ts` - Test users and employees
- Update when schema changes

### Adding New Tests

1. Create test file in appropriate directory
2. Follow naming convention: `*.test.ts` or `*.spec.ts`
3. Add to relevant test suite
4. Update documentation

### Deprecating Tests

1. Mark as `test.skip()` with reason
2. Create issue to update or remove
3. Remove after confirmation

---

**Last Updated**: 2025-01-27
**Maintained By**: QA Team
