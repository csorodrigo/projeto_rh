# Test Suite Documentation

Comprehensive test suite for RH-Rickgay time tracking system.

## Test Structure

```
tests/
├── e2e/                          # End-to-end tests (Playwright)
│   ├── time-tracking.spec.ts    # Time tracking user flows
│   └── .env.example              # Environment variables template
└── README.md

src/__tests__/
├── unit/                         # Unit tests
│   └── clt-calculations.test.ts # CLT calculations logic
├── integration/                  # Integration tests
│   └── signings-api.test.ts     # API endpoint tests
├── time-tracking/                # Time tracking tests
│   ├── compliance.test.ts       # Compliance validation
│   ├── hours-calculation.test.ts # Hours calculation
│   └── signing-validation.test.ts # Signing validation
├── fixtures/                     # Test data fixtures
└── setup.ts                      # Test setup configuration
```

## Prerequisites

### Install Dependencies

```bash
npm install
```

### Install Playwright Browsers

```bash
npx playwright install
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Integration Tests

```bash
# Run only integration tests
npm test integration

# Run API tests
npm test signings-api
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Run specific browser
npx playwright test --project=chromium

# Show test report
npm run test:e2e:report
```

### Run All Tests

```bash
npm run test:all
```

## Test Categories

### 1. CLT Calculations Tests (`clt-calculations.test.ts`)

Tests Brazilian labor law calculations:

- **Working hours calculation**: Basic time tracking math
- **Overtime 50%**: Weekday overtime calculations
- **Overtime 100%**: Sunday/holiday overtime
- **Night shift bonus**: 22h-5h night work (52.5min = 1h)
- **DSR**: Weekly rest pay calculations
- **Monthly consolidation**: Full month aggregation
- **Monetary values**: Salary and payment calculations

**Coverage**: 100% of calculation functions

### 2. API Integration Tests (`signings-api.test.ts`)

Tests time entry API endpoints:

- **POST /api/signings**: Create time entries
  - Authentication validation
  - Employee validation
  - Action sequence validation
  - Duplicate detection
  - Break management

- **GET /api/signings/today**: Today's records
  - User-specific records
  - Admin access control
  - Time calculations
  - Next allowed actions

- **GET /api/signings**: List entries
  - Pagination
  - Date filtering
  - Permission checks

**Coverage**: All API routes and edge cases

### 3. E2E Tests (`time-tracking.spec.ts`)

Tests complete user journeys:

- **Login flow**: User authentication
- **Clock in/out**: Complete punch cycle
- **Break management**: Start and end breaks
- **Timeline display**: Record visualization
- **Hours calculation**: Real-time updates
- **Action validation**: Correct button states
- **Duplicate prevention**: 1-minute window
- **Responsive design**: Mobile/tablet views
- **Network errors**: Offline handling
- **Accessibility**: Keyboard navigation, ARIA labels

**Browsers tested**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari, iPad

## Test Data

### Fixtures

Located in `src/__tests__/fixtures/`:

- `users.ts`: Test user and employee data
- Mock Supabase responses
- Sample time records

### Environment Variables

For E2E tests, create `tests/e2e/.env`:

```env
BASE_URL=http://localhost:3000
TEST_EMAIL=your-test-user@example.com
TEST_PASSWORD=your-test-password
```

## Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| Unit Tests | 90% | TBD |
| Integration Tests | 85% | TBD |
| E2E Critical Paths | 100% | TBD |

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test -- --coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Tests

### Unit/Integration Tests

```bash
# Run specific test file
npm test clt-calculations

# Run tests matching pattern
npm test -- -t "overtime"

# Enable verbose output
npm test -- --reporter=verbose
```

### E2E Tests

```bash
# Debug mode (step through)
npm run test:e2e:debug

# Run specific test
npx playwright test time-tracking.spec.ts

# Run specific test case
npx playwright test -g "should clock in"

# View trace
npx playwright show-trace trace.zip
```

## Best Practices

### Writing Tests

1. **Arrange-Act-Assert**: Clear test structure
2. **Descriptive names**: Test intent should be obvious
3. **Independent tests**: No test dependencies
4. **Isolated data**: Use fixtures and mocks
5. **Deterministic**: Tests should not be flaky

### Mocking

- Mock Supabase for unit/integration tests
- Use real database for E2E (test environment)
- Mock external APIs (email, payment, etc.)

### Performance

- Run unit tests in parallel
- Limit E2E parallelization to avoid conflicts
- Use test data factories for efficiency
- Clean up test data after runs

## Troubleshooting

### Common Issues

**Vitest not found**
```bash
npm install -D vitest @vitejs/plugin-react
```

**Playwright browsers missing**
```bash
npx playwright install
```

**Port 3000 already in use**
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
BASE_URL=http://localhost:3001 npm run test:e2e
```

**Tests timing out**
- Increase timeout in test config
- Check network connectivity
- Verify dev server is running

### Getting Help

1. Check test output for errors
2. Review test logs: `test-results/`
3. View Playwright report: `npm run test:e2e:report`
4. Check coverage report: `coverage/index.html`

## Contributing

When adding features:

1. Write tests first (TDD)
2. Ensure all tests pass
3. Maintain coverage targets
4. Update test documentation

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [CLT Labor Law Reference](https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm)
