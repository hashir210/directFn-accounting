import request from 'supertest';
import speakeasy from 'speakeasy';

// Mock the mailer so we can capture the raw (un-hashed) verification/reset
// tokens. In the DB these tokens are stored hashed, so reading them back from
// Prisma is no longer possible — the raw value only exists at send time.
jest.mock('../../utils/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

import app from '../../app';
import prisma from '../../config/db';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../utils/mailer';

// Extracts the raw refreshToken value from a Set-Cookie response header.
function extractRefreshToken(res: request.Response): string | undefined {
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) return undefined;
  const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const c of arr) {
    const match = /refreshToken=([^;]+)/.exec(c);
    if (match) return decodeURIComponent(match[1]);
  }
  return undefined;
}

describe('Authentication Integration Tests', () => {
  const testEmail = 'test@example.com';
  const testPassword = 'Password123!';
  const testName = 'Test User';

  // Cookie-persisting agent so the httpOnly refresh-token cookie flows between
  // requests (the refresh token is no longer returned in response bodies).
  const agent = request.agent(app);

  let accessToken = '';
  let currentRefreshToken = ''; // raw value pulled from the Set-Cookie header
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

      // Grab the raw verification token from the mocked mailer call
      const calls = (sendVerificationEmail as jest.Mock).mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0]).toBe(testEmail);
      emailVerificationToken = calls[0][1];
      expect(emailVerificationToken).toBeTruthy();

      // Exactly one (hashed) verification token should exist in the DB
      const user = await prisma.user.findUnique({
        where: { email: testEmail },
        include: { emailVerificationTokens: true },
      });
      expect(user?.emailVerificationTokens.length).toBe(1);
      // The stored token must NOT equal the raw token (it is hashed)
      expect(user?.emailVerificationTokens[0].token).not.toBe(emailVerificationToken);
    });

    it('should default new users to the staff role (no privilege escalation)', async () => {
      const user = await prisma.user.findUnique({ where: { email: testEmail } });
      expect(user?.role).toBe('staff');
    });

    it('should ignore a client-supplied role and still create a staff user', async () => {
      const escalationEmail = 'escalate@example.com';
      await prisma.user.deleteMany({ where: { email: escalationEmail } });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: escalationEmail,
          password: testPassword,
          role: 'admin',
        });

      expect(response.status).toBe(201);
      const user = await prisma.user.findUnique({ where: { email: escalationEmail } });
      expect(user?.role).toBe('staff');

      await prisma.user.deleteMany({ where: { email: escalationEmail } });
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
    it('should login successfully and return access token (no refresh token in body) when 2FA is disabled', async () => {
      const response = await agent
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      // Refresh token must NOT be exposed in the response body
      expect(response.body.data).not.toHaveProperty('refreshToken');
      expect(response.body.data.twoFactorRequired).toBe(false);

      // It must be delivered via an httpOnly cookie instead
      const rawRefresh = extractRefreshToken(response);
      expect(rawRefresh).toBeTruthy();

      accessToken = response.body.data.accessToken;
      currentRefreshToken = rawRefresh as string;
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
    it('should rotate and issue a new access token using the refresh cookie', async () => {
      // Small sleep to ensure timestamps differ if needed, though not strictly required
      await new Promise((resolve) => setTimeout(resolve, 50));

      const response = await agent.post('/api/v1/auth/refresh');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).not.toHaveProperty('refreshToken');

      // A new refresh cookie should be issued (rotation)
      const rotated = extractRefreshToken(response);
      expect(rotated).toBeTruthy();
      expect(rotated).not.toBe(currentRefreshToken);

      accessToken = response.body.data.accessToken;
      currentRefreshToken = rotated as string;
    });

    it('should fail refresh with an unknown refresh token', async () => {
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

    it('should NOT accept a pre-auth token as a bearer access token (2FA bypass prevention)', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${preAuthToken}`);

      expect(response.status).toBe(401);
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
      const response = await agent
        .post('/api/v1/auth/2fa/authenticate')
        .send({
          preAuthToken,
          token: code,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).not.toHaveProperty('refreshToken');

      const rawRefresh = extractRefreshToken(response);
      expect(rawRefresh).toBeTruthy();

      accessToken = response.body.data.accessToken;
      currentRefreshToken = rawRefresh as string;
    });
  });

  describe('Password Reset Flow', () => {
    it('should initiate forgot password and create token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testEmail });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const calls = (sendPasswordResetEmail as jest.Mock).mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0]).toBe(testEmail);
      passwordResetToken = calls[0][1];
      expect(passwordResetToken).toBeTruthy();

      const user = await prisma.user.findUnique({
        where: { email: testEmail },
        include: { passwordResetTokens: true },
      });
      expect(user?.passwordResetTokens.length).toBe(1);
      // The stored reset token must be hashed, not the raw value
      expect(user?.passwordResetTokens[0].token).not.toBe(passwordResetToken);
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
      const revokedToken = currentRefreshToken;

      const response = await agent.post('/api/v1/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify that refreshing with the logged out (revoked) token fails
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: revokedToken });

      expect(refreshResponse.status).toBe(401);
    });
  });
});
