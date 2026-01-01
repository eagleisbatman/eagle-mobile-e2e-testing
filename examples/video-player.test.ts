/**
 * Example: Video Player E2E Tests
 *
 * Tests for video playback including:
 * - Playback controls
 * - Quality selection
 * - Fullscreen mode
 * - Subtitles/captions
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Video Player - Playback Controls', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('video-item-0')).tap();
    await waitFor(element(by.id('video-player-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should display video player with controls', async () => {
    await expect(element(by.id('video-player'))).toBeVisible();
    await element(by.id('video-player')).tap();
    await expect(element(by.id('play-pause-button'))).toBeVisible();
  });

  it('should play and pause video', async () => {
    await element(by.id('video-player')).tap();
    await element(by.id('play-pause-button')).tap();
    await expect(element(by.id('pause-icon'))).toBeVisible();

    await element(by.id('play-pause-button')).tap();
    await expect(element(by.id('play-icon'))).toBeVisible();
  });

  it('should show progress bar', async () => {
    await element(by.id('video-player')).tap();
    await expect(element(by.id('progress-bar'))).toBeVisible();
    await expect(element(by.id('current-time'))).toBeVisible();
    await expect(element(by.id('total-duration'))).toBeVisible();
  });

  it('should seek video via progress bar', async () => {
    await element(by.id('video-player')).tap();
    await element(by.id('progress-bar')).swipe('right', 'slow', 0.5);

    // Time should advance
    await expect(element(by.id('current-time'))).not.toHaveText('0:00');
  });

  it('should skip forward 10 seconds', async () => {
    await element(by.id('video-player')).tap();
    await element(by.id('skip-forward-button')).tap();

    await expect(element(by.id('current-time'))).toHaveText('0:10');
  });

  it('should skip backward 10 seconds', async () => {
    await element(by.id('video-player')).tap();
    await element(by.id('skip-forward-button')).tap();
    await element(by.id('skip-forward-button')).tap();
    await element(by.id('skip-backward-button')).tap();

    await expect(element(by.id('current-time'))).toHaveText('0:10');
  });
});

describe('Video Player - Fullscreen', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('video-item-0')).tap();
    await waitFor(element(by.id('video-player-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should enter fullscreen mode', async () => {
    await element(by.id('video-player')).tap();
    await element(by.id('fullscreen-button')).tap();

    await expect(element(by.id('video-player-fullscreen'))).toBeVisible();
  });

  it('should exit fullscreen mode', async () => {
    await element(by.id('video-player')).tap();
    await element(by.id('fullscreen-button')).tap();
    await element(by.id('video-player-fullscreen')).tap();
    await element(by.id('exit-fullscreen-button')).tap();

    await expect(element(by.id('video-player-screen'))).toBeVisible();
  });
});

describe('Video Player - Quality Selection', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('video-item-0')).tap();
    await waitFor(element(by.id('video-player-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should open quality settings', async () => {
    await element(by.id('video-player')).tap();
    await element(by.id('settings-button')).tap();

    await expect(element(by.id('quality-options'))).toBeVisible();
  });

  it('should select different quality', async () => {
    await element(by.id('video-player')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.id('quality-720p')).tap();

    await expect(element(by.id('current-quality'))).toHaveText('720p');
  });
});

describe('Video Player - Subtitles', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('video-item-0')).tap();
    await waitFor(element(by.id('video-player-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should enable subtitles', async () => {
    await element(by.id('video-player')).tap();
    await element(by.id('subtitles-button')).tap();
    await element(by.id('subtitle-english')).tap();

    await expect(element(by.id('subtitle-overlay'))).toBeVisible();
  });

  it('should disable subtitles', async () => {
    await element(by.id('video-player')).tap();
    await element(by.id('subtitles-button')).tap();
    await element(by.id('subtitle-english')).tap();
    await element(by.id('subtitles-button')).tap();
    await element(by.id('subtitle-off')).tap();

    await expect(element(by.id('subtitle-overlay'))).not.toBeVisible();
  });
});
