import { Page, Locator } from "@playwright/test";

export class InventoryLocators {
  readonly page: Page;
  readonly inventoryItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.inventoryItems = page.locator('[data-test="inventory-item"]');
  }

  itemName(item: Locator): Locator {
    return item.locator('[data-test="inventory-item-name"]');
  }

  itemPrice(item: Locator): Locator {
    return item.locator('[data-test="inventory-item-price"]');
  }

  // Clickable product name link on inventory page (by product name text)
  itemLink(name: string): Locator {
    return this.page.locator('[data-test="inventory-item-name"]', { hasText: name });
  }

  // --- Detail page locators ---
  get detailName(): Locator {
    return this.page.locator('[data-test="inventory-item-name"]');
  }

  get detailPrice(): Locator {
    return this.page.locator('[data-test="inventory-item-price"]');
  }

  get backToProductsButton(): Locator {
    return this.page.locator('[data-test="back-to-products"]');
  }

  get sortDropdown(): Locator {
    return this.page.locator('[data-test="product-sort-container"]');
  }

  get allItemNames(): Locator {
    return this.page.locator('[data-test="inventory-item-name"]');
  }

  get allItemPrices(): Locator {
    return this.page.locator('[data-test="inventory-item-price"]');
  }
}
