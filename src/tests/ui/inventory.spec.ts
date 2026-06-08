import { test, expect } from "@playwright/test";
import { login } from "@commons/auth";
import { InventoryLocators } from "@locators/inventory.locators";
import credentials from "@data/credentials.json";
import products from "@data/products.json";

test.describe("Inventory — Product Detail", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await login(page, credentials.standard_user.username, credentials.standard_user.password);
    await expect(page).toHaveURL("/inventory.html");
  });

  for (const product of products) {
    test(`TC-INV-DETAIL-${product.id}: Click "${product.name}" navigates to correct detail page`, async ({ page }) => {
      const inventory = new InventoryLocators(page);

      // Click the product name link
      await inventory.itemLink(product.name).click();

      // URL should update to inventory-item.html?id=<id>
      await expect(page).toHaveURL(`/inventory-item.html?id=${product.id}`);

      // Detail page shows correct name and price
      await expect(inventory.detailName).toHaveText(product.name);
      await expect(inventory.detailPrice).toHaveText(`$${product.price.toFixed(2)}`);
    });
  }
});

test.describe("Inventory — Sorting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await login(page, credentials.standard_user.username, credentials.standard_user.password);
    await expect(page).toHaveURL("/inventory.html");
  });

  test("TC-INV-SORT-01: Sort by Name (A to Z)", async ({ page }) => {
    const inventory = new InventoryLocators(page);

    await inventory.sortDropdown.selectOption("az");

    const names = await inventory.allItemNames.allTextContents();
    const expected = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(expected);
  });

  test("TC-INV-SORT-02: Sort by Name (Z to A)", async ({ page }) => {
    const inventory = new InventoryLocators(page);

    await inventory.sortDropdown.selectOption("za");

    const names = await inventory.allItemNames.allTextContents();
    const expected = [...names].sort((a, b) => b.localeCompare(a));
    expect(names).toEqual(expected);
  });

  test("TC-INV-SORT-03: Sort by Price (low to high)", async ({ page }) => {
    const inventory = new InventoryLocators(page);

    await inventory.sortDropdown.selectOption("lohi");

    const priceTexts = await inventory.allItemPrices.allTextContents();
    const prices = priceTexts.map((p) => parseFloat(p.replace("$", "")));
    const expected = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(expected);
  });

  test("TC-INV-SORT-04: Sort by Price (high to low)", async ({ page }) => {
    const inventory = new InventoryLocators(page);

    await inventory.sortDropdown.selectOption("hilo");

    const priceTexts = await inventory.allItemPrices.allTextContents();
    const prices = priceTexts.map((p) => parseFloat(p.replace("$", "")));
    const expected = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(expected);
  });
});
