/**
 * Example: Notes Editor E2E Tests
 *
 * Tests for note-taking functionality including:
 * - Note creation and editing
 * - Rich text formatting
 * - Note organization
 * - Sync and backup
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Notes - Creation and Editing', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-notes')).tap();
  });

  it('should display notes list', async () => {
    await expect(element(by.id('notes-screen'))).toBeVisible();
    await expect(element(by.id('notes-list'))).toBeVisible();
  });

  it('should create new note', async () => {
    await element(by.id('create-note-button')).tap();
    await element(by.id('note-title-input')).typeText('My First Note');
    await element(by.id('note-content-input')).typeText('This is the content.');
    await element(by.id('save-note-button')).tap();

    await expect(element(by.id('note-My-First-Note'))).toBeVisible();
  });

  it('should edit existing note', async () => {
    await element(by.id('note-item-0')).tap();
    await element(by.id('note-content-input')).typeText(' Updated content.');
    await element(by.id('save-note-button')).tap();

    await expect(element(by.id('note-saved-toast'))).toBeVisible();
  });

  it('should auto-save note', async () => {
    await element(by.id('create-note-button')).tap();
    await element(by.id('note-title-input')).typeText('Auto-saved Note');
    await element(by.id('note-content-input')).typeText('Content here.');

    // Wait for auto-save
    await new Promise(r => setTimeout(r, 3000));
    await element(by.id('back-button')).tap();

    await expect(element(by.id('note-Auto-saved-Note'))).toBeVisible();
  });

  it('should delete note', async () => {
    await element(by.id('note-item-0')).longPress();
    await element(by.id('delete-note-option')).tap();
    await element(by.id('confirm-delete')).tap();

    await expect(element(by.id('note-deleted-toast'))).toBeVisible();
  });
});

describe('Notes - Rich Text Formatting', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-notes')).tap();
    await element(by.id('create-note-button')).tap();
  });

  it('should display formatting toolbar', async () => {
    await element(by.id('note-content-input')).tap();
    await expect(element(by.id('formatting-toolbar'))).toBeVisible();
  });

  it('should apply bold formatting', async () => {
    await element(by.id('note-content-input')).typeText('Bold text');
    await element(by.id('select-all-button')).tap();
    await element(by.id('bold-button')).tap();

    await expect(element(by.id('bold-active'))).toBeVisible();
  });

  it('should apply italic formatting', async () => {
    await element(by.id('note-content-input')).typeText('Italic text');
    await element(by.id('select-all-button')).tap();
    await element(by.id('italic-button')).tap();

    await expect(element(by.id('italic-active'))).toBeVisible();
  });

  it('should create bulleted list', async () => {
    await element(by.id('bullet-list-button')).tap();
    await element(by.id('note-content-input')).typeText('Item 1');

    await expect(element(by.id('bullet-list-active'))).toBeVisible();
  });

  it('should create numbered list', async () => {
    await element(by.id('numbered-list-button')).tap();
    await element(by.id('note-content-input')).typeText('Step 1');

    await expect(element(by.id('numbered-list-active'))).toBeVisible();
  });

  it('should add checkbox', async () => {
    await element(by.id('checkbox-button')).tap();
    await element(by.id('note-content-input')).typeText('Task item');

    await expect(element(by.id('checkbox-item-0'))).toBeVisible();
  });
});

describe('Notes - Organization', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('notes-user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-notes')).tap();
  });

  it('should create folder', async () => {
    await element(by.id('add-folder-button')).tap();
    await element(by.id('folder-name-input')).typeText('Work Notes');
    await element(by.id('create-folder-confirm')).tap();

    await expect(element(by.id('folder-Work-Notes'))).toBeVisible();
  });

  it('should move note to folder', async () => {
    await element(by.id('note-item-0')).longPress();
    await element(by.id('move-to-folder-option')).tap();
    await element(by.id('folder-Work-Notes')).tap();

    await expect(element(by.id('note-moved-toast'))).toBeVisible();
  });

  it('should add tag to note', async () => {
    await element(by.id('note-item-0')).tap();
    await element(by.id('add-tag-button')).tap();
    await element(by.id('tag-input')).typeText('important');
    await element(by.id('add-tag-confirm')).tap();

    await expect(element(by.id('tag-important'))).toBeVisible();
  });

  it('should filter notes by tag', async () => {
    await element(by.id('filter-button')).tap();
    await element(by.id('tag-filter-important')).tap();

    await expect(element(by.id('filter-active'))).toBeVisible();
  });

  it('should pin note', async () => {
    await element(by.id('note-item-0')).longPress();
    await element(by.id('pin-note-option')).tap();

    await expect(element(by.id('pinned-section'))).toBeVisible();
  });
});

describe('Notes - Search', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('notes-user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-notes')).tap();
  });

  it('should search notes by title', async () => {
    await element(by.id('search-input')).typeText('meeting');
    await waitFor(element(by.id('search-results'))).toBeVisible().withTimeout(3000);

    await expect(element(by.id('search-result-0'))).toBeVisible();
  });

  it('should search notes by content', async () => {
    await element(by.id('search-input')).typeText('project deadline');
    await waitFor(element(by.id('search-results'))).toBeVisible().withTimeout(3000);

    await expect(element(by.id('search-result-0'))).toBeVisible();
  });

  it('should highlight search matches', async () => {
    await element(by.id('search-input')).typeText('important');
    await waitFor(element(by.id('search-results'))).toBeVisible().withTimeout(3000);

    await expect(element(by.id('search-highlight-0'))).toBeVisible();
  });
});
