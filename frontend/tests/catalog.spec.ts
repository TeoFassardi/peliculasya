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

test("mi lista privada permite guardar, filtrar, editar y quitar películas", async ({ page }) => {
  await login(page, "user");
  await page.getByRole("link", { name: /Interestelar/ }).click();
  await page.getByRole("button", { name: "Guardar en mi lista", exact: true }).click();
  await page.getByRole("link", { name: "En mi lista · Ver y editar", exact: true }).click();
  const item = page.getByRole("article", { name: "Interestelar", exact: true });
  await expect(item).toBeVisible();
  await item.getByRole("button", { name: "Editar mi registro", exact: true }).click();
  await item.getByLabel("Mi nota", { exact: true }).fill("Una historia que quiero volver a ver.");
  await item.getByLabel("Ya la vi", { exact: true }).check();
  await item.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(item.getByText("Vista", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    item.getByText("Una historia que quiero volver a ver.", { exact: true }),
  ).toBeVisible();
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `test-results/watchlist-${width}.png`, fullPage: true });
  }
  await page.getByLabel("Mostrar", { exact: true }).selectOption("pending");
  await expect(
    page.getByRole("heading", { name: "No hay películas con este estado", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Mostrar", { exact: true }).selectOption("watched");
  await expect(item).toBeVisible();
  page.once("dialog", (dialog) => dialog.dismiss());
  await item.getByRole("button", { name: "Quitar de mi lista", exact: true }).click();
  await expect(item).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await item.getByRole("button", { name: "Quitar de mi lista", exact: true }).click();
  await expect(item).toHaveCount(0);
  await page.goto("/admin/usuarios");
  await expect(page.getByRole("heading", { name: "Sin permisos", exact: true })).toBeVisible();
});

test("admin cambia roles con confirmación y conserva su propio acceso", async ({
  page,
  request,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  const email = `roles-${Date.now()}@peliculasya.test`;
  const registered = await request.post("http://localhost:5173/api/auth/sign-up/email", {
    headers: { Origin: "http://localhost:5173" },
    data: { name: "Cuenta para roles", email, password: "Browser-Test-Password-2026!" },
  });
  expect(registered.ok()).toBe(true);
  await request.post("http://localhost:5173/api/auth/sign-out", {
    headers: { Origin: "http://localhost:5173" },
    data: {},
  });
  await login(page, "admin");
  await page.goto("/admin/usuarios");
  const ownRow = page.getByRole("listitem").filter({ hasText: "admin@peliculasya.test" });
  await expect(ownRow.getByRole("combobox")).toBeDisabled();
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `test-results/users-${width}.png`, fullPage: true });
  }
  await page.getByLabel("Buscar por email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  const row = page.getByRole("listitem").filter({ hasText: email });
  await row.getByRole("combobox").selectOption("admin");
  page.once("dialog", (dialog) => dialog.dismiss());
  await row.getByRole("button", { name: "Guardar rol", exact: true }).click();
  await expect(row.getByText("Rol actual: Usuario", { exact: true })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Guardar rol", exact: true }).click();
  await expect(row.getByText("Rol actual: Administrador", { exact: true })).toBeVisible();
  await row.getByRole("combobox").selectOption("user");
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Guardar rol", exact: true }).click();
  await expect(row.getByText("Rol actual: Usuario", { exact: true })).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test("Google inicia OAuth y el callback fallido muestra una recuperación clara", async ({
  page,
}) => {
  await page.route("https://accounts.google.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "OAuth de prueba: no se envían credenciales reales.",
    }),
  );
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: "Ingresar con Google", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/login-google.png", fullPage: true });
  await page.getByRole("button", { name: "Ingresar con Google", exact: true }).click();
  await expect(page).toHaveURL(/accounts\.google\.com/);
  expect(new URL(page.url()).searchParams.get("redirect_uri")).toBe(
    "http://localhost:5173/api/auth/callback/google",
  );
  await page.goto("/login?error=access_denied");
  await expect(page.getByRole("alert")).toContainText("No se pudo completar el ingreso");
});
