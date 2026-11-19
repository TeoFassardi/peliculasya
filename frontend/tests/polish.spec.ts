import { test, expect } from "@playwright/test";

async function settlePosters(page: import("@playwright/test").Page) {
  await page.locator(".movie-poster img").evaluateAll((images) =>
    Promise.all(
      images.map(async (image) => {
        const poster = image as HTMLImageElement;
        poster.loading = "eager";
        await poster.decode().catch(() => {});
      }),
    ),
  );
}

test("catálogo: recupera un error de conexión sin perder la búsqueda", async ({ page }) => {
  await page.route("**/api/movies?*", (route) => route.abort("connectionfailed"));
  await page.goto("/?search=Interestelar");
  await expect(page.getByRole("alert")).toContainText("No pudimos conectar con el servidor");
  await page.unroute("**/api/movies?*");
  await page.getByRole("button", { name: "Reintentar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Interestelar", exact: true })).toBeVisible();
  await expect(page.getByText("1 película para “Interestelar”", { exact: true })).toBeVisible();
});

test("navegación y revisión visual de las pantallas principales", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  for (const [route, title] of [
    ["/login", "Volvé a las historias."],
    ["/register", "Tu próxima historia."],
    ["/pagina-inexistente", "Esta página no existe"],
  ]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBeTruthy();
      await page.screenshot({
        path: `test-results/polish-${route.slice(1)}-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("admin@peliculasya.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("Browser-Test-Password-2026!");
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Salir (admin)", exact: true })).toBeVisible();
  await expect(page.locator(".app-shell.has-assistant")).toBeVisible();
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const movie = page.getByRole("link", { name: /El viaje de Chihiro/ });
    await movie.scrollIntoViewIfNeeded();
    await movie.click();
    await expect(
      page.getByRole("heading", { name: "El viaje de Chihiro", exact: true }),
    ).toBeVisible();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await settlePosters(page);
    if (width === 375) {
      const movieTitle = await page
        .getByRole("heading", { name: "El viaje de Chihiro", exact: true })
        .evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const rect = range.getBoundingClientRect();
          return { x: rect.x, width: rect.width };
        });
      const launcher = await page.getByRole("button", { name: "Abrir asistente" }).boundingBox();
      expect(movieTitle && launcher && movieTitle.x + movieTitle.width <= launcher.x).toBeTruthy();
    }
    await page.screenshot({ path: `test-results/polish-detail-${width}.png`, fullPage: true });
    for (const [route, heading] of [
      ["/admin", "Administrar catálogo"],
      ["/admin/usuarios", "Usuarios y roles"],
      ["/mi-lista", "Mi lista"],
    ]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      if (route === "/admin") {
        await expect(page.getByRole("table")).toBeVisible();
        if (width === 375)
          await expect(
            page.getByText("Deslizá la tabla para ver el estado y las acciones."),
          ).toBeVisible();
      }
      if (route === "/admin/usuarios")
        await expect(page.locator(".user-role-row").first()).toBeVisible();
      if (route === "/mi-lista")
        await expect(page.getByRole("combobox", { name: "Mostrar" })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBeTruthy();
      await settlePosters(page);
      await page.screenshot({
        path: `test-results/polish-${route.slice(1).replaceAll("/", "-")}-${width}.png`,
        fullPage: true,
      });
    }
    const launcher = page.getByRole("button", { name: "Abrir asistente" });
    await page.locator(".site-footer").scrollIntoViewIfNeeded();
    const tagline = await page.locator(".site-footer p").boundingBox();
    const button = await launcher.boundingBox();
    const overlap =
      tagline &&
      button &&
      tagline.x < button.x + button.width &&
      tagline.x + tagline.width > button.x &&
      tagline.y < button.y + button.height &&
      tagline.y + tagline.height > button.y;
    expect(overlap).toBeFalsy();
    await page.screenshot({ path: `test-results/polish-footer-${width}.png` });
  }
  expect(consoleErrors).toEqual([]);
});
