const request = require('supertest');
const { createTestApp } = require('./helpers/testApp');
const { createAuthenticatedUser, deleteTestUser } = require('./helpers/authHelper');
const { seedTrades, clearUserData } = require('./helpers/dbHelper');

const app = createTestApp();

describe('Trade API', () => {
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

  describe('POST /api/trades', () => {
    it('should create trade with complete data and return 201', async () => {
      const tradeData = {
        openTime: new Date().toISOString(),
        closeTime: new Date().toISOString(),
        pair: 'BTCUSDT',
        direction: 'LONG',
        entryPrice: 50000,
        exitPrice: 51000,
        positionSize: 0.1,
        margin: 1000,
        pnl: 100,
        slPrice: 49000,
        tpPrice: 52000,
        notes: 'Test trade'
      };

      const res = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${token}`)
        .send(tradeData);

      expect(res.status).toBe(201);
      expect(res.body.pair).toBe('BTCUSDT');
      expect(res.body.direction).toBe('LONG');
      expect(res.body.pnl).toBe(100);
    });

    it('should calculate pnlPercent = pnl/margin*100', async () => {
      const tradeData = {
        openTime: new Date().toISOString(),
        pair: 'ETHUSDT',
        direction: 'SHORT',
        entryPrice: 3000,
        exitPrice: 2900,
        positionSize: 1,
        margin: 500,
        pnl: 100
      };

      const res = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${token}`)
        .send(tradeData);

      expect(res.status).toBe(201);
      expect(res.body.pnlPercent).toBe(20); // 100/500*100 = 20%
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${token}`)
        .send({
          pair: 'BTCUSDT'
          // Missing required fields
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/trades')
        .send({
          pair: 'BTCUSDT',
          direction: 'LONG',
          entryPrice: 50000
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/trades', () => {
    beforeEach(async () => {
      // Seed some trades
      await seedTrades(userId, [
        { pair: 'BTCUSDT', direction: 'LONG', pnl: 100, margin: 1000, pnlPercent: 10 },
        { pair: 'ETHUSDT', direction: 'SHORT', pnl: -50, margin: 500, pnlPercent: -10 },
        { pair: 'BTCUSDT', direction: 'LONG', pnl: 200, margin: 1000, pnlPercent: 20 }
      ]);
    });

    it('should return array of trades', async () => {
      const res = await request(app)
        .get('/api/trades')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);
    });

    it('should filter trades by pair', async () => {
      const res = await request(app)
        .get('/api/trades?pair=ETHUSDT')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].pair).toBe('ETHUSDT');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/trades');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/trades/:id', () => {
    let tradeId;

    beforeEach(async () => {
      const trades = await seedTrades(userId, [
        { pair: 'BTCUSDT', direction: 'LONG', pnl: 100, margin: 1000, pnlPercent: 10 }
      ]);
      tradeId = trades[0].id;
    });

    it('should return single trade by ID', async () => {
      const res = await request(app)
        .get(`/api/trades/${tradeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(tradeId);
      expect(res.body.pair).toBe('BTCUSDT');
    });

    it('should return 404 if trade does not exist', async () => {
      const res = await request(app)
        .get('/api/trades/99999999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/trades/:id', () => {
    let tradeId;

    beforeEach(async () => {
      const trades = await seedTrades(userId, [
        { pair: 'BTCUSDT', direction: 'LONG', pnl: 100, margin: 1000, pnlPercent: 10 }
      ]);
      tradeId = trades[0].id;
    });

    it('should update trade successfully', async () => {
      const res = await request(app)
        .put(`/api/trades/${tradeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          notes: 'Updated notes',
          pnl: 150
        });

      expect(res.status).toBe(200);
      expect(res.body.notes).toBe('Updated notes');
      expect(res.body.pnl).toBe(150);
    });

    it('should preserve pnlPercent if margin not sent', async () => {
      const res = await request(app)
        .put(`/api/trades/${tradeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          pnl: 150
          // Not sending margin
        });

      expect(res.status).toBe(200);
      expect(res.body.pnlPercent).toBe(15); // 150/1000*100 = 15%
    });

    it('should return 404 if trade does not exist', async () => {
      const res = await request(app)
        .put('/api/trades/99999999')
        .set('Authorization', `Bearer ${token}`)
        .send({ notes: 'Test' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/trades/:id', () => {
    let tradeId;
    let otherUserId, otherToken;

    beforeEach(async () => {
      const trades = await seedTrades(userId, [
        { pair: 'BTCUSDT', direction: 'LONG', pnl: 100, margin: 1000, pnlPercent: 10 }
      ]);
      tradeId = trades[0].id;

      // Create another user
      const otherAuth = await createAuthenticatedUser({ email: 'other@example.com' });
      otherUserId = otherAuth.user.id;
      otherToken = otherAuth.token;
    });

    afterEach(async () => {
      if (otherUserId) {
        await deleteTestUser(otherUserId);
      }
    });

    it('should delete trade successfully', async () => {
      const res = await request(app)
        .delete(`/api/trades/${tradeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify trade is deleted
      const getRes = await request(app)
        .get(`/api/trades/${tradeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.status).toBe(404);
    });

    it('should return 404 if trade does not exist', async () => {
      const res = await request(app)
        .delete('/api/trades/99999999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should not allow deleting another user\'s trade', async () => {
      const res = await request(app)
        .delete(`/api/trades/${tradeId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(404); // Trade not found for this user
    });
  });
});
