/**
 * Example: File Management E2E Tests
 *
 * Tests for file operations including:
 * - File browsing
 * - Upload/download
 * - File actions (rename, delete, share)
 * - Folder management
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('File Management - Browsing', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-files')).tap();
  });

  it('should display files list', async () => {
    await expect(element(by.id('files-screen'))).toBeVisible();
    await expect(element(by.id('files-list'))).toBeVisible();
  });

  it('should show file details', async () => {
    await expect(element(by.id('file-item-0-name'))).toBeVisible();
    await expect(element(by.id('file-item-0-size'))).toBeVisible();
    await expect(element(by.id('file-item-0-date'))).toBeVisible();
  });

  it('should switch to grid view', async () => {
    await element(by.id('view-toggle')).tap();
    await expect(element(by.id('files-grid'))).toBeVisible();
  });

  it('should sort files by name', async () => {
    await element(by.id('sort-button')).tap();
    await element(by.id('sort-by-name')).tap();
    await expect(element(by.id('sort-indicator-name'))).toBeVisible();
  });

  it('should sort files by date', async () => {
    await element(by.id('sort-button')).tap();
    await element(by.id('sort-by-date')).tap();
    await expect(element(by.id('sort-indicator-date'))).toBeVisible();
  });

  it('should sort files by size', async () => {
    await element(by.id('sort-button')).tap();
    await element(by.id('sort-by-size')).tap();
    await expect(element(by.id('sort-indicator-size'))).toBeVisible();
  });
});

describe('File Management - Folders', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-files')).tap();
  });

  it('should navigate into folder', async () => {
    await element(by.id('folder-item-0')).tap();
    await expect(element(by.id('breadcrumb-path'))).toBeVisible();
  });

  it('should navigate back via breadcrumb', async () => {
    await element(by.id('folder-item-0')).tap();
    await element(by.id('breadcrumb-root')).tap();
    await expect(element(by.id('files-screen'))).toBeVisible();
  });

  it('should create new folder', async () => {
    await element(by.id('add-button')).tap();
    await element(by.id('create-folder-option')).tap();
    await element(by.id('folder-name-input')).typeText('New Folder');
    await element(by.id('create-folder-confirm')).tap();

    await expect(element(by.id('folder-New-Folder'))).toBeVisible();
  });

  it('should rename folder', async () => {
    await element(by.id('folder-item-0')).longPress();
    await element(by.id('rename-option')).tap();
    await element(by.id('rename-input')).clearText();
    await element(by.id('rename-input')).typeText('Renamed Folder');
    await element(by.id('rename-confirm')).tap();

    await expect(element(by.id('folder-Renamed-Folder'))).toBeVisible();
  });

  it('should delete folder', async () => {
    await element(by.id('folder-item-0')).longPress();
    await element(by.id('delete-option')).tap();
    await element(by.id('confirm-delete')).tap();

    await expect(element(by.id('folder-item-0'))).not.toBeVisible();
  });
});

describe('File Management - File Actions', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-files')).tap();
  });

  it('should open file preview', async () => {
    await element(by.id('file-item-0')).tap();
    await expect(element(by.id('file-preview-screen'))).toBeVisible();
  });

  it('should rename file', async () => {
    await element(by.id('file-item-0')).longPress();
    await element(by.id('rename-option')).tap();
    await element(by.id('rename-input')).clearText();
    await element(by.id('rename-input')).typeText('renamed-file.pdf');
    await element(by.id('rename-confirm')).tap();

    await expect(element(by.id('file-renamed-file.pdf'))).toBeVisible();
  });

  it('should delete file', async () => {
    await element(by.id('file-item-0')).longPress();
    await element(by.id('delete-option')).tap();
    await element(by.id('confirm-delete')).tap();

    await expect(element(by.id('file-deleted-toast'))).toBeVisible();
  });

  it('should share file', async () => {
    await element(by.id('file-item-0')).longPress();
    await element(by.id('share-option')).tap();

    await expect(element(by.id('share-sheet'))).toBeVisible();
  });

  it('should move file to folder', async () => {
    await element(by.id('file-item-0')).longPress();
    await element(by.id('move-option')).tap();
    await element(by.id('destination-folder-0')).tap();
    await element(by.id('move-confirm')).tap();

    await expect(element(by.id('file-moved-toast'))).toBeVisible();
  });

  it('should copy file', async () => {
    await element(by.id('file-item-0')).longPress();
    await element(by.id('copy-option')).tap();
    await element(by.id('destination-folder-0')).tap();
    await element(by.id('copy-confirm')).tap();

    await expect(element(by.id('file-copied-toast'))).toBeVisible();
  });
});

describe('File Management - Upload', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-files')).tap();
  });

  it('should show upload options', async () => {
    await element(by.id('add-button')).tap();
    await expect(element(by.id('upload-file-option'))).toBeVisible();
    await expect(element(by.id('take-photo-option'))).toBeVisible();
  });

  it('should show upload progress', async () => {
    await element(by.id('add-button')).tap();
    await element(by.id('upload-file-option')).tap();
    // Simulate file selection
    await expect(element(by.id('upload-progress'))).toBeVisible();
  });

  it('should cancel upload', async () => {
    await element(by.id('add-button')).tap();
    await element(by.id('upload-file-option')).tap();
    await element(by.id('cancel-upload-button')).tap();

    await expect(element(by.id('upload-cancelled-toast'))).toBeVisible();
  });
});

describe('File Management - Search', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-files')).tap();
  });

  it('should search files', async () => {
    await element(by.id('search-button')).tap();
    await element(by.id('file-search-input')).typeText('report');
    await element(by.id('file-search-input')).tapReturnKey();

    await waitFor(element(by.id('search-results'))).toBeVisible().withTimeout(5000);
  });

  it('should filter by file type', async () => {
    await element(by.id('filter-button')).tap();
    await element(by.id('filter-pdf')).tap();

    await expect(element(by.id('filter-active-pdf'))).toBeVisible();
  });
});
