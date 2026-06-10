import { test, expect } from "@playwright/test";
import { login } from "@commons/auth";
import { CartLocators } from "@locators/cart.locators";
import { CheckoutLocators } from "@locators/checkout.locators";
import credentials from "@data/credentials.json";
import products from "@data/products.json";

const itemsToAdd = products.slice(0, 3);

test.describe("Checkout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await login(page, credentials.standard_user.username, credentials.standard_user.password);
    await expect(page).toHaveURL("/inventory.html");

    const cart = new CartLocators(page);
    for (const product of itemsToAdd) {
      await cart.addToCartButton(product.slug).click();
    }
    await cart.cartLink.click();
    await expect(page).toHaveURL("/cart.html");
    await page.locator('[data-test="checkout"]').click();
    await expect(page).toHaveURL("/checkout-step-one.html");
  });

  test("TC-CHECKOUT-01: Fill info and continue to order summary page", async ({ page }) => {
    const checkout = new CheckoutLocators(page);

    // Fill checkout form
    await checkout.firstNameInput.fill("firstname");
    await checkout.lastNameInput.fill("lastname");
    await checkout.postalCodeInput.fill("10160");
    await checkout.continueButton.click();

    // Should redirect to step 2
    await expect(page).toHaveURL("/checkout-step-two.html");

    // Verify order summary elements are visible
    await expect(checkout.paymentInfoLabel).toBeVisible();
    await expect(checkout.paymentInfoValue).toBeVisible();
    await expect(checkout.shippingInfoLabel).toBeVisible();
    await expect(checkout.shippingInfoValue).toBeVisible();
    await expect(checkout.subtotalLabel).toBeVisible();
    await expect(checkout.taxLabel).toBeVisible();
    await expect(checkout.totalLabel).toBeVisible();
    await expect(checkout.finishButton).toBeVisible();

    // Verify added items appear in the summary
    await expect(checkout.cartItems).toHaveCount(itemsToAdd.length);
    for (const product of itemsToAdd) {
      const item = checkout.cartItems.filter({
        has: page.locator('[data-test="inventory-item-name"]', { hasText: product.name }),
      });
      await expect(checkout.cartItemName(item)).toHaveText(product.name);
      await expect(checkout.cartItemPrice(item)).toHaveText(`$${product.price.toFixed(2)}`);
    }
    // Verify price calculations
    const itemTotal = itemsToAdd.reduce((sum, p) => sum + p.price, 0);
    const tax = Math.round(itemTotal * 0.08 * 100) / 100;
    const total = Math.round((itemTotal + tax) * 100) / 100;

    await expect(checkout.subtotalLabel).toHaveText(`Item total: $${itemTotal.toFixed(2)}`);
    await expect(checkout.taxLabel).toHaveText(`Tax: $${tax.toFixed(2)}`);
    await expect(checkout.totalLabel).toHaveText(`Total: $${total.toFixed(2)}`);
  });

  test("TC-CHECKOUT-02: Complete order and verify success page", async ({ page }) => {
    const checkout = new CheckoutLocators(page);

    await checkout.firstNameInput.fill("firstname");
    await checkout.lastNameInput.fill("lastname");
    await checkout.postalCodeInput.fill("10160");
    await checkout.continueButton.click();
    await expect(page).toHaveURL("/checkout-step-two.html");

    await checkout.finishButton.click();
    await expect(page).toHaveURL("/checkout-complete.html");

    await expect(checkout.completeHeader).toHaveText("Thank you for your order!");
    await expect(checkout.completeText).toHaveText("Your order has been dispatched, and will arrive just as fast as the pony can get there!");
    await expect(checkout.backHomeButton).toBeVisible();
  });
});
