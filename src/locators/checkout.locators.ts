import { Page, Locator } from "@playwright/test";

export class CheckoutLocators {
  constructor(private page: Page) {}

  // Step 1 — form fields
  get firstNameInput(): Locator { return this.page.locator('[data-test="firstName"]'); }
  get lastNameInput(): Locator { return this.page.locator('[data-test="lastName"]'); }
  get postalCodeInput(): Locator { return this.page.locator('[data-test="postalCode"]'); }
  get continueButton(): Locator { return this.page.locator('[data-test="continue"]'); }
  get cancelButton(): Locator { return this.page.locator('[data-test="cancel"]'); }

  // Step 2 — order summary
  get paymentInfoLabel(): Locator { return this.page.locator('[data-test="payment-info-label"]'); }
  get paymentInfoValue(): Locator { return this.page.locator('[data-test="payment-info-value"]'); }
  get shippingInfoLabel(): Locator { return this.page.locator('[data-test="shipping-info-label"]'); }
  get shippingInfoValue(): Locator { return this.page.locator('[data-test="shipping-info-value"]'); }
  get subtotalLabel(): Locator { return this.page.locator('[data-test="subtotal-label"]'); }
  get taxLabel(): Locator { return this.page.locator('[data-test="tax-label"]'); }
  get totalLabel(): Locator { return this.page.locator('[data-test="total-label"]'); }
  get finishButton(): Locator { return this.page.locator('[data-test="finish"]'); }

  // Complete page
  get completeHeader(): Locator { return this.page.locator('[data-test="complete-header"]'); }
  get completeText(): Locator { return this.page.locator('[data-test="complete-text"]'); }
  get backHomeButton(): Locator { return this.page.locator('[data-test="back-to-products"]'); }

  // Cart items on step 2
  get cartItems(): Locator { return this.page.locator('[data-test="inventory-item"]'); }
  cartItemName(item: Locator): Locator { return item.locator('[data-test="inventory-item-name"]'); }
  cartItemPrice(item: Locator): Locator { return item.locator('[data-test="inventory-item-price"]'); }
}
