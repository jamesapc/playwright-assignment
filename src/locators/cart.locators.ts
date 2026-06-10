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

  // Cart page — item rows
  get cartItems(): Locator {
    return this.page.locator('[data-test="inventory-item"]');
  }

  // Cart page — item name inside a cart item row
  cartItemName(item: Locator): Locator {
    return item.locator('[data-test="inventory-item-name"]');
  }

  // Cart page — item price inside a cart item row
  cartItemPrice(item: Locator): Locator {
    return item.locator('[data-test="inventory-item-price"]');
  }

  // Cart page — remove button inside a cart item row (by slug)
  cartRemoveButton(slug: string): Locator {
    return this.page.locator(`[data-test="remove-${slug}"]`);
  }

  // Cart page — continue shopping button
  get continueShoppingButton(): Locator {
    return this.page.locator('[data-test="continue-shopping"]');
  }
}
