import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe.configure({ mode: "serial" });

async function mockGeocode(page: import("@playwright/test").Page) {
  await page.route("**/api/geocode**", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("lat") && url.searchParams.get("lng")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          address: "Maipú 1873, Santa Fe de la Vera Cruz, Argentina",
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [
          {
            display_name:
              "Maipú 1873, Santa Fe de la Vera Cruz, Santa Fe, Argentina",
            lat: "-31.6405",
            lon: "-60.7042",
            type: "house",
          },
          {
            display_name: "Maipú, Esperanza, Santa Fe, Argentina",
            lat: "-31.4489",
            lon: "-60.9317",
            type: "street",
          },
        ],
      }),
    });
  });
}

test("comparte el micrositio y crea una invitación digital con mapa", async ({
  page,
}) => {
  await mockGeocode(page);
  await login(page, "demo@debodas.local", "demo1234", "/mi-cuenta");

  await page.goto("/mi-cuenta/invitar");
  await expect(
    page.getByRole("heading", { name: "Compartir / invitar" }),
  ).toBeVisible();

  const micrositeInput = page.getByLabel("Link del micrositio");
  await expect(micrositeInput).toHaveValue(/\/bodas\/demo/);
  await page.getByRole("button", { name: "Copiar link" }).click();
  await expect(page.getByRole("button", { name: "¡Copiado!" })).toBeVisible();

  await page.getByRole("button", { name: "Nueva invitación" }).click();
  await page.getByPlaceholder("Ceremonia, Fiesta, etc.").fill("Ceremonia E2E");
  await page.getByPlaceholder("Nos vamos a casar").fill("Nos casamos E2E");
  await page.locator('input[name="datetime"]').fill("2030-11-15T19:30");
  await page.getByPlaceholder("Salón, iglesia, etc.").fill("Salón E2E");

  await page.getByPlaceholder("Ej: Maipú 1873, Santa Fe").fill(
    "Maipú 1873, Santa Fe",
  );
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(
    page.getByText("Santa Fe de la Vera Cruz", { exact: false }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: /Maipú 1873, Santa Fe de la Vera Cruz/,
    })
    .click();
  await expect(page.getByText("Ubicación seleccionada en el mapa")).toBeVisible();

  await page
    .locator("label")
    .filter({ hasText: "Mostrar botones Agendar" })
    .locator('input[type="checkbox"]')
    .check();
  await page.getByRole("button", { name: "Guardar invitación" }).click();
  await expect(page.getByText("Invitación creada.")).toBeVisible();
  await expect(page.getByText("Ceremonia E2E")).toBeVisible();

  await page.goto("/bodas/demo");
  await expect(page.locator("#ubicacion")).toContainText("Nos casamos E2E");
  await expect(page.locator("#ubicacion")).toContainText("Salón E2E");
  await expect(
    page.locator("#ubicacion").getByRole("link", { name: "Agendar" }),
  ).toBeVisible();
  await expect(
    page.locator("#ubicacion").getByRole("link", { name: "Ir al lugar" }),
  ).toBeVisible();
});

test("elimina una invitación y muestra toast", async ({ page }) => {
  await login(page, "demo@debodas.local", "demo1234", "/mi-cuenta");
  await page.goto("/mi-cuenta/invitar");

  page.once("dialog", (dialog) => dialog.accept());
  const card = page.locator("article").filter({ hasText: "Ceremonia E2E" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Eliminado.")).toBeVisible();
  await expect(page.getByText("Ceremonia E2E")).toHaveCount(0);
});
