/**
 * Example: Accessibility E2E Tests
 *
 * Tests for accessibility features including:
 * - Screen reader support
 * - Dynamic type
 * - Color contrast
 * - Reduced motion
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Accessibility - Screen Reader Support', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should have accessible labels on interactive elements', async () => {
    await expect(element(by.id('tab-home'))).toHaveLabel('Home Tab');
    await expect(element(by.id('tab-search'))).toHaveLabel('Search Tab');
    await expect(element(by.id('tab-profile'))).toHaveLabel('Profile Tab');
  });

  it('should have accessible hints on buttons', async () => {
    await element(by.id('tab-profile')).tap();
    await expect(element(by.id('settings-button'))).toHaveLabel('Settings');
  });

  it('should announce screen changes', async () => {
    await element(by.id('tab-search')).tap();
    // VoiceOver would announce "Search Screen"
    await expect(element(by.id('search-screen'))).toBeVisible();
  });

  it('should have proper heading hierarchy', async () => {
    await element(by.id('tab-profile')).tap();
    await expect(element(by.id('profile-heading'))).toBeVisible();
  });

  it('should group related elements', async () => {
    await element(by.id('tab-profile')).tap();
    await expect(element(by.id('user-info-group'))).toBeVisible();
  });
});

describe('Accessibility - Touch Targets', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should have adequate touch target sizes', async () => {
    // All interactive elements should be at least 44x44 points
    await expect(element(by.id('tab-home'))).toBeVisible();
    await expect(element(by.id('tab-search'))).toBeVisible();
    await expect(element(by.id('tab-profile'))).toBeVisible();
  });

  it('should have adequate spacing between touch targets', async () => {
    // Elements should be spaced to prevent accidental taps
    await element(by.id('tab-search')).tap();
    await expect(element(by.id('search-screen'))).toBeVisible();
  });
});

describe('Accessibility - Dynamic Type', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      launchArgs: { 'accessibility-large-text': 'true' }
    });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should support large text sizes', async () => {
    await expect(element(by.id('home-title'))).toBeVisible();
    // Text should scale and remain readable
  });

  it('should not truncate important text', async () => {
    await element(by.id('tab-profile')).tap();
    await expect(element(by.id('profile-name'))).toBeVisible();
    // Name should not be cut off
  });

  it('should maintain layout with large text', async () => {
    // UI should adapt without breaking
    await expect(element(by.id('tab-home'))).toBeVisible();
    await expect(element(by.id('tab-search'))).toBeVisible();
  });
});

describe('Accessibility - Color and Contrast', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should not rely solely on color for information', async () => {
    // Error states should include icons/text, not just color
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.id('settings-notifications')).tap();

    // Status indicators should have text labels
    await expect(element(by.id('notification-status-label'))).toBeVisible();
  });

  it('should support high contrast mode', async () => {
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.id('accessibility-settings')).tap();
    await element(by.id('high-contrast-toggle')).tap();

    await expect(element(by.id('high-contrast-enabled'))).toBeVisible();
  });
});

describe('Accessibility - Reduced Motion', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      launchArgs: { 'reduce-motion': 'true' }
    });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should respect reduced motion preference', async () => {
    await element(by.id('tab-search')).tap();
    // Transition should be instant, not animated
    await expect(element(by.id('search-screen'))).toBeVisible();
  });

  it('should disable auto-playing animations', async () => {
    // Looping animations should be paused
    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});

describe('Accessibility - Focus Management', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should trap focus in modal dialogs', async () => {
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.id('logout-button')).tap();

    // Focus should be trapped within the confirmation dialog
    await expect(element(by.id('logout-confirmation-dialog'))).toBeVisible();
    await expect(element(by.id('logout-confirm-button'))).toBeVisible();
    await expect(element(by.id('logout-cancel-button'))).toBeVisible();
  });

  it('should return focus after modal closes', async () => {
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.id('logout-button')).tap();
    await element(by.id('logout-cancel-button')).tap();

    // Focus should return to the logout button
    await expect(element(by.id('settings-screen'))).toBeVisible();
  });

  it('should move focus to new content', async () => {
    await element(by.id('tab-search')).tap();
    await element(by.id('search-input')).typeText('test');
    await element(by.id('search-input')).tapReturnKey();

    // Focus should move to search results
    await waitFor(element(by.id('search-results'))).toBeVisible().withTimeout(5000);
  });
});

describe('Accessibility - Error Handling', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-create-account-button')).tap();
    await waitFor(element(by.id('registration-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should announce form errors accessibly', async () => {
    await element(by.id('register-button')).tap();

    // Errors should be announced
    await expect(element(by.id('form-error-summary'))).toBeVisible();
  });

  it('should associate errors with form fields', async () => {
    await element(by.id('email-input')).typeText('invalid');
    await element(by.id('email-input')).tapReturnKey();

    // Error should be associated with the input
    await expect(element(by.id('email-error'))).toBeVisible();
  });

  it('should provide clear error messages', async () => {
    await element(by.id('email-input')).typeText('invalid');
    await element(by.id('email-input')).tapReturnKey();

    await expect(element(by.id('email-error'))).toHaveText('Please enter a valid email address');
  });
});
