import { test, expect } from "@playwright/test";
import { LoginPage } from "@pages/login.page";
import { InventoryPage } from "@pages/inventory.page";
import credentials from "@data/credentials.json";
import products from "@data/products.json";

async function verifyInventoryProducts(inventoryPage: InventoryPage) {
  for (const product of products) {
    await inventoryPage.expectProductVisible(product.name, product.price);
  }
}

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("TC-AUTH-01: Login with valid credentials redirects to inventory page and shows correct products", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const { username, password } = credentials.standard_user;

    await loginPage.login(username, password);
    await loginPage.expectRedirectedToInventory();
    await verifyInventoryProducts(inventoryPage);
  });

  test("TC-AUTH-02: Locked out user sees error message", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const { username, password } = credentials.locked_out_user;

    await loginPage.login(username, password);
    await loginPage.expectErrorMessage("Epic sadface: Sorry, this user has been locked out.");
  });

  test("TC-AUTH-03: Login with empty username shows validation error", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login("", "secret_sauce");
    await loginPage.expectErrorMessage("Epic sadface: Username is required");
  });

  test("TC-AUTH-04: Login with empty password shows validation error", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login("standard_user", "");
    await loginPage.expectErrorMessage("Epic sadface: Password is required");
  });

  test("TC-AUTH-05: Login with wrong password shows error message", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login("standard_user", "wrong_password");
    await loginPage.expectErrorMessage("Epic sadface: Username and password do not match any user in this service");
  });

  test("TC-AUTH-06: Logout returns user to login page, re-login shows correct products", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const { username, password } = credentials.standard_user;

    await loginPage.login(username, password);
    await loginPage.expectRedirectedToInventory();
    await verifyInventoryProducts(inventoryPage);

    await inventoryPage.logout();
    await expect(page).toHaveURL("/");

    await loginPage.login(username, password);
    await loginPage.expectRedirectedToInventory();
    await verifyInventoryProducts(inventoryPage);
  });

  test("TC-AUTH-07: Accessing inventory page without login redirects to login page", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await page.goto("/inventory.html");
    await expect(page).toHaveURL("/");
    await loginPage.expectErrorMessage("Epic sadface: You can only access '/inventory.html' when you are logged in.");
  });

  test("TC-AUTH-08: Performance glitch user eventually redirects to inventory page and shows correct products", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const { username, password } = credentials.performance_glitch_user;

    const startTime = Date.now();
    await loginPage.login(username, password);
    await loginPage.expectRedirectedToInventory(3_000);

    const elapsed = Date.now() - startTime;
    expect(elapsed, `Expected redirect within 3s, got ${elapsed}ms`).toBeLessThanOrEqual(3000);

    await verifyInventoryProducts(inventoryPage);
  });
});
