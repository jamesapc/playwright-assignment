import { test, expect } from "@playwright/test";
import { LoginPage } from "@pages/login.page";
import { InventoryPage } from "@pages/inventory.page";
import credentials from "@data/credentials.json";
import products from "@data/products.json";

test.describe("Inventory — Product Detail", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credentials.standard_user.username, credentials.standard_user.password);
    await loginPage.expectRedirectedToInventory();
  });

  for (const product of products) {
    test(`TC-INV-DETAIL-${product.id}: Click "${product.name}" navigates to correct detail page`, async ({ page }) => {
      const inventoryPage = new InventoryPage(page);

      await inventoryPage.clickProduct(product.name);
      await inventoryPage.expectProductDetailPage(product.id);
      await inventoryPage.expectDetailName(product.name);
      await inventoryPage.expectDetailPrice(product.price);
    });
  }
});

test.describe("Inventory — Sorting", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credentials.standard_user.username, credentials.standard_user.password);
    await loginPage.expectRedirectedToInventory();
  });

  test("TC-INV-SORT-01: Sort by Name (A to Z)", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.sortBy("az");
    const names = await inventoryPage.getItemNames();
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  test("TC-INV-SORT-02: Sort by Name (Z to A)", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.sortBy("za");
    const names = await inventoryPage.getItemNames();
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  test("TC-INV-SORT-03: Sort by Price (low to high)", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.sortBy("lohi");
    const prices = await inventoryPage.getItemPrices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test("TC-INV-SORT-04: Sort by Price (high to low)", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.sortBy("hilo");
    const prices = await inventoryPage.getItemPrices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });
});
