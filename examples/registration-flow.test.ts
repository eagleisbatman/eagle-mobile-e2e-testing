/**
 * Example: User Registration Flow E2E Tests
 *
 * Comprehensive tests for registration including:
 * - Email/password registration
 * - Social sign-up (Google, Apple, Facebook)
 * - Form validation
 * - Terms acceptance
 * - Email verification
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Registration - Email Sign Up', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-create-account-button')).tap();
  });

  it('should display registration form with all required fields', async () => {
    await waitFor(element(by.id('registration-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('first-name-input'))).toBeVisible();
    await expect(element(by.id('last-name-input'))).toBeVisible();
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
    await expect(element(by.id('confirm-password-input'))).toBeVisible();
    await expect(element(by.id('terms-checkbox'))).toBeVisible();
    await expect(element(by.id('register-button'))).toBeVisible();
  });

  it('should validate email format', async () => {
    await waitFor(element(by.id('registration-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('email-input')).typeText('invalid-email');
    await element(by.id('email-input')).tapReturnKey();

    await expect(element(by.id('email-error'))).toBeVisible();
    await expect(element(by.id('email-error'))).toHaveText('Please enter a valid email address');
  });

  it('should validate password strength', async () => {
    await waitFor(element(by.id('registration-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('password-input')).typeText('weak');

    await expect(element(by.id('password-strength-indicator'))).toBeVisible();
    await expect(element(by.id('password-strength-weak'))).toBeVisible();

    await element(by.id('password-input')).clearText();
    await element(by.id('password-input')).typeText('StrongP@ss123');

    await expect(element(by.id('password-strength-strong'))).toBeVisible();
  });

  it('should validate password confirmation match', async () => {
    await waitFor(element(by.id('registration-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('confirm-password-input')).typeText('DifferentPassword');
    await element(by.id('confirm-password-input')).tapReturnKey();

    await expect(element(by.id('confirm-password-error'))).toBeVisible();
    await expect(element(by.id('confirm-password-error'))).toHaveText('Passwords do not match');
  });

  it('should require terms acceptance before registration', async () => {
    await waitFor(element(by.id('registration-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('first-name-input')).typeText('John');
    await element(by.id('last-name-input')).typeText('Doe');
    await element(by.id('email-input')).typeText('john.doe@example.com');
    await element(by.id('password-input')).typeText('SecurePass123!');
    await element(by.id('confirm-password-input')).typeText('SecurePass123!');

    // Try to register without accepting terms
    await element(by.id('register-button')).tap();

    await expect(element(by.id('terms-error'))).toBeVisible();
  });

  it('should complete registration successfully', async () => {
    await waitFor(element(by.id('registration-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('first-name-input')).typeText('Jane');
    await element(by.id('last-name-input')).typeText('Smith');
    await element(by.id('email-input')).typeText('jane.smith@example.com');
    await element(by.id('password-input')).typeText('SecurePass123!');
    await element(by.id('confirm-password-input')).typeText('SecurePass123!');
    await element(by.id('terms-checkbox')).tap();
    await element(by.id('register-button')).tap();

    // Should show email verification screen
    await waitFor(element(by.id('email-verification-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('verification-email-sent-message'))).toBeVisible();
  });
});

describe('Registration - Social Sign Up', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-create-account-button')).tap();
    await waitFor(element(by.id('registration-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should display social sign up options', async () => {
    await expect(element(by.id('google-signup-button'))).toBeVisible();
    await expect(element(by.id('apple-signup-button'))).toBeVisible();
    await expect(element(by.id('facebook-signup-button'))).toBeVisible();
  });

  it('should initiate Google sign up flow', async () => {
    await element(by.id('google-signup-button')).tap();

    // Google OAuth should open
    await waitFor(element(by.id('google-auth-webview')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should initiate Apple sign up flow', async () => {
    await element(by.id('apple-signup-button')).tap();

    // Apple Sign In should appear
    await waitFor(element(by.id('apple-auth-prompt')))
      .toBeVisible()
      .withTimeout(5000);
  });
});

describe('Registration - Email Verification', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Navigate to verification screen (after registration)
    await element(by.id('welcome-create-account-button')).tap();
    await waitFor(element(by.id('registration-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('first-name-input')).typeText('Test');
    await element(by.id('last-name-input')).typeText('User');
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('TestPass123!');
    await element(by.id('confirm-password-input')).typeText('TestPass123!');
    await element(by.id('terms-checkbox')).tap();
    await element(by.id('register-button')).tap();

    await waitFor(element(by.id('email-verification-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should display verification code input', async () => {
    await expect(element(by.id('verification-code-input'))).toBeVisible();
    await expect(element(by.id('verify-button'))).toBeVisible();
    await expect(element(by.id('resend-code-button'))).toBeVisible();
  });

  it('should allow entering verification code', async () => {
    await element(by.id('verification-code-input')).typeText('123456');

    await expect(element(by.id('verification-code-input'))).toHaveText('123456');
  });

  it('should handle invalid verification code', async () => {
    await element(by.id('verification-code-input')).typeText('000000');
    await element(by.id('verify-button')).tap();

    await waitFor(element(by.id('verification-error')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('verification-error'))).toHaveText('Invalid verification code');
  });

  it('should allow resending verification code', async () => {
    await element(by.id('resend-code-button')).tap();

    await expect(element(by.id('code-resent-toast'))).toBeVisible();
  });

  it('should show countdown timer for resend', async () => {
    await element(by.id('resend-code-button')).tap();

    await expect(element(by.id('resend-countdown'))).toBeVisible();
    await expect(element(by.id('resend-code-button'))).not.toBeVisible();
  });
});
