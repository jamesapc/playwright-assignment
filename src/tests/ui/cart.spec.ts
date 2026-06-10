import { test } from "@playwright/test";
import { LoginPage } from "@pages/login.page";
import { CartPage } from "@pages/cart.page";
import credentials from "@data/credentials.json";
import products from "@data/products.json";

const itemsToAdd = products.slice(0, 3);

test.describe("Cart — Add Items", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credentials.standard_user.username, credentials.standard_user.password);
    await loginPage.expectRedirectedToInventory();
  });

  test("TC-CART-01: Add 3 items — cart badge updates and buttons change to Remove", async ({ page }) => {
    const cartPage = new CartPage(page);

    await cartPage.expectBadgeHidden();

    for (let i = 0; i < itemsToAdd.length; i++) {
      await cartPage.addToCart(itemsToAdd[i].slug);
      await cartPage.expectBadgeCount(i + 1);
      await cartPage.expectRemoveButtonVisible(itemsToAdd[i].slug);
    }

    await cartPage.expectRemoveButtonCount(3);
  });

  test("TC-CART-02: Remove button reverts to Add to cart and badge decrements", async ({ page }) => {
    const cartPage = new CartPage(page);

    for (const product of itemsToAdd) {
      await cartPage.addToCart(product.slug);
    }
    await cartPage.expectBadgeCount(3);
    await cartPage.expectRemoveButtonCount(3);

    await cartPage.removeFromInventory(itemsToAdd[0].slug);
    await cartPage.expectBadgeCount(2);
    await cartPage.expectAddToCartButtonVisible(itemsToAdd[0].slug);
    await cartPage.expectRemoveButtonCount(2);
  });

  test("TC-CART-03: Add items, verify in cart page, remove all, return to inventory — badge gone", async ({ page }) => {
    const cartPage = new CartPage(page);

    for (const product of itemsToAdd) {
      await cartPage.addToCart(product.slug);
    }
    await cartPage.expectBadgeCount(3);

    await cartPage.goToCart();

    for (const product of itemsToAdd) {
      await cartPage.expectCartItem(product.name, product.price);
    }

    for (const product of itemsToAdd) {
      await cartPage.removeFromCart(product.slug);
    }
    await cartPage.expectCartEmpty();

    await cartPage.continueShopping();
    await cartPage.expectBadgeHidden();
  });
});
