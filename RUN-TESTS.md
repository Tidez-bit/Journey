# Quick Guide: Running Journey Tests

## 🚀 Quick Start

```bash
# 1. Navigate to server directory
cd server

# 2. Run all tests
npm test

# 3. Run with coverage
npm run test:coverage
```

## 📋 Prerequisites

### First Time Setup:
```bash
# 1. Create test database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS journey_test_db;"

# 2. Run migrations
DATABASE_URL="mysql://root:@localhost:3306/journey_test_db" npx prisma migrate deploy

# 3. Install dependencies
npm install
```

## 🧪 Test Commands

### Run All Tests:
```bash
npm test
```

### Run Specific Test File:
```bash
npm test -- auth.test.js
npm test -- target.test.js
npm test -- integration/tradeFlow.test.js
```

### Run Tests with Coverage:
```bash
npm run test:coverage
```

### Run Tests in Watch Mode:
```bash
npm run test:watch
```

### Run Single Test Case:
```bash
npm test -- -t "should create target"
```

## 📊 Expected Results

### Test Summary:
```
Test Suites: 9 passed, 9 total
Tests:       87 passed, 87 total
Time:        ~8-12 seconds
```

### Coverage:
```
Controllers:  85% (target: 80%) ✅
Middleware:   90% (target: 90%) ✅
Services:     70% (target: 80%) 🟡
Overall:      82% (target: 80%) ✅
```

## 🐛 Troubleshooting

### PowerShell Execution Policy Error:
```powershell
# Run this first:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Then run tests:
npm test
```

### Database Connection Error:
```bash
# Check if MySQL is running
mysql -u root -e "SELECT 1;"

# Recreate test database
mysql -u root -e "DROP DATABASE IF EXISTS journey_test_db;"
mysql -u root -e "CREATE DATABASE journey_test_db;"

# Run migrations again
DATABASE_URL="mysql://root:@localhost:3306/journey_test_db" npx prisma migrate deploy
```

### Tests Timeout:
```bash
# Increase timeout in tests/setup.js
# Current: 10000ms (10 seconds)
# Change to: 30000ms (30 seconds) if needed
```

### Port Already in Use:
```bash
# Tests don't need server running
# Stop the dev server if it's running
```

## 📁 Test Files

### Unit Tests (67 tests):
- `tests/auth.test.js` - 11 tests
- `tests/trade.test.js` - 15 tests
- `tests/dashboard.test.js` - 10 tests
- `tests/transaction.test.js` - 9 tests
- `tests/middleware.test.js` - 8 tests
- `tests/target.test.js` - 14 tests ⭐ NEW

### Integration Tests (20 tests):
- `tests/integration/tradeFlow.test.js` - 10 tests
- `tests/integration/dashboardFlow.test.js` - 5 tests
- `tests/integration/targetFlow.test.js` - 5 tests ⭐ NEW

## ✅ Success Checklist

Before committing:
- [ ] All tests pass
- [ ] Coverage ≥ 80%
- [ ] No console errors
- [ ] Test database clean

## 📚 More Information

- Full documentation: `PHASE-6-TESTING-COMPLETE.md`
- Setup guide: `TESTING-SETUP-GUIDE.md`
- Detailed guide: `server/tests/README.md`

---

**Quick Test:** `npm test`  
**Quick Coverage:** `npm run test:coverage`  
**Need Help?** Check `PHASE-6-TESTING-COMPLETE.md`
