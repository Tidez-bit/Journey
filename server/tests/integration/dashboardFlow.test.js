const request = require('supertest');
const { createTestApp } = require('../helpers/testApp');
const { createAuthenticatedUser, deleteTestUser } = require('../helpers/authHelper');
const { clearUserData } = require('../helpers/dbHelper');

const app = createTestApp();

describe('Integration: Dashboard Stats Accuracy', () => {
  let user, token, userId;

  beforeAll(async () => {
    const auth = await createAuthenticatedUser({ email: 'dashboard-flow@example.com' });
    user = auth.user;
    token = auth.token;
    userId = user.id;
  });

  afterAll(async () => {
    await deleteTestUser(userId);
  });

  it('Step 1: Start with fresh user, balance = 0', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.currentBalance).toBe(0);
    expect(res.body.totalTrades).toBe(0);
  });

  it('Step 2: Create DEPOSIT transaction of 10000', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'DEPOSIT',
        amount: 10000,
        date: new Date().toISOString(),
        notes: 'Initial deposit'
      });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(10000);
  });

  it('Step 3: Create 2 winning trades (pnl: 500, 300)', async () => {
    // Trade 1: +$500
    const res1 = await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        openTime: new Date().toISOString(),
        pair: 'BTCUSDT',
        direction: 'LONG',
        entryPrice: 50000,
        exitPrice: 51000,
        margin: 2000,
        pnl: 500
      });
    expect(res1.status).toBe(201);

    // Trade 2: +$300
    const res2 = await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        openTime: new Date().toISOString(),
        pair: 'ETHUSDT',
        direction: 'LONG',
        entryPrice: 3000,
        exitPrice: 3100,
        margin: 1500,
        pnl: 300
      });
    expect(res2.status).toBe(201);
  });

  it('Step 4: Create 1 losing trade (pnl: -200)', async () => {
    const res = await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        openTime: new Date().toISOString(),
        pair: 'BNBUSDT',
        direction: 'SHORT',
        entryPrice: 400,
        exitPrice: 410,
        margin: 1000,
        pnl: -200
      });
    expect(res.status).toBe(201);
  });

  it('Step 5: GET /api/dashboard/stats and assert all values', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Assert totalTrades = 3
    expect(res.body.totalTrades).toBe(3);

    // Assert winRate = 66.67% (2/3)
    expect(res.body.winRate).toBeCloseTo(66.67, 1);

    // Assert totalPnL = 600 (500+300-200)
    expect(res.body.totalPnL).toBe(600);

    // Assert currentBalance = 10600 (10000+600)
    expect(res.body.currentBalance).toBe(10600);

    // Assert bestTrade = 500
    expect(res.body.bestTrade).toBe(500);
  });
});
