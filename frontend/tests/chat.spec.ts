import { test, expect } from "@playwright/test";
test("chat: streaming, fuentes, F5, errores y nueva conversación", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("user@peliculasya.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("Browser-Test-Password-2026!");
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Salir (user)", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Asistente", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Abrir asistente", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Tu asistente de cine" });
  await expect(panel).toBeVisible();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "¿Qué vemos hoy?" })).toBeVisible();
  expect(await page.getByLabel("Conversación", { exact: true }).evaluate(el => el.scrollTop)).toBe(0);
  await page.screenshot({ path: "test-results/chat-welcome-desktop.png" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: "test-results/chat-welcome-mobile.png" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/chat", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.history).toEqual([]);
    await route.fulfill({
      contentType: "text/event-stream",
      body: 'event: status\ndata: {"text":"Consultando…"}\n\nevent: sources\ndata: [{"title":"Mi lista","url":"/mi-lista"}]\n\nevent: token\ndata: {"text":"Tenés 2 pendientes."}\n\nevent: done\ndata: {}\n\n',
    });
  });
  await page.getByLabel("Tu pregunta").fill("¿Cuántas pendientes?");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.getByText("Tenés 2 pendientes.", { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Fuentes de la respuesta" })
      .getByRole("link", { name: "Mi lista" }),
  ).toBeVisible();
  await page.getByLabel("Tu pregunta").fill("Borrador conservado");
  await page.getByRole("button", { name: "Minimizar chat" }).click();
  await expect(panel).toBeHidden();
  await expect(page.getByRole("button", { name: "Abrir asistente" })).toBeFocused();
  await page.getByRole("button", { name: "Abrir asistente" }).click();
  await expect(page.getByLabel("Tu pregunta")).toHaveValue("Borrador conservado");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await page.getByRole("link", { name: "Mi lista", exact: true }).click();
  await page.getByRole("button", { name: "Abrir asistente" }).click();
  await expect(page.getByText("Tenés 2 pendientes.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Tu pregunta")).toHaveValue("Borrador conservado");
  await page.reload();
  await page.getByRole("button", { name: "Abrir asistente" }).click();
  await expect(page.getByText("Tenés 2 pendientes.", { exact: true })).toBeVisible();
  for (const width of [320, 375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
    const bounds = await panel.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: "test-results/chat-" + width + ".png", fullPage: true });
  }
  await page.getByRole("button", { name: "Nueva conversación" }).click();
  await expect(page.getByText("Tenés 2 pendientes.", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "¿Cuántas películas tengo pendientes?" }).click();
  await expect(page.getByText("Tenés 2 pendientes.", { exact: true })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Fuentes de la respuesta" })
    .getByRole("link", { name: "Mi lista" })
    .click();
  await expect(panel).toBeHidden();
  await page.getByRole("button", { name: "Abrir asistente" }).click();
  await page.unroute("**/api/chat");
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":{"message":"Cuota temporalmente agotada"}}',
    }),
  );
  await page.getByLabel("Tu pregunta").fill("Hola");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Cuota temporalmente agotada");
  await page.getByRole("button", { name: "Minimizar chat" }).click();
  await page.getByRole("button", { name: "Salir (user)", exact: true }).click();
  await expect(page.getByRole("link", { name: "Ingresar", exact: true })).toBeVisible();
  expect(
    await page.evaluate(() =>
      Object.keys(sessionStorage).filter((k) => k.startsWith("peliculasya-chat:")),
    ),
  ).toEqual([]);
  await expect(page.getByRole("button", { name: "Abrir asistente" })).toHaveCount(0);
});
