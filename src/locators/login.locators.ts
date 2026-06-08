import { Page } from "@playwright/test";

export class LoginLocators {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get usernameInput() {
    return this.page.locator('[data-test="username"]');
  }

  get passwordInput() {
    return this.page.locator('[data-test="password"]');
  }

  get loginButton() {
    return this.page.locator('[data-test="login-button"]');
  }

  get errorMessage() {
    return this.page.locator('[data-test="error"]');
  }
}
