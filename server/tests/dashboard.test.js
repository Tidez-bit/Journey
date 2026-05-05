const request = require('supertest');
const { createTestApp } = require('./helpers/testApp');
const { createAuthenticatedUser, deleteTestUser } = require('./helpers/authHelper');
const { seedTrades, seedTransactions, clearUserData } = require('./helpers/dbHelper');

const app = createTestApp();

describe('Dashboard API', () => {
  let user, token, userId;

  beforeAll(async () => {
    const auth = await createAuthenticatedUser();
    user = auth.user;
    token = auth.token;
    userId = user.id;
  });

  afterEach(async () => {
    await clearUserData(userId);
  });

  afterAll(async () => {
    await deleteTestUser(userId);
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return stats object with 200', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalTrades');
      expect(res.body).toHaveProperty('totalPnL');
      expect(res.body).toHaveProperty('winRate');
      expect(res.body).toHaveProperty('bestTrade');
      expect(res.body).toHaveProperty('currentBalance');
    });

    it('should return totalTrades = 0 if no trades exist', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalTrades).toBe(0);
    });

    it('should return bestTrade = 0 if all trades are losses', async () => {
      await seedTrades(userId, [
        { pnl: -100, margin: 1000, pnlPercent: -10 },
        { pnl: -50, margin: 500, pnlPercent: -10 },
        { pnl: -200, margin: 1000, pnlPercent: -20 }
      ]);

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.bestTrade).toBe(0);
    });

    it('should return winRate = 0 if no trades exist', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.winRate).toBe(0);
    });

    it('should calculate winRate correctly', async () => {
      // 3 wins, 2 losses = 60% win rate
      await seedTrades(userId, [
        { pnl: 100, margin: 1000, pnlPercent: 10 },
        { pnl: 150, margin: 1000, pnlPercent: 15 },
        { pnl: 200, margin: 1000, pnlPercent: 20 },
        { pnl: -50, margin: 500, pnlPercent: -10 },
        { pnl: -100, margin: 1000, pnlPercent: -10 }
      ]);

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.winRate).toBe(60);
    });

    it('should calculate currentBalance = depositTotal - withdrawTotal + totalPnL', async () => {
      // Seed transactions
      await seedTransactions(userId, [
        { type: 'DEPOSIT', amount: 1000 },
        { type: 'DEPOSIT', amount: 500 },
        { type: 'WITHDRAW', amount: 200 }
      ]);

      // Seed trades
      await seedTrades(userId, [
        { pnl: 100, margin: 1000, pnlPercent: 10 },
        { pnl: 50, margin: 500, pnlPercent: 10 },
        { pnl: -30, margin: 300, pnlPercent: -10 }
      ]);

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // 1000 + 500 - 200 + (100 + 50 - 30) = 1420
      expect(res.body.currentBalance).toBe(1420);
    });

    it('should calculate totalPnL correctly', async () => {
      await seedTrades(userId, [
        { pnl: 100, margin: 1000, pnlPercent: 10 },
        { pnl: 200, margin: 1000, pnlPercent: 20 },
        { pnl: -50, margin: 500, pnlPercent: -10 }
      ]);

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalPnL).toBe(250); // 100 + 200 - 50
    });

    it('should return bestTrade as highest profit', async () => {
      await seedTrades(userId, [
        { pnl: 100, margin: 1000, pnlPercent: 10 },
        { pnl: 300, margin: 1000, pnlPercent: 30 }, // Best
        { pnl: 150, margin: 1000, pnlPercent: 15 },
        { pnl: -50, margin: 500, pnlPercent: -10 }
      ]);

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.bestTrade).toBe(300);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats');

      expect(res.status).toBe(401);
    });

    it('should handle user with no transactions', async () => {
      await seedTrades(userId, [
        { pnl: 100, margin: 1000, pnlPercent: 10 }
      ]);

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.currentBalance).toBe(100); // Only PnL, no deposits
    });
  });
});
