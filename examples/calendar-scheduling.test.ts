/**
 * Example: Calendar and Scheduling E2E Tests
 *
 * Tests for calendar functionality including:
 * - Calendar views (day, week, month)
 * - Event creation and editing
 * - Reminders
 * - Recurring events
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Calendar - Views', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-calendar')).tap();
  });

  it('should display month view by default', async () => {
    await expect(element(by.id('calendar-month-view'))).toBeVisible();
    await expect(element(by.id('month-header'))).toBeVisible();
  });

  it('should switch to week view', async () => {
    await element(by.id('view-selector')).tap();
    await element(by.id('week-view-option')).tap();
    await expect(element(by.id('calendar-week-view'))).toBeVisible();
  });

  it('should switch to day view', async () => {
    await element(by.id('view-selector')).tap();
    await element(by.id('day-view-option')).tap();
    await expect(element(by.id('calendar-day-view'))).toBeVisible();
  });

  it('should navigate to next month', async () => {
    await element(by.id('next-month-button')).tap();
    // Month header should update
  });

  it('should navigate to previous month', async () => {
    await element(by.id('previous-month-button')).tap();
    // Month header should update
  });

  it('should jump to today', async () => {
    await element(by.id('next-month-button')).tap();
    await element(by.id('next-month-button')).tap();
    await element(by.id('today-button')).tap();
    await expect(element(by.id('today-highlighted'))).toBeVisible();
  });
});

describe('Calendar - Event Creation', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-calendar')).tap();
  });

  it('should open event creation form', async () => {
    await element(by.id('add-event-button')).tap();
    await expect(element(by.id('event-form-screen'))).toBeVisible();
  });

  it('should create new event', async () => {
    await element(by.id('add-event-button')).tap();
    await element(by.id('event-title-input')).typeText('Team Meeting');
    await element(by.id('event-date-picker')).tap();
    await element(by.id('date-confirm')).tap();
    await element(by.id('event-start-time')).tap();
    await element(by.id('time-confirm')).tap();
    await element(by.id('save-event-button')).tap();

    await expect(element(by.id('event-Team-Meeting'))).toBeVisible();
  });

  it('should add event description', async () => {
    await element(by.id('add-event-button')).tap();
    await element(by.id('event-title-input')).typeText('Project Review');
    await element(by.id('event-description-input')).typeText('Quarterly review meeting');
    await element(by.id('save-event-button')).tap();

    await element(by.id('event-Project-Review')).tap();
    await expect(element(by.id('event-description'))).toHaveText('Quarterly review meeting');
  });

  it('should set event location', async () => {
    await element(by.id('add-event-button')).tap();
    await element(by.id('event-title-input')).typeText('Lunch');
    await element(by.id('event-location-input')).typeText('Conference Room A');
    await element(by.id('save-event-button')).tap();

    await element(by.id('event-Lunch')).tap();
    await expect(element(by.id('event-location'))).toHaveText('Conference Room A');
  });

  it('should create all-day event', async () => {
    await element(by.id('add-event-button')).tap();
    await element(by.id('event-title-input')).typeText('Company Holiday');
    await element(by.id('all-day-toggle')).tap();
    await element(by.id('save-event-button')).tap();

    await expect(element(by.id('all-day-event-indicator'))).toBeVisible();
  });
});

describe('Calendar - Event Editing', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('calendar-user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-calendar')).tap();
  });

  it('should open event details', async () => {
    await element(by.id('event-item-0')).tap();
    await expect(element(by.id('event-detail-screen'))).toBeVisible();
  });

  it('should edit event title', async () => {
    await element(by.id('event-item-0')).tap();
    await element(by.id('edit-event-button')).tap();
    await element(by.id('event-title-input')).clearText();
    await element(by.id('event-title-input')).typeText('Updated Meeting');
    await element(by.id('save-event-button')).tap();

    await expect(element(by.id('event-title'))).toHaveText('Updated Meeting');
  });

  it('should delete event', async () => {
    await element(by.id('event-item-0')).tap();
    await element(by.id('delete-event-button')).tap();
    await element(by.id('confirm-delete-button')).tap();

    await expect(element(by.id('calendar-month-view'))).toBeVisible();
  });
});

describe('Calendar - Reminders', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-calendar')).tap();
    await element(by.id('add-event-button')).tap();
  });

  it('should add reminder to event', async () => {
    await element(by.id('event-title-input')).typeText('Doctor Appointment');
    await element(by.id('add-reminder-button')).tap();
    await element(by.id('reminder-15-min')).tap();

    await expect(element(by.id('reminder-badge'))).toBeVisible();
  });

  it('should add multiple reminders', async () => {
    await element(by.id('event-title-input')).typeText('Important Meeting');
    await element(by.id('add-reminder-button')).tap();
    await element(by.id('reminder-15-min')).tap();
    await element(by.id('add-reminder-button')).tap();
    await element(by.id('reminder-1-hour')).tap();

    await expect(element(by.id('reminder-count'))).toHaveText('2');
  });

  it('should remove reminder', async () => {
    await element(by.id('event-title-input')).typeText('Meeting');
    await element(by.id('add-reminder-button')).tap();
    await element(by.id('reminder-15-min')).tap();
    await element(by.id('reminder-item-0-remove')).tap();

    await expect(element(by.id('reminder-badge'))).not.toBeVisible();
  });
});

describe('Calendar - Recurring Events', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-calendar')).tap();
    await element(by.id('add-event-button')).tap();
  });

  it('should set daily recurrence', async () => {
    await element(by.id('event-title-input')).typeText('Daily Standup');
    await element(by.id('recurrence-button')).tap();
    await element(by.id('recurrence-daily')).tap();
    await element(by.id('save-event-button')).tap();

    await expect(element(by.id('recurring-indicator'))).toBeVisible();
  });

  it('should set weekly recurrence', async () => {
    await element(by.id('event-title-input')).typeText('Weekly Review');
    await element(by.id('recurrence-button')).tap();
    await element(by.id('recurrence-weekly')).tap();
    await element(by.id('save-event-button')).tap();

    await expect(element(by.id('recurring-indicator'))).toBeVisible();
  });

  it('should set custom recurrence', async () => {
    await element(by.id('event-title-input')).typeText('Bi-weekly Meeting');
    await element(by.id('recurrence-button')).tap();
    await element(by.id('recurrence-custom')).tap();
    await element(by.id('custom-interval-input')).typeText('2');
    await element(by.id('custom-unit-weeks')).tap();
    await element(by.id('save-recurrence')).tap();

    await expect(element(by.id('recurring-indicator'))).toBeVisible();
  });
});
