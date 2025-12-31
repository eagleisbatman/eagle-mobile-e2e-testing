/**
 * Example: Login Flow E2E Tests
 *
 * This file demonstrates proper test structure, naming conventions,
 * and patterns for E2E testing with Detox.
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('User Authentication - Login Flow', () => {
  /**
   * Runs once before all tests in this file.
   * Use for one-time setup that doesn't need to be repeated.
   */
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  /**
   * Runs before each test.
   * Use { delete: true } to clear all app data for test isolation.
   */
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  /**
   * Test: Welcome screen visibility
   * Verifies the initial app state shows welcome screen with key CTAs.
   */
  it('should display welcome screen with login and register options', async () => {
    // Wait for screen to fully load
    await waitFor(element(by.id('welcome-screen')))
      .toBeVisible()
      .withTimeout(10000);

    // Verify primary CTAs are visible
    await expect(element(by.id('welcome-login-button'))).toBeVisible();
    await expect(element(by.id('welcome-register-button'))).toBeVisible();

    // Verify branding elements
    await expect(element(by.id('welcome-logo'))).toBeVisible();
  });

  /**
   * Test: Navigation to login screen
   * Verifies tapping Sign In navigates to login form.
   */
  it('should navigate to login screen when tapping Sign In', async () => {
    // Wait for welcome screen
    await waitFor(element(by.id('welcome-login-button')))
      .toBeVisible()
      .withTimeout(5000);

    // Tap Sign In
    await element(by.id('welcome-login-button')).tap();

    // Verify login screen loaded
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify form elements present
    await expect(element(by.id('login-email-input'))).toBeVisible();
    await expect(element(by.id('login-password-input'))).toBeVisible();
    await expect(element(by.id('login-submit-button'))).toBeVisible();
    await expect(element(by.id('login-forgot-password-link'))).toBeVisible();
  });

  /**
   * Test: Email validation
   * Verifies inline validation error for invalid email format.
   */
  it('should show inline validation error for invalid email format', async () => {
    // Navigate to login
    await element(by.id('welcome-login-button')).tap();
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(5000);

    // Enter invalid email
    await element(by.id('login-email-input')).tap();
    await element(by.id('login-email-input')).typeText('not-an-email');

    // Move focus to trigger validation
    await element(by.id('login-password-input')).tap();

    // Verify validation error shown
    await waitFor(element(by.id('login-email-error')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.id('login-email-error'))).toHaveText('Invalid email format');
  });

  /**
   * Test: Failed authentication
   * Verifies error banner displayed for incorrect credentials.
   */
  it('should show error banner when credentials are incorrect', async () => {
    // Navigate to login
    await element(by.id('welcome-login-button')).tap();
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(5000);

    // Enter invalid credentials
    await element(by.id('login-email-input')).tap();
    await element(by.id('login-email-input')).typeText('wrong@example.com');

    await element(by.id('login-password-input')).tap();
    await element(by.id('login-password-input')).typeText('wrongpassword');

    // Submit form
    await element(by.id('login-submit-button')).tap();

    // Verify error banner appears
    await waitFor(element(by.id('login-error-banner')))
      .toBeVisible()
      .withTimeout(5000);
  });

  /**
   * Test: Successful authentication
   * Verifies successful login navigates to home screen.
   */
  it('should navigate to home screen after successful authentication', async () => {
    // Navigate to login
    await element(by.id('welcome-login-button')).tap();
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(5000);

    // Enter valid credentials
    await element(by.id('login-email-input')).tap();
    await element(by.id('login-email-input')).typeText('test@example.com');

    await element(by.id('login-password-input')).tap();
    await element(by.id('login-password-input')).typeText('ValidPassword123!');

    // Submit form
    await element(by.id('login-submit-button')).tap();

    // Wait for navigation to home
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);

    // Verify home screen elements
    await expect(element(by.id('home-welcome-message'))).toBeVisible();
  });

  /**
   * Test: Session persistence
   * Verifies user remains logged in after app restart.
   */
  it('should persist session across app restart', async () => {
    // Login first
    await element(by.id('welcome-login-button')).tap();
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(5000);

    await element(by.id('login-email-input')).typeText('test@example.com');
    await element(by.id('login-password-input')).typeText('ValidPassword123!');
    await element(by.id('login-submit-button')).tap();

    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);

    // Restart app WITHOUT clearing data
    await device.launchApp({ newInstance: true });

    // Should go directly to home (not welcome)
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  /**
   * Test: Forgot password navigation
   * Verifies forgot password link navigates to reset screen.
   */
  it('should navigate to password reset screen when tapping Forgot Password', async () => {
    // Navigate to login
    await element(by.id('welcome-login-button')).tap();
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(5000);

    // Tap forgot password
    await element(by.id('login-forgot-password-link')).tap();

    // Verify password reset screen
    await waitFor(element(by.id('password-reset-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('password-reset-email-input'))).toBeVisible();
    await expect(element(by.id('password-reset-submit-button'))).toBeVisible();
  });
});
