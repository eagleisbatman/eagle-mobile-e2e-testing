/**
 * Example: E-Commerce App E2E Tests
 *
 * Comprehensive tests for shopping apps including:
 * - Product browsing and search
 * - Shopping cart management
 * - Checkout flow
 * - Payment processing
 * - Order tracking
 */

import { device, element, by, expect, waitFor } from 'detox';

describe('E-Commerce - Product Browsing', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('should display product catalog with categories', async () => {
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);

    // Verify category navigation
    await expect(element(by.id('category-electronics'))).toBeVisible();
    await expect(element(by.id('category-clothing'))).toBeVisible();
    await expect(element(by.id('category-home'))).toBeVisible();

    // Verify featured products section
    await expect(element(by.id('featured-products-carousel'))).toBeVisible();
  });

  it('should navigate to product detail when tapping product card', async () => {
    await waitFor(element(by.id('product-card-0'))).toBeVisible().withTimeout(5000);

    await element(by.id('product-card-0')).tap();

    await waitFor(element(by.id('product-detail-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify product detail elements
    await expect(element(by.id('product-title'))).toBeVisible();
    await expect(element(by.id('product-price'))).toBeVisible();
    await expect(element(by.id('product-description'))).toBeVisible();
    await expect(element(by.id('add-to-cart-button'))).toBeVisible();
    await expect(element(by.id('product-images-gallery'))).toBeVisible();
  });

  it('should filter products by price range', async () => {
    await element(by.id('category-electronics')).tap();
    await waitFor(element(by.id('products-list'))).toBeVisible().withTimeout(5000);

    // Open filter modal
    await element(by.id('filter-button')).tap();
    await waitFor(element(by.id('filter-modal'))).toBeVisible().withTimeout(3000);

    // Set price range
    await element(by.id('price-min-input')).typeText('100');
    await element(by.id('price-max-input')).typeText('500');

    // Apply filters
    await element(by.id('apply-filters-button')).tap();

    // Verify filter applied
    await expect(element(by.id('active-filter-badge'))).toBeVisible();
  });

  it('should search products with autocomplete suggestions', async () => {
    await element(by.id('search-bar')).tap();
    await element(by.id('search-input')).typeText('wireless');

    // Verify autocomplete suggestions
    await waitFor(element(by.id('search-suggestions-list')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.id('suggestion-0'))).toBeVisible();

    // Tap suggestion
    await element(by.id('suggestion-0')).tap();

    // Verify search results
    await expect(element(by.id('search-results-screen'))).toBeVisible();
  });
});

describe('E-Commerce - Shopping Cart', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('should add product to cart with quantity selection', async () => {
    // Navigate to product
    await waitFor(element(by.id('product-card-0'))).toBeVisible().withTimeout(5000);
    await element(by.id('product-card-0')).tap();

    await waitFor(element(by.id('product-detail-screen'))).toBeVisible().withTimeout(5000);

    // Select quantity
    await element(by.id('quantity-increase-button')).tap();
    await element(by.id('quantity-increase-button')).tap();
    await expect(element(by.id('quantity-value'))).toHaveText('3');

    // Select size/variant if available
    try {
      await element(by.id('variant-option-L')).tap();
    } catch {
      // Variant selection not available for this product
    }

    // Add to cart
    await element(by.id('add-to-cart-button')).tap();

    // Verify cart updated
    await waitFor(element(by.id('cart-badge')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.id('cart-badge'))).toHaveText('3');
  });

  it('should update item quantity in cart', async () => {
    // Add item to cart first
    await waitFor(element(by.id('product-card-0'))).toBeVisible().withTimeout(5000);
    await element(by.id('product-card-0')).tap();
    await waitFor(element(by.id('add-to-cart-button'))).toBeVisible().withTimeout(5000);
    await element(by.id('add-to-cart-button')).tap();

    // Navigate to cart
    await element(by.id('cart-icon')).tap();
    await waitFor(element(by.id('cart-screen'))).toBeVisible().withTimeout(5000);

    // Increase quantity
    await element(by.id('cart-item-0-increase')).tap();
    await expect(element(by.id('cart-item-0-quantity'))).toHaveText('2');

    // Verify total updated
    await expect(element(by.id('cart-subtotal'))).toBeVisible();
  });

  it('should remove item from cart', async () => {
    // Add item and navigate to cart
    await waitFor(element(by.id('product-card-0'))).toBeVisible().withTimeout(5000);
    await element(by.id('product-card-0')).tap();
    await waitFor(element(by.id('add-to-cart-button'))).toBeVisible().withTimeout(5000);
    await element(by.id('add-to-cart-button')).tap();
    await element(by.id('cart-icon')).tap();

    await waitFor(element(by.id('cart-screen'))).toBeVisible().withTimeout(5000);

    // Swipe to delete or tap delete button
    await element(by.id('cart-item-0-delete')).tap();

    // Confirm deletion
    await waitFor(element(by.id('confirm-delete-modal'))).toBeVisible().withTimeout(3000);
    await element(by.id('confirm-delete-button')).tap();

    // Verify empty cart
    await expect(element(by.id('empty-cart-message'))).toBeVisible();
  });

  it('should apply promo code and show discount', async () => {
    // Add item and navigate to cart
    await waitFor(element(by.id('product-card-0'))).toBeVisible().withTimeout(5000);
    await element(by.id('product-card-0')).tap();
    await element(by.id('add-to-cart-button')).tap();
    await element(by.id('cart-icon')).tap();

    await waitFor(element(by.id('cart-screen'))).toBeVisible().withTimeout(5000);

    // Enter promo code
    await element(by.id('promo-code-input')).typeText('SAVE20');
    await element(by.id('apply-promo-button')).tap();

    // Verify discount applied
    await waitFor(element(by.id('discount-applied-badge')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.id('discount-amount'))).toBeVisible();
  });
});

