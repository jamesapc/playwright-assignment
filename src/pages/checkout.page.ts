import { Page, expect } from "@playwright/test";
import { CheckoutLocators } from "@locators/checkout.locators";

export class CheckoutPage {
  private locators: CheckoutLocators;

  constructor(private page: Page) {
    this.locators = new CheckoutLocators(page);
  }

  async fillInfo(firstName: string, lastName: string, postalCode: string) {
    await this.locators.firstNameInput.fill(firstName);
    await this.locators.lastNameInput.fill(lastName);
    await this.locators.postalCodeInput.fill(postalCode);
  }

  async continue() {
    await this.locators.continueButton.click();
    await expect(this.page).toHaveURL("/checkout-step-two.html");
  }

  async finish() {
    await this.locators.finishButton.click();
    await expect(this.page).toHaveURL("/checkout-complete.html");
  }

  async expectSummaryVisible() {
    await expect(this.locators.paymentInfoLabel).toBeVisible();
    await expect(this.locators.paymentInfoValue).toBeVisible();
    await expect(this.locators.shippingInfoLabel).toBeVisible();
    await expect(this.locators.shippingInfoValue).toBeVisible();
    await expect(this.locators.subtotalLabel).toBeVisible();
    await expect(this.locators.taxLabel).toBeVisible();
    await expect(this.locators.totalLabel).toBeVisible();
    await expect(this.locators.finishButton).toBeVisible();
  }

  async expectPriceSummary(itemTotal: number, taxRate = 0.08) {
    const tax = Math.round(itemTotal * taxRate * 100) / 100;
    const total = Math.round((itemTotal + tax) * 100) / 100;
    await expect(this.locators.subtotalLabel).toHaveText(`Item total: $${itemTotal.toFixed(2)}`);
    await expect(this.locators.taxLabel).toHaveText(`Tax: $${tax.toFixed(2)}`);
    await expect(this.locators.totalLabel).toHaveText(`Total: $${total.toFixed(2)}`);
  }

  async expectCartItem(name: string, price: number) {
    const item = this.locators.cartItems.filter({
      has: this.page.locator('[data-test="inventory-item-name"]', { hasText: name }),
    });
    await expect(this.locators.cartItemName(item)).toHaveText(name);
    await expect(this.locators.cartItemPrice(item)).toHaveText(`$${price.toFixed(2)}`);
  }

  async expectCartItemCount(count: number) {
    await expect(this.locators.cartItems).toHaveCount(count);
  }

  async expectSuccessPage() {
    await expect(this.locators.completeHeader).toHaveText("Thank you for your order!");
    await expect(this.locators.completeText).toHaveText("Your order has been dispatched, and will arrive just as fast as the pony can get there!");
    await expect(this.locators.backHomeButton).toBeVisible();
  }
}
