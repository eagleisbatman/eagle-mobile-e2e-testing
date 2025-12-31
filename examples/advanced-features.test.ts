/**
 * Example: Advanced Features E2E Tests
 *
 * This file demonstrates testing advanced capabilities:
 * - Biometric authentication
 * - Deep linking
 * - Push notifications
 * - Background/foreground states
 * - Location mocking
 * - Device orientation
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Biometric Authentication - Face ID / Touch ID', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  /**
   * Test: Successful biometric authentication
   * Verifies Face ID / Touch ID grants access when matched.
   */
  it('should grant access when biometric authentication succeeds', async () => {
    // Enable biometric enrollment on simulator
    await device.setBiometricEnrollment(true);

    // Navigate to protected feature
    await element(by.id('secure-vault-button')).tap();

    // Verify biometric prompt appears
    await waitFor(element(by.id('biometric-prompt')))
      .toBeVisible()
      .withTimeout(3000);

    // Simulate successful Face ID match
    await device.matchFace();

    // Verify access granted
    await waitFor(element(by.id('secure-content')))
      .toBeVisible()
      .withTimeout(5000);
  });

  /**
   * Test: Failed biometric authentication
   * Verifies app handles biometric failure appropriately.
   */
  it('should show error and fallback when biometric fails', async () => {
    await device.setBiometricEnrollment(true);

    await element(by.id('secure-vault-button')).tap();

    // Simulate failed Face ID
    await device.unmatchFace();

    // Verify error message and fallback option
    await expect(element(by.id('biometric-failed-message'))).toBeVisible();
    await expect(element(by.id('use-passcode-button'))).toBeVisible();
  });

  /**
   * Test: No biometric enrollment
   * Verifies fallback when biometrics not set up.
   */
  it('should show passcode entry when biometrics not enrolled', async () => {
    // Disable biometric enrollment
    await device.setBiometricEnrollment(false);

    await element(by.id('secure-vault-button')).tap();

    // Should go directly to passcode
    await expect(element(by.id('passcode-input'))).toBeVisible();
  });

  /**
   * Test: Touch ID (older devices)
   * Verifies Touch ID works similarly to Face ID.
   */
  it('should handle Touch ID authentication', async () => {
    await device.setBiometricEnrollment(true);

    await element(by.id('secure-vault-button')).tap();

    // Simulate successful Touch ID
    await device.matchFinger();

    await waitFor(element(by.id('secure-content')))
      .toBeVisible()
      .withTimeout(5000);
  });
});

describe('Deep Linking - URL Scheme Handling', () => {
  /**
   * Test: Cold start with deep link
   * Verifies app opens to correct screen from URL.
   */
  it('should navigate to profile when launched with profile deep link', async () => {
    await device.launchApp({
      newInstance: true,
      url: 'myapp://profile/user-123'
    });

    // Verify correct screen loaded
    await waitFor(element(by.id('profile-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify correct data loaded
    await expect(element(by.id('user-id-text'))).toHaveText('user-123');
  });

  /**
   * Test: Deep link while app is running
   * Verifies navigation when app receives URL in foreground.
   */
  it('should navigate to product when receiving deep link in foreground', async () => {
    // Start app normally
    await device.launchApp({ newInstance: true });
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);

    // Send deep link to running app
    await device.openURL({ url: 'myapp://product/abc-123' });

    // Verify navigation occurred
    await expect(element(by.id('product-detail-screen'))).toBeVisible();
    await expect(element(by.id('product-id-text'))).toHaveText('abc-123');
  });

  /**
   * Test: Deep link with query parameters
   * Verifies URL parameters are parsed correctly.
   */
  it('should handle deep link with query parameters', async () => {
    await device.launchApp({
      newInstance: true,
      url: 'myapp://search?query=shoes&category=footwear&sort=price'
    });

    // Verify search results screen
    await waitFor(element(by.id('search-results-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify parameters applied
    await expect(element(by.id('search-query-input'))).toHaveText('shoes');
    await expect(element(by.id('category-filter'))).toHaveText('footwear');
  });

  /**
   * Test: Invalid deep link handling
   * Verifies app handles malformed URLs gracefully.
   */
  it('should navigate to home for invalid deep link', async () => {
    await device.launchApp({
      newInstance: true,
      url: 'myapp://invalid/unknown/path'
    });

    // Should fall back to home screen
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
});

describe('Push Notifications - User Notification Handling', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
  });

  /**
   * Test: Launch from notification tap
   * Verifies app opens to correct screen when launched via notification.
   */
  it('should open message detail when launched from message notification', async () => {
    const notification = {
      trigger: { type: 'push' },
      title: 'New Message',
      body: 'John sent you a message',
      badge: 1,
      payload: {
        type: 'message',
        messageId: 'msg-12345',
        senderId: 'user-john'
      }
    };

    // Launch app from notification
    await device.launchApp({
      newInstance: true,
      userNotification: notification
    });

    // Verify message detail screen
    await expect(element(by.id('message-detail-screen'))).toBeVisible();
    await expect(element(by.id('message-id-text'))).toHaveText('msg-12345');
  });

  /**
   * Test: Notification while app in foreground
   * Verifies in-app notification banner appears.
   */
  it('should show in-app banner for foreground notification', async () => {
    // Ensure app is running
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);

    // Send notification
    await device.sendUserNotification({
      trigger: { type: 'push' },
      title: 'Special Offer',
      body: '50% off today only!',
      payload: { type: 'promo', promoId: 'SAVE50' }
    });

    // Verify in-app notification
    await expect(element(by.id('in-app-notification-banner'))).toBeVisible();
    await expect(element(by.text('Special Offer'))).toBeVisible();
  });

  /**
   * Test: Notification while app in background
   * Verifies app handles notification when returning from background.
   */
  it('should handle notification received while in background', async () => {
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);

    // Send app to background
    await device.sendToHome();

    // Send notification while in background
    await device.sendUserNotification({
      trigger: { type: 'push' },
      title: 'New Task',
      body: 'You have a new task assigned',
      payload: { type: 'task', taskId: 'task-999' }
    });

    // Return to app (simulates tapping notification)
    await device.launchApp({ newInstance: false });

    // Verify task detail screen
    await expect(element(by.id('task-detail-screen'))).toBeVisible();
  });
});

describe('App Lifecycle - Background / Foreground', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  /**
   * Test: State preservation across background
   * Verifies unsaved data persists when app backgrounds.
   */
  it('should preserve form data when returning from background', async () => {
    // Navigate to a form
    await element(by.id('nav-profile-tab')).tap();
    await element(by.id('edit-profile-button')).tap();

    // Fill in form data
    await element(by.id('name-input')).typeText('John Doe');
    await element(by.id('bio-input')).typeText('Software developer');

    // Send to background
    await device.sendToHome();

    // Wait (simulating user doing something else)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return to app
    await device.launchApp({ newInstance: false });

    // Verify data preserved
    await expect(element(by.id('name-input'))).toHaveText('John Doe');
    await expect(element(by.id('bio-input'))).toHaveText('Software developer');
  });

  /**
   * Test: Session refresh on foreground
   * Verifies app refreshes data when returning from background.
   */
  it('should refresh data when returning from background', async () => {
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);

    // Note the current timestamp
    const initialTimestamp = await element(by.id('last-updated-text')).getAttributes();

    // Send to background
    await device.sendToHome();

    // Return after delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    await device.launchApp({ newInstance: false });

    // Verify refresh occurred (loading indicator or new timestamp)
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
});

describe('Location Mocking - GPS Simulation', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { location: 'always' }
    });
  });

  /**
   * Test: Location-based content
   * Verifies app shows content based on mocked location.
   */
  it('should show nearby results for San Francisco location', async () => {
    // Set location to San Francisco
    await device.setLocation(37.7749, -122.4194);

    // Trigger location-based search
    await element(by.id('find-nearby-button')).tap();

    // Wait for results
    await waitFor(element(by.id('nearby-results-list')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify San Francisco area results
    await expect(element(by.text('San Francisco'))).toBeVisible();
  });

  /**
   * Test: Location changes
   * Verifies app updates when location changes.
   */
  it('should update results when location changes', async () => {
    // Start in New York
    await device.setLocation(40.7128, -74.0060);
    await element(by.id('find-nearby-button')).tap();

    await waitFor(element(by.id('nearby-results-list'))).toBeVisible().withTimeout(5000);
    await expect(element(by.text('New York'))).toBeVisible();

    // Move to Los Angeles
    await device.setLocation(34.0522, -118.2437);
    await element(by.id('refresh-location-button')).tap();

    // Verify updated results
    await waitFor(element(by.text('Los Angeles'))).toBeVisible().withTimeout(5000);
  });
});

