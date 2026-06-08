import { test, expect } from "@playwright/test";
import { login } from "@commons/auth";
import { CartLocators } from "@locators/cart.locators";
import credentials from "@data/credentials.json";
import products from "@data/products.json";

// Pick 3 products to add to cart
const itemsToAdd = products.slice(0, 3);

test.describe("Cart — Add Items", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await login(page, credentials.standard_user.username, credentials.standard_user.password);
    await expect(page).toHaveURL("/inventory.html");
  });

  test("TC-CART-01: Add 3 items — cart badge updates and buttons change to Remove", async ({ page }) => {
    const cart = new CartLocators(page);

    // Cart badge should not exist before adding anything
    await expect(cart.cartBadge).not.toBeVisible();

    for (let i = 0; i < itemsToAdd.length; i++) {
      const product = itemsToAdd[i];

      // Click Add to cart
      await cart.addToCartButton(product.slug).click();

      // Cart badge increments
      await expect(cart.cartBadge).toHaveText(String(i + 1));

      // Button changes to Remove
      await expect(cart.removeButton(product.slug)).toBeVisible();
      await expect(cart.removeButton(product.slug)).toHaveText("Remove");
    }

    // Exactly 3 Remove buttons visible on inventory page
    await expect(cart.allRemoveButtons).toHaveCount(3);
  });

  test("TC-CART-02: Remove button reverts to Add to cart and badge decrements", async ({ page }) => {
    const cart = new CartLocators(page);

    // Add 3 items first
    for (const product of itemsToAdd) {
      await cart.addToCartButton(product.slug).click();
    }
    await expect(cart.cartBadge).toHaveText("3");
    await expect(cart.allRemoveButtons).toHaveCount(3);

    // Remove one item
    const [first] = itemsToAdd;
    await cart.removeButton(first.slug).click();

    // Badge drops to 2
    await expect(cart.cartBadge).toHaveText("2");

    // Add to cart button is back for that product
    await expect(cart.addToCartButton(first.slug)).toBeVisible();

    // Only 2 Remove buttons remain
    await expect(cart.allRemoveButtons).toHaveCount(2);
  });
});
