import { Page } from "@playwright/test";

export class ProductDetailLocators {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get itemName() {
    return this.page.locator('[data-test="inventory-item-name"]');
  }

  get itemPrice() {
    return this.page.locator('[data-test="inventory-item-price"]');
  }

  get backButton() {
    return this.page.locator('[data-test="back-to-products"]');
  }
}
