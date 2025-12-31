/**
 * Example: Banking and Finance E2E Tests
 *
 * Tests for banking app functionality including:
 * - Account overview
 * - Transactions
 * - Transfers
 * - Bill payments
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Banking - Account Overview', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should display account balances', async () => {
    await expect(element(by.id('accounts-section'))).toBeVisible();
    await expect(element(by.id('checking-balance'))).toBeVisible();
    await expect(element(by.id('savings-balance'))).toBeVisible();
  });

  it('should show total balance', async () => {
    await expect(element(by.id('total-balance'))).toBeVisible();
  });

  it('should navigate to account details', async () => {
    await element(by.id('checking-account')).tap();
    await expect(element(by.id('account-detail-screen'))).toBeVisible();
  });

  it('should toggle balance visibility', async () => {
    await element(by.id('hide-balance-button')).tap();
    await expect(element(by.id('balance-hidden'))).toBeVisible();

    await element(by.id('show-balance-button')).tap();
    await expect(element(by.id('checking-balance'))).toBeVisible();
  });
});

describe('Banking - Transactions', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('checking-account')).tap();
  });

  it('should display transaction history', async () => {
    await expect(element(by.id('transactions-list'))).toBeVisible();
    await expect(element(by.id('transaction-item-0'))).toBeVisible();
  });

  it('should show transaction details', async () => {
    await element(by.id('transaction-item-0')).tap();
    await expect(element(by.id('transaction-detail-screen'))).toBeVisible();
    await expect(element(by.id('transaction-amount'))).toBeVisible();
    await expect(element(by.id('transaction-date'))).toBeVisible();
  });

  it('should filter transactions by type', async () => {
    await element(by.id('filter-button')).tap();
    await element(by.id('filter-deposits')).tap();
    await expect(element(by.id('filter-active-deposits'))).toBeVisible();
  });

  it('should search transactions', async () => {
    await element(by.id('search-button')).tap();
    await element(by.id('transaction-search-input')).typeText('Amazon');
    await waitFor(element(by.id('search-results'))).toBeVisible().withTimeout(3000);
  });

  it('should export transactions', async () => {
    await element(by.id('export-button')).tap();
    await element(by.id('export-pdf')).tap();
    await expect(element(by.id('export-success-toast'))).toBeVisible();
  });
});

describe('Banking - Transfers', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('transfer-button')).tap();
  });

  it('should display transfer form', async () => {
    await expect(element(by.id('transfer-screen'))).toBeVisible();
    await expect(element(by.id('from-account-selector'))).toBeVisible();
    await expect(element(by.id('to-account-selector'))).toBeVisible();
    await expect(element(by.id('amount-input'))).toBeVisible();
  });

  it('should select from account', async () => {
    await element(by.id('from-account-selector')).tap();
    await element(by.id('account-checking')).tap();
    await expect(element(by.id('from-account-selected'))).toHaveText(/Checking/);
  });

  it('should select to account', async () => {
    await element(by.id('to-account-selector')).tap();
    await element(by.id('account-savings')).tap();
    await expect(element(by.id('to-account-selected'))).toHaveText(/Savings/);
  });

  it('should validate transfer amount', async () => {
    await element(by.id('amount-input')).typeText('0');
    await element(by.id('transfer-submit-button')).tap();
    await expect(element(by.id('amount-error'))).toBeVisible();
  });

  it('should complete transfer', async () => {
    await element(by.id('from-account-selector')).tap();
    await element(by.id('account-checking')).tap();
    await element(by.id('to-account-selector')).tap();
    await element(by.id('account-savings')).tap();
    await element(by.id('amount-input')).typeText('100');
    await element(by.id('transfer-submit-button')).tap();

    await waitFor(element(by.id('transfer-confirmation'))).toBeVisible().withTimeout(5000);
    await element(by.id('confirm-transfer-button')).tap();

    await expect(element(by.id('transfer-success-screen'))).toBeVisible();
  });

  it('should schedule future transfer', async () => {
    await element(by.id('from-account-selector')).tap();
    await element(by.id('account-checking')).tap();
    await element(by.id('to-account-selector')).tap();
    await element(by.id('account-savings')).tap();
    await element(by.id('amount-input')).typeText('50');
    await element(by.id('schedule-toggle')).tap();
    await element(by.id('schedule-date-picker')).tap();
    await element(by.id('date-confirm')).tap();
    await element(by.id('transfer-submit-button')).tap();

    await expect(element(by.id('scheduled-transfer-success'))).toBeVisible();
  });
});

describe('Banking - Bill Pay', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-bills')).tap();
  });

  it('should display bills list', async () => {
    await expect(element(by.id('bills-screen'))).toBeVisible();
    await expect(element(by.id('bills-list'))).toBeVisible();
  });

  it('should show upcoming bills', async () => {
    await expect(element(by.id('upcoming-bills-section'))).toBeVisible();
    await expect(element(by.id('bill-item-0-due-date'))).toBeVisible();
  });

  it('should pay a bill', async () => {
    await element(by.id('bill-item-0')).tap();
    await element(by.id('pay-bill-button')).tap();
    await element(by.id('confirm-payment-button')).tap();

    await expect(element(by.id('payment-success'))).toBeVisible();
  });

  it('should add new payee', async () => {
    await element(by.id('add-payee-button')).tap();
    await element(by.id('payee-name-input')).typeText('Electric Company');
    await element(by.id('account-number-input')).typeText('123456789');
    await element(by.id('save-payee-button')).tap();

    await expect(element(by.id('payee-Electric-Company'))).toBeVisible();
  });

  it('should set up autopay', async () => {
    await element(by.id('bill-item-0')).tap();
    await element(by.id('setup-autopay-button')).tap();
    await element(by.id('autopay-confirm')).tap();

    await expect(element(by.id('autopay-enabled'))).toBeVisible();
  });
});