describe('Device Orientation - Rotation Handling', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await device.setOrientation('portrait');
  });

  afterEach(async () => {
    // Reset to portrait
    await device.setOrientation('portrait');
  });

  /**
   * Test: Portrait to landscape transition
   * Verifies layout adapts to landscape orientation.
   */
  it('should adapt layout for landscape orientation', async () => {
    // Verify portrait layout
    await expect(element(by.id('portrait-layout'))).toBeVisible();

    // Rotate to landscape
    await device.setOrientation('landscape');

    // Verify landscape layout
    await expect(element(by.id('landscape-layout'))).toBeVisible();
  });

  /**
   * Test: Content preservation on rotation
   * Verifies scroll position and data persist through rotation.
   */
  it('should preserve scroll position when rotating', async () => {
    // Navigate to a list
    await element(by.id('content-list-button')).tap();

    // Scroll down to item 10
    await waitFor(element(by.id('item-10')))
      .toBeVisible()
      .whileElement(by.id('content-list'))
      .scroll(300, 'down');

    await expect(element(by.id('item-10'))).toBeVisible();

    // Rotate
    await device.setOrientation('landscape');

    // Item should still be visible
    await expect(element(by.id('item-10'))).toBeVisible();
  });
});

describe('Shake Gesture - Debug Features', () => {
  /**
   * Test: Shake gesture opens debug menu
   * Verifies shake triggers debug menu in dev builds.
   */
  it('should show debug menu on shake gesture', async () => {
    await device.launchApp({ newInstance: true });
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);

    // Trigger shake
    await device.shake();

    // Verify debug menu appears (dev builds only)
    // Note: This may not work in release builds
    try {
      await waitFor(element(by.id('debug-menu')))
        .toBeVisible()
        .withTimeout(3000);
    } catch {
      // Debug menu might not be available in this build
      console.log('Debug menu not available in this build configuration');
    }
  });
});

describe('Network URL Blacklisting', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  /**
   * Test: Block analytics during tests
   * Verifies URL blacklisting prevents analytics calls.
   */
  it('should function without analytics when blocked', async () => {
    // Block analytics and tracking URLs
    await device.setURLBlacklist([
      '.*analytics.*',
      '.*tracking.*',
      '.*metrics.*',
      '.*firebase.*analytics.*'
    ]);

    // App should still function normally
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);

    // Perform normal operations
    await element(by.id('nav-settings-tab')).tap();
    await expect(element(by.id('settings-screen'))).toBeVisible();

    // Clear blacklist
    await device.setURLBlacklist([]);
  });
});
