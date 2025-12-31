/**
 * Example: Search and Filter E2E Tests
 *
 * Tests for search functionality including:
 * - Basic search
 * - Auto-suggestions
 * - Filters and sorting
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('Search - Basic', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-search')).tap();
  });

  it('should perform search and show results', async () => {
    await element(by.id('search-input')).typeText('headphones');
    await element(by.id('search-submit-button')).tap();

    await waitFor(element(by.id('search-results-list'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('search-result-0'))).toBeVisible();
  });

  it('should show no results message', async () => {
    await element(by.id('search-input')).typeText('xyznonexistent');
    await element(by.id('search-submit-button')).tap();

    await waitFor(element(by.id('no-results-message'))).toBeVisible().withTimeout(5000);
  });

  it('should clear search input', async () => {
    await element(by.id('search-input')).typeText('test');
    await element(by.id('search-clear-button')).tap();

    await expect(element(by.id('search-input'))).toHaveText('');
  });
});

describe('Search - Suggestions', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-search')).tap();
  });

  it('should show suggestions while typing', async () => {
    await element(by.id('search-input')).typeText('lap');

    await waitFor(element(by.id('suggestions-list'))).toBeVisible().withTimeout(3000);
  });

  it('should search when suggestion is tapped', async () => {
    await element(by.id('search-input')).typeText('key');
    await waitFor(element(by.id('suggestions-list'))).toBeVisible().withTimeout(3000);
    await element(by.id('suggestion-0')).tap();

    await waitFor(element(by.id('search-results-list'))).toBeVisible().withTimeout(5000);
  });
});

describe('Search - Filters', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-search')).tap();
    await element(by.id('search-input')).typeText('electronics');
    await element(by.id('search-submit-button')).tap();
    await waitFor(element(by.id('search-results-list'))).toBeVisible().withTimeout(5000);
  });

  it('should open filter panel', async () => {
    await element(by.id('filter-button')).tap();

    await expect(element(by.id('filter-panel'))).toBeVisible();
  });

  it('should apply category filter', async () => {
    await element(by.id('filter-button')).tap();
    await element(by.id('filter-category-laptops')).tap();
    await element(by.id('apply-filters-button')).tap();

    await expect(element(by.id('active-filter-laptops'))).toBeVisible();
  });

  it('should apply price range filter', async () => {
    await element(by.id('filter-button')).tap();
    await element(by.id('price-min-input')).typeText('100');
    await element(by.id('price-max-input')).typeText('500');
    await element(by.id('apply-filters-button')).tap();

    await expect(element(by.id('active-filter-price'))).toHaveText('$100 - $500');
  });

  it('should clear all filters', async () => {
    await element(by.id('filter-button')).tap();
    await element(by.id('filter-category-laptops')).tap();
    await element(by.id('apply-filters-button')).tap();
    await element(by.id('clear-all-filters-button')).tap();

    await expect(element(by.id('active-filter-laptops'))).not.toBeVisible();
  });
});

describe('Search - Sorting', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('user@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('tab-search')).tap();
    await element(by.id('search-input')).typeText('phone');
    await element(by.id('search-submit-button')).tap();
    await waitFor(element(by.id('search-results-list'))).toBeVisible().withTimeout(5000);
  });

  it('should sort by price low to high', async () => {
    await element(by.id('sort-button')).tap();
    await element(by.id('sort-price-low')).tap();

    await expect(element(by.id('active-sort'))).toHaveText('Price: Low to High');
  });

  it('should sort by rating', async () => {
    await element(by.id('sort-button')).tap();
    await element(by.id('sort-rating')).tap();

    await expect(element(by.id('active-sort'))).toHaveText('Highest Rated');
  });
});