describe('E-Commerce - Checkout Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Login first
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('test@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should complete full checkout flow with saved address', async () => {
    // Add product to cart
    await element(by.id('product-card-0')).tap();
    await element(by.id('add-to-cart-button')).tap();
    await element(by.id('cart-icon')).tap();

    await waitFor(element(by.id('cart-screen'))).toBeVisible().withTimeout(5000);

    // Proceed to checkout
    await element(by.id('checkout-button')).tap();

    // Step 1: Shipping Address
    await waitFor(element(by.id('checkout-shipping-step'))).toBeVisible().withTimeout(5000);
    await element(by.id('saved-address-0')).tap();
    await element(by.id('continue-to-payment-button')).tap();

    // Step 2: Payment Method
    await waitFor(element(by.id('checkout-payment-step'))).toBeVisible().withTimeout(5000);
    await element(by.id('saved-card-0')).tap();
    await element(by.id('continue-to-review-button')).tap();

    // Step 3: Review Order
    await waitFor(element(by.id('checkout-review-step'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('order-items-summary'))).toBeVisible();
    await expect(element(by.id('shipping-summary'))).toBeVisible();
    await expect(element(by.id('payment-summary'))).toBeVisible();

    // Place order
    await element(by.id('place-order-button')).tap();

    // Verify order confirmation
    await waitFor(element(by.id('order-confirmation-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('order-number'))).toBeVisible();
    await expect(element(by.id('estimated-delivery'))).toBeVisible();
  });

  it('should add new shipping address during checkout', async () => {
    // Add to cart and proceed to checkout
    await element(by.id('product-card-0')).tap();
    await element(by.id('add-to-cart-button')).tap();
    await element(by.id('cart-icon')).tap();
    await element(by.id('checkout-button')).tap();

    await waitFor(element(by.id('checkout-shipping-step'))).toBeVisible().withTimeout(5000);

    // Add new address
    await element(by.id('add-new-address-button')).tap();

    await waitFor(element(by.id('address-form'))).toBeVisible().withTimeout(3000);

    await element(by.id('address-name-input')).typeText('John Doe');
    await element(by.id('address-street-input')).typeText('123 Main Street');
    await element(by.id('address-city-input')).typeText('San Francisco');
    await element(by.id('address-state-input')).typeText('CA');
    await element(by.id('address-zip-input')).typeText('94102');

    await element(by.id('save-address-button')).tap();

    // Verify new address selected
    await expect(element(by.id('selected-address-name'))).toHaveText('John Doe');
  });

  it('should handle payment failure gracefully', async () => {
    // Add to cart and proceed to checkout
    await element(by.id('product-card-0')).tap();
    await element(by.id('add-to-cart-button')).tap();
    await element(by.id('cart-icon')).tap();
    await element(by.id('checkout-button')).tap();

    // Complete shipping step
    await waitFor(element(by.id('checkout-shipping-step'))).toBeVisible().withTimeout(5000);
    await element(by.id('saved-address-0')).tap();
    await element(by.id('continue-to-payment-button')).tap();

    // Enter test card that triggers failure
    await waitFor(element(by.id('checkout-payment-step'))).toBeVisible().withTimeout(5000);
    await element(by.id('add-new-card-button')).tap();

    await element(by.id('card-number-input')).typeText('4000000000000002'); // Decline card
    await element(by.id('card-expiry-input')).typeText('12/25');
    await element(by.id('card-cvv-input')).typeText('123');
    await element(by.id('save-card-button')).tap();

    await element(by.id('continue-to-review-button')).tap();
    await element(by.id('place-order-button')).tap();

    // Verify payment error
    await waitFor(element(by.id('payment-error-message')))
      .toBeVisible()
      .withTimeout(10000);
  });
});

describe('E-Commerce - Order History', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    // Login
    await element(by.id('welcome-login-button')).tap();
    await element(by.id('login-email-input')).typeText('test@example.com');
    await element(by.id('login-password-input')).typeText('Password123!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('should display order history with status tracking', async () => {
    await element(by.id('nav-profile-tab')).tap();
    await element(by.id('order-history-button')).tap();

    await waitFor(element(by.id('orders-list'))).toBeVisible().withTimeout(5000);

    // Verify order card elements
    await expect(element(by.id('order-0-number'))).toBeVisible();
    await expect(element(by.id('order-0-date'))).toBeVisible();
    await expect(element(by.id('order-0-status'))).toBeVisible();
    await expect(element(by.id('order-0-total'))).toBeVisible();
  });

  it('should show order tracking details', async () => {
    await element(by.id('nav-profile-tab')).tap();
    await element(by.id('order-history-button')).tap();

    await waitFor(element(by.id('orders-list'))).toBeVisible().withTimeout(5000);

    // Tap order to see details
    await element(by.id('order-0')).tap();

    await waitFor(element(by.id('order-detail-screen'))).toBeVisible().withTimeout(5000);

    // Verify tracking timeline
    await expect(element(by.id('tracking-timeline'))).toBeVisible();
    await expect(element(by.id('tracking-step-ordered'))).toBeVisible();
  });
});

describe('E-Commerce - Wishlist', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('should add and remove items from wishlist', async () => {
    // Navigate to product
    await waitFor(element(by.id('product-card-0'))).toBeVisible().withTimeout(5000);
    await element(by.id('product-card-0')).tap();

    await waitFor(element(by.id('product-detail-screen'))).toBeVisible().withTimeout(5000);

    // Add to wishlist
    await element(by.id('wishlist-button')).tap();
    await expect(element(by.id('wishlist-button-active'))).toBeVisible();

    // Navigate to wishlist
    await element(by.id('nav-wishlist-tab')).tap();

    await waitFor(element(by.id('wishlist-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('wishlist-item-0'))).toBeVisible();

    // Remove from wishlist
    await element(by.id('wishlist-item-0-remove')).tap();
    await expect(element(by.id('empty-wishlist-message'))).toBeVisible();
  });
});
