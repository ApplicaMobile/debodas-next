import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe.configure({ mode: "serial" });

test("protege el admin y autentica pareja y administrador", async ({
  page,
  browser,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin|\/login\?next=\/admin/);

  await login(page, "demo@debodas.local", "demo1234", "/mi-cuenta");
  await expect(page.getByRole("heading", { name: "Mi cuenta" })).toBeVisible();
  await expect(page.getByText("Bienvenido, María y Juan")).toBeVisible();

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/acceso-denegado\?from=admin/);

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, "admin@debodas.local", "admin1234", "/admin");
  await expect(
    adminPage.getByRole("heading", { name: "Panel admin" }),
  ).toBeVisible();
  await expect(adminPage.getByRole("heading", { name: "Resumen" })).toBeVisible();
  await adminContext.close();
});

test("encola recuperación y permite cambiar una contraseña", async ({
  page,
  browser,
}) => {
  await page.goto("/recuperar");
  await page.getByLabel("Email").fill("demo@debodas.local");
  await page.getByRole("button", { name: "Enviar enlace" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Si ese email está registrado",
  );

  await page.goto("/recuperar/e2e-reset-token-known");
  await page.getByLabel("Nueva contraseña").fill("nueva1234");
  await page.getByLabel("Repetir contraseña").fill("nueva1234");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page.getByRole("status")).toContainText("Contraseña actualizada");

  const resetContext = await browser.newContext();
  const resetPage = await resetContext.newPage();
  await login(resetPage, "reset@debodas.local", "nueva1234", "/mi-cuenta");
  await resetContext.close();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, "admin@debodas.local", "admin1234", "/admin");
  await adminPage.goto(
    "/admin/emails?status=queued&type=password_reset&q=demo%40debodas.local",
  );
  const row = adminPage
    .getByRole("row")
    .filter({ hasText: "demo@debodas.local" });
  await expect(row).toContainText("Restablecer contraseña");
  await expect(row).toContainText("0/5");
  await expect(row).toContainText("queued");
  await adminContext.close();
});

test("registra un RSVP y lo muestra en la cuenta", async ({ page, browser }) => {
  const guestName = "Invitado E2E";
  await page.goto("/bodas/demo");
  const rsvp = page.locator("#rsvp");
  await rsvp.getByLabel("Nombre y apellido").fill(guestName);
  await rsvp.getByLabel("Email (opcional)").fill("invitado-e2e@example.com");
  await rsvp.getByRole("radio", { name: "Sí, asistiré" }).check();
  await rsvp.getByLabel("¿Necesitás menú especial?").selectOption("vegetariano");
  await rsvp
    .getByLabel("Mensaje para los novios (opcional)")
    .fill("Mensaje generado por Playwright");
  await rsvp.getByRole("button", { name: "Confirmar asistencia" }).click();
  await expect(rsvp.getByRole("status")).toContainText(
    "Recibimos tu confirmación",
  );

  const accountContext = await browser.newContext();
  const accountPage = await accountContext.newPage();
  await login(accountPage, "demo@debodas.local", "demo1234", "/mi-cuenta");
  await accountPage.goto("/mi-cuenta/invitados");
  await expect(accountPage.getByText(guestName)).toBeVisible();
  await expect(
    accountPage.getByRole("cell", { name: "Vegetariano" }),
  ).toBeVisible();
  await accountContext.close();
});

test("crea y aprueba una calificación, con email en cola", async ({
  page,
  browser,
}) => {
  const ratingEmail = "rating-e2e@example.com";
  await page.goto("/calificar?bodaId=boda-e2e-past");
  await page.getByRole("button", { name: "5 estrellas" }).click();
  await page.getByLabel("Nombre").fill("Cliente Rating E2E");
  await page.getByLabel("Email").fill(ratingEmail);
  await page
    .getByLabel("Comentario (opcional)")
    .fill("Calificación automatizada");
  await page.getByRole("button", { name: "Enviar calificación" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Recibimos tu calificación",
  );

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, "admin@debodas.local", "admin1234", "/admin");
  await adminPage.goto("/admin/calificaciones?status=pending");
  const rating = adminPage.locator("article").filter({ hasText: ratingEmail });
  await expect(rating).toBeVisible();
  await rating.getByRole("button", { name: "Aprobar" }).click();
  await expect(rating).toHaveCount(0);
  await adminPage.goto("/admin/calificaciones?status=approved");
  await expect(
    adminPage.locator("article").filter({ hasText: ratingEmail }),
  ).toContainText("approved");

  await adminPage.goto(
    `/admin/emails?status=queued&type=rating_thanks&q=${encodeURIComponent(ratingEmail)}`,
  );
  const row = adminPage.getByRole("row").filter({ hasText: ratingEmail });
  await expect(row).toContainText("¡Gracias por tu calificación!");
  await expect(row).toContainText("queued");
  await adminContext.close();
});

test("recorre las secciones administrativas críticas", async ({ page }) => {
  await login(page, "admin@debodas.local", "admin1234", "/admin");

  for (const [path, heading] of [
    ["/admin/bodas?q=demo", "Bodas"],
    ["/admin/usuarios", "Usuarios"],
    ["/admin/emails", "Emails"],
    ["/admin/auditoria", "Auditoría administrativa"],
  ] as const) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }

  await page.goto("/admin/emails");
  await expect(page.getByText("simulado (sin credenciales)")).toBeVisible();
});
