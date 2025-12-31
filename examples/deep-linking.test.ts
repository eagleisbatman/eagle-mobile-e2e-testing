/**
 * Example: Deep Linking E2E Tests
 *
 * Comprehensive tests for deep linking including:
 * - URL scheme handling
 * - Universal links
 * - App state handling (cold/warm start)
 * - Parameter parsing
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Deep Linking - URL Scheme (Cold Start)', () => {
  it('should open product detail from deep link', async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      url: 'myapp://products/12345'
    });

    await waitFor(element(by.id('product-detail-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('product-id-12345'))).toBeVisible();
  });

  it('should open user profile from deep link', async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      url: 'myapp://users/john-doe'
    });

    await waitFor(element(by.id('user-profile-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should open category with filters from deep link', async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      url: 'myapp://category/electronics?sort=price&min=100&max=500'
    });

    await waitFor(element(by.id('category-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('filter-price-range'))).toHaveText('$100 - $500');
  });
});

describe('Deep Linking - URL Scheme (Warm Start)', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should handle deep link while app is running', async () => {
    await device.openURL({ url: 'myapp://products/67890' });

    await waitFor(element(by.id('product-detail-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate back to previous screen', async () => {
    await device.openURL({ url: 'myapp://products/67890' });
    await waitFor(element(by.id('product-detail-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('back-button')).tap();

    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});

describe('Deep Linking - Authentication Required', () => {
  it('should redirect to login for protected deep link', async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      url: 'myapp://account/settings'
    });

    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should navigate to original destination after login', async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      url: 'myapp://account/settings'
    });

    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(10000);

    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();

    await waitFor(element(by.id('account-settings-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });
});

describe('Deep Linking - Error Handling', () => {
  it('should show error for invalid deep link path', async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      url: 'myapp://invalid/path/here'
    });

    await waitFor(element(by.id('deep-link-error-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should handle malformed deep link gracefully', async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      url: 'myapp://'
    });

    await waitFor(element(by.id('welcome-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
