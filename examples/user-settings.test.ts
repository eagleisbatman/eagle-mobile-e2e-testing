/**
 * Example: User Settings E2E Tests
 *
 * Tests for settings screens including:
 * - Profile settings
 * - Account management
 * - App preferences
 * - Data management
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('User Settings - Profile', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
  });

  it('should display settings menu', async () => {
    await expect(element(by.id('settings-screen'))).toBeVisible();
    await expect(element(by.id('settings-profile'))).toBeVisible();
    await expect(element(by.id('settings-account'))).toBeVisible();
    await expect(element(by.id('settings-privacy'))).toBeVisible();
  });

  it('should open profile settings', async () => {
    await element(by.id('settings-profile')).tap();
    await expect(element(by.id('profile-settings-screen'))).toBeVisible();
  });

  it('should edit display name', async () => {
    await element(by.id('settings-profile')).tap();
    await element(by.id('display-name-input')).clearText();
    await element(by.id('display-name-input')).typeText('New Name');
    await element(by.id('save-profile-button')).tap();

    await expect(element(by.id('profile-saved-toast'))).toBeVisible();
  });

  it('should change profile photo', async () => {
    await element(by.id('settings-profile')).tap();
    await element(by.id('change-photo-button')).tap();
    await expect(element(by.id('photo-options-sheet'))).toBeVisible();
  });
});

describe('User Settings - Account', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.id('settings-account')).tap();
  });

  it('should display account settings', async () => {
    await expect(element(by.id('account-settings-screen'))).toBeVisible();
    await expect(element(by.id('change-email-button'))).toBeVisible();
    await expect(element(by.id('change-password-button'))).toBeVisible();
  });

  it('should initiate email change', async () => {
    await element(by.id('change-email-button')).tap();
    await expect(element(by.id('change-email-screen'))).toBeVisible();
    await expect(element(by.id('new-email-input'))).toBeVisible();
  });

  it('should initiate password change', async () => {
    await element(by.id('change-password-button')).tap();
    await expect(element(by.id('change-password-screen'))).toBeVisible();
    await expect(element(by.id('current-password-input'))).toBeVisible();
    await expect(element(by.id('new-password-input'))).toBeVisible();
  });

  it('should show linked accounts', async () => {
    await element(by.id('linked-accounts-button')).tap();
    await expect(element(by.id('linked-accounts-screen'))).toBeVisible();
  });
});

describe('User Settings - App Preferences', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.id('settings-preferences')).tap();
  });

  it('should toggle dark mode', async () => {
    await element(by.id('dark-mode-toggle')).tap();
    await expect(element(by.id('dark-mode-toggle-on'))).toBeVisible();
  });

  it('should change language', async () => {
    await element(by.id('language-selector')).tap();
    await element(by.id('language-spanish')).tap();
    await expect(element(by.id('current-language'))).toHaveText('Spanish');
  });

  it('should set default currency', async () => {
    await element(by.id('currency-selector')).tap();
    await element(by.id('currency-EUR')).tap();
    await expect(element(by.id('current-currency'))).toHaveText('EUR');
  });

  it('should configure auto-play settings', async () => {
    await element(by.id('autoplay-toggle')).tap();
    await expect(element(by.id('autoplay-toggle-off'))).toBeVisible();
  });
});

describe('User Settings - Privacy', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.id('settings-privacy')).tap();
  });

  it('should configure profile visibility', async () => {
    await element(by.id('profile-visibility-selector')).tap();
    await element(by.id('visibility-private')).tap();
    await expect(element(by.id('current-visibility'))).toHaveText('Private');
  });

  it('should manage blocked users', async () => {
    await element(by.id('blocked-users-button')).tap();
    await expect(element(by.id('blocked-users-screen'))).toBeVisible();
  });

  it('should toggle activity status', async () => {
    await element(by.id('activity-status-toggle')).tap();
    await expect(element(by.id('activity-status-toggle-off'))).toBeVisible();
  });
});

describe('User Settings - Data Management', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.id('settings-data')).tap();
  });

  it('should show storage usage', async () => {
    await expect(element(by.id('storage-usage'))).toBeVisible();
    await expect(element(by.id('storage-breakdown'))).toBeVisible();
  });

  it('should clear cache', async () => {
    await element(by.id('clear-cache-button')).tap();
    await element(by.id('confirm-clear-cache')).tap();
    await expect(element(by.id('cache-cleared-toast'))).toBeVisible();
  });

  it('should download data', async () => {
    await element(by.id('download-data-button')).tap();
    await expect(element(by.id('download-data-confirmation'))).toBeVisible();
  });

  it('should delete account', async () => {
    await element(by.id('delete-account-button')).tap();
    await expect(element(by.id('delete-account-warning'))).toBeVisible();
    await expect(element(by.id('confirm-delete-input'))).toBeVisible();
  });
});
