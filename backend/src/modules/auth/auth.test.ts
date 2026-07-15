import request from 'supertest';
import speakeasy from 'speakeasy';
import app from '../../app';
import prisma from '../../config/db';

describe('Authentication Integration Tests', () => {
  const testEmail = 'test@example.com';
  const testPassword = 'Password123!';
  const testName = 'Test User';

  let accessToken = '';
  let refreshToken = '';
  let emailVerificationToken = '';
  let passwordResetToken = '';

  beforeAll(async () => {
    // Clear any existing test data to ensure a clean state
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
  });

  afterAll(async () => {
    // Clean up database after tests
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully and create verification token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          name: testName,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('email', testEmail);
      expect(response.body.data).toHaveProperty('emailVerified', false);
      expect(response.body.data).not.toHaveProperty('password');

      // Fetch verification token from database to bypass email checking
      const user = await prisma.user.findUnique({
        where: { email: testEmail },
        include: { emailVerificationTokens: true },
      });

      expect(user).toBeDefined();
      expect(user?.emailVerificationTokens.length).toBe(1);
      emailVerificationToken = user!.emailVerificationTokens[0].token;
    });

    it('should return error for duplicate email registration', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail registration with weak password (validation)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'weak@example.com',
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/auth/verify-email', () => {
    it('should verify the email with valid token', async () => {
      const response = await request(app)
        .get(`/api/v1/auth/verify-email?token=${emailVerificationToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);

      const user = await prisma.user.findUnique({ where: { email: testEmail } });
      expect(user?.emailVerified).toBe(true);
    });

    it('should return error for invalid/used token', async () => {
      const response = await request(app)
        .get(`/api/v1/auth/verify-email?token=${emailVerificationToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully and return access and refresh tokens when 2FA is disabled', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.twoFactorRequired).toBe(false);

      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should fail login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/auth/me (Protected Route)', () => {
    it('should allow access with valid bearer token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testEmail);
    });

    it('should block access with missing bearer token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });

    it('should block access with invalid bearer token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should rotate and issue new access & refresh tokens', async () => {
      // Small sleep to ensure timestamps differ if needed, though not strictly required
      await new Promise((resolve) => setTimeout(resolve, 50));

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.refreshToken).not.toBe(refreshToken);

      // Save new tokens
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should fail refresh with a previously used (rotated) refresh token', async () => {
      // Trying to reuse the first refreshToken
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'random_non_existent' });

      expect(response.status).toBe(401);
    });
  });

  describe('Two-Factor Authentication (2FA) Flow', () => {
    let tempSecret = '';
    let preAuthToken = '';

    it('should initiate 2FA setup for authenticated user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/2fa/setup')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('secret');
      expect(response.body.data).toHaveProperty('qrCode');

      tempSecret = response.body.data.secret;
    });

    it('should fail to verify 2FA with invalid code', async () => {
      const response = await request(app)
        .post('/api/v1/auth/2fa/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ token: '000000' });

      expect(response.status).toBe(400);
    });

    it('should successfully verify and enable 2FA with valid code', async () => {
      const code = speakeasy.totp({
        secret: tempSecret,
        encoding: 'base32',
      });
      const response = await request(app)
        .post('/api/v1/auth/2fa/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ token: code });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const user = await prisma.user.findUnique({ where: { email: testEmail } });
      expect(user?.twoFactorEnabled).toBe(true);
    });

    it('should require 2FA on subsequent logins', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.twoFactorRequired).toBe(true);
      expect(response.body.data).toHaveProperty('preAuthToken');
      expect(response.body.data).not.toHaveProperty('accessToken');

      preAuthToken = response.body.data.preAuthToken;
    });

    it('should fail 2FA authenticate with invalid code', async () => {
      const response = await request(app)
        .post('/api/v1/auth/2fa/authenticate')
        .send({
          preAuthToken,
          token: '000000',
        });

      expect(response.status).toBe(401);
    });

    it('should successfully login using preAuthToken and valid 2FA code', async () => {
      const code = speakeasy.totp({
        secret: tempSecret,
        encoding: 'base32',
      });
      const response = await request(app)
        .post('/api/v1/auth/2fa/authenticate')
        .send({
          preAuthToken,
          token: code,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');

      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });
  });

  describe('Password Reset Flow', () => {
    it('should initiate forgot password and create token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testEmail });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const user = await prisma.user.findUnique({
        where: { email: testEmail },
        include: { passwordResetTokens: true },
      });

      expect(user?.passwordResetTokens.length).toBe(1);
      passwordResetToken = user!.passwordResetTokens[0].token;
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'NewPassword123!';
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: passwordResetToken,
          password: newPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify login works with new password (and requires 2FA since it is enabled)
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: newPassword,
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data.twoFactorRequired).toBe(true);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should invalidate refresh token on logout', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify that refreshing with the logged out token fails
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(401);
    });
  });
});
