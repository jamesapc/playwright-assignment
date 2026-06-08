import { Page } from "@playwright/test";
import { LoginLocators } from "@locators/login.locators";

export async function login(page: Page, username: string, password: string) {
  const locators = new LoginLocators(page);

  await locators.usernameInput.fill(username);
  await locators.passwordInput.fill(password);
  await locators.loginButton.click();
}
