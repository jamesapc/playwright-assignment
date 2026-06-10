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

  test("TC-CART-03: Add items, verify in cart page, remove all, return to inventory — badge gone", async ({ page }) => {
    const cart = new CartLocators(page);

    // Add 3 items from inventory
    for (const product of itemsToAdd) {
      await cart.addToCartButton(product.slug).click();
    }
    await expect(cart.cartBadge).toHaveText("3");

    // Navigate to cart page
    await cart.cartLink.click();
    await expect(page).toHaveURL("/cart.html");

    // Verify each added item appears in the cart with correct name and price
    for (const product of itemsToAdd) {
      const item = cart.cartItems.filter({
        has: page.locator('[data-test="inventory-item-name"]', { hasText: product.name }),
      });
      await expect(cart.cartItemName(item)).toHaveText(product.name);
      await expect(cart.cartItemPrice(item)).toHaveText(`$${product.price.toFixed(2)}`);
    }

    // Remove all items from cart
    for (const product of itemsToAdd) {
      await cart.cartRemoveButton(product.slug).click();
    }

    // Cart should be empty
    await expect(cart.cartItems).toHaveCount(0);

    // Go back to inventory
    await cart.continueShoppingButton.click();
    await expect(page).toHaveURL("/inventory.html");

    // Cart badge should not be visible
    await expect(cart.cartBadge).not.toBeVisible();
  });
});
