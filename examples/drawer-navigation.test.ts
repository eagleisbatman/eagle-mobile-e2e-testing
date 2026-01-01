/**
 * Example: Drawer Navigation E2E Tests
 *
 * Comprehensive tests for drawer/hamburger menu navigation including:
 * - Opening and closing drawer
 * - Menu item navigation
 * - User profile in drawer
 * - Gesture-based interactions
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Drawer Navigation - Basic Operations', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should open drawer via hamburger menu button', async () => {
    await element(by.id('drawer-toggle-button')).tap();

    await waitFor(element(by.id('drawer-menu')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should close drawer via close button', async () => {
    await element(by.id('drawer-toggle-button')).tap();
    await waitFor(element(by.id('drawer-menu'))).toBeVisible().withTimeout(3000);

    await element(by.id('drawer-close-button')).tap();

    await waitFor(element(by.id('drawer-menu')))
      .not.toBeVisible()
      .withTimeout(3000);
  });

  it('should close drawer by tapping outside', async () => {
    await element(by.id('drawer-toggle-button')).tap();
    await waitFor(element(by.id('drawer-menu'))).toBeVisible().withTimeout(3000);

    await element(by.id('drawer-overlay')).tap();

    await waitFor(element(by.id('drawer-menu')))
      .not.toBeVisible()
      .withTimeout(3000);
  });

  it('should open drawer via swipe gesture from left edge', async () => {
    await element(by.id('home-screen')).swipe('right', 'fast', 0.5, 0.01);

    await waitFor(element(by.id('drawer-menu')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should close drawer via swipe gesture', async () => {
    await element(by.id('drawer-toggle-button')).tap();
    await waitFor(element(by.id('drawer-menu'))).toBeVisible().withTimeout(3000);

    await element(by.id('drawer-menu')).swipe('left', 'fast');

    await waitFor(element(by.id('drawer-menu')))
      .not.toBeVisible()
      .withTimeout(3000);
  });
});

describe('Drawer Navigation - Menu Items', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('drawer-toggle-button')).tap();
    await waitFor(element(by.id('drawer-menu'))).toBeVisible().withTimeout(3000);
  });

  it('should display all menu items', async () => {
    await expect(element(by.id('drawer-item-home'))).toBeVisible();
    await expect(element(by.id('drawer-item-profile'))).toBeVisible();
    await expect(element(by.id('drawer-item-settings'))).toBeVisible();
    await expect(element(by.id('drawer-item-help'))).toBeVisible();
    await expect(element(by.id('drawer-item-logout'))).toBeVisible();
  });

  it('should navigate to Profile screen', async () => {
    await element(by.id('drawer-item-profile')).tap();

    await waitFor(element(by.id('profile-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Drawer should close after navigation
    await expect(element(by.id('drawer-menu'))).not.toBeVisible();
  });

  it('should navigate to Settings screen', async () => {
    await element(by.id('drawer-item-settings')).tap();

    await waitFor(element(by.id('settings-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should navigate to Help screen', async () => {
    await element(by.id('drawer-item-help')).tap();

    await waitFor(element(by.id('help-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should highlight current screen in drawer', async () => {
    // Home should be highlighted initially
    await expect(element(by.id('drawer-item-home-active'))).toBeVisible();

    // Navigate to profile and reopen drawer
    await element(by.id('drawer-item-profile')).tap();
    await waitFor(element(by.id('profile-screen'))).toBeVisible().withTimeout(3000);
    await element(by.id('drawer-toggle-button')).tap();
    await waitFor(element(by.id('drawer-menu'))).toBeVisible().withTimeout(3000);

    // Profile should now be highlighted
    await expect(element(by.id('drawer-item-profile-active'))).toBeVisible();
    await expect(element(by.id('drawer-item-home-active'))).not.toBeVisible();
  });
});

describe('Drawer Navigation - User Profile Section', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('john.doe@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('drawer-toggle-button')).tap();
    await waitFor(element(by.id('drawer-menu'))).toBeVisible().withTimeout(3000);
  });

  it('should display user profile in drawer header', async () => {
    await expect(element(by.id('drawer-user-avatar'))).toBeVisible();
    await expect(element(by.id('drawer-user-name'))).toBeVisible();
    await expect(element(by.id('drawer-user-email'))).toBeVisible();
  });

  it('should display correct user information', async () => {
    await expect(element(by.id('drawer-user-name'))).toHaveText('John Doe');
    await expect(element(by.id('drawer-user-email'))).toHaveText('john.doe@example.com');
  });

  it('should navigate to profile when tapping user section', async () => {
    await element(by.id('drawer-user-section')).tap();

    await waitFor(element(by.id('profile-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });
});

describe('Drawer Navigation - Logout Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('drawer-toggle-button')).tap();
    await waitFor(element(by.id('drawer-menu'))).toBeVisible().withTimeout(3000);
  });

  it('should show logout confirmation dialog', async () => {
    await element(by.id('drawer-item-logout')).tap();

    await waitFor(element(by.id('logout-confirmation-dialog')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.id('logout-confirm-button'))).toBeVisible();
    await expect(element(by.id('logout-cancel-button'))).toBeVisible();
  });

  it('should cancel logout when cancel is pressed', async () => {
    await element(by.id('drawer-item-logout')).tap();
    await waitFor(element(by.id('logout-confirmation-dialog'))).toBeVisible().withTimeout(3000);

    await element(by.id('logout-cancel-button')).tap();

    await expect(element(by.id('drawer-menu'))).toBeVisible();
    await expect(element(by.id('logout-confirmation-dialog'))).not.toBeVisible();
  });

  it('should logout and return to welcome screen', async () => {
    await element(by.id('drawer-item-logout')).tap();
    await waitFor(element(by.id('logout-confirmation-dialog'))).toBeVisible().withTimeout(3000);

    await element(by.id('logout-confirm-button')).tap();

    await waitFor(element(by.id('welcome-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
});

describe('Drawer Navigation - Nested Sections', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('drawer-toggle-button')).tap();
    await waitFor(element(by.id('drawer-menu'))).toBeVisible().withTimeout(3000);
  });

  it('should expand settings section', async () => {
    await element(by.id('drawer-section-settings')).tap();

    await expect(element(by.id('drawer-item-account'))).toBeVisible();
    await expect(element(by.id('drawer-item-privacy'))).toBeVisible();
    await expect(element(by.id('drawer-item-notifications'))).toBeVisible();
  });

  it('should collapse expanded section', async () => {
    await element(by.id('drawer-section-settings')).tap();
    await expect(element(by.id('drawer-item-account'))).toBeVisible();

    await element(by.id('drawer-section-settings')).tap();

    await expect(element(by.id('drawer-item-account'))).not.toBeVisible();
  });

  it('should navigate to nested item', async () => {
    await element(by.id('drawer-section-settings')).tap();
    await element(by.id('drawer-item-privacy')).tap();

    await waitFor(element(by.id('privacy-settings-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
