/**
 * Example: Maps and Location E2E Tests
 *
 * Tests for maps functionality including:
 * - Map display and navigation
 * - Search and directions
 * - Place details
 * - Location services
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Maps - Display', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { location: 'always' }
    });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-maps')).tap();
  });

  it('should display map view', async () => {
    await expect(element(by.id('map-view'))).toBeVisible();
  });

  it('should show current location', async () => {
    await device.setLocation(37.7749, -122.4194);
    await element(by.id('my-location-button')).tap();

    await expect(element(by.id('current-location-marker'))).toBeVisible();
  });

  it('should zoom in', async () => {
    await element(by.id('zoom-in-button')).tap();
    await expect(element(by.id('zoom-level'))).toHaveText(/\d+/);
  });

  it('should zoom out', async () => {
    await element(by.id('zoom-out-button')).tap();
    await expect(element(by.id('zoom-level'))).toHaveText(/\d+/);
  });

  it('should switch map type', async () => {
    await element(by.id('map-type-button')).tap();
    await element(by.id('satellite-view-option')).tap();

    await expect(element(by.id('map-type-satellite'))).toBeVisible();
  });
});

describe('Maps - Search', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { location: 'always' }
    });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-maps')).tap();
  });

  it('should search for location', async () => {
    await element(by.id('search-input')).tap();
    await element(by.id('search-input')).typeText('Coffee shops');
    await element(by.id('search-input')).tapReturnKey();

    await waitFor(element(by.id('search-results'))).toBeVisible().withTimeout(5000);
  });

  it('should show search suggestions', async () => {
    await element(by.id('search-input')).tap();
    await element(by.id('search-input')).typeText('Star');

    await waitFor(element(by.id('suggestions-list'))).toBeVisible().withTimeout(3000);
  });

  it('should select search result', async () => {
    await element(by.id('search-input')).tap();
    await element(by.id('search-input')).typeText('Restaurant');
    await element(by.id('search-input')).tapReturnKey();
    await waitFor(element(by.id('search-results'))).toBeVisible().withTimeout(5000);

    await element(by.id('search-result-0')).tap();

    await expect(element(by.id('place-marker'))).toBeVisible();
  });

  it('should show nearby places', async () => {
    await device.setLocation(37.7749, -122.4194);
    await element(by.id('nearby-button')).tap();

    await expect(element(by.id('nearby-places-list'))).toBeVisible();
  });

  it('should filter by category', async () => {
    await element(by.id('category-restaurants')).tap();

    await expect(element(by.id('restaurant-markers'))).toBeVisible();
  });
});

describe('Maps - Directions', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { location: 'always' }
    });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-maps')).tap();
    await device.setLocation(37.7749, -122.4194);
  });

  it('should open directions panel', async () => {
    await element(by.id('directions-button')).tap();

    await expect(element(by.id('directions-panel'))).toBeVisible();
    await expect(element(by.id('start-location-input'))).toBeVisible();
    await expect(element(by.id('destination-input'))).toBeVisible();
  });

  it('should get driving directions', async () => {
    await element(by.id('directions-button')).tap();
    await element(by.id('destination-input')).typeText('Golden Gate Bridge');
    await element(by.id('get-directions-button')).tap();

    await waitFor(element(by.id('route-overview'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('driving-mode-active'))).toBeVisible();
  });

  it('should switch to walking directions', async () => {
    await element(by.id('directions-button')).tap();
    await element(by.id('destination-input')).typeText('Union Square');
    await element(by.id('walking-mode-button')).tap();
    await element(by.id('get-directions-button')).tap();

    await expect(element(by.id('walking-mode-active'))).toBeVisible();
  });

  it('should switch to transit directions', async () => {
    await element(by.id('directions-button')).tap();
    await element(by.id('destination-input')).typeText('Airport');
    await element(by.id('transit-mode-button')).tap();
    await element(by.id('get-directions-button')).tap();

    await expect(element(by.id('transit-mode-active'))).toBeVisible();
  });

  it('should show route steps', async () => {
    await element(by.id('directions-button')).tap();
    await element(by.id('destination-input')).typeText('City Hall');
    await element(by.id('get-directions-button')).tap();
    await waitFor(element(by.id('route-overview'))).toBeVisible().withTimeout(5000);

    await element(by.id('expand-steps-button')).tap();

    await expect(element(by.id('route-step-0'))).toBeVisible();
  });

  it('should start navigation', async () => {
    await element(by.id('directions-button')).tap();
    await element(by.id('destination-input')).typeText('Downtown');
    await element(by.id('get-directions-button')).tap();
    await waitFor(element(by.id('route-overview'))).toBeVisible().withTimeout(5000);

    await element(by.id('start-navigation-button')).tap();

    await expect(element(by.id('navigation-view'))).toBeVisible();
  });
});

describe('Maps - Place Details', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { location: 'always' }
    });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-maps')).tap();
    await element(by.id('search-input')).typeText('Starbucks');
    await element(by.id('search-input')).tapReturnKey();
    await waitFor(element(by.id('search-results'))).toBeVisible().withTimeout(5000);
    await element(by.id('search-result-0')).tap();
  });

  it('should show place information', async () => {
    await element(by.id('place-card')).tap();

    await expect(element(by.id('place-detail-screen'))).toBeVisible();
    await expect(element(by.id('place-name'))).toBeVisible();
    await expect(element(by.id('place-address'))).toBeVisible();
    await expect(element(by.id('place-rating'))).toBeVisible();
  });

  it('should show opening hours', async () => {
    await element(by.id('place-card')).tap();

    await expect(element(by.id('opening-hours'))).toBeVisible();
  });

  it('should call place', async () => {
    await element(by.id('place-card')).tap();
    await element(by.id('call-button')).tap();

    await expect(element(by.id('phone-dialer'))).toBeVisible();
  });

  it('should save place to favorites', async () => {
    await element(by.id('place-card')).tap();
    await element(by.id('save-place-button')).tap();

    await expect(element(by.id('place-saved-toast'))).toBeVisible();
  });

  it('should share place', async () => {
    await element(by.id('place-card')).tap();
    await element(by.id('share-place-button')).tap();

    await expect(element(by.id('share-sheet'))).toBeVisible();
  });
});
