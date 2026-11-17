import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, role: "admin" | "user") {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(`${role}@peliculasya.test`);
  await page.getByLabel("Contraseña", { exact: true }).fill("Browser-Test-Password-2026!");
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page.getByRole("button", { name: `Salir (${role})`, exact: true })).toBeVisible();
}

test("catálogo público, búsqueda, detalle y diseño adaptable", async ({ page }) => {
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Una buena película empieza por elegirla." }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Interestelar", exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: `test-results/catalog-${width}.png`, fullPage: true });
  }

  await page.getByLabel("Buscar por título").fill("Chihiro");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page).toHaveURL(/search=Chihiro/);
  await expect(
    page.getByRole("heading", { name: "El viaje de Chihiro", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Interestelar", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: /El viaje de Chihiro/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "El viaje de Chihiro" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Sinopsis", exact: true })).toBeVisible();
});

test("visitante y usuario común no acceden al panel", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
  await login(page, "user");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Sin permisos", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Salir (user)", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Salir (user)", exact: true }).click();
  await expect(page.getByRole("link", { name: "Ingresar", exact: true })).toBeVisible();
});

test("admin crea, valida, edita y elimina una película", async ({ page }) => {
  await login(page, "admin");
  await page.getByRole("link", { name: "Administrar", exact: true }).click();
  await page.getByRole("button", { name: "Agregar película", exact: true }).click();
  await page.getByRole("button", { name: "Guardar película", exact: true }).click();
  await expect(page.getByText("Ingresá el título", { exact: true })).toBeVisible();
  await page.getByLabel("Título", { exact: true }).fill("Historia del navegador");
  await page
    .getByLabel("Sinopsis", { exact: true })
    .fill("Una película creada desde el formulario de administración.");
  await page.getByLabel("Género", { exact: true }).selectOption("Drama");
  await page.getByLabel("Duración (minutos)").fill("110");
  await page.getByLabel("Fecha de estreno").fill("2024-06-15");
  await page.getByRole("button", { name: "Guardar película", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: "Historia del navegador" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Editar Historia del navegador", exact: true }).click();
  await page.getByLabel("Título", { exact: true }).fill("Historia editada");
  await page.getByRole("button", { name: "Guardar película", exact: true }).click();
  const editedRow = page.getByRole("row").filter({ hasText: "Historia editada" });
  await expect(editedRow).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await editedRow.getByRole("button", { name: "Eliminar Historia editada", exact: true }).click();
  await expect(editedRow).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Película eliminada.");
});
