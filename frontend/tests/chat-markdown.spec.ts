import { test, expect } from "@playwright/test";

test("chat: Markdown legible, tablas contenidas y HTML inactivo", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("user@peliculasya.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("Browser-Test-Password-2026!");
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await page.getByRole("button", { name: "Abrir asistente" }).click();
  const markdown = [
    "### Una comedia para tu lista",
    "Podés ver **El gran hotel Budapest**. Una historia con *humor y aventura*.",
    "- **Género:** Comedia\n- **Duración:** 99 minutos",
    "| Título | Género | Duración | Estreno | Sinopsis |\n| --- | --- | --- | --- | --- |\n| **El gran hotel Budapest** | Comedia | 99 min | 6 mar 2014 | Un conserje y su joven aprendiz quedan envueltos en una disputa por una herencia. |",
    '[Enlace inseguro](javascript:alert%281%29)\n\n<img src="https://example.invalid/tracker" onerror="alert(1)" />\n<script>alert(1)</script>',
  ].join("\n\n");
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: `event: token\ndata: ${JSON.stringify({ text: markdown.slice(0, 65) })}\n\nevent: token\ndata: ${JSON.stringify({ text: markdown.slice(65) })}\n\nevent: done\ndata: {}\n\n`,
    }),
  );
  await page.getByLabel("Tu pregunta").fill("Compará esta película en una tabla");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Tu asistente de cine" });
  await expect(panel.locator(".chat-markdown > p strong")).toHaveText("El gran hotel Budapest");
  await expect(panel.locator(".chat-markdown li")).toHaveCount(2);
  await expect(panel.getByRole("columnheader", { name: "Título", exact: true })).toBeVisible();
  await expect(panel.locator("script, img, iframe, a[href^='javascript:']")).toHaveCount(0);
  await expect(panel.locator(".chat-markdown")).not.toContainText("**");
  for (const width of [375, 561, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const conversation = page.getByLabel("Conversación", { exact: true });
    await conversation.evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.screenshot({ path: `test-results/chat-markdown-${width}.png` });
    const table = panel.getByRole("region", {
      name: "Tabla de la respuesta, desplazamiento horizontal",
    });
    await table.scrollIntoViewIfNeeded();
    expect(await table.evaluate((el) => el.scrollWidth > el.clientWidth)).toBeTruthy();
    expect(await conversation.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBeTruthy();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
    await page.screenshot({ path: `test-results/chat-table-${width}.png` });
  }
  await page.reload();
  await page.getByRole("button", { name: "Abrir asistente" }).click();
  await expect(panel.getByRole("columnheader", { name: "Título", exact: true })).toBeVisible();
});
