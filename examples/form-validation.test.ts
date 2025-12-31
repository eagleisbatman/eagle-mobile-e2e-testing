/**
 * Example: Form Validation E2E Tests
 *
 * Comprehensive tests for form validation including:
 * - Input field validation
 * - Real-time validation feedback
 * - Form submission handling
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Form Validation - Text Input', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-create-account-button')).tap();
    await waitFor(element(by.id('registration-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should validate required fields', async () => {
    await element(by.id('register-button')).tap();

    await expect(element(by.id('first-name-error'))).toBeVisible();
    await expect(element(by.id('email-error'))).toBeVisible();
  });

  it('should validate minimum length', async () => {
    await element(by.id('first-name-input')).typeText('A');
    await element(by.id('first-name-input')).tapReturnKey();

    await expect(element(by.id('first-name-error'))).toHaveText('Minimum 2 characters required');
  });

  it('should clear error when valid input entered', async () => {
    await element(by.id('first-name-input')).tapReturnKey();
    await expect(element(by.id('first-name-error'))).toBeVisible();

    await element(by.id('first-name-input')).typeText('John');

    await expect(element(by.id('first-name-error'))).not.toBeVisible();
  });
});

describe('Form Validation - Email', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-create-account-button')).tap();
    await waitFor(element(by.id('registration-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should reject invalid email format', async () => {
    await element(by.id('email-input')).typeText('invalid-email');
    await element(by.id('email-input')).tapReturnKey();

    await expect(element(by.id('email-error'))).toHaveText('Please enter a valid email address');
  });

  it('should accept valid email format', async () => {
    await element(by.id('email-input')).typeText('valid@example.com');
    await element(by.id('email-input')).tapReturnKey();

    await expect(element(by.id('email-error'))).not.toBeVisible();
  });
});

describe('Form Validation - Password', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-create-account-button')).tap();
    await waitFor(element(by.id('registration-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should show password requirements', async () => {
    await element(by.id('password-input')).tap();

    await expect(element(by.id('password-requirements'))).toBeVisible();
  });

  it('should validate password strength', async () => {
    await element(by.id('password-input')).typeText('weak');

    await expect(element(by.id('req-length-unmet'))).toBeVisible();
  });

  it('should show all requirements met for strong password', async () => {
    await element(by.id('password-input')).typeText('SecurePass123!');

    await expect(element(by.id('req-length-met'))).toBeVisible();
    await expect(element(by.id('req-uppercase-met'))).toBeVisible();
    await expect(element(by.id('req-number-met'))).toBeVisible();
  });

  it('should toggle password visibility', async () => {
    await element(by.id('password-input')).typeText('MyPassword');
    await element(by.id('password-visibility-toggle')).tap();

    await expect(element(by.id('password-input'))).toHaveText('MyPassword');
  });
});

describe('Form Validation - Submission', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-create-account-button')).tap();
    await waitFor(element(by.id('registration-screen'))).toBeVisible().withTimeout(5000);
  });

  it('should prevent submission with invalid fields', async () => {
    await element(by.id('register-button')).tap();

    await expect(element(by.id('first-name-error'))).toBeVisible();
    await expect(element(by.id('email-error'))).toBeVisible();
  });

  it('should show success after valid submission', async () => {
    await element(by.id('first-name-input')).typeText('John');
    await element(by.id('last-name-input')).typeText('Doe');
    await element(by.id('email-input')).typeText('newuser@example.com');
    await element(by.id('password-input')).typeText('SecurePass123!');
    await element(by.id('confirm-password-input')).typeText('SecurePass123!');
    await element(by.id('terms-checkbox')).tap();
    await element(by.id('register-button')).tap();

    await waitFor(element(by.id('email-verification-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
