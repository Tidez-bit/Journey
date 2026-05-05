const request = require('supertest');
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { errorHandler } = require('../middleware/errorHandler');
const { createAuthenticatedUser, deleteTestUser } = require('./helpers/authHelper');

describe('Middleware Tests', () => {
  describe('authMiddleware', () => {
    let app;
    let user, token, userId;

    beforeAll(async () => {
      const auth = await createAuthenticatedUser();
      user = auth.user;
      token = auth.token;
      userId = user.id;

      // Create test app with protected route
      app = express();
      app.use(express.json());
      app.get('/protected', protect, (req, res) => {
        res.json({ success: true, userId: req.user.id });
      });
      app.use(errorHandler);
    });

    afterAll(async () => {
      await deleteTestUser(userId);
    });

    it('should return 401 without Authorization header', async () => {
      const res = await request(app)
        .get('/protected');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('token');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token-12345');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 200 with valid token', async () => {
      const res = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.userId).toBe(userId);
    });

    it('should return 401 with malformed Authorization header', async () => {
      const res = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('errorHandler', () => {
    let app;

    beforeAll(() => {
      app = express();
      app.use(express.json());

      // Route that throws error with custom statusCode
      app.get('/error-with-status', (req, res, next) => {
        const err = new Error('Custom error message');
        err.statusCode = 404;
        next(err);
      });

      // Route that throws generic error
      app.get('/error-generic', (req, res, next) => {
        next(new Error('Generic error'));
      });

      // Route that throws error without message
      app.get('/error-no-message', (req, res, next) => {
        const err = new Error();
        next(err);
      });

      app.use(errorHandler);
    });

    it('should return error in { success: false, message } format', async () => {
      const res = await request(app)
        .get('/error-with-status');

      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('message');
      expect(res.body.success).toBe(false);
      expect(typeof res.body.message).toBe('string');
    });

    it('should use statusCode from err.statusCode', async () => {
      const res = await request(app)
        .get('/error-with-status');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Custom error message');
    });

    it('should default to 500 if no statusCode provided', async () => {
      const res = await request(app)
        .get('/error-generic');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it('should handle errors without message', async () => {
      const res = await request(app)
        .get('/error-no-message');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('Rate Limiter', () => {
    // Note: Rate limiter is disabled in test environment
    // This test documents expected behavior in production

    it('should document rate limiter behavior', () => {
      // In production:
      // - General endpoints: 200 req/15min
      // - Auth endpoints: 10 req/15min
      // - Returns 429 after limit exceeded
      
      expect(true).toBe(true); // Placeholder
      
      // To test rate limiter in production:
      // 1. Enable rate limiter in testApp.js
      // 2. Make 11 requests to /api/auth/login
      // 3. Expect 11th request to return 429
    });
  });
});
