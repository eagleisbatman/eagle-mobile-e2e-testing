/**
 * Example: Gaming & Entertainment App E2E Tests
 *
 * Comprehensive tests for gaming/entertainment apps including:
 * - Game menus and navigation
 * - In-game purchases
 * - Leaderboards and achievements
 * - Media playback
 * - Social features
 * - Settings and controls
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Gaming - Main Menu & Navigation', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('should display main menu with game options', async () => {
    await waitFor(element(by.id('main-menu-screen')))
      .toBeVisible()
      .withTimeout(10000);

    // Verify menu elements
    await expect(element(by.id('game-logo'))).toBeVisible();
    await expect(element(by.id('play-button'))).toBeVisible();
    await expect(element(by.id('continue-button'))).toBeVisible();
    await expect(element(by.id('leaderboard-button'))).toBeVisible();
    await expect(element(by.id('settings-button'))).toBeVisible();
    await expect(element(by.id('shop-button'))).toBeVisible();
  });

  it('should start new game session', async () => {
    await waitFor(element(by.id('main-menu-screen'))).toBeVisible().withTimeout(10000);

    await element(by.id('play-button')).tap();

    // Verify level selection or game start
    await waitFor(element(by.id('level-select-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('level-1')).tap();

    // Verify game screen loaded
    await waitFor(element(by.id('game-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('game-hud'))).toBeVisible();
    await expect(element(by.id('score-display'))).toBeVisible();
    await expect(element(by.id('pause-button'))).toBeVisible();
  });

  it('should continue saved game', async () => {
    // First play a level to create save
    await waitFor(element(by.id('main-menu-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('play-button')).tap();
    await element(by.id('level-1')).tap();
    await waitFor(element(by.id('game-screen'))).toBeVisible().withTimeout(5000);

    // Pause and save
    await element(by.id('pause-button')).tap();
    await element(by.id('save-and-exit-button')).tap();

    await waitFor(element(by.id('main-menu-screen'))).toBeVisible().withTimeout(5000);

    // Continue game
    await element(by.id('continue-button')).tap();

    // Should resume from saved state
    await waitFor(element(by.id('game-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should show level selection with locked/unlocked levels', async () => {
    await waitFor(element(by.id('main-menu-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('play-button')).tap();

    await waitFor(element(by.id('level-select-screen'))).toBeVisible().withTimeout(5000);

    // First levels unlocked
    await expect(element(by.id('level-1-unlocked'))).toBeVisible();
    await expect(element(by.id('level-1-stars'))).toBeVisible();

    // Later levels locked
    await waitFor(element(by.id('level-10-locked')))
      .toBeVisible()
      .whileElement(by.id('level-scroll-view'))
      .scroll(300, 'down');
  });
});

describe('Gaming - In-Game Actions', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Start a game
    await waitFor(element(by.id('main-menu-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('play-button')).tap();
    await element(by.id('level-1')).tap();
    await waitFor(element(by.id('game-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should pause and resume game', async () => {
    await element(by.id('pause-button')).tap();

    // Verify pause menu
    await waitFor(element(by.id('pause-menu'))).toBeVisible().withTimeout(3000);
    await expect(element(by.id('resume-button'))).toBeVisible();
    await expect(element(by.id('restart-button'))).toBeVisible();
    await expect(element(by.id('quit-button'))).toBeVisible();

    // Resume
    await element(by.id('resume-button')).tap();

    // Verify game resumed
    await expect(element(by.id('pause-menu'))).not.toBeVisible();
    await expect(element(by.id('game-screen'))).toBeVisible();
  });

  it('should restart level from pause menu', async () => {
    await element(by.id('pause-button')).tap();
    await waitFor(element(by.id('pause-menu'))).toBeVisible().withTimeout(3000);

    await element(by.id('restart-button')).tap();
    await element(by.id('confirm-restart-button')).tap();

    // Verify level restarted (score reset)
    await waitFor(element(by.id('game-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('score-display'))).toHaveText('0');
  });

  it('should show game over screen on failure', async () => {
    // This would require game-specific actions to trigger failure
    // For demo, we'll check the game over screen elements
    await waitFor(element(by.id('game-over-screen')))
      .toBeVisible()
      .withTimeout(60000); // Game might take time

    await expect(element(by.id('final-score'))).toBeVisible();
    await expect(element(by.id('retry-button'))).toBeVisible();
    await expect(element(by.id('main-menu-button'))).toBeVisible();
  });

  it('should show victory screen on level completion', async () => {
    // Complete level actions would go here
    await waitFor(element(by.id('victory-screen')))
      .toBeVisible()
      .withTimeout(120000);

    await expect(element(by.id('level-score'))).toBeVisible();
    await expect(element(by.id('stars-earned'))).toBeVisible();
    await expect(element(by.id('next-level-button'))).toBeVisible();
    await expect(element(by.id('replay-button'))).toBeVisible();
  });
});

describe('Gaming - In-App Purchases', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await waitFor(element(by.id('main-menu-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should display in-game shop with items', async () => {
    await element(by.id('shop-button')).tap();

    await waitFor(element(by.id('shop-screen'))).toBeVisible().withTimeout(5000);

    // Verify shop categories
    await expect(element(by.id('shop-category-coins'))).toBeVisible();
    await expect(element(by.id('shop-category-powerups'))).toBeVisible();
    await expect(element(by.id('shop-category-skins'))).toBeVisible();
  });

  it('should show item details and price', async () => {
    await element(by.id('shop-button')).tap();
    await waitFor(element(by.id('shop-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('shop-item-0')).tap();

    await waitFor(element(by.id('item-detail-modal'))).toBeVisible().withTimeout(3000);

    await expect(element(by.id('item-name'))).toBeVisible();
    await expect(element(by.id('item-description'))).toBeVisible();
    await expect(element(by.id('item-price'))).toBeVisible();
    await expect(element(by.id('buy-button'))).toBeVisible();
  });

  it('should initiate purchase flow', async () => {
    await element(by.id('shop-button')).tap();
    await waitFor(element(by.id('shop-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('shop-item-0')).tap();
    await waitFor(element(by.id('item-detail-modal'))).toBeVisible().withTimeout(3000);

    await element(by.id('buy-button')).tap();

    // Verify purchase confirmation
    await waitFor(element(by.id('purchase-confirmation-modal')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.id('confirm-purchase-button'))).toBeVisible();
    await expect(element(by.id('cancel-purchase-button'))).toBeVisible();
  });

  it('should show currency balance', async () => {
    await element(by.id('shop-button')).tap();
    await waitFor(element(by.id('shop-screen'))).toBeVisible().withTimeout(5000);

    await expect(element(by.id('coins-balance'))).toBeVisible();
    await expect(element(by.id('gems-balance'))).toBeVisible();
  });

  it('should display premium subscription options', async () => {
    await element(by.id('shop-button')).tap();
    await waitFor(element(by.id('shop-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('premium-tab')).tap();

    await waitFor(element(by.id('premium-options'))).toBeVisible().withTimeout(3000);

    await expect(element(by.id('premium-monthly'))).toBeVisible();
    await expect(element(by.id('premium-yearly'))).toBeVisible();
    await expect(element(by.id('premium-benefits-list'))).toBeVisible();
  });
});

describe('Gaming - Leaderboards & Achievements', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await waitFor(element(by.id('main-menu-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should display global leaderboard', async () => {
    await element(by.id('leaderboard-button')).tap();

    await waitFor(element(by.id('leaderboard-screen'))).toBeVisible().withTimeout(5000);

    // Verify leaderboard tabs
    await expect(element(by.id('global-leaderboard-tab'))).toBeVisible();
    await expect(element(by.id('friends-leaderboard-tab'))).toBeVisible();

    // Verify leaderboard entries
    await expect(element(by.id('leaderboard-entry-0'))).toBeVisible();
    await expect(element(by.id('leaderboard-rank'))).toBeVisible();
    await expect(element(by.id('leaderboard-player-name'))).toBeVisible();
    await expect(element(by.id('leaderboard-score'))).toBeVisible();
  });

  it('should switch between leaderboard tabs', async () => {
    await element(by.id('leaderboard-button')).tap();
    await waitFor(element(by.id('leaderboard-screen'))).toBeVisible().withTimeout(5000);

    // Switch to friends
    await element(by.id('friends-leaderboard-tab')).tap();
    await expect(element(by.id('friends-leaderboard-list'))).toBeVisible();

    // Switch to weekly
    await element(by.id('weekly-leaderboard-tab')).tap();
    await expect(element(by.id('weekly-leaderboard-list'))).toBeVisible();
  });

  it('should show player rank and position', async () => {
    await element(by.id('leaderboard-button')).tap();
    await waitFor(element(by.id('leaderboard-screen'))).toBeVisible().withTimeout(5000);

    await expect(element(by.id('my-rank-card'))).toBeVisible();
    await expect(element(by.id('my-rank-position'))).toBeVisible();
    await expect(element(by.id('my-rank-score'))).toBeVisible();
  });

  it('should display achievements list', async () => {
    await element(by.id('leaderboard-button')).tap();
    await waitFor(element(by.id('leaderboard-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('achievements-tab')).tap();

    await waitFor(element(by.id('achievements-list'))).toBeVisible().withTimeout(3000);

    // Verify achievement card
    await expect(element(by.id('achievement-0'))).toBeVisible();
    await expect(element(by.id('achievement-0-icon'))).toBeVisible();
    await expect(element(by.id('achievement-0-title'))).toBeVisible();
    await expect(element(by.id('achievement-0-progress'))).toBeVisible();
  });

  it('should show locked vs unlocked achievements', async () => {
    await element(by.id('leaderboard-button')).tap();
    await element(by.id('achievements-tab')).tap();

    await waitFor(element(by.id('achievements-list'))).toBeVisible().withTimeout(3000);

    await expect(element(by.id('achievement-unlocked-0'))).toBeVisible();
    await expect(element(by.id('achievement-locked-5'))).toBeVisible();
  });
});

describe('Gaming - Settings & Controls', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await waitFor(element(by.id('main-menu-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should display settings options', async () => {
    await element(by.id('settings-button')).tap();

    await waitFor(element(by.id('settings-screen'))).toBeVisible().withTimeout(5000);

    // Verify settings sections
    await expect(element(by.id('audio-settings-section'))).toBeVisible();
    await expect(element(by.id('graphics-settings-section'))).toBeVisible();
    await expect(element(by.id('controls-settings-section'))).toBeVisible();
    await expect(element(by.id('account-settings-section'))).toBeVisible();
  });

  it('should toggle sound effects on/off', async () => {
    await element(by.id('settings-button')).tap();
    await waitFor(element(by.id('settings-screen'))).toBeVisible().withTimeout(5000);

    // Toggle sound
    await element(by.id('sfx-toggle')).tap();
    await expect(element(by.id('sfx-toggle-off'))).toBeVisible();

    // Toggle back on
    await element(by.id('sfx-toggle-off')).tap();
    await expect(element(by.id('sfx-toggle-on'))).toBeVisible();
  });

  it('should adjust music volume with slider', async () => {
    await element(by.id('settings-button')).tap();
    await waitFor(element(by.id('settings-screen'))).toBeVisible().withTimeout(5000);

    await expect(element(by.id('music-volume-slider'))).toBeVisible();

    // Adjust slider (implementation depends on slider type)
    await element(by.id('music-volume-slider')).swipe('right', 'fast', 0.5);
  });

  it('should change graphics quality', async () => {
    await element(by.id('settings-button')).tap();
    await waitFor(element(by.id('settings-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('graphics-quality-button')).tap();

    await waitFor(element(by.id('graphics-options-modal'))).toBeVisible().withTimeout(3000);

    await element(by.id('quality-high')).tap();

    await expect(element(by.id('graphics-quality-button'))).toHaveText('High');
  });

  it('should configure control scheme', async () => {
    await element(by.id('settings-button')).tap();
    await waitFor(element(by.id('settings-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('controls-customize-button')).tap();

    await waitFor(element(by.id('controls-screen'))).toBeVisible().withTimeout(3000);

    await expect(element(by.id('control-layout-options'))).toBeVisible();
    await expect(element(by.id('sensitivity-slider'))).toBeVisible();
  });
});

describe('Media - Video Playback', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('should play video with controls', async () => {
    await waitFor(element(by.id('video-list'))).toBeVisible().withTimeout(5000);

    await element(by.id('video-0')).tap();

    await waitFor(element(by.id('video-player-screen'))).toBeVisible().withTimeout(5000);

    // Verify video playing
    await expect(element(by.id('video-player'))).toBeVisible();

    // Tap to show controls
    await element(by.id('video-player')).tap();

    await expect(element(by.id('play-pause-button'))).toBeVisible();
    await expect(element(by.id('progress-bar'))).toBeVisible();
    await expect(element(by.id('fullscreen-button'))).toBeVisible();
  });

  it('should pause and resume video', async () => {
    await waitFor(element(by.id('video-list'))).toBeVisible().withTimeout(5000);
    await element(by.id('video-0')).tap();

    await waitFor(element(by.id('video-player-screen'))).toBeVisible().withTimeout(5000);

    // Show controls and pause
    await element(by.id('video-player')).tap();
    await element(by.id('play-pause-button')).tap();

    await expect(element(by.id('pause-icon'))).not.toBeVisible();
    await expect(element(by.id('play-icon'))).toBeVisible();
  });

  it('should seek video using progress bar', async () => {
    await waitFor(element(by.id('video-list'))).toBeVisible().withTimeout(5000);
    await element(by.id('video-0')).tap();

    await waitFor(element(by.id('video-player-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('video-player')).tap();

    // Seek to middle
    await element(by.id('progress-bar')).swipe('right', 'fast', 0.5);

    // Verify time updated
    await expect(element(by.id('current-time'))).not.toHaveText('0:00');
  });

  it('should enter and exit fullscreen mode', async () => {
    await waitFor(element(by.id('video-list'))).toBeVisible().withTimeout(5000);
    await element(by.id('video-0')).tap();

    await waitFor(element(by.id('video-player-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('video-player')).tap();
    await element(by.id('fullscreen-button')).tap();

    // Verify fullscreen
    await expect(element(by.id('fullscreen-video-player'))).toBeVisible();

    // Exit fullscreen
    await element(by.id('fullscreen-video-player')).tap();
    await element(by.id('exit-fullscreen-button')).tap();

    await expect(element(by.id('video-player'))).toBeVisible();
  });
});

describe('Media - Audio Playback', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('should play audio track with mini player', async () => {
    await waitFor(element(by.id('music-list'))).toBeVisible().withTimeout(5000);

    await element(by.id('track-0')).tap();

    // Verify mini player appears
    await waitFor(element(by.id('mini-player'))).toBeVisible().withTimeout(3000);

    await expect(element(by.id('mini-player-title'))).toBeVisible();
    await expect(element(by.id('mini-player-play-pause'))).toBeVisible();
    await expect(element(by.id('mini-player-progress'))).toBeVisible();
  });

  it('should expand to full player', async () => {
    await waitFor(element(by.id('music-list'))).toBeVisible().withTimeout(5000);
    await element(by.id('track-0')).tap();

    await waitFor(element(by.id('mini-player'))).toBeVisible().withTimeout(3000);

    // Expand mini player
    await element(by.id('mini-player')).swipe('up');

    await waitFor(element(by.id('full-player-screen'))).toBeVisible().withTimeout(3000);

    await expect(element(by.id('album-art'))).toBeVisible();
    await expect(element(by.id('track-title'))).toBeVisible();
    await expect(element(by.id('artist-name'))).toBeVisible();
    await expect(element(by.id('previous-button'))).toBeVisible();
    await expect(element(by.id('next-button'))).toBeVisible();
    await expect(element(by.id('shuffle-button'))).toBeVisible();
    await expect(element(by.id('repeat-button'))).toBeVisible();
  });

  it('should skip to next track', async () => {
    await waitFor(element(by.id('music-list'))).toBeVisible().withTimeout(5000);
    await element(by.id('track-0')).tap();

    await waitFor(element(by.id('mini-player'))).toBeVisible().withTimeout(3000);
    await element(by.id('mini-player')).swipe('up');

    await waitFor(element(by.id('full-player-screen'))).toBeVisible().withTimeout(3000);

    const initialTitle = element(by.id('track-title'));

    await element(by.id('next-button')).tap();

    // Verify track changed
    await expect(element(by.id('track-title'))).not.toHaveText(await initialTitle.getAttributes());
  });
});
