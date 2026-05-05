const request = require('supertest');
const { createTestApp } = require('./helpers/testApp');
const { createAuthenticatedUser, deleteTestUser } = require('./helpers/authHelper');
const { seedTrades, seedTransactions, clearUserData } = require('./helpers/dbHelper');

const app = createTestApp();

describe('Target API', () => {
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

  describe('POST /api/targets', () => {
    it('should create target and return 201', async () => {
      const res = await request(app)
        .post('/api/targets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'DAILY',
          name: 'Daily Target',
          startBalance: 10000,
          targetBalance: 15000,
          dailyPercent: 2,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Daily Target');
      expect(res.body.startBalance).toBe(10000);
      expect(res.body.dailyPercent).toBe(2);
    });

    it('should return 400 if required fields missing', async () => {
      const res = await request(app)
        .post('/api/targets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Incomplete Target'
          // Missing required fields
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/targets')
        .send({
          type: 'DAILY',
          name: 'Test Target',
          startBalance: 10000,
          targetBalance: 15000
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/targets', () => {
    beforeEach(async () => {
      // Create some targets
      await request(app)
        .post('/api/targets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'DAILY',
          name: 'Target 1',
          startBalance: 10000,
          targetBalance: 15000,
          dailyPercent: 2
        });

      await request(app)
        .post('/api/targets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'WEEKLY',
          name: 'Target 2',
          startBalance: 10000,
          targetBalance: 20000,
          dailyPercent: 3
        });
    });

    it('should return array of targets', async () => {
      const res = await request(app)
        .get('/api/targets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .get('/api/targets');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/targets/daily-log', () => {
    let targetId;

    beforeEach(async () => {
      // Create a target
      const targetRes = await request(app)
        .post('/api/targets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'DAILY',
          name: 'Test Target',
          startBalance: 10000,
          targetBalance: 15000,
          dailyPercent: 2
        });

      targetId = targetRes.body.id;
    });

    it('should create daily log entry', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const res = await request(app)
        .post('/api/targets/daily-log')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetId,
          date: today.toISOString()
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.targetId).toBe(targetId);
    });

    it('should set isAchieved = true if pnl >= dailyTarget', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create a winning trade (2% of 10000 = 200, so we need >= 200)
      await seedTrades(userId, [
        {
          openTime: today,
          pair: 'BTCUSDT',
          direction: 'LONG',
          entryPrice: 50000,
          exitPrice: 51000,
          margin: 1000,
          pnl: 250, // More than 200
          pnlPercent: 25
        }
      ]);

      const res = await request(app)
        .post('/api/targets/daily-log')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetId,
          date: today.toISOString()
        });

      expect(res.status).toBe(201);
      expect(res.body.isAchieved).toBe(true);
      expect(res.body.actualPnl).toBe(250);
      expect(res.body.targetAmount).toBe(200); // 2% of 10000
    });

    it('should set isAchieved = false if pnl < dailyTarget', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create a trade with less than target (2% of 10000 = 200)
      await seedTrades(userId, [
        {
          openTime: today,
          pair: 'BTCUSDT',
          direction: 'LONG',
          entryPrice: 50000,
          exitPrice: 50500,
          margin: 1000,
          pnl: 100, // Less than 200
          pnlPercent: 10
        }
      ]);

      const res = await request(app)
        .post('/api/targets/daily-log')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetId,
          date: today.toISOString()
        });

      expect(res.status).toBe(201);
      expect(res.body.isAchieved).toBe(false);
      expect(res.body.actualPnl).toBe(100);
      expect(res.body.targetAmount).toBe(200);
    });

    it('should return 404 if target not found', async () => {
      const res = await request(app)
        .post('/api/targets/daily-log')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetId: 'invalid-id',
          date: new Date().toISOString()
        });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/targets/projection', () => {
    it('should return compound projection array', async () => {
      const res = await request(app)
        .get('/api/targets/projection')
        .set('Authorization', `Bearer ${token}`)
        .query({
          startBalance: 10000,
          dailyPercent: 2,
          days: 5
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('startBalance');
      expect(res.body).toHaveProperty('endBalance');
      expect(res.body).toHaveProperty('projection');
      expect(Array.isArray(res.body.projection)).toBe(true);
      expect(res.body.projection.length).toBe(5);
    });

    it('should show projection increases over time', async () => {
      const res = await request(app)
        .get('/api/targets/projection')
        .set('Authorization', `Bearer ${token}`)
        .query({
          startBalance: 10000,
          dailyPercent: 2,
          days: 3
        });

      expect(res.status).toBe(200);
      const projection = res.body.projection;
      
      // Day 1: 10000 + 200 = 10200
      expect(projection[0].accumulatedBalance).toBeCloseTo(10200, 2);
      
      // Day 2: 10200 + 204 = 10404
      expect(projection[1].accumulatedBalance).toBeCloseTo(10404, 2);
      
      // Day 3: 10404 + 208.08 = 10612.08
      expect(projection[2].accumulatedBalance).toBeCloseTo(10612.08, 2);
      
      // Verify increasing trend
      expect(projection[1].accumulatedBalance).toBeGreaterThan(projection[0].accumulatedBalance);
      expect(projection[2].accumulatedBalance).toBeGreaterThan(projection[1].accumulatedBalance);
    });

    it('should return 400 if required params missing', async () => {
      const res = await request(app)
        .get('/api/targets/projection')
        .set('Authorization', `Bearer ${token}`)
        .query({
          startBalance: 10000
          // Missing dailyPercent and days
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
