/**
 * Example: Onboarding & Tutorial E2E Tests
 *
 * Comprehensive tests for app onboarding including:
 * - Welcome screens and carousels
 * - Permission requests
 * - Account setup flows
 * - Feature tutorials
 * - Skip functionality
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Onboarding - Welcome Carousel', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('should display welcome carousel with swipeable screens', async () => {
    await waitFor(element(by.id('onboarding-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify first slide
    await expect(element(by.id('onboarding-slide-0'))).toBeVisible();
    await expect(element(by.id('onboarding-title-0'))).toBeVisible();
    await expect(element(by.id('onboarding-description-0'))).toBeVisible();
    await expect(element(by.id('onboarding-image-0'))).toBeVisible();

    // Verify pagination dots
    await expect(element(by.id('pagination-dots'))).toBeVisible();
    await expect(element(by.id('dot-0-active'))).toBeVisible();
  });

  it('should navigate carousel with swipe gestures', async () => {
    await waitFor(element(by.id('onboarding-screen'))).toBeVisible().withTimeout(5000);

    // Swipe to second slide
    await element(by.id('onboarding-carousel')).swipe('left');

    await expect(element(by.id('onboarding-slide-1'))).toBeVisible();
    await expect(element(by.id('dot-1-active'))).toBeVisible();

    // Swipe to third slide
    await element(by.id('onboarding-carousel')).swipe('left');

    await expect(element(by.id('onboarding-slide-2'))).toBeVisible();
    await expect(element(by.id('dot-2-active'))).toBeVisible();
  });

  it('should navigate carousel with next button', async () => {
    await waitFor(element(by.id('onboarding-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('next-button')).tap();
    await expect(element(by.id('onboarding-slide-1'))).toBeVisible();

    await element(by.id('next-button')).tap();
    await expect(element(by.id('onboarding-slide-2'))).toBeVisible();
  });

  it('should show Get Started button on last slide', async () => {
    await waitFor(element(by.id('onboarding-screen'))).toBeVisible().withTimeout(5000);

    // Navigate to last slide
    await element(by.id('onboarding-carousel')).swipe('left');
    await element(by.id('onboarding-carousel')).swipe('left');
    await element(by.id('onboarding-carousel')).swipe('left');

    // Verify Get Started button
    await expect(element(by.id('get-started-button'))).toBeVisible();
    await expect(element(by.id('next-button'))).not.toBeVisible();
  });

  it('should skip onboarding to login screen', async () => {
    await waitFor(element(by.id('onboarding-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('skip-button')).tap();

    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should proceed to login after completing onboarding', async () => {
    await waitFor(element(by.id('onboarding-screen'))).toBeVisible().withTimeout(5000);

    // Navigate through all slides
    await element(by.id('next-button')).tap();
    await element(by.id('next-button')).tap();
    await element(by.id('next-button')).tap();

    await element(by.id('get-started-button')).tap();

    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should not show onboarding on subsequent launches', async () => {
    await waitFor(element(by.id('onboarding-screen'))).toBeVisible().withTimeout(5000);

    // Complete onboarding
    await element(by.id('skip-button')).tap();
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(5000);

    // Restart app without deleting data
    await device.launchApp({ newInstance: true });

    // Should go directly to login, not onboarding
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
});

describe('Onboarding - Permission Requests', () => {
  it('should request notification permission with explanation', async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { notifications: 'unset' }
    });

    // Complete welcome carousel
    await waitFor(element(by.id('onboarding-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('skip-button')).tap();

    // Should see permission explanation screen
    await waitFor(element(by.id('notification-permission-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('permission-explanation-text'))).toBeVisible();
    await expect(element(by.id('permission-benefit-1'))).toBeVisible();
    await expect(element(by.id('enable-notifications-button'))).toBeVisible();
    await expect(element(by.id('maybe-later-button'))).toBeVisible();
  });

  it('should handle notification permission granted', async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { notifications: 'YES' }
    });

    await waitFor(element(by.id('onboarding-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('skip-button')).tap();

    // Should proceed past notification screen since already granted
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should request location permission with use case explanation', async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { location: 'unset' }
    });

    // Skip to permission flow
    await waitFor(element(by.id('onboarding-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('skip-button')).tap();

    await waitFor(element(by.id('location-permission-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('location-use-case-text'))).toBeVisible();
    await expect(element(by.id('enable-location-button'))).toBeVisible();
    await expect(element(by.id('skip-location-button'))).toBeVisible();
  });

  it('should allow skipping optional permissions', async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { location: 'unset', notifications: 'unset' }
    });

    await waitFor(element(by.id('onboarding-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('skip-button')).tap();

    // Skip notification permission
    await waitFor(element(by.id('notification-permission-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('maybe-later-button')).tap();

    // Skip location permission
    await waitFor(element(by.id('location-permission-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('skip-location-button')).tap();

    // Should reach login screen
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
});

describe('Onboarding - Account Setup', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Complete initial onboarding
    await waitFor(element(by.id('onboarding-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('skip-button')).tap();
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(5000);
    // Start registration
    await element(by.id('create-account-button')).tap();
  });

  it('should complete multi-step registration wizard', async () => {
    // Step 1: Email/Password
    await waitFor(element(by.id('registration-step-1'))).toBeVisible().withTimeout(5000);
    await element(by.id('email-input')).typeText('newuser@example.com');
    await element(by.id('password-input')).typeText('SecurePass123!');
    await element(by.id('confirm-password-input')).typeText('SecurePass123!');
    await element(by.id('next-step-button')).tap();

    // Step 2: Profile Info
    await waitFor(element(by.id('registration-step-2'))).toBeVisible().withTimeout(5000);
    await element(by.id('first-name-input')).typeText('John');
    await element(by.id('last-name-input')).typeText('Doe');
    await element(by.id('next-step-button')).tap();

    // Step 3: Preferences
    await waitFor(element(by.id('registration-step-3'))).toBeVisible().withTimeout(5000);
    await element(by.id('preference-option-1')).tap();
    await element(by.id('preference-option-3')).tap();
    await element(by.id('complete-setup-button')).tap();

    // Should reach home screen
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should show progress indicator during setup', async () => {
    await waitFor(element(by.id('registration-step-1'))).toBeVisible().withTimeout(5000);

    // Verify progress indicator
    await expect(element(by.id('setup-progress-bar'))).toBeVisible();
    await expect(element(by.id('step-indicator-1-active'))).toBeVisible();
    await expect(element(by.id('step-indicator-2'))).toBeVisible();
    await expect(element(by.id('step-indicator-3'))).toBeVisible();
  });

  it('should validate required fields before proceeding', async () => {
    await waitFor(element(by.id('registration-step-1'))).toBeVisible().withTimeout(5000);

    // Try to proceed without filling fields
    await element(by.id('next-step-button')).tap();

    // Should show validation errors
    await expect(element(by.id('email-error'))).toBeVisible();
    await expect(element(by.id('password-error'))).toBeVisible();
  });

  it('should allow going back to previous step', async () => {
    await waitFor(element(by.id('registration-step-1'))).toBeVisible().withTimeout(5000);
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('confirm-password-input')).typeText('Password123!');
    await element(by.id('next-step-button')).tap();

    await waitFor(element(by.id('registration-step-2'))).toBeVisible().withTimeout(5000);

    // Go back
    await element(by.id('back-button')).tap();

    // Should return to step 1 with data preserved
    await expect(element(by.id('registration-step-1'))).toBeVisible();
    await expect(element(by.id('email-input'))).toHaveText('test@example.com');
  });
});

describe('Onboarding - Feature Tutorial', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Complete onboarding and login
    await waitFor(element(by.id('onboarding-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('skip-button')).tap();
    await element(by.id('login-email-input')).typeText('test@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should show feature tooltips on first login', async () => {
    // Verify tooltip overlay
    await expect(element(by.id('tutorial-overlay'))).toBeVisible();
    await expect(element(by.id('tooltip-1'))).toBeVisible();
    await expect(element(by.id('tooltip-highlight'))).toBeVisible();
  });

  it('should navigate through tutorial steps', async () => {
    // Step 1
    await expect(element(by.id('tooltip-1'))).toBeVisible();
    await element(by.id('tooltip-next-button')).tap();

    // Step 2
    await expect(element(by.id('tooltip-2'))).toBeVisible();
    await element(by.id('tooltip-next-button')).tap();

    // Step 3
    await expect(element(by.id('tooltip-3'))).toBeVisible();
    await element(by.id('tooltip-done-button')).tap();

    // Tutorial complete
    await expect(element(by.id('tutorial-overlay'))).not.toBeVisible();
  });

  it('should allow skipping tutorial', async () => {
    await expect(element(by.id('tutorial-overlay'))).toBeVisible();

    await element(by.id('skip-tutorial-button')).tap();

    // Confirm skip
    await element(by.id('confirm-skip-button')).tap();

    await expect(element(by.id('tutorial-overlay'))).not.toBeVisible();
  });

  it('should highlight interactive elements during tutorial', async () => {
    await expect(element(by.id('tooltip-1'))).toBeVisible();

    // Verify the target element is highlighted
    await expect(element(by.id('highlighted-element'))).toBeVisible();

    // Tapping highlighted element should also advance tutorial
    await element(by.id('highlighted-element')).tap();

    await expect(element(by.id('tooltip-2'))).toBeVisible();
  });

  it('should not show tutorial on subsequent logins', async () => {
    // Complete tutorial
    await element(by.id('skip-tutorial-button')).tap();
    await element(by.id('confirm-skip-button')).tap();

    // Logout
    await element(by.id('nav-profile-tab')).tap();
    await element(by.id('logout-button')).tap();
    await element(by.id('confirm-logout-button')).tap();

    // Login again
    await element(by.id('login-email-input')).typeText('test@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);

    // Tutorial should not appear
    await expect(element(by.id('tutorial-overlay'))).not.toBeVisible();
  });
});

describe('Onboarding - Personalization', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await waitFor(element(by.id('onboarding-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('skip-button')).tap();
    // Complete registration
    await element(by.id('create-account-button')).tap();
    await element(by.id('email-input')).typeText('new@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('confirm-password-input')).typeText('Password123!');
    await element(by.id('next-step-button')).tap();
    await element(by.id('first-name-input')).typeText('Jane');
    await element(by.id('last-name-input')).typeText('Doe');
    await element(by.id('next-step-button')).tap();
  });

  it('should allow selecting interests for personalization', async () => {
    await waitFor(element(by.id('interests-selection-screen'))).toBeVisible().withTimeout(5000);

    // Select multiple interests
    await element(by.id('interest-technology')).tap();
    await element(by.id('interest-travel')).tap();
    await element(by.id('interest-food')).tap();

    // Verify selections
    await expect(element(by.id('interest-technology-selected'))).toBeVisible();
    await expect(element(by.id('interest-travel-selected'))).toBeVisible();
    await expect(element(by.id('interest-food-selected'))).toBeVisible();

    // Verify minimum selection requirement
    await expect(element(by.id('continue-button'))).toBeVisible();
  });

  it('should require minimum interest selections', async () => {
    await waitFor(element(by.id('interests-selection-screen'))).toBeVisible().withTimeout(5000);

    // Select only one interest
    await element(by.id('interest-technology')).tap();

    // Continue button should be disabled or show message
    await expect(element(by.id('minimum-selection-hint'))).toBeVisible();
  });

  it('should allow avatar selection or upload', async () => {
    // Navigate past interests
    await waitFor(element(by.id('interests-selection-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('interest-technology')).tap();
    await element(by.id('interest-travel')).tap();
    await element(by.id('interest-food')).tap();
    await element(by.id('continue-button')).tap();

    // Avatar selection screen
    await waitFor(element(by.id('avatar-selection-screen'))).toBeVisible().withTimeout(5000);

    // Select preset avatar
    await element(by.id('avatar-preset-1')).tap();
    await expect(element(by.id('avatar-preset-1-selected'))).toBeVisible();

    // Or upload custom
    await expect(element(by.id('upload-avatar-button'))).toBeVisible();
  });
});
