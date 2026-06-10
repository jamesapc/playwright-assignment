import { test } from "@playwright/test";
import { LoginPage } from "@pages/login.page";
import { CartPage } from "@pages/cart.page";
import { CheckoutPage } from "@pages/checkout.page";
import credentials from "@data/credentials.json";
import products from "@data/products.json";

const itemsToAdd = products.slice(0, 3);

test.describe("Checkout", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credentials.standard_user.username, credentials.standard_user.password);
    await loginPage.expectRedirectedToInventory();

    const cartPage = new CartPage(page);
    for (const product of itemsToAdd) {
      await cartPage.addToCart(product.slug);
    }
    await cartPage.goToCart();
    await cartPage.proceedToCheckout();
  });

  test("TC-CHECKOUT-01: Fill info and continue to order summary page", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.fillInfo("firstname", "lastname", "10160");
    await checkoutPage.continue();

    await checkoutPage.expectSummaryVisible();
    await checkoutPage.expectCartItemCount(itemsToAdd.length);

    for (const product of itemsToAdd) {
      await checkoutPage.expectCartItem(product.name, product.price);
    }

    const itemTotal = itemsToAdd.reduce((sum, p) => sum + p.price, 0);
    await checkoutPage.expectPriceSummary(itemTotal);
  });

  test("TC-CHECKOUT-02: Complete order and verify success page", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.fillInfo("firstname", "lastname", "10160");
    await checkoutPage.continue();
    await checkoutPage.finish();
    await checkoutPage.expectSuccessPage();
  });
});
