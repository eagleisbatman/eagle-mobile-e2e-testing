/**
 * Example: Device Permissions E2E Tests
 *
 * This file demonstrates testing device permissions for camera,
 * location, microphone, and other native capabilities.
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Device Permissions - Camera Access', () => {
  beforeEach(async () => {
    // Each test starts with a fresh app state
    await device.launchApp({ delete: true, newInstance: true });
  });

  /**
   * Test: Camera permission granted
   * Verifies app functions correctly with camera access.
   */
  it('should open camera view when permission is granted', async () => {
    // Launch with camera permission granted
    await device.launchApp({
      newInstance: true,
      permissions: { camera: 'YES' }
    });

    // Navigate to feature requiring camera
    await element(by.id('scan-qr-button')).tap();

    // Verify camera view is visible
    await waitFor(element(by.id('camera-preview')))
      .toBeVisible()
      .withTimeout(5000);
  });

  /**
   * Test: Camera permission denied
   * Verifies app shows appropriate message when camera access denied.
   */
  it('should show permission denied message when camera access denied', async () => {
    // Launch with camera permission denied
    await device.launchApp({
      newInstance: true,
      permissions: { camera: 'NO' }
    });

    // Navigate to feature requiring camera
    await element(by.id('scan-qr-button')).tap();

    // Verify permission denied UI
    await waitFor(element(by.id('camera-permission-denied')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.id('open-settings-button'))).toBeVisible();
  });
});

describe('Device Permissions - Location Access', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  /**
   * Test: Location "always" permission
   * Verifies background location tracking works.
   */
  it('should enable background location with always permission', async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { location: 'always' }
    });

    // Navigate to location feature
    await element(by.id('find-nearby-button')).tap();

    // Verify location features enabled
    await expect(element(by.id('background-tracking-toggle'))).toBeVisible();
    await expect(element(by.id('location-map'))).toBeVisible();
  });

  /**
   * Test: Location "when in use" permission
   * Verifies foreground-only location works correctly.
   */
  it('should show location only while app is active with inuse permission', async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { location: 'inuse' }
    });

    await element(by.id('find-nearby-button')).tap();

    // Background tracking should be disabled
    await expect(element(by.id('background-tracking-disabled-notice'))).toBeVisible();

    // But foreground location should work
    await expect(element(by.id('location-map'))).toBeVisible();
  });

  /**
   * Test: Location permission denied
   * Verifies app handles location denial gracefully.
   */
  it('should show manual location entry when location denied', async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { location: 'never' }
    });

    await element(by.id('find-nearby-button')).tap();

    // Should show manual entry option
    await expect(element(by.id('manual-location-input'))).toBeVisible();
    await expect(element(by.id('location-permission-prompt'))).toBeVisible();
  });
});

describe('Device Permissions - Microphone Access', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  /**
   * Test: Microphone permission granted
   * Verifies voice recording works when permitted.
   */
  it('should enable voice recording when microphone granted', async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { microphone: 'YES' }
    });

    await element(by.id('voice-note-button')).tap();

    // Verify recording UI appears
    await expect(element(by.id('recording-indicator'))).toBeVisible();
    await expect(element(by.id('stop-recording-button'))).toBeVisible();
  });

  /**
   * Test: Microphone permission denied
   * Verifies voice features are disabled when denied.
   */
  it('should show text-only mode when microphone denied', async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { microphone: 'NO' }
    });

    await element(by.id('voice-note-button')).tap();

    // Should show text fallback
    await expect(element(by.id('microphone-permission-required'))).toBeVisible();
    await expect(element(by.id('text-note-fallback-button'))).toBeVisible();
  });
});

describe('Device Permissions - Push Notifications', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  /**
   * Test: Notifications permission granted
   * Verifies notification settings are available when permitted.
   */
  it('should show notification preferences when notifications granted', async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' }
    });

    await element(by.id('nav-settings-tab')).tap();
    await element(by.id('notification-settings-button')).tap();

    // All notification options should be available
    await expect(element(by.id('push-notifications-toggle'))).toBeVisible();
    await expect(element(by.id('notification-sound-toggle'))).toBeVisible();
    await expect(element(by.id('notification-badge-toggle'))).toBeVisible();
  });

  /**
   * Test: Notifications permission denied
   * Verifies app guides user to enable notifications.
   */
  it('should show enable notifications prompt when denied', async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'NO' }
    });

    await element(by.id('nav-settings-tab')).tap();
    await element(by.id('notification-settings-button')).tap();

    // Should show prompt to enable
    await expect(element(by.id('notifications-disabled-banner'))).toBeVisible();
    await expect(element(by.id('open-notification-settings-button'))).toBeVisible();
  });
});

describe('Device Permissions - Multiple Permissions', () => {
  /**
   * Test: App with all permissions granted
   * Verifies all features work when fully permitted.
   */
  it('should have all features enabled with full permissions', async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {
        camera: 'YES',
        microphone: 'YES',
        location: 'always',
        notifications: 'YES',
        photos: 'YES',
        contacts: 'YES'
      }
    });

    // All permission-dependent features should be available
    await expect(element(by.id('camera-feature'))).toBeVisible();
    await expect(element(by.id('voice-feature'))).toBeVisible();
    await expect(element(by.id('location-feature'))).toBeVisible();
  });

  /**
   * Test: App with minimal permissions
   * Verifies app degrades gracefully with restricted permissions.
   */
  it('should show limited mode with minimal permissions', async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {
        camera: 'NO',
        microphone: 'NO',
        location: 'never',
        notifications: 'NO',
        photos: 'NO',
        contacts: 'NO'
      }
    });

    // Should show limited mode banner or alternatives
    await expect(element(by.id('limited-mode-banner'))).toBeVisible();
  });
});
