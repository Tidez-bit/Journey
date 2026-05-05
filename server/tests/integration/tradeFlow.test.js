const request = require('supertest');
const { createTestApp } = require('../helpers/testApp');
const { deleteTestUserByEmail } = require('../helpers/authHelper');

const app = createTestApp();

describe('Integration: Complete Trade Lifecycle', () => {
  const testEmail = 'integration-trade@example.com';
  const testPassword = 'Test123!@#';
  let token;
  let userId;
  let tradeId;

  afterAll(async () => {
    await deleteTestUserByEmail(testEmail);
  });

  it('Step 1: Register new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        name: 'Integration Test User'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    
    token = res.body.token;
    userId = res.body.user.id;
  });

  it('Step 2: Login and get token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    
    token = res.body.token; // Update token
  });

  it('Step 3: Create trade with margin', async () => {
    const res = await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        openTime: new Date().toISOString(),
        closeTime: new Date().toISOString(),
        pair: 'BTCUSDT',
        direction: 'LONG',
        entryPrice: 50000,
        exitPrice: 51000,
        positionSize: 0.1,
        margin: 1000,
        pnl: 100,
        notes: 'Integration test trade'
      });

    expect(res.status).toBe(201);
    expect(res.body.pnl).toBe(100);
    expect(res.body.margin).toBe(1000);
    
    tradeId = res.body.id;
  });

  it('Step 4: Verify pnlPercent calculated correctly', async () => {
    const res = await request(app)
      .get(`/api/trades/${tradeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pnlPercent).toBe(10); // 100/1000*100 = 10%
  });

  it('Step 5: Update trade', async () => {
    const res = await request(app)
      .put(`/api/trades/${tradeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        pnl: 150,
        notes: 'Updated in integration test'
      });

    expect(res.status).toBe(200);
    expect(res.body.pnl).toBe(150);
    expect(res.body.pnlPercent).toBe(15); // 150/1000*100 = 15%
    expect(res.body.notes).toBe('Updated in integration test');
  });

  it('Step 6: Verify update persisted', async () => {
    const res = await request(app)
      .get(`/api/trades/${tradeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pnl).toBe(150);
    expect(res.body.notes).toBe('Updated in integration test');
  });

  it('Step 7: Delete trade', async () => {
    const res = await request(app)
      .delete(`/api/trades/${tradeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Step 8: Verify trade no longer exists', async () => {
    const res = await request(app)
      .get(`/api/trades/${tradeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('Step 9: Get all trades - should be empty after deletion', async () => {
    const res = await request(app)
      .get('/api/trades')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('Step 10: Verify another user cannot delete first user\'s trade', async () => {
    // Create a new trade for first user
    const createRes = await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        openTime: new Date().toISOString(),
        pair: 'ETHUSDT',
        direction: 'LONG',
        entryPrice: 3000,
        exitPrice: 3100,
        margin: 500,
        pnl: 50
      });

    expect(createRes.status).toBe(201);
    const newTradeId = createRes.body.id;

    // Register second user
    const user2Email = 'integration-trade-2@example.com';
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: user2Email,
        password: testPassword,
        name: 'Second User'
      });

    expect(registerRes.status).toBe(201);
    const token2 = registerRes.body.token;

    // Try to delete first user's trade with second user's token
    const deleteRes = await request(app)
      .delete(`/api/trades/${newTradeId}`)
      .set('Authorization', `Bearer ${token2}`);

    // Should return 404 (trade not found for this user) or 403 (forbidden)
    expect([403, 404]).toContain(deleteRes.status);

    // Verify trade still exists for first user
    const getRes = await request(app)
      .get(`/api/trades/${newTradeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(newTradeId);

    // Cleanup second user
    await deleteTestUserByEmail(user2Email);
  });
});
