/**
 * Example: Password Reset Flow E2E Tests
 *
 * Comprehensive tests for password reset including:
 * - Forgot password request
 * - Email/SMS verification
 * - Password update
 * - Security questions
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Password Reset - Request Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('forgot-password-link')).tap();
  });

  it('should display forgot password screen', async () => {
    await waitFor(element(by.id('forgot-password-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('forgot-password-title'))).toBeVisible();
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('send-reset-link-button'))).toBeVisible();
    await expect(element(by.id('back-to-login-link'))).toBeVisible();
  });

  it('should validate email format', async () => {
    await waitFor(element(by.id('forgot-password-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('email-input')).typeText('invalid-email');
    await element(by.id('send-reset-link-button')).tap();

    await expect(element(by.id('email-error'))).toBeVisible();
  });

  it('should send password reset link for valid email', async () => {
    await waitFor(element(by.id('forgot-password-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('send-reset-link-button')).tap();

    await waitFor(element(by.id('reset-link-sent-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('check-email-message'))).toBeVisible();
  });

  it('should handle unregistered email gracefully', async () => {
    await waitFor(element(by.id('forgot-password-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('email-input')).typeText('unknown@example.com');
    await element(by.id('send-reset-link-button')).tap();

    // Should still show success (security best practice)
    await waitFor(element(by.id('reset-link-sent-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should navigate back to login', async () => {
    await waitFor(element(by.id('forgot-password-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('back-to-login-link')).tap();

    await expect(element(by.id('login-screen'))).toBeVisible();
  });
});

describe('Password Reset - Verification', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      url: 'myapp://reset-password?token=valid-token'
    });
  });

  it('should display reset password form from deep link', async () => {
    await waitFor(element(by.id('reset-password-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('new-password-input'))).toBeVisible();
    await expect(element(by.id('confirm-new-password-input'))).toBeVisible();
    await expect(element(by.id('reset-password-button'))).toBeVisible();
  });

  it('should validate password requirements', async () => {
    await waitFor(element(by.id('reset-password-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('new-password-input')).typeText('weak');
    await element(by.id('new-password-input')).tapReturnKey();

    await expect(element(by.id('password-requirements-list'))).toBeVisible();
    await expect(element(by.id('requirement-length-unmet'))).toBeVisible();
    await expect(element(by.id('requirement-uppercase-unmet'))).toBeVisible();
    await expect(element(by.id('requirement-number-unmet'))).toBeVisible();
  });

  it('should validate password confirmation', async () => {
    await waitFor(element(by.id('reset-password-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('new-password-input')).typeText('NewSecurePass123!');
    await element(by.id('confirm-new-password-input')).typeText('DifferentPass');
    await element(by.id('reset-password-button')).tap();

    await expect(element(by.id('password-mismatch-error'))).toBeVisible();
  });

  it('should successfully reset password', async () => {
    await waitFor(element(by.id('reset-password-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('new-password-input')).typeText('NewSecurePass123!');
    await element(by.id('confirm-new-password-input')).typeText('NewSecurePass123!');
    await element(by.id('reset-password-button')).tap();

    await waitFor(element(by.id('password-reset-success-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('login-with-new-password-button'))).toBeVisible();
  });
});

describe('Password Reset - Expired Token', () => {
  it('should handle expired reset token', async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      url: 'myapp://reset-password?token=expired-token'
    });

    await waitFor(element(by.id('token-expired-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('token-expired-message'))).toBeVisible();
    await expect(element(by.id('request-new-link-button'))).toBeVisible();
  });

  it('should allow requesting new reset link', async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      url: 'myapp://reset-password?token=expired-token'
    });

    await waitFor(element(by.id('token-expired-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('request-new-link-button')).tap();

    await expect(element(by.id('forgot-password-screen'))).toBeVisible();
  });
});

describe('Password Reset - Security Questions', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('forgot-password-link')).tap();
    await waitFor(element(by.id('forgot-password-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('reset-via-security-questions-link')).tap();
  });

  it('should display security questions', async () => {
    await waitFor(element(by.id('security-questions-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('security-question-1'))).toBeVisible();
    await expect(element(by.id('security-answer-1-input'))).toBeVisible();
  });

  it('should validate security answers', async () => {
    await waitFor(element(by.id('security-questions-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('security-answer-1-input')).typeText('Wrong Answer');
    await element(by.id('verify-answers-button')).tap();

    await expect(element(by.id('incorrect-answer-error'))).toBeVisible();
  });

  it('should proceed after correct answers', async () => {
    await waitFor(element(by.id('security-questions-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('security-answer-1-input')).typeText('Fluffy');
    await element(by.id('security-answer-2-input')).typeText('Springfield');
    await element(by.id('verify-answers-button')).tap();

    await waitFor(element(by.id('reset-password-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
