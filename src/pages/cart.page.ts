import { Page, expect } from "@playwright/test";
import { CartLocators } from "@locators/cart.locators";

export class CartPage {
  private locators: CartLocators;

  constructor(private page: Page) {
    this.locators = new CartLocators(page);
  }

  async addToCart(slug: string) {
    await this.locators.addToCartButton(slug).click();
  }

  async removeFromInventory(slug: string) {
    await this.locators.removeButton(slug).click();
  }

  async removeFromCart(slug: string) {
    await this.locators.cartRemoveButton(slug).click();
  }

  async goToCart() {
    await this.locators.cartLink.click();
    await expect(this.page).toHaveURL("/cart.html");
  }

  async continueShopping() {
    await this.locators.continueShoppingButton.click();
    await expect(this.page).toHaveURL("/inventory.html");
  }

  async expectBadgeCount(count: number) {
    await expect(this.locators.cartBadge).toHaveText(String(count));
  }

  async expectBadgeHidden() {
    await expect(this.locators.cartBadge).not.toBeVisible();
  }

  async expectRemoveButtonVisible(slug: string) {
    await expect(this.locators.removeButton(slug)).toBeVisible();
    await expect(this.locators.removeButton(slug)).toHaveText("Remove");
  }

  async expectAddToCartButtonVisible(slug: string) {
    await expect(this.locators.addToCartButton(slug)).toBeVisible();
  }

  async expectRemoveButtonCount(count: number) {
    await expect(this.locators.allRemoveButtons).toHaveCount(count);
  }

  async expectCartEmpty() {
    await expect(this.locators.cartItems).toHaveCount(0);
  }

  async expectCartItem(name: string, price: number) {
    const item = this.locators.cartItems.filter({
      has: this.page.locator('[data-test="inventory-item-name"]', { hasText: name }),
    });
    await expect(this.locators.cartItemName(item)).toHaveText(name);
    await expect(this.locators.cartItemPrice(item)).toHaveText(`$${price.toFixed(2)}`);
  }

  async proceedToCheckout() {
    await this.page.locator('[data-test="checkout"]').click();
    await expect(this.page).toHaveURL("/checkout-step-one.html");
  }
}
