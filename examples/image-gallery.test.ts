/**
 * Example: Image Gallery E2E Tests
 *
 * Tests for image gallery including:
 * - Grid/list views
 * - Image viewer with zoom
 * - Albums and folders
 * - Image selection
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Image Gallery - Grid View', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-photos')).tap();
    await waitFor(element(by.id('gallery-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should display photo grid', async () => {
    await expect(element(by.id('photo-grid'))).toBeVisible();
    await expect(element(by.id('photo-item-0'))).toBeVisible();
  });

  it('should switch to list view', async () => {
    await element(by.id('view-toggle-button')).tap();
    await expect(element(by.id('photo-list'))).toBeVisible();
  });

  it('should scroll through photos', async () => {
    await element(by.id('photo-grid')).scroll(500, 'down');
    await expect(element(by.id('photo-item-20'))).toBeVisible();
  });
});

describe('Image Gallery - Image Viewer', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-photos')).tap();
    await element(by.id('photo-item-0')).tap();
    await waitFor(element(by.id('image-viewer'))).toBeVisible().withTimeout(5000);
  });

  it('should display full image', async () => {
    await expect(element(by.id('full-image'))).toBeVisible();
  });

  it('should zoom in with double tap', async () => {
    await element(by.id('full-image')).multiTap(2);
    await expect(element(by.id('zoom-indicator'))).toHaveText('2x');
  });

  it('should zoom out with double tap', async () => {
    await element(by.id('full-image')).multiTap(2);
    await element(by.id('full-image')).multiTap(2);
    await expect(element(by.id('zoom-indicator'))).toHaveText('1x');
  });

  it('should swipe to next image', async () => {
    await element(by.id('full-image')).swipe('left');
    await expect(element(by.id('image-index'))).toHaveText('2');
  });

  it('should swipe to previous image', async () => {
    await element(by.id('full-image')).swipe('left');
    await element(by.id('full-image')).swipe('right');
    await expect(element(by.id('image-index'))).toHaveText('1');
  });

  it('should close viewer', async () => {
    await element(by.id('close-viewer-button')).tap();
    await expect(element(by.id('gallery-screen'))).toBeVisible();
  });
});

describe('Image Gallery - Albums', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-photos')).tap();
    await element(by.id('albums-tab')).tap();
  });

  it('should display albums list', async () => {
    await expect(element(by.id('albums-list'))).toBeVisible();
    await expect(element(by.id('album-item-0'))).toBeVisible();
  });

  it('should open album', async () => {
    await element(by.id('album-item-0')).tap();
    await expect(element(by.id('album-detail-screen'))).toBeVisible();
  });

  it('should show album photo count', async () => {
    await expect(element(by.id('album-item-0-count'))).toHaveText(/\d+ photos/);
  });

  it('should create new album', async () => {
    await element(by.id('create-album-button')).tap();
    await element(by.id('album-name-input')).typeText('Vacation 2024');
    await element(by.id('create-album-confirm')).tap();

    await expect(element(by.id('album-Vacation-2024'))).toBeVisible();
  });
});

describe('Image Gallery - Selection Mode', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-photos')).tap();
  });

  it('should enter selection mode on long press', async () => {
    await element(by.id('photo-item-0')).longPress();
    await expect(element(by.id('selection-toolbar'))).toBeVisible();
  });

  it('should select multiple photos', async () => {
    await element(by.id('photo-item-0')).longPress();
    await element(by.id('photo-item-1')).tap();
    await element(by.id('photo-item-2')).tap();

    await expect(element(by.id('selected-count'))).toHaveText('3 selected');
  });

  it('should select all photos', async () => {
    await element(by.id('photo-item-0')).longPress();
    await element(by.id('select-all-button')).tap();

    await expect(element(by.id('selected-count'))).toHaveText(/\d+ selected/);
  });

  it('should delete selected photos', async () => {
    await element(by.id('photo-item-0')).longPress();
    await element(by.id('delete-selected-button')).tap();
    await element(by.id('confirm-delete-button')).tap();

    await expect(element(by.id('selection-toolbar'))).not.toBeVisible();
  });

  it('should share selected photos', async () => {
    await element(by.id('photo-item-0')).longPress();
    await element(by.id('share-selected-button')).tap();

    await expect(element(by.id('share-sheet'))).toBeVisible();
  });

  it('should exit selection mode', async () => {
    await element(by.id('photo-item-0')).longPress();
    await element(by.id('cancel-selection-button')).tap();

    await expect(element(by.id('selection-toolbar'))).not.toBeVisible();
  });
});
