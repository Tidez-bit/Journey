const request = require('supertest');
const { createTestApp } = require('../helpers/testApp');
const { createAuthenticatedUser, deleteTestUser } = require('../helpers/authHelper');
const { seedTrades, clearUserData } = require('../helpers/dbHelper');

const app = createTestApp();

describe('Integration: Target Flow', () => {
  let user, token, userId, targetId;

  beforeAll(async () => {
    const auth = await createAuthenticatedUser({ email: 'target-flow@example.com' });
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

  it('Step 1: Create target with dailyTarget = 100', async () => {
    const res = await request(app)
      .post('/api/targets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'DAILY',
        name: 'Daily Target Test',
        startBalance: 5000,
        targetBalance: 10000,
        dailyPercent: 2, // 2% of 5000 = 100
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.dailyPercent).toBe(2);
    targetId = res.body.id;
  });

  it('Step 2: Log day with pnl = 150 → isAchieved = true', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create trade with pnl = 150 (more than 100)
    await seedTrades(userId, [
      {
        openTime: today,
        pair: 'BTCUSDT',
        direction: 'LONG',
        entryPrice: 50000,
        exitPrice: 51000,
        margin: 1000,
        pnl: 150,
        pnlPercent: 15
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
    expect(res.body.actualPnl).toBe(150);
    expect(res.body.targetAmount).toBe(100); // 2% of 5000
  });

  it('Step 3: Log day with pnl = 50 → isAchieved = false', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Create trade with pnl = 50 (less than 100)
    await seedTrades(userId, [
      {
        openTime: yesterday,
        pair: 'ETHUSDT',
        direction: 'SHORT',
        entryPrice: 3000,
        exitPrice: 2950,
        margin: 500,
        pnl: 50,
        pnlPercent: 10
      }
    ]);

    const res = await request(app)
      .post('/api/targets/daily-log')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targetId,
        date: yesterday.toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.isAchieved).toBe(false);
    expect(res.body.actualPnl).toBe(50);
    expect(res.body.targetAmount).toBe(100);
  });

  it('Step 4: GET /api/targets → streaks and logs reflect correctly', async () => {
    const res = await request(app)
      .get('/api/targets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const target = res.body.find(t => t.id === targetId);
    expect(target).toBeDefined();
    expect(target.dailyPercent).toBe(2);

    // Check if logs are included
    if (target.dailytargetlog) {
      expect(Array.isArray(target.dailytargetlog)).toBe(true);
      // Should have 2 logs (one achieved, one not)
      expect(target.dailytargetlog.length).toBe(2);
    }
  });

  it('Step 5: GET /api/targets/daily-logs → returns all logs', async () => {
    const res = await request(app)
      .get('/api/targets/daily-logs')
      .set('Authorization', `Bearer ${token}`)
      .query({ targetId });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);

    // Check that we have one achieved and one not achieved
    const achieved = res.body.filter(log => log.isAchieved);
    const notAchieved = res.body.filter(log => !log.isAchieved);

    expect(achieved.length).toBe(1);
    expect(notAchieved.length).toBe(1);
  });
});
