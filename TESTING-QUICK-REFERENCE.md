# Journey Testing — Quick Reference Card

## 🚀 Run All Tests

### Backend:
```bash
cd server && npm test
```

### Frontend:
```bash
cd client && npm test
```

### With Coverage:
```bash
# Backend
cd server && npm run test:coverage

# Frontend
cd client && npm run test:coverage
```

---

## 📊 Test Statistics

| Component | Tests | Coverage | Status |
|-----------|-------|----------|--------|
| Backend | 87 | 82% | ✅ |
| Frontend | 32 | ~90% | ✅ |
| **Total** | **119** | **~85%** | ✅ |

---

## 📁 Test Files

### Backend (9 files):
- `tests/auth.test.js` - 11 tests
- `tests/trade.test.js` - 15 tests
- `tests/dashboard.test.js` - 10 tests
- `tests/transaction.test.js` - 9 tests
- `tests/middleware.test.js` - 8 tests
- `tests/target.test.js` - 14 tests ⭐
- `tests/integration/tradeFlow.test.js` - 10 tests
- `tests/integration/dashboardFlow.test.js` - 5 tests
- `tests/integration/targetFlow.test.js` - 5 tests ⭐

### Frontend (3 files):
- `src/tests/store/authStore.test.ts` - 8 tests ⭐
- `src/tests/store/tradeStore.test.ts` - 13 tests ⭐
- `src/tests/pages/Login.test.tsx` - 11 tests ⭐

⭐ = New in Phase 6

---

## 🔧 First Time Setup

### Backend:
```bash
cd server
npm install
mysql -u root -e "CREATE DATABASE journey_test_db;"
DATABASE_URL="mysql://root:@localhost:3306/journey_test_db" npx prisma migrate deploy
npm test
```

### Frontend:
```bash
cd client
npm install
npm test
```

---

## 🐛 Troubleshooting

### Backend Issues:
```bash
# Database error
mysql -u root -e "CREATE DATABASE journey_test_db;"

# Migration error
DATABASE_URL="mysql://root:@localhost:3306/journey_test_db" npx prisma migrate deploy

# Port conflict
# Stop dev server before testing
```

### Frontend Issues:
```bash
# Module not found
npm install

# Clear cache
rm -rf node_modules
npm install
```

---

## 📚 Documentation

- `PHASE-6-FINAL-SUMMARY.md` - Complete overview
- `PHASE-6-TESTING-COMPLETE.md` - Backend details
- `FRONTEND-TESTING-COMPLETE.md` - Frontend details
- `RUN-TESTS.md` - Detailed guide
- `server/tests/README.md` - Backend guide

---

## ✅ Quick Checklist

Before committing:
- [ ] Run backend tests
- [ ] Run frontend tests
- [ ] Check coverage
- [ ] All tests pass
- [ ] No console errors

---

## 🎯 Coverage Goals

- Backend: ≥ 80% ✅ (82%)
- Frontend: ≥ 80% ✅ (~90%)
- Overall: ≥ 80% ✅ (~85%)

---

**Need help?** Check `PHASE-6-FINAL-SUMMARY.md`
