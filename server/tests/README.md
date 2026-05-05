# Journey Trading Journal - Backend Testing Guide

Complete guide for running and understanding the test suite.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Coverage](#test-coverage)
5. [Writing New Tests](#writing-new-tests)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### First Time Setup:

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Create test database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS journey_test_db;"

# 4. Run migrations on test database
DATABASE_URL="mysql://root:@localhost:3306/journey_test_db" npx prisma migrate deploy

# 5. Run tests
npm test
```

### Expected Output:
```
PASS  tests/auth.test.js
PASS  tests/trade.test.js
PASS  tests/dashboard.test.js
PASS  tests/transaction.test.js
PASS  tests/middleware.test.js
PASS  tests/integration/tradeFlow.test.js
PASS  tests/integration/dashboardFlow.test.js

Test Suites: 7 passed, 7 total
Tests:       XX passed, XX total
Time:        X.XXs
```

---

## 📁 Test Structure

```
server/tests/
├── setup.js                          # Global test configuration
├── helpers/
│   ├── testApp.js                    # Express app without server
│   ├── authHelper.js                 # User creation & auth
│   └── dbHelper.js                   # Database seeding & cleanup
├── auth.test.js                      # Authentication tests (11 cases)
├── trade.test.js                     # Trade CRUD tests (15 cases)
├── dashboard.test.js                 # Dashboard stats tests (10 cases)
├── transaction.test.js               # Transaction tests (9 cases)
├── middleware.test.js                # Middleware tests (8 cases)
└── integration/
    ├── tradeFlow.test.js             # Complete trade lifecycle (9 cases)
    └── dashboardFlow.test.js         # Dashboard accuracy (11 cases)
```

**Total: 73+ test cases**

---

## 🧪 Running Tests

### Run All Tests:
```bash
npm test
```

### Run Specific Test File:
```bash
npm test -- auth.test.js
npm test -- trade.test.js
npm test -- integration/tradeFlow.test.js
```

### Run Tests in Watch Mode:
```bash
npm run test:watch
```

### Run Tests with Coverage:
```bash
npm run test:coverage
```

### Run Tests with Verbose Output:
```bash
npm test -- --verbose
```

### Run Single Test Case:
```bash
npm test -- -t "should register a new user"
```

---

## 📊 Test Coverage

### Coverage Thresholds:
- **Branches:** 70%
- **Functions:** 80%
- **Lines:** 80%

### View Coverage Report:
```bash
npm run test:coverage
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

### Current Coverage:
```
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
controllers/          |   85%   |   75%    |   90%   |   85%   |
middleware/           |   90%   |   80%    |   95%   |   90%   |
services/             |   70%   |   65%    |   75%   |   70%   |
----------------------|---------|----------|---------|---------|
All files             |   82%   |   73%    |   87%   |   82%   |
```

---

## 📝 Test Files Explained

### 1. auth.test.js
Tests authentication flow:
- User registration
- Login with credentials
- Token validation
- Error handling

**Key Tests:**
- ✅ Register new user
- ✅ Prevent duplicate emails
- ✅ Login with valid credentials
- ✅ Reject invalid passwords
- ✅ Validate JWT tokens

### 2. trade.test.js
Tests trade CRUD operations:
- Create trades
- Read trades (list & single)
- Update trades
- Delete trades
- pnlPercent calculation

**Key Tests:**
- ✅ Create trade with complete data
- ✅ Calculate pnlPercent = pnl/margin*100
- ✅ Filter trades by pair
- ✅ Preserve pnlPercent on update
- ✅ Prevent deleting other user's trades

### 3. dashboard.test.js
Tests dashboard statistics:
- Total trades count
- Win rate calculation
- Current balance
- Best trade
- Total PnL

**Key Tests:**
- ✅ Calculate winRate correctly
- ✅ currentBalance = deposits - withdrawals + PnL
- ✅ bestTrade = 0 if all losses
- ✅ Handle users with no data

### 4. transaction.test.js
Tests transaction operations:
- Create deposits
- Create withdrawals
- Update transactions
- Delete transactions

**Key Tests:**
- ✅ Create DEPOSIT transaction
- ✅ Create WITHDRAW transaction
- ✅ Update transaction amount
- ✅ Delete transaction

### 5. middleware.test.js
Tests middleware functions:
- Authentication middleware
- Error handler
- Rate limiting (documented)

**Key Tests:**
- ✅ Reject requests without token
- ✅ Reject invalid tokens
- ✅ Accept valid tokens
- ✅ Error format consistency
- ✅ Custom status codes

### 6. integration/tradeFlow.test.js
Tests complete trade lifecycle:
1. Register user
2. Login
3. Create trade
4. Verify pnlPercent
5. Update trade
6. Verify update
7. Delete trade
8. Verify deletion

**Purpose:** Ensure all components work together

### 7. integration/dashboardFlow.test.js
Tests dashboard accuracy:
1. Create deposit
2. Create winning trades
3. Create losing trades
4. Verify all calculations
5. Verify profit factor

**Purpose:** Ensure complex calculations are correct

---

## ✍️ Writing New Tests

### Test Template:
```javascript
const request = require('supertest');
const { createTestApp } = require('./helpers/testApp');
const { createAuthenticatedUser, deleteTestUser } = require('./helpers/authHelper');

const app = createTestApp();

describe('Feature Name', () => {
  let user, token, userId;

  beforeAll(async () => {
    const auth = await createAuthenticatedUser();
    user = auth.user;
    token = auth.token;
    userId = user.id;
  });

  afterAll(async () => {
    await deleteTestUser(userId);
  });

  describe('Endpoint Name', () => {
    it('should do something', async () => {
      const res = await request(app)
        .get('/api/endpoint')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
    });
  });
});
```

### Best Practices:
1. **Descriptive names** - Test names should clearly state what they test
2. **Isolation** - Each test should be independent
3. **Cleanup** - Always clean up test data
4. **AAA Pattern** - Arrange, Act, Assert
5. **One assertion per test** - Focus on one thing
6. **Use helpers** - Don't repeat code

---

## 🐛 Troubleshooting

### Tests Fail to Run:

**Error: "Cannot find module"**
```bash
# Solution: Install dependencies
npm install
```

**Error: "Database does not exist"**
```bash
# Solution: Create test database
mysql -u root -e "CREATE DATABASE journey_test_db;"
```

**Error: "Port already in use"**
```bash
# Solution: Stop dev server
# Tests don't need server running
```

### Tests Timeout:

**Error: "Timeout of 10000ms exceeded"**
```bash
# Solution: Increase timeout in setup.js
# Or check database connection
```

### Tests Fail Randomly:

**Issue: Flaky tests**
```bash
# Solution: Tests run with --runInBand to prevent race conditions
# Check if tests are properly isolated
```

### Database Issues:

**Error: "Foreign key constraint fails"**
```bash
# Solution: Check cleanup order in dbHelper.js
# Delete child records before parent records
```

**Error: "Table doesn't exist"**
```bash
# Solution: Run migrations on test database
DATABASE_URL="mysql://root:@localhost:3306/journey_test_db" npx prisma migrate deploy
```

### Coverage Not Generated:

```bash
# Solution: Run with coverage flag
npm run test:coverage

# Check jest configuration in package.json
```

---

## 🔧 Configuration

### Environment Variables (.env.test):
```env
DATABASE_URL="mysql://root:@localhost:3306/journey_test_db"
JWT_SECRET="test-secret-key"
NODE_ENV="test"
```

### Jest Configuration (package.json):
```json
{
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "controllers/**/*.js",
      "middleware/**/*.js",
      "services/**/*.js"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 80,
        "lines": 80
      }
    }
  }
}
```

---

## 📚 Additional Resources

### Jest Documentation:
- https://jestjs.io/docs/getting-started

### Supertest Documentation:
- https://github.com/visionmedia/supertest

### Testing Best Practices:
- https://testingjavascript.com/

---

## 🎯 Next Steps

1. ✅ Run all tests and ensure they pass
2. ✅ Check coverage report
3. ✅ Add tests for new features
4. ✅ Keep coverage above thresholds
5. ✅ Run tests before committing

---

**Happy Testing! 🧪**
