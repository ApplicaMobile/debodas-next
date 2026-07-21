import { expect, type Page } from "@playwright/test";

export async function login(
  page: Page,
  email: string,
  password: string,
  expectedPath: "/admin" | "/mi-cuenta",
) {
  await page.goto(
    expectedPath === "/admin" ? "/login?next=/admin" : "/login",
  );
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  const isExpectedPath = (url: URL) =>
    url.pathname === expectedPath ||
    url.pathname.startsWith(`${expectedPath}/`);
  await expect(page).toHaveURL(isExpectedPath);
  await page.reload();
  await expect(page).toHaveURL(isExpectedPath);
}
