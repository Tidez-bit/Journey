const request = require('supertest');
const { createTestApp } = require('./helpers/testApp');
const { createAuthenticatedUser, deleteTestUser } = require('./helpers/authHelper');
const { seedTransactions, clearUserData } = require('./helpers/dbHelper');

const app = createTestApp();

describe('Transaction API', () => {
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

  describe('POST /api/transactions', () => {
    it('should create DEPOSIT transaction with 201', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'DEPOSIT',
          amount: 1000,
          date: new Date().toISOString(),
          notes: 'Initial deposit'
        });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('DEPOSIT');
      expect(res.body.amount).toBe(1000);
    });

    it('should create WITHDRAW transaction with 201', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'WITHDRAW',
          amount: 500,
          date: new Date().toISOString(),
          notes: 'Withdrawal'
        });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('WITHDRAW');
      expect(res.body.amount).toBe(500);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'DEPOSIT'
          // Missing amount
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/transactions', () => {
    beforeEach(async () => {
      await seedTransactions(userId, [
        { type: 'DEPOSIT', amount: 1000 },
        { type: 'WITHDRAW', amount: 200 },
        { type: 'DEPOSIT', amount: 500 }
      ]);
    });

    it('should return array of transactions', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/transactions');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    let transactionId;

    beforeEach(async () => {
      const transactions = await seedTransactions(userId, [
        { type: 'DEPOSIT', amount: 1000, notes: 'Original' }
      ]);
      transactionId = transactions[0].id;
    });

    it('should update transaction successfully', async () => {
      const res = await request(app)
        .put(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 1500,
          notes: 'Updated'
        });

      expect(res.status).toBe(200);
      expect(res.body.amount).toBe(1500);
      expect(res.body.notes).toBe('Updated');
    });

    it('should return 404 if transaction does not exist', async () => {
      const res = await request(app)
        .put('/api/transactions/99999999')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 1500 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    let transactionId;

    beforeEach(async () => {
      const transactions = await seedTransactions(userId, [
        { type: 'DEPOSIT', amount: 1000 }
      ]);
      transactionId = transactions[0].id;
    });

    it('should delete transaction successfully', async () => {
      const res = await request(app)
        .delete(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 if transaction does not exist', async () => {
      const res = await request(app)
        .delete('/api/transactions/99999999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
