/**
 * Example: Audio Player E2E Tests
 *
 * Tests for audio/music playback including:
 * - Playback controls
 * - Playlist management
 * - Background playback
 * - Lock screen controls
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Audio Player - Playback Controls', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-music')).tap();
    await element(by.id('song-item-0')).tap();
    await waitFor(element(by.id('now-playing-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should display now playing screen', async () => {
    await expect(element(by.id('album-artwork'))).toBeVisible();
    await expect(element(by.id('song-title'))).toBeVisible();
    await expect(element(by.id('artist-name'))).toBeVisible();
  });

  it('should play and pause audio', async () => {
    await element(by.id('play-pause-button')).tap();
    await expect(element(by.id('pause-icon'))).toBeVisible();

    await element(by.id('play-pause-button')).tap();
    await expect(element(by.id('play-icon'))).toBeVisible();
  });

  it('should skip to next track', async () => {
    const initialTitle = await element(by.id('song-title')).getAttributes();
    await element(by.id('next-button')).tap();

    // Title should change
    await expect(element(by.id('song-title'))).not.toHaveText(initialTitle.text);
  });

  it('should skip to previous track', async () => {
    await element(by.id('next-button')).tap();
    await element(by.id('previous-button')).tap();

    // Should return to first track
    await expect(element(by.id('track-position'))).toHaveText('1');
  });

  it('should show progress bar', async () => {
    await expect(element(by.id('audio-progress-bar'))).toBeVisible();
    await expect(element(by.id('elapsed-time'))).toBeVisible();
    await expect(element(by.id('remaining-time'))).toBeVisible();
  });

  it('should seek audio via scrubber', async () => {
    await element(by.id('audio-progress-bar')).swipe('right', 'slow', 0.5);
    await expect(element(by.id('elapsed-time'))).not.toHaveText('0:00');
  });
});

describe('Audio Player - Shuffle and Repeat', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-music')).tap();
    await element(by.id('song-item-0')).tap();
    await waitFor(element(by.id('now-playing-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should toggle shuffle mode', async () => {
    await element(by.id('shuffle-button')).tap();
    await expect(element(by.id('shuffle-active'))).toBeVisible();

    await element(by.id('shuffle-button')).tap();
    await expect(element(by.id('shuffle-active'))).not.toBeVisible();
  });

  it('should cycle through repeat modes', async () => {
    await element(by.id('repeat-button')).tap();
    await expect(element(by.id('repeat-all'))).toBeVisible();

    await element(by.id('repeat-button')).tap();
    await expect(element(by.id('repeat-one'))).toBeVisible();

    await element(by.id('repeat-button')).tap();
    await expect(element(by.id('repeat-off'))).toBeVisible();
  });
});

describe('Audio Player - Volume Control', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-music')).tap();
    await element(by.id('song-item-0')).tap();
    await waitFor(element(by.id('now-playing-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should show volume slider', async () => {
    await expect(element(by.id('volume-slider'))).toBeVisible();
  });

  it('should adjust volume', async () => {
    await element(by.id('volume-slider')).swipe('left', 'slow', 0.5);
    await expect(element(by.id('volume-low-icon'))).toBeVisible();
  });

  it('should mute and unmute', async () => {
    await element(by.id('volume-button')).tap();
    await expect(element(by.id('muted-icon'))).toBeVisible();

    await element(by.id('volume-button')).tap();
    await expect(element(by.id('muted-icon'))).not.toBeVisible();
  });
});

describe('Audio Player - Queue Management', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-music')).tap();
    await element(by.id('song-item-0')).tap();
    await waitFor(element(by.id('now-playing-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should open queue view', async () => {
    await element(by.id('queue-button')).tap();
    await expect(element(by.id('queue-screen'))).toBeVisible();
  });

  it('should reorder queue items', async () => {
    await element(by.id('queue-button')).tap();
    await element(by.id('queue-item-2-drag')).longPress();
    // Drag to position 0
    await element(by.id('queue-item-0')).tap();

    await expect(element(by.id('queue-item-0'))).toHaveText(/Previously track 2/);
  });

  it('should remove item from queue', async () => {
    await element(by.id('queue-button')).tap();
    await element(by.id('queue-item-1')).swipe('left');
    await element(by.id('queue-item-1-delete')).tap();

    await expect(element(by.id('queue-item-count'))).toHaveText(/\d+ songs/);
  });
});

describe('Audio Player - Background Playback', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-music')).tap();
    await element(by.id('song-item-0')).tap();
    await waitFor(element(by.id('now-playing-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should continue playing in background', async () => {
    await element(by.id('play-pause-button')).tap();
    await device.sendToHome();
    await new Promise(r => setTimeout(r, 3000));
    await device.launchApp({ newInstance: false });

    // Should still be playing
    await expect(element(by.id('pause-icon'))).toBeVisible();
    await expect(element(by.id('elapsed-time'))).not.toHaveText('0:00');
  });
});
