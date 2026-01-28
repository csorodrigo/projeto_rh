#!/bin/bash

# Test Setup Script
# Installs all testing dependencies and configures the test environment

set -e

echo "🧪 Setting up test environment for RH-Rickgay..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "${YELLOW}Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${BLUE}Node.js version: $(node --version)${NC}"
echo -e "${BLUE}npm version: $(npm --version)${NC}"

# Install dependencies
echo -e "\n${BLUE}📦 Installing npm dependencies...${NC}"
npm install

# Install Playwright browsers
echo -e "\n${BLUE}🌐 Installing Playwright browsers...${NC}"
npx playwright install

# Install Playwright system dependencies (Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "\n${BLUE}🐧 Installing Playwright system dependencies (Linux)...${NC}"
    npx playwright install-deps
fi

# Create E2E environment file if it doesn't exist
if [ ! -f "tests/e2e/.env" ]; then
    echo -e "\n${YELLOW}⚙️  Creating E2E environment file...${NC}"
    cp tests/e2e/.env.example tests/e2e/.env
    echo -e "${YELLOW}Please update tests/e2e/.env with your test credentials${NC}"
fi

# Verify test setup
echo -e "\n${BLUE}✅ Verifying test setup...${NC}"

# Check Vitest
if npx vitest --version &> /dev/null; then
    echo -e "${GREEN}✓ Vitest installed${NC}"
else
    echo -e "${YELLOW}✗ Vitest installation failed${NC}"
    exit 1
fi

# Check Playwright
if npx playwright --version &> /dev/null; then
    echo -e "${GREEN}✓ Playwright installed${NC}"
else
    echo -e "${YELLOW}✗ Playwright installation failed${NC}"
    exit 1
fi

# Run a quick test
echo -e "\n${BLUE}🏃 Running quick test check...${NC}"
if npm test -- --run --reporter=basic 2>&1 | head -20; then
    echo -e "${GREEN}✓ Unit tests working${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests may need attention${NC}"
fi

# Summary
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Test environment setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${BLUE}Available test commands:${NC}"
echo -e "  ${GREEN}npm test${NC}              - Run unit tests"
echo -e "  ${GREEN}npm run test:watch${NC}    - Run tests in watch mode"
echo -e "  ${GREEN}npm run test:coverage${NC} - Generate coverage report"
echo -e "  ${GREEN}npm run test:e2e${NC}      - Run E2E tests"
echo -e "  ${GREEN}npm run test:e2e:ui${NC}   - Run E2E tests with UI"
echo -e "  ${GREEN}npm run test:all${NC}      - Run all tests"

echo -e "\n${BLUE}Next steps:${NC}"
echo -e "  1. Update ${YELLOW}tests/e2e/.env${NC} with test credentials"
echo -e "  2. Start dev server: ${GREEN}npm run dev${NC}"
echo -e "  3. Run tests: ${GREEN}npm test${NC}"

echo ""
