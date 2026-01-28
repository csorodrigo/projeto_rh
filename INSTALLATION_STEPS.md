# Test Suite Installation Steps

## Issue Detected

There's a file locking issue preventing automatic installation. Follow these manual steps:

## Manual Installation

### Step 1: Close All Processes

1. Stop the Next.js dev server if running (Ctrl+C)
2. Close your code editor (VS Code, etc.)
3. Close any terminal windows accessing this directory

### Step 2: Clean Node Modules

```bash
cd "/Users/rodrigooliveira/Documents/workspace 2/Claude-code/rh-rickgay"

# Remove node_modules completely
rm -rf node_modules

# Remove package-lock.json
rm -f package-lock.json

# Clear npm cache
npm cache clean --force
```

### Step 3: Install Dependencies

```bash
# Install all dependencies fresh
npm install
```

### Step 4: Install Playwright Browsers

```bash
# Install Playwright browsers
npx playwright install

# For Linux, also install system dependencies
# npx playwright install-deps
```

### Step 5: Verify Installation

```bash
# Check vitest
npx vitest --version

# Check playwright
npx playwright --version
```

### Step 6: Configure E2E Tests

```bash
# Copy environment template
cp tests/e2e/.env.example tests/e2e/.env

# Edit with your test credentials
nano tests/e2e/.env
```

Update with:
```env
BASE_URL=http://localhost:3000
TEST_EMAIL=your-test-email@example.com
TEST_PASSWORD=your-test-password
```

### Step 7: Run Tests

#### Unit Tests

```bash
# Run all unit tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

#### E2E Tests

```bash
# Start dev server (Terminal 1)
npm run dev

# In another terminal (Terminal 2)
npm run test:e2e

# Or use UI mode
npm run test:e2e:ui
```

## Alternative: Use Docker (If Issues Persist)

If you continue to have file locking issues, you can run tests in Docker:

### Create Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Install Playwright
RUN npx playwright install --with-deps

CMD ["npm", "test"]
```

### Run Tests in Docker

```bash
# Build image
docker build -t rh-rickgay-tests .

# Run unit tests
docker run rh-rickgay-tests npm test

# Run E2E tests
docker run -e BASE_URL=http://host.docker.internal:3000 rh-rickgay-tests npm run test:e2e
```

## Troubleshooting

### Issue: "ENOTEMPTY" errors

**Solution**: Restart your computer and try again. This usually resolves file locking issues.

### Issue: "Permission denied"

**Solution**:
```bash
sudo chown -R $(whoami) node_modules
chmod -R 755 node_modules
```

### Issue: Playwright browsers fail to install

**Solution**:
```bash
# Install system dependencies (macOS)
brew install chromium

# Or use system browsers
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install
```

### Issue: Tests timeout

**Solution**:
```bash
# Increase timeout in playwright.config.ts
timeout: 120000  # 2 minutes
```

## Files Created

All test files are ready:

### Unit Tests
- ✅ `src/__tests__/unit/clt-calculations.test.ts`

### Integration Tests
- ✅ `src/__tests__/integration/signings-api.test.ts`

### E2E Tests
- ✅ `tests/e2e/time-tracking.spec.ts`

### Configuration
- ✅ `vitest.config.ts` (updated)
- ✅ `playwright.config.ts` (created)
- ✅ `package.json` (updated with scripts and dependencies)

### Documentation
- ✅ `tests/README.md`
- ✅ `TESTING_GUIDE.md`
- ✅ `claudedocs/test-suite-summary.md`

### Scripts
- ✅ `scripts/setup-tests.sh`

## Expected Dependencies After Install

Your `package.json` should have these devDependencies:

```json
{
  "@playwright/test": "^1.49.1",
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/react": "^16.1.0",
  "@vitejs/plugin-react": "^4.3.4",
  "@vitest/coverage-v8": "^3.0.6",
  "@vitest/ui": "^3.0.6",
  "happy-dom": "^15.11.7",
  "vitest": "^3.0.6"
}
```

## Verification Checklist

After installation, verify:

- [ ] `npm test` runs without errors
- [ ] `npx vitest --version` shows version
- [ ] `npx playwright --version` shows version
- [ ] `tests/e2e/.env` exists with credentials
- [ ] `npm run dev` starts server on port 3000
- [ ] `npm run test:e2e` runs E2E tests

## Next Steps

Once installation is complete:

1. Read `TESTING_GUIDE.md` for usage instructions
2. Run `npm test` to execute unit tests
3. Start dev server and run E2E tests
4. View coverage with `npm run test:coverage`

## Support

If you encounter issues:

1. Check `TESTING_GUIDE.md` troubleshooting section
2. Review npm error logs: `~/.npm/_logs/`
3. Try in a fresh directory clone
4. Consider using Docker approach above

---

**Note**: The file locking issue is typically caused by:
- Running dev server in background
- VS Code file watcher
- macOS Spotlight indexing
- Antivirus software

Restarting your computer usually resolves these issues.
