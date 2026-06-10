import { Page, expect } from "@playwright/test";
import { LoginLocators } from "@locators/login.locators";

export class LoginPage {
  private locators: LoginLocators;

  constructor(private page: Page) {
    this.locators = new LoginLocators(page);
  }

  async goto() {
    await this.page.goto("/");
  }

  async login(username: string, password: string) {
    await this.locators.usernameInput.fill(username);
    await this.locators.passwordInput.fill(password);
    await this.locators.loginButton.click();
  }

  async expectErrorMessage(text: string) {
    await expect(this.locators.errorMessage).toBeVisible();
    await expect(this.locators.errorMessage).toContainText(text);
  }

  async expectRedirectedToInventory(timeout?: number) {
    await expect(this.page).toHaveURL("/inventory.html", { timeout });
  }
}
