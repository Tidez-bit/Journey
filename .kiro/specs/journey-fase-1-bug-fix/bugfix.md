# Bugfix Requirements Document

## Introduction

This document addresses six critical bugs in the Journey Trading Journal application that affect database connection management, data field consistency, calculation accuracy, performance optimization, user experience, and deployment configuration. These fixes ensure proper resource management, correct data handling, accurate PnL calculations, optimized query performance, improved UX consistency, and reliable server startup.

## Bug Analysis

### Current Behavior (Defect)

**1. Database Connection Management**

1.1 WHEN multiple controllers and middleware initialize Prisma THEN the system creates multiple PrismaClient instances causing connection pool exhaustion and memory leaks

1.2 WHEN each file instantiates `new PrismaClient()` independently THEN the system fails to reuse connections efficiently

**2. Data Field Inconsistency**

1.3 WHEN targetController.js queries the trade model THEN the system uses the non-existent `date` field instead of `openTime` causing query failures

1.4 WHEN filtering, ordering, or grouping trades in target-related queries THEN the system throws database errors due to field mismatch

**3. PnL Percentage Calculation Error**

1.5 WHEN calculating pnlPercent in tradeController.js THEN the system uses formula `(pnl / entryPrice) * 100` which incorrectly calculates percentage based on price instead of margin

1.6 WHEN a trade has size/leverage THEN the system produces inaccurate percentage returns that don't reflect actual capital risk

**4. Dashboard Performance Issue**

1.7 WHEN dashboardController.js loads equity curve data THEN the system fetches all historical trades without date filtering causing slow response times

1.8 WHEN the trade history grows large THEN the system experiences performance degradation on dashboard load

**5. Delete Confirmation UX Inconsistency**

1.9 WHEN user clicks delete trade button in Journal.tsx THEN the system uses native `window.confirm()` instead of the existing Modal component creating inconsistent UI/UX

1.10 WHEN delete confirmation appears THEN the system displays a browser-native dialog that doesn't match the application's design system

**6. Server Startup Script Missing**

1.11 WHEN checking server/package.json scripts THEN the system has `"dev": "node server.js"` instead of `"dev": "nodemon server.js"` preventing hot-reload during development

### Expected Behavior (Correct)

**1. Database Connection Management**

2.1 WHEN the application initializes Prisma THEN the system SHALL use a singleton pattern via `server/lib/prisma.js` that creates one PrismaClient instance globally

2.2 WHEN any controller or middleware needs database access THEN the system SHALL import the shared Prisma instance from `../lib/prisma` (or appropriate relative path)

2.3 WHEN the following files need Prisma access THEN the system SHALL replace their Prisma initialization:
- `server/middleware/authMiddleware.js`
- `server/controllers/authController.js`
- `server/controllers/tradeController.js`
- `server/controllers/transactionController.js`
- `server/controllers/targetController.js`
- `server/controllers/dashboardController.js`
- `server/controllers/ruleController.js`
- `server/controllers/scannerController.js`

**2. Data Field Consistency**

2.4 WHEN targetController.js queries the trade model THEN the system SHALL use `openTime` field instead of `date` in all Prisma queries

2.5 WHEN filtering, ordering, selecting, or grouping trades THEN the system SHALL consistently reference `openTime` as per the schema definition

**3. PnL Percentage Calculation Accuracy**

2.6 WHEN calculating pnlPercent in tradeController.js THEN the system SHALL use the formula:
```javascript
const margin = entryPrice * size;
const pnlPercent = margin > 0 ? (pnl / margin) * 100 : 0;
```

2.7 WHEN size is not available THEN the system SHALL handle the calculation gracefully with a fallback or zero value

**4. Dashboard Performance Optimization**

2.8 WHEN dashboardController.js queries trades for equity curve/chart THEN the system SHALL add a 90-day filter:
```javascript
openTime: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
```

2.9 WHEN calculating summary statistics (total PnL, win rate, total trades) THEN the system SHALL continue to query all historical data without date filtering

**5. Delete Confirmation UX Consistency**

2.10 WHEN user clicks delete trade button in Journal.tsx THEN the system SHALL display the existing Modal component for confirmation

2.11 WHEN implementing delete confirmation THEN the system SHALL:
- Add state `deleteTargetId` to track which trade is being deleted
- Set `deleteTargetId` when delete button is clicked
- Render Modal with confirmation message
- Execute delete only after user confirms in modal
- Clear `deleteTargetId` after action completes

**6. Server Startup Script Configuration**

2.12 WHEN server/package.json is configured THEN the system SHALL include:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

2.13 WHEN the entry point is not `server.js` THEN the system SHALL adjust the script to match the actual entry point filename

### Unchanged Behavior (Regression Prevention)

**1. Database Connection Management**

3.1 WHEN Prisma queries execute THEN the system SHALL CONTINUE TO return the same data and maintain the same query behavior

3.2 WHEN authentication middleware validates tokens THEN the system SHALL CONTINUE TO perform user lookups correctly

3.3 WHEN any existing API endpoint is called THEN the system SHALL CONTINUE TO respond with the same data structure and status codes

**2. Data Field Consistency**

3.4 WHEN other controllers query trades using `openTime` THEN the system SHALL CONTINUE TO work without modification

3.5 WHEN the schema.prisma file is read THEN the system SHALL CONTINUE TO remain unchanged

**3. PnL Percentage Calculation**

3.6 WHEN trades without size information are processed THEN the system SHALL CONTINUE TO handle them gracefully without errors

3.7 WHEN existing trade records are queried THEN the system SHALL CONTINUE TO return all stored fields correctly

**4. Dashboard Performance**

3.8 WHEN summary statistics are calculated THEN the system SHALL CONTINUE TO use all historical trade data

3.9 WHEN equity curve data structure is returned THEN the system SHALL CONTINUE TO maintain the same format for frontend compatibility

**5. Delete Confirmation UX**

3.10 WHEN other CRUD operations (create, edit, view) are performed THEN the system SHALL CONTINUE TO function identically

3.11 WHEN the Modal component is used elsewhere THEN the system SHALL CONTINUE TO work without side effects

**6. Server Startup**

3.12 WHEN `npm start` is executed THEN the system SHALL CONTINUE TO start the server in production mode

3.13 WHEN environment variables are loaded THEN the system SHALL CONTINUE TO read from .env files correctly
