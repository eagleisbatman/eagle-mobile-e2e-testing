/**
 * Example: Social Media App E2E Tests
 *
 * Comprehensive tests for social networking apps including:
 * - Feed browsing and interactions
 * - Post creation with media
 * - Comments and reactions
 * - Following/Followers
 * - Profile management
 * - Direct messaging
 * - Stories
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Social Media - Feed Browsing', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Login
    await element(by.id('login-button')).tap();
    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('submit-button')).tap();
    await waitFor(element(by.id('feed-screen'))).toBeVisible().withTimeout(10000);
  });

  beforeEach(async () => {
    // Return to feed
    await element(by.id('nav-home-tab')).tap();
  });

  it('should display feed with posts from followed users', async () => {
    await waitFor(element(by.id('feed-list')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify post elements
    await expect(element(by.id('post-0-avatar'))).toBeVisible();
    await expect(element(by.id('post-0-username'))).toBeVisible();
    await expect(element(by.id('post-0-content'))).toBeVisible();
    await expect(element(by.id('post-0-like-button'))).toBeVisible();
    await expect(element(by.id('post-0-comment-button'))).toBeVisible();
    await expect(element(by.id('post-0-share-button'))).toBeVisible();
  });

  it('should pull to refresh feed', async () => {
    await waitFor(element(by.id('feed-list'))).toBeVisible().withTimeout(5000);

    // Pull to refresh
    await element(by.id('feed-list')).scroll(150, 'down');

    // Verify refresh indicator
    await waitFor(element(by.id('feed-refresh-indicator')))
      .toBeVisible()
      .withTimeout(2000);

    // Wait for refresh to complete
    await waitFor(element(by.id('feed-refresh-indicator')))
      .not.toBeVisible()
      .withTimeout(5000);
  });

  it('should play video when scrolled into view', async () => {
    // Scroll to video post
    await waitFor(element(by.id('post-video-0')))
      .toBeVisible()
      .whileElement(by.id('feed-list'))
      .scroll(300, 'down');

    // Verify video playing indicator
    await expect(element(by.id('post-video-0-playing'))).toBeVisible();
  });

  it('should show stories carousel at top of feed', async () => {
    await expect(element(by.id('stories-carousel'))).toBeVisible();
    await expect(element(by.id('story-0'))).toBeVisible();
    await expect(element(by.id('add-story-button'))).toBeVisible();
  });
});

describe('Social Media - Post Interactions', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Login
    await element(by.id('login-button')).tap();
    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('submit-button')).tap();
    await waitFor(element(by.id('feed-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should like and unlike a post', async () => {
    await waitFor(element(by.id('post-0-like-button'))).toBeVisible().withTimeout(5000);

    // Like post
    await element(by.id('post-0-like-button')).tap();
    await expect(element(by.id('post-0-like-button-active'))).toBeVisible();

    // Verify like count increased
    const likeCount = element(by.id('post-0-like-count'));
    await expect(likeCount).toBeVisible();

    // Unlike post
    await element(by.id('post-0-like-button-active')).tap();
    await expect(element(by.id('post-0-like-button'))).toBeVisible();
  });

  it('should double tap to like post', async () => {
    await waitFor(element(by.id('post-0-content'))).toBeVisible().withTimeout(5000);

    // Double tap
    await element(by.id('post-0-content')).multiTap(2);

    // Verify heart animation and like
    await waitFor(element(by.id('post-0-like-animation')))
      .toBeVisible()
      .withTimeout(1000);

    await expect(element(by.id('post-0-like-button-active'))).toBeVisible();
  });

  it('should add comment to post', async () => {
    await waitFor(element(by.id('post-0-comment-button'))).toBeVisible().withTimeout(5000);

    await element(by.id('post-0-comment-button')).tap();

    await waitFor(element(by.id('comments-screen'))).toBeVisible().withTimeout(5000);

    // Type comment
    await element(by.id('comment-input')).typeText('Great post! 🔥');
    await element(by.id('post-comment-button')).tap();

    // Verify comment appears
    await waitFor(element(by.text('Great post! 🔥')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should reply to a comment', async () => {
    await element(by.id('post-0-comment-button')).tap();
    await waitFor(element(by.id('comments-screen'))).toBeVisible().withTimeout(5000);

    // Tap reply on first comment
    await element(by.id('comment-0-reply-button')).tap();

    // Verify reply mode active
    await expect(element(by.id('replying-to-indicator'))).toBeVisible();

    // Type reply
    await element(by.id('comment-input')).typeText('Thanks!');
    await element(by.id('post-comment-button')).tap();

    // Verify reply appears
    await waitFor(element(by.id('comment-0-reply-0')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should save post to bookmarks', async () => {
    await waitFor(element(by.id('post-0-save-button'))).toBeVisible().withTimeout(5000);

    await element(by.id('post-0-save-button')).tap();

    // Verify saved indicator
    await expect(element(by.id('post-0-save-button-active'))).toBeVisible();

    // Check saved posts
    await element(by.id('nav-profile-tab')).tap();
    await element(by.id('saved-posts-button')).tap();

    await waitFor(element(by.id('saved-posts-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('saved-post-0'))).toBeVisible();
  });

  it('should share post to story', async () => {
    await waitFor(element(by.id('post-0-share-button'))).toBeVisible().withTimeout(5000);

    await element(by.id('post-0-share-button')).tap();

    await waitFor(element(by.id('share-modal'))).toBeVisible().withTimeout(3000);

    await element(by.id('share-to-story-option')).tap();

    // Verify story editor
    await waitFor(element(by.id('story-editor-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('shared-post-preview'))).toBeVisible();
  });
});

describe('Social Media - Create Post', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { camera: 'YES', photos: 'YES', microphone: 'YES' }
    });
    // Login
    await element(by.id('login-button')).tap();
    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('submit-button')).tap();
    await waitFor(element(by.id('feed-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should create text-only post', async () => {
    await element(by.id('create-post-button')).tap();

    await waitFor(element(by.id('create-post-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('post-text-input')).typeText('Hello world! This is my first post.');
    await element(by.id('publish-post-button')).tap();

    // Verify post created
    await waitFor(element(by.id('feed-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.text('Hello world! This is my first post.'))).toBeVisible();
  });

  it('should create post with image from gallery', async () => {
    await element(by.id('create-post-button')).tap();
    await waitFor(element(by.id('create-post-screen'))).toBeVisible().withTimeout(5000);

    // Add image
    await element(by.id('add-media-button')).tap();
    await element(by.id('select-from-gallery-option')).tap();

    // Select image (mock gallery interaction)
    await waitFor(element(by.id('gallery-image-0'))).toBeVisible().withTimeout(5000);
    await element(by.id('gallery-image-0')).tap();
    await element(by.id('done-selecting-button')).tap();

    // Verify image preview
    await expect(element(by.id('post-image-preview-0'))).toBeVisible();

    // Add caption
    await element(by.id('post-text-input')).typeText('Check out this photo! 📸');
    await element(by.id('publish-post-button')).tap();

    // Verify post created with image
    await waitFor(element(by.id('feed-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should create post with multiple images', async () => {
    await element(by.id('create-post-button')).tap();
    await waitFor(element(by.id('create-post-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('add-media-button')).tap();
    await element(by.id('select-from-gallery-option')).tap();

    // Select multiple images
    await element(by.id('gallery-image-0')).tap();
    await element(by.id('gallery-image-1')).tap();
    await element(by.id('gallery-image-2')).tap();
    await element(by.id('done-selecting-button')).tap();

    // Verify multiple previews
    await expect(element(by.id('post-image-preview-0'))).toBeVisible();
    await expect(element(by.id('image-count-indicator'))).toHaveText('3');
  });

  it('should add location tag to post', async () => {
    await element(by.id('create-post-button')).tap();
    await waitFor(element(by.id('create-post-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('post-text-input')).typeText('Having a great time!');
    await element(by.id('add-location-button')).tap();

    await waitFor(element(by.id('location-search-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('location-search-input')).typeText('Coffee');
    await waitFor(element(by.id('location-result-0'))).toBeVisible().withTimeout(5000);
    await element(by.id('location-result-0')).tap();

    // Verify location added
    await expect(element(by.id('selected-location-tag'))).toBeVisible();
  });

  it('should tag users in post', async () => {
    await element(by.id('create-post-button')).tap();
    await waitFor(element(by.id('create-post-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('post-text-input')).typeText('With @');

    // Should show mention suggestions
    await waitFor(element(by.id('mention-suggestions-list'))).toBeVisible().withTimeout(3000);

    await element(by.id('mention-suggestion-0')).tap();

    // Verify mention added
    await expect(element(by.id('tagged-user-0'))).toBeVisible();
  });
});

describe('Social Media - Stories', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { camera: 'YES', photos: 'YES' }
    });
    // Login
    await element(by.id('login-button')).tap();
    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('submit-button')).tap();
    await waitFor(element(by.id('feed-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should view story with tap to advance', async () => {
    await element(by.id('story-0')).tap();

    await waitFor(element(by.id('story-viewer-screen'))).toBeVisible().withTimeout(5000);

    // Verify story elements
    await expect(element(by.id('story-progress-bar'))).toBeVisible();
    await expect(element(by.id('story-user-info'))).toBeVisible();

    // Tap to advance
    await element(by.id('story-tap-area-right')).tap();

    // Verify next story item
    await expect(element(by.id('story-progress-segment-1-active'))).toBeVisible();
  });

  it('should pause story on long press', async () => {
    await element(by.id('story-0')).tap();
    await waitFor(element(by.id('story-viewer-screen'))).toBeVisible().withTimeout(5000);

    // Long press to pause
    await element(by.id('story-content')).longPress();

    // Verify paused state
    await expect(element(by.id('story-paused-indicator'))).toBeVisible();
  });

  it('should reply to story', async () => {
    await element(by.id('story-0')).tap();
    await waitFor(element(by.id('story-viewer-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('story-reply-input')).tap();
    await element(by.id('story-reply-input')).typeText('Love this! ❤️');
    await element(by.id('send-story-reply-button')).tap();

    // Verify reply sent
    await waitFor(element(by.id('story-reply-sent-indicator')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should create story with text overlay', async () => {
    await element(by.id('add-story-button')).tap();

    await waitFor(element(by.id('story-camera-screen'))).toBeVisible().withTimeout(5000);

    // Take photo or select from gallery
    await element(by.id('gallery-button')).tap();
    await element(by.id('gallery-image-0')).tap();

    await waitFor(element(by.id('story-editor-screen'))).toBeVisible().withTimeout(5000);

    // Add text
    await element(by.id('add-text-button')).tap();
    await element(by.id('story-text-input')).typeText('My Story ✨');
    await element(by.id('done-text-button')).tap();

    // Post story
    await element(by.id('post-story-button')).tap();

    // Verify story posted
    await waitFor(element(by.id('feed-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('my-story-ring'))).toBeVisible();
  });
});

describe('Social Media - Profile & Following', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Login
    await element(by.id('login-button')).tap();
    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('submit-button')).tap();
    await waitFor(element(by.id('feed-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should view own profile with stats', async () => {
    await element(by.id('nav-profile-tab')).tap();

    await waitFor(element(by.id('profile-screen'))).toBeVisible().withTimeout(5000);

    // Verify profile elements
    await expect(element(by.id('profile-avatar'))).toBeVisible();
    await expect(element(by.id('profile-username'))).toBeVisible();
    await expect(element(by.id('profile-bio'))).toBeVisible();
    await expect(element(by.id('posts-count'))).toBeVisible();
    await expect(element(by.id('followers-count'))).toBeVisible();
    await expect(element(by.id('following-count'))).toBeVisible();
    await expect(element(by.id('profile-posts-grid'))).toBeVisible();
  });

  it('should follow and unfollow user', async () => {
    // Navigate to another user's profile
    await waitFor(element(by.id('post-0-username'))).toBeVisible().withTimeout(5000);
    await element(by.id('post-0-username')).tap();

    await waitFor(element(by.id('user-profile-screen'))).toBeVisible().withTimeout(5000);

    // Follow user
    await element(by.id('follow-button')).tap();
    await expect(element(by.id('following-button'))).toBeVisible();

    // Unfollow user
    await element(by.id('following-button')).tap();
    await element(by.id('confirm-unfollow-button')).tap();
    await expect(element(by.id('follow-button'))).toBeVisible();
  });

  it('should view followers list', async () => {
    await element(by.id('nav-profile-tab')).tap();
    await waitFor(element(by.id('profile-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('followers-count')).tap();

    await waitFor(element(by.id('followers-list-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('follower-0'))).toBeVisible();
  });

  it('should edit profile information', async () => {
    await element(by.id('nav-profile-tab')).tap();
    await waitFor(element(by.id('profile-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('edit-profile-button')).tap();

    await waitFor(element(by.id('edit-profile-screen'))).toBeVisible().withTimeout(5000);

    // Update bio
    await element(by.id('bio-input')).clearText();
    await element(by.id('bio-input')).typeText('Updated bio! 🚀');

    await element(by.id('save-profile-button')).tap();

    // Verify changes saved
    await waitFor(element(by.id('profile-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('profile-bio'))).toHaveText('Updated bio! 🚀');
  });
});

describe('Social Media - Direct Messages', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Login
    await element(by.id('login-button')).tap();
    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('submit-button')).tap();
    await waitFor(element(by.id('feed-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should view messages inbox', async () => {
    await element(by.id('messages-icon')).tap();

    await waitFor(element(by.id('messages-inbox-screen'))).toBeVisible().withTimeout(5000);

    await expect(element(by.id('conversation-0'))).toBeVisible();
    await expect(element(by.id('conversation-0-avatar'))).toBeVisible();
    await expect(element(by.id('conversation-0-last-message'))).toBeVisible();
  });

  it('should send text message in conversation', async () => {
    await element(by.id('messages-icon')).tap();
    await waitFor(element(by.id('messages-inbox-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('conversation-0')).tap();

    await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('message-input')).typeText('Hey! How are you?');
    await element(by.id('send-message-button')).tap();

    // Verify message sent
    await waitFor(element(by.text('Hey! How are you?')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.id('message-sent-indicator'))).toBeVisible();
  });

  it('should start new conversation', async () => {
    await element(by.id('messages-icon')).tap();
    await waitFor(element(by.id('messages-inbox-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('new-message-button')).tap();

    await waitFor(element(by.id('new-message-screen'))).toBeVisible().withTimeout(5000);

    // Search for user
    await element(by.id('user-search-input')).typeText('John');
    await waitFor(element(by.id('user-result-0'))).toBeVisible().withTimeout(3000);
    await element(by.id('user-result-0')).tap();

    // Verify chat opened
    await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(5000);
  });
});

describe('Social Media - Notifications', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Login
    await element(by.id('login-button')).tap();
    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('submit-button')).tap();
    await waitFor(element(by.id('feed-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should display notifications with different types', async () => {
    await element(by.id('nav-notifications-tab')).tap();

    await waitFor(element(by.id('notifications-screen'))).toBeVisible().withTimeout(5000);

    // Verify different notification types
    await expect(element(by.id('notifications-list'))).toBeVisible();
    // Like notification
    // Follow notification
    // Comment notification
  });

  it('should navigate to content from notification tap', async () => {
    await element(by.id('nav-notifications-tab')).tap();
    await waitFor(element(by.id('notifications-screen'))).toBeVisible().withTimeout(5000);

    // Tap on like notification
    await element(by.id('notification-0')).tap();

    // Should navigate to the post
    await waitFor(element(by.id('post-detail-screen'))).toBeVisible().withTimeout(5000);
  });
});
