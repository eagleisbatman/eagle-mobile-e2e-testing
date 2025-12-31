/**
 * Example: Messaging/Chat App E2E Tests
 *
 * Comprehensive tests for messaging apps including:
 * - Real-time messaging
 * - Group chats
 * - Media sharing
 * - Voice messages
 * - Read receipts
 * - Typing indicators
 * - Message reactions
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Messaging - Conversations List', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Login
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('continue-button')).tap();
    await element(by.id('otp-input')).typeText('123456');
    await waitFor(element(by.id('chats-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should display conversations sorted by recent activity', async () => {
    await expect(element(by.id('conversations-list'))).toBeVisible();
    await expect(element(by.id('conversation-0'))).toBeVisible();

    // Verify conversation card elements
    await expect(element(by.id('conversation-0-avatar'))).toBeVisible();
    await expect(element(by.id('conversation-0-name'))).toBeVisible();
    await expect(element(by.id('conversation-0-last-message'))).toBeVisible();
    await expect(element(by.id('conversation-0-time'))).toBeVisible();
  });

  it('should show unread message badge', async () => {
    await expect(element(by.id('conversation-0-unread-badge'))).toBeVisible();
  });

  it('should search conversations', async () => {
    await element(by.id('search-bar')).tap();
    await element(by.id('search-input')).typeText('John');

    await waitFor(element(by.id('search-results-list')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.id('search-result-0'))).toBeVisible();
  });

  it('should archive conversation with swipe', async () => {
    await element(by.id('conversation-0')).swipe('left');

    await waitFor(element(by.id('archive-action-button')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('archive-action-button')).tap();

    // Verify archived
    await expect(element(by.id('conversation-archived-toast'))).toBeVisible();
  });
});

describe('Messaging - Chat Screen', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Login and open a conversation
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('continue-button')).tap();
    await element(by.id('otp-input')).typeText('123456');
    await waitFor(element(by.id('chats-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('conversation-0')).tap();
    await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should send text message', async () => {
    await element(by.id('message-input')).typeText('Hello! How are you?');
    await element(by.id('send-button')).tap();

    // Verify message appears
    await waitFor(element(by.text('Hello! How are you?')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify sent indicator
    await expect(element(by.id('message-sent-tick'))).toBeVisible();
  });

  it('should show typing indicator when other user types', async () => {
    // This would require mocking the server response
    // In real tests, you'd simulate the other user typing
    await waitFor(element(by.id('typing-indicator')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show read receipts', async () => {
    await element(by.id('message-input')).typeText('Test message');
    await element(by.id('send-button')).tap();

    // Wait for message to be read (mocked)
    await waitFor(element(by.id('message-read-tick')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should scroll to bottom on new message', async () => {
    // Scroll up in chat history
    await element(by.id('messages-list')).scroll(500, 'up');

    // Send new message
    await element(by.id('message-input')).typeText('New message');
    await element(by.id('send-button')).tap();

    // Should auto-scroll to bottom
    await expect(element(by.text('New message'))).toBeVisible();
  });

  it('should reply to specific message', async () => {
    // Long press on message to show options
    await element(by.id('message-0')).longPress();

    await waitFor(element(by.id('message-actions-menu')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('reply-action')).tap();

    // Verify reply mode
    await expect(element(by.id('reply-preview'))).toBeVisible();

    // Send reply
    await element(by.id('message-input')).typeText('This is a reply');
    await element(by.id('send-button')).tap();

    // Verify reply with quote
    await expect(element(by.id('message-with-reply'))).toBeVisible();
  });

  it('should add reaction to message', async () => {
    await element(by.id('message-0')).longPress();

    await waitFor(element(by.id('message-actions-menu')))
      .toBeVisible()
      .withTimeout(2000);

    // Tap reaction emoji
    await element(by.id('reaction-emoji-❤️')).tap();

    // Verify reaction appears
    await expect(element(by.id('message-0-reaction-❤️'))).toBeVisible();
  });

  it('should delete message for everyone', async () => {
    // First send a message
    await element(by.id('message-input')).typeText('Message to delete');
    await element(by.id('send-button')).tap();

    await waitFor(element(by.text('Message to delete'))).toBeVisible().withTimeout(3000);

    // Long press and delete
    await element(by.text('Message to delete')).longPress();
    await element(by.id('delete-action')).tap();
    await element(by.id('delete-for-everyone-option')).tap();

    // Verify message deleted
    await expect(element(by.id('message-deleted-placeholder'))).toBeVisible();
  });
});

describe('Messaging - Media Sharing', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { camera: 'YES', photos: 'YES', microphone: 'YES' }
    });
    // Login and open conversation
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('continue-button')).tap();
    await element(by.id('otp-input')).typeText('123456');
    await waitFor(element(by.id('chats-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('conversation-0')).tap();
    await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should send image from gallery', async () => {
    await element(by.id('attach-button')).tap();
    await element(by.id('gallery-option')).tap();

    await waitFor(element(by.id('gallery-picker'))).toBeVisible().withTimeout(5000);
    await element(by.id('gallery-image-0')).tap();

    // Verify image preview
    await expect(element(by.id('image-preview'))).toBeVisible();

    // Add caption
    await element(by.id('caption-input')).typeText('Check this out!');
    await element(by.id('send-image-button')).tap();

    // Verify image sent
    await waitFor(element(by.id('message-image-0'))).toBeVisible().withTimeout(5000);
  });

  it('should take and send photo', async () => {
    await element(by.id('attach-button')).tap();
    await element(by.id('camera-option')).tap();

    await waitFor(element(by.id('camera-screen'))).toBeVisible().withTimeout(5000);

    // Take photo
    await element(by.id('capture-button')).tap();

    // Verify preview and send
    await waitFor(element(by.id('photo-preview'))).toBeVisible().withTimeout(3000);
    await element(by.id('send-photo-button')).tap();

    await waitFor(element(by.id('message-image-0'))).toBeVisible().withTimeout(5000);
  });

  it('should send voice message', async () => {
    // Long press voice button to record
    await element(by.id('voice-message-button')).longPress(3000);

    // Release to send
    // Verify voice message sent
    await waitFor(element(by.id('voice-message-0'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('voice-message-0-duration'))).toBeVisible();
  });

  it('should play received voice message', async () => {
    // Assuming there's a voice message in chat
    await element(by.id('voice-message-0')).tap();

    // Verify playing state
    await expect(element(by.id('voice-message-0-playing'))).toBeVisible();
    await expect(element(by.id('voice-message-0-progress'))).toBeVisible();
  });

  it('should send document file', async () => {
    await element(by.id('attach-button')).tap();
    await element(by.id('document-option')).tap();

    await waitFor(element(by.id('document-picker'))).toBeVisible().withTimeout(5000);
    await element(by.id('document-0')).tap();

    // Verify document sent
    await waitFor(element(by.id('message-document-0'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('document-name'))).toBeVisible();
    await expect(element(by.id('document-size'))).toBeVisible();
  });

  it('should share location', async () => {
    await element(by.id('attach-button')).tap();
    await element(by.id('location-option')).tap();

    await waitFor(element(by.id('location-picker'))).toBeVisible().withTimeout(5000);

    // Share current location
    await element(by.id('share-current-location-button')).tap();

    // Verify location message sent
    await waitFor(element(by.id('message-location-0'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('location-map-preview'))).toBeVisible();
  });
});

describe('Messaging - Group Chats', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Login
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('continue-button')).tap();
    await element(by.id('otp-input')).typeText('123456');
    await waitFor(element(by.id('chats-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should create new group chat', async () => {
    await element(by.id('new-chat-button')).tap();
    await element(by.id('new-group-option')).tap();

    await waitFor(element(by.id('select-members-screen'))).toBeVisible().withTimeout(5000);

    // Select members
    await element(by.id('contact-0')).tap();
    await element(by.id('contact-1')).tap();
    await element(by.id('contact-2')).tap();
    await element(by.id('next-button')).tap();

    // Set group details
    await waitFor(element(by.id('group-details-screen'))).toBeVisible().withTimeout(5000);
    await element(by.id('group-name-input')).typeText('Weekend Plans');
    await element(by.id('create-group-button')).tap();

    // Verify group created
    await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('group-name'))).toHaveText('Weekend Plans');
  });

  it('should add member to existing group', async () => {
    // Open group chat
    await element(by.id('group-conversation-0')).tap();
    await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(5000);

    // Open group info
    await element(by.id('group-info-button')).tap();
    await waitFor(element(by.id('group-info-screen'))).toBeVisible().withTimeout(5000);

    // Add member
    await element(by.id('add-members-button')).tap();
    await element(by.id('contact-5')).tap();
    await element(by.id('done-button')).tap();

    // Verify member added
    await expect(element(by.id('member-count'))).toHaveText('4 members');
  });

  it('should remove member from group as admin', async () => {
    await element(by.id('group-conversation-0')).tap();
    await element(by.id('group-info-button')).tap();

    await waitFor(element(by.id('group-info-screen'))).toBeVisible().withTimeout(5000);

    // Long press on member to remove
    await element(by.id('member-1')).longPress();
    await element(by.id('remove-member-option')).tap();
    await element(by.id('confirm-remove-button')).tap();

    // Verify member removed
    await expect(element(by.id('member-1'))).not.toBeVisible();
  });

  it('should leave group chat', async () => {
    await element(by.id('group-conversation-0')).tap();
    await element(by.id('group-info-button')).tap();

    await waitFor(element(by.id('group-info-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('leave-group-button')).tap();
    await element(by.id('confirm-leave-button')).tap();

    // Should return to chats list
    await waitFor(element(by.id('chats-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should mention user in group with @', async () => {
    await element(by.id('group-conversation-0')).tap();
    await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('message-input')).typeText('@');

    // Verify mention suggestions
    await waitFor(element(by.id('mention-suggestions-list')))
      .toBeVisible()
      .withTimeout(3000);

    await element(by.id('mention-suggestion-0')).tap();

    // Send message
    await element(by.id('message-input')).typeText(' check this out!');
    await element(by.id('send-button')).tap();

    // Verify mention highlighted
    await expect(element(by.id('message-mention'))).toBeVisible();
  });
});

describe('Messaging - Status/Stories', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { camera: 'YES', photos: 'YES' }
    });
    // Login
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('continue-button')).tap();
    await element(by.id('otp-input')).typeText('123456');
    await waitFor(element(by.id('chats-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should view contact status', async () => {
    await element(by.id('status-tab')).tap();

    await waitFor(element(by.id('status-screen'))).toBeVisible().withTimeout(5000);

    // Tap on contact status
    await element(by.id('status-contact-0')).tap();

    await waitFor(element(by.id('status-viewer-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('status-content'))).toBeVisible();
  });

  it('should post text status', async () => {
    await element(by.id('status-tab')).tap();
    await element(by.id('add-status-button')).tap();
    await element(by.id('text-status-option')).tap();

    await waitFor(element(by.id('text-status-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('status-text-input')).typeText('Feeling great today! 🎉');
    await element(by.id('post-status-button')).tap();

    // Verify status posted
    await waitFor(element(by.id('my-status-ring'))).toBeVisible().withTimeout(5000);
  });
});

describe('Messaging - Calls', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      permissions: { camera: 'YES', microphone: 'YES' }
    });
    // Login
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('continue-button')).tap();
    await element(by.id('otp-input')).typeText('123456');
    await waitFor(element(by.id('chats-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('conversation-0')).tap();
    await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should initiate voice call', async () => {
    await element(by.id('voice-call-button')).tap();

    await waitFor(element(by.id('call-screen'))).toBeVisible().withTimeout(5000);

    // Verify call UI
    await expect(element(by.id('contact-avatar'))).toBeVisible();
    await expect(element(by.id('call-status'))).toBeVisible();
    await expect(element(by.id('end-call-button'))).toBeVisible();
    await expect(element(by.id('mute-button'))).toBeVisible();
    await expect(element(by.id('speaker-button'))).toBeVisible();
  });

  it('should initiate video call', async () => {
    await element(by.id('video-call-button')).tap();

    await waitFor(element(by.id('video-call-screen'))).toBeVisible().withTimeout(5000);

    // Verify video call UI
    await expect(element(by.id('remote-video'))).toBeVisible();
    await expect(element(by.id('local-video-preview'))).toBeVisible();
    await expect(element(by.id('flip-camera-button'))).toBeVisible();
    await expect(element(by.id('toggle-video-button'))).toBeVisible();
  });

  it('should view call history', async () => {
    await element(by.id('calls-tab')).tap();

    await waitFor(element(by.id('calls-screen'))).toBeVisible().withTimeout(5000);

    await expect(element(by.id('call-history-list'))).toBeVisible();
    await expect(element(by.id('call-0'))).toBeVisible();
    await expect(element(by.id('call-0-type-indicator'))).toBeVisible();
    await expect(element(by.id('call-0-duration'))).toBeVisible();
  });
});
