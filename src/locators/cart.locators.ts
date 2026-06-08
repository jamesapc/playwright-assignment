import { Page, Locator } from "@playwright/test";

export class CartLocators {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Cart icon badge showing item count
  get cartBadge(): Locator {
    return this.page.locator('[data-test="shopping-cart-badge"]');
  }

  // Cart icon link
  get cartLink(): Locator {
    return this.page.locator('[data-test="shopping-cart-link"]');
  }

  // Add to cart button for a specific product (by data-test slug)
  addToCartButton(slug: string): Locator {
    return this.page.locator(`[data-test="add-to-cart-${slug}"]`);
  }

  // Remove button for a specific product (by data-test slug)
  removeButton(slug: string): Locator {
    return this.page.locator(`[data-test="remove-${slug}"]`);
  }

  // All visible "Remove" buttons on the page
  get allRemoveButtons(): Locator {
    return this.page.locator('button[data-test^="remove"]');
  }
}
