/**
 * Example: Tab Navigation E2E Tests
 *
 * Comprehensive tests for tab-based navigation including:
 * - Bottom tab bar navigation
 * - Tab state persistence
 * - Badge indicators
 * - Tab switching animations
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Tab Navigation - Basic Navigation', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Complete login to reach main app with tabs
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should display bottom tab bar with all tabs', async () => {
    await expect(element(by.id('tab-bar'))).toBeVisible();
    await expect(element(by.id('tab-home'))).toBeVisible();
    await expect(element(by.id('tab-search'))).toBeVisible();
    await expect(element(by.id('tab-notifications'))).toBeVisible();
    await expect(element(by.id('tab-profile'))).toBeVisible();
  });

  it('should highlight active tab', async () => {
    await expect(element(by.id('tab-home-active'))).toBeVisible();
  });

  it('should navigate to Search tab', async () => {
    await element(by.id('tab-search')).tap();

    await waitFor(element(by.id('search-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.id('tab-search-active'))).toBeVisible();
    await expect(element(by.id('tab-home-active'))).not.toBeVisible();
  });

  it('should navigate to Notifications tab', async () => {
    await element(by.id('tab-notifications')).tap();

    await waitFor(element(by.id('notifications-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should navigate to Profile tab', async () => {
    await element(by.id('tab-profile')).tap();

    await waitFor(element(by.id('profile-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should return to Home tab', async () => {
    await element(by.id('tab-profile')).tap();
    await waitFor(element(by.id('profile-screen'))).toBeVisible().withTimeout(3000);

    await element(by.id('tab-home')).tap();

    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});

describe('Tab Navigation - State Persistence', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should preserve scroll position when switching tabs', async () => {
    // Scroll down on home screen
    await element(by.id('home-feed-list')).scroll(500, 'down');

    // Switch to another tab
    await element(by.id('tab-search')).tap();
    await waitFor(element(by.id('search-screen'))).toBeVisible().withTimeout(3000);

    // Return to home tab
    await element(by.id('tab-home')).tap();

    // Scroll position should be preserved (content below fold should still be visible)
    await expect(element(by.id('home-feed-item-5'))).toBeVisible();
  });

  it('should preserve search query when switching tabs', async () => {
    await element(by.id('tab-search')).tap();
    await waitFor(element(by.id('search-screen'))).toBeVisible().withTimeout(3000);

    await element(by.id('search-input')).typeText('test query');

    await element(by.id('tab-home')).tap();
    await element(by.id('tab-search')).tap();

    await expect(element(by.id('search-input'))).toHaveText('test query');
  });

  it('should preserve nested navigation state', async () => {
    await element(by.id('tab-profile')).tap();
    await waitFor(element(by.id('profile-screen'))).toBeVisible().withTimeout(3000);

    // Navigate deeper into profile
    await element(by.id('profile-settings-button')).tap();
    await waitFor(element(by.id('settings-screen'))).toBeVisible().withTimeout(3000);

    // Switch tabs
    await element(by.id('tab-home')).tap();
    await element(by.id('tab-profile')).tap();

    // Should still be on settings screen
    await expect(element(by.id('settings-screen'))).toBeVisible();
  });
});

describe('Tab Navigation - Badge Indicators', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('badge-user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should display notification badge count', async () => {
    await expect(element(by.id('tab-notifications-badge'))).toBeVisible();
  });

  it('should clear badge when tab is visited', async () => {
    await element(by.id('tab-notifications')).tap();
    await waitFor(element(by.id('notifications-screen'))).toBeVisible().withTimeout(3000);

    await expect(element(by.id('tab-notifications-badge'))).not.toBeVisible();
  });

  it('should update badge count on new notification', async () => {
    // Simulate receiving a notification
    await device.sendUserNotification({
      trigger: { type: 'push' },
      title: 'New Message',
      body: 'You have a new message',
      payload: { type: 'message' }
    });

    await expect(element(by.id('tab-notifications-badge'))).toBeVisible();
  });
});

describe('Tab Navigation - Double Tap Behavior', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should scroll to top on double tap of active tab', async () => {
    // Scroll down
    await element(by.id('home-feed-list')).scroll(500, 'down');

    // Double tap home tab
    await element(by.id('tab-home')).multiTap(2);

    // Should scroll back to top
    await expect(element(by.id('home-feed-item-0'))).toBeVisible();
  });

  it('should pop to root on double tap from nested screen', async () => {
    await element(by.id('tab-profile')).tap();
    await waitFor(element(by.id('profile-screen'))).toBeVisible().withTimeout(3000);

    // Navigate to nested screen
    await element(by.id('profile-settings-button')).tap();
    await waitFor(element(by.id('settings-screen'))).toBeVisible().withTimeout(3000);

    // Double tap profile tab
    await element(by.id('tab-profile')).multiTap(2);

    // Should return to profile root
    await expect(element(by.id('profile-screen'))).toBeVisible();
    await expect(element(by.id('settings-screen'))).not.toBeVisible();
  });
});
