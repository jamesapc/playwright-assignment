import { Page, expect } from "@playwright/test";
import { InventoryLocators } from "@locators/inventory.locators";

export class InventoryPage {
  private locators: InventoryLocators;

  constructor(private page: Page) {
    this.locators = new InventoryLocators(page);
  }

  async clickProduct(name: string) {
    await this.locators.itemLink(name).click();
  }

  async expectProductDetailPage(id: number) {
    await expect(this.page).toHaveURL(`/inventory-item.html?id=${id}`);
  }

  async expectDetailName(name: string) {
    await expect(this.locators.detailName).toHaveText(name);
  }

  async expectDetailPrice(price: number) {
    await expect(this.locators.detailPrice).toHaveText(`$${price.toFixed(2)}`);
  }

  async sortBy(option: "az" | "za" | "lohi" | "hilo") {
    await this.locators.sortDropdown.selectOption(option);
  }

  async getItemNames(): Promise<string[]> {
    return this.locators.allItemNames.allTextContents();
  }

  async getItemPrices(): Promise<number[]> {
    const texts = await this.locators.allItemPrices.allTextContents();
    return texts.map((p) => parseFloat(p.replace("$", "")));
  }

  async expectProductVisible(name: string, price: number) {
    const item = this.locators.inventoryItems.filter({
      has: this.page.locator('[data-test="inventory-item-name"]', { hasText: name }),
    });
    await expect(this.locators.itemName(item)).toHaveText(name);
    await expect(this.locators.itemPrice(item)).toHaveText(`$${price.toFixed(2)}`);
  }

  async logout() {
    await this.page.locator("#react-burger-menu-btn").click();
    await this.page.locator('[data-test="logout-sidebar-link"]').click();
  }
}
