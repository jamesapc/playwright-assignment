import { test, expect, Page } from "@playwright/test";
import { login } from "@commons/auth";
import { LoginLocators } from "@locators/login.locators";
import { InventoryLocators } from "@locators/inventory.locators";
import credentials from "@data/credentials.json";
import products from "@data/products.json";

async function verifyInventoryProducts(page: Page) {
  const inventory = new InventoryLocators(page);

  for (const product of products) {
    const item = inventory.inventoryItems.filter({
      has: page.locator('[data-test="inventory-item-name"]', { hasText: product.name }),
    });

    await expect(inventory.itemName(item)).toHaveText(product.name);
    await expect(inventory.itemPrice(item)).toHaveText(`$${product.price.toFixed(2)}`);
  }
}

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("TC-AUTH-01: Login with valid credentials redirects to inventory page and shows correct products", async ({
    page,
  }) => {
    const { username, password } = credentials.standard_user;

    await login(page, username, password);

    await expect(page).toHaveURL("/inventory.html");
    await verifyInventoryProducts(page);
  });

  test("TC-AUTH-02: Locked out user sees error message", async ({ page }) => {
    const { username, password } = credentials.locked_out_user;
    const locators = new LoginLocators(page);

    await login(page, username, password);

    await expect(locators.errorMessage).toBeVisible();
    await expect(locators.errorMessage).toContainText("Epic sadface: Sorry, this user has been locked out.");
  });

  test("TC-AUTH-03: Login with empty username shows validation error", async ({ page }) => {
    const locators = new LoginLocators(page);

    await login(page, "", "secret_sauce");

    await expect(locators.errorMessage).toBeVisible();
    await expect(locators.errorMessage).toContainText("Epic sadface: Username is required");
  });

  test("TC-AUTH-04: Login with empty password shows validation error", async ({ page }) => {
    const locators = new LoginLocators(page);

    await login(page, "standard_user", "");

    await expect(locators.errorMessage).toBeVisible();
    await expect(locators.errorMessage).toContainText("Epic sadface: Password is required");
  });

  test("TC-AUTH-05: Login with wrong password shows error message", async ({ page }) => {
    const locators = new LoginLocators(page);

    await login(page, "standard_user", "wrong_password");

    await expect(locators.errorMessage).toBeVisible();
    await expect(locators.errorMessage).toContainText("Epic sadface: Username and password do not match any user in this service");
  });

  test("TC-AUTH-06: Logout returns user to login page, re-login shows correct products", async ({ page }) => {
    const { username, password } = credentials.standard_user;

    await login(page, username, password);
    await expect(page).toHaveURL("/inventory.html");
    await verifyInventoryProducts(page);

    // Open burger menu and click logout
    await page.locator("#react-burger-menu-btn").click();
    await page.locator('[data-test="logout-sidebar-link"]').click();

    await expect(page).toHaveURL("/");

    // Re-login and verify products still correct
    await login(page, username, password);
    await expect(page).toHaveURL("/inventory.html");
    await verifyInventoryProducts(page);
  });

  test("TC-AUTH-07: Accessing inventory page without login redirects to login page", async ({ page }) => {
    const locators = new LoginLocators(page);

    await page.goto("/inventory.html");

    await expect(page).toHaveURL("/");
    await expect(locators.errorMessage).toContainText("Epic sadface: You can only access '/inventory.html' when you are logged in.");
  });

  test("TC-AUTH-08: Performance glitch user eventually redirects to inventory page and shows correct products", async ({
    page,
  }) => {
    const { username, password } = credentials.performance_glitch_user;

    const startTime = Date.now();
    await login(page, username, password);

    await expect(page).toHaveURL("/inventory.html", { timeout: 3_000 });

    const elapsed = Date.now() - startTime;
    expect(elapsed, `Expected redirect within 3s, got ${elapsed}ms`).toBeLessThanOrEqual(3000);

    await verifyInventoryProducts(page);
  });
});
