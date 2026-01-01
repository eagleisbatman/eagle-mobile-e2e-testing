/**
 * Example: Two-Factor Authentication E2E Tests
 *
 * Comprehensive tests for 2FA including:
 * - SMS verification
 * - Authenticator app (TOTP)
 * - Backup codes
 * - 2FA setup and management
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Two-Factor Auth - SMS Verification', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Login triggers 2FA
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('2fa-user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
  });

  it('should display SMS verification screen after login', async () => {
    await waitFor(element(by.id('sms-verification-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('verification-code-input'))).toBeVisible();
    await expect(element(by.id('verify-code-button'))).toBeVisible();
    await expect(element(by.id('resend-sms-button'))).toBeVisible();
    await expect(element(by.id('use-backup-code-link'))).toBeVisible();
  });

  it('should display masked phone number', async () => {
    await waitFor(element(by.id('sms-verification-screen'))).toBeVisible().withTimeout(10000);

    await expect(element(by.id('masked-phone-number'))).toBeVisible();
    // Should show something like "***-***-1234"
  });

  it('should validate 6-digit code format', async () => {
    await waitFor(element(by.id('sms-verification-screen'))).toBeVisible().withTimeout(10000);

    await element(by.id('verification-code-input')).typeText('123');
    await element(by.id('verify-code-button')).tap();

    await expect(element(by.id('code-format-error'))).toBeVisible();
  });

  it('should handle invalid verification code', async () => {
    await waitFor(element(by.id('sms-verification-screen'))).toBeVisible().withTimeout(10000);

    await element(by.id('verification-code-input')).typeText('000000');
    await element(by.id('verify-code-button')).tap();

    await waitFor(element(by.id('invalid-code-error')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should successfully verify and proceed to app', async () => {
    await waitFor(element(by.id('sms-verification-screen'))).toBeVisible().withTimeout(10000);

    await element(by.id('verification-code-input')).typeText('123456');
    await element(by.id('verify-code-button')).tap();

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should allow resending SMS code', async () => {
    await waitFor(element(by.id('sms-verification-screen'))).toBeVisible().withTimeout(10000);

    await element(by.id('resend-sms-button')).tap();

    await expect(element(by.id('code-resent-toast'))).toBeVisible();
  });

  it('should enforce rate limiting on resend', async () => {
    await waitFor(element(by.id('sms-verification-screen'))).toBeVisible().withTimeout(10000);

    await element(by.id('resend-sms-button')).tap();

    // Button should be disabled with countdown
    await expect(element(by.id('resend-countdown'))).toBeVisible();
  });
});

describe('Two-Factor Auth - Authenticator App', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('totp-user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
  });

  it('should display authenticator verification screen', async () => {
    await waitFor(element(by.id('authenticator-verification-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('totp-code-input'))).toBeVisible();
    await expect(element(by.id('verify-totp-button'))).toBeVisible();
  });

  it('should accept valid TOTP code', async () => {
    await waitFor(element(by.id('authenticator-verification-screen'))).toBeVisible().withTimeout(10000);

    await element(by.id('totp-code-input')).typeText('123456');
    await element(by.id('verify-totp-button')).tap();

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should handle expired TOTP code', async () => {
    await waitFor(element(by.id('authenticator-verification-screen'))).toBeVisible().withTimeout(10000);

    await element(by.id('totp-code-input')).typeText('999999');
    await element(by.id('verify-totp-button')).tap();

    await expect(element(by.id('code-expired-error'))).toBeVisible();
  });
});

describe('Two-Factor Auth - Backup Codes', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('2fa-user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('sms-verification-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('use-backup-code-link')).tap();
  });

  it('should display backup code entry screen', async () => {
    await waitFor(element(by.id('backup-code-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('backup-code-input'))).toBeVisible();
    await expect(element(by.id('verify-backup-code-button'))).toBeVisible();
  });

  it('should accept valid backup code', async () => {
    await waitFor(element(by.id('backup-code-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('backup-code-input')).typeText('ABCD-EFGH-1234');
    await element(by.id('verify-backup-code-button')).tap();

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should warn about used backup code', async () => {
    await waitFor(element(by.id('backup-code-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('backup-code-input')).typeText('USED-CODE-1234');
    await element(by.id('verify-backup-code-button')).tap();

    await expect(element(by.id('backup-code-used-error'))).toBeVisible();
  });
});

describe('Two-Factor Auth - Setup', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Login as user without 2FA
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('no2fa@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    // Navigate to security settings
    await element(by.id('nav-profile-tab')).tap();
    await element(by.id('security-settings-button')).tap();
  });

  it('should display 2FA setup option', async () => {
    await waitFor(element(by.id('security-settings-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('enable-2fa-button'))).toBeVisible();
  });

  it('should show 2FA method selection', async () => {
    await waitFor(element(by.id('security-settings-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('enable-2fa-button')).tap();

    await waitFor(element(by.id('2fa-method-selection-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('sms-method-option'))).toBeVisible();
    await expect(element(by.id('authenticator-method-option'))).toBeVisible();
  });

  it('should setup SMS-based 2FA', async () => {
    await waitFor(element(by.id('security-settings-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('enable-2fa-button')).tap();
    await waitFor(element(by.id('2fa-method-selection-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('sms-method-option')).tap();

    // Phone number entry
    await waitFor(element(by.id('phone-number-input'))).toBeVisible().withTimeout(5000);
    await element(by.id('phone-number-input')).typeText('+1234567890');
    await element(by.id('send-verification-button')).tap();

    // Verification code entry
    await waitFor(element(by.id('verify-phone-code-input'))).toBeVisible().withTimeout(5000);
    await element(by.id('verify-phone-code-input')).typeText('123456');
    await element(by.id('confirm-2fa-button')).tap();

    // Show backup codes
    await waitFor(element(by.id('backup-codes-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('backup-code-1'))).toBeVisible();
  });

  it('should setup authenticator app 2FA', async () => {
    await waitFor(element(by.id('security-settings-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('enable-2fa-button')).tap();
    await waitFor(element(by.id('2fa-method-selection-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('authenticator-method-option')).tap();

    // QR code screen
    await waitFor(element(by.id('authenticator-setup-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('qr-code-image'))).toBeVisible();
    await expect(element(by.id('manual-entry-key'))).toBeVisible();

    // Verification
    await element(by.id('totp-verification-input')).typeText('123456');
    await element(by.id('verify-authenticator-button')).tap();

    await waitFor(element(by.id('2fa-enabled-success'))).toBeVisible().withTimeout(5000);
  });
});
