// US3 de la spec gelée : élément 3D piloté par les variables (rendu WebGL, repli, compteur FPS).

import { test, expect, pageUrl, waitAttr } from "./fixtures.ts";

test.describe("Overlay 3D", () => {
  test("US3-1 la scène WebGL se charge sans erreur et expose couleur et vitesse", async ({ page }) => {
    const erreurs: string[] = [];
    page.on("pageerror", (e) => erreurs.push(e.message));
    page.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
    await page.goto(pageUrl("overlay-3d"));
    await expect(page.locator('[data-var="couleur"]')).toHaveAttribute("data-value", "#4f8cff", { timeout: 10_000 });
    await expect(page.locator('[data-var="vitesse"]')).toHaveAttribute("data-value", "0.25");
    const webgl = await page.evaluate(() => {
      const c = document.querySelector("canvas");
      return !!c && !!(c.getContext("webgl2") ?? c.getContext("webgl"));
    });
    expect(webgl, "un canvas avec un contexte WebGL").toBe(true);
    await expect(page.getByText("3D indisponible")).toHaveCount(0);
    await page.waitForTimeout(1000);
    expect(erreurs).toEqual([]);
  });

  test("US3-2 la couleur du modèle suit la variable", async ({ page, serveur }) => {
    await page.goto(pageUrl("overlay-3d"));
    await expect(page.locator('[data-var="couleur"]')).toHaveAttribute("data-value", "#4f8cff", { timeout: 10_000 });
    const c = await serveur.client();
    c.set("couleur", "#FF8800");
    await expect(page.locator('[data-var="couleur"]')).toHaveAttribute("data-value", "#ff8800");
  });

  test("US3-3 la vitesse suit la variable, 0 compris", async ({ page, serveur }) => {
    await page.goto(pageUrl("overlay-3d"));
    const vitesse = page.locator('[data-var="vitesse"]');
    await expect(vitesse).toHaveAttribute("data-value", "0.25", { timeout: 10_000 });
    const c = await serveur.client();
    c.set("vitesse", 0);
    await expect(vitesse).toHaveAttribute("data-value", "0");
    c.set("vitesse", 1.5);
    await expect(vitesse).toHaveAttribute("data-value", "1.5");
  });

  test("US3-4 l'alerte déclenche l'animation 3D pendant 2 s", async ({ page, serveur }) => {
    await page.goto(pageUrl("overlay-3d"));
    await expect(page.locator('[data-var="couleur"]')).toHaveAttribute("data-value", "#4f8cff", { timeout: 10_000 });
    await expect(page.locator("[data-alert]").first()).toHaveAttribute("data-alert", "off");
    const c = await serveur.client();
    const t0 = Date.now();
    c.alert();
    const on = await waitAttr(page, "[data-alert]", "data-alert", "on", 1000, t0);
    expect(on).toBeLessThan(300);
    const off = await waitAttr(page, "[data-alert]", "data-alert", "off", 4000, t0);
    expect(off).toBeGreaterThanOrEqual(1700);
    expect(off).toBeLessThanOrEqual(2300);
  });

  test("US3-5 @repli sans 3D, un repli 2D suit la couleur", async ({ page, serveur }) => {
    await page.goto(pageUrl("overlay-3d"));
    await expect(page.getByText("3D indisponible")).toBeVisible({ timeout: 10_000 });
    const couleur = page.locator('[data-var="couleur"]');
    await expect(couleur).toHaveCount(1);
    await expect(couleur).toHaveAttribute("data-value", "#4f8cff");
    const c = await serveur.client();
    c.set("couleur", "#22aa44");
    await expect(couleur).toHaveAttribute("data-value", "#22aa44");
  });

  test("US3-6 le compteur FPS n'apparaît qu'avec ?debug=1 et remonte au service", async ({ page, serveur }) => {
    await page.goto(pageUrl("overlay-3d", "debug=1"));
    await expect(page.locator("[data-fps]")).toBeVisible({ timeout: 10_000 });
    await expect
      .poll(async () => (await serveur.stats()).fps.filter((f) => f.overlay === "overlay-3d").length, { timeout: 5000 })
      .toBeGreaterThan(0);

    const autre = await page.context().newPage();
    await page.close();
    await serveur.restart();
    await autre.goto(pageUrl("overlay-3d"));
    await expect(autre.locator('[data-var="couleur"]')).toHaveAttribute("data-value", "#4f8cff", { timeout: 10_000 });
    await autre.waitForTimeout(2000);
    await expect(autre.locator("[data-fps]")).toHaveCount(0);
    expect((await serveur.stats()).fps).toEqual([]);
  });
});
