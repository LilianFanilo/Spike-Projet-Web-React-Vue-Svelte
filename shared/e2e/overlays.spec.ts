// US2 de la spec gelée : deux overlays 2D synchronisés (contrat FR-040 à FR-042).

import type { Page as PwPage } from "@playwright/test";
import { test, expect, pageUrl, waitAttr, type Page } from "./fixtures.ts";

async function ouvrir(page: PwPage, name: Page, sonde: string): Promise<void> {
  await page.goto(pageUrl(name));
  await expect(page.locator(`[data-var="${sonde}"]`)).toHaveAttribute("data-value");
}

/** Vérifie la durée d'une alerte partie à `t0` : on en moins de 300 ms, off dans [offMin, offMax]. */
async function verifierAlerte(page: PwPage, t0: number, offMin: number, offMax: number): Promise<void> {
  const on = await waitAttr(page, "[data-alert]", "data-alert", "on", 1000, t0);
  expect(on, "data-alert=on après l'alerte (ms)").toBeLessThan(300);
  const off = await waitAttr(page, "[data-alert]", "data-alert", "off", offMax + 1000, t0);
  expect(off, "data-alert=off après l'alerte (ms)").toBeGreaterThanOrEqual(offMin);
  expect(off, "data-alert=off après l'alerte (ms)").toBeLessThanOrEqual(offMax);
}

test.describe("Overlays 2D", () => {
  test("US2-1 un overlay qui s'ouvre affiche l'état courant", async ({ page, serveur }) => {
    const c = await serveur.client();
    c.set("titre", "Avant ouverture");
    c.set("score", 7);
    await c.waitFor((m) => m.type === "update" && m.id === "score");
    await page.goto(pageUrl("overlay-a"));
    await expect(page.locator('[data-var="titre"]')).toHaveAttribute("data-value", "Avant ouverture");
    await expect(page.locator('[data-var="titre"]')).toHaveText("Avant ouverture");
    await expect(page.locator('[data-var="score"]')).toHaveAttribute("data-value", "7");
  });

  test("US2-2 l'overlay A suit le titre et le score", async ({ page, serveur }) => {
    await ouvrir(page, "overlay-a", "score");
    await expect(page.locator('[data-var="titre"]')).toHaveText("Bienvenue sur le live");
    const c = await serveur.client();
    c.set("titre", "Manche 2");
    c.set("score", 1234);
    await expect(page.locator('[data-var="titre"]')).toHaveAttribute("data-value", "Manche 2");
    await expect(page.locator('[data-var="titre"]')).toHaveText("Manche 2");
    await expect(page.locator('[data-var="score"]')).toHaveAttribute("data-value", "1234");
    await expect(page.locator('[data-var="score"]')).toContainText("1234");
  });

  test("US2-3 l'overlay B affiche ou masque le bandeau EN DIRECT", async ({ page, serveur }) => {
    await ouvrir(page, "overlay-b", "bandeau");
    const bandeau = page.locator('[data-var="bandeau"]');
    await expect(bandeau).toBeVisible();
    await expect(bandeau).toContainText("EN DIRECT");
    const c = await serveur.client();
    c.set("bandeau", false);
    await expect(bandeau).toHaveAttribute("data-value", "false");
    await expect(bandeau).toBeHidden();
    c.set("bandeau", true);
    await expect(bandeau).toHaveAttribute("data-value", "true");
    await expect(bandeau).toBeVisible();
  });

  test("US2-4 l'alerte anime les deux overlays pendant 2 s", async ({ page, context, serveur }) => {
    const b = await context.newPage();
    await ouvrir(page, "overlay-a", "score");
    await ouvrir(b, "overlay-b", "bandeau");
    await expect(page.locator("[data-alert]").first()).toHaveAttribute("data-alert", "off");
    const c = await serveur.client();
    const t0 = Date.now();
    c.alert();
    await Promise.all([verifierAlerte(page, t0, 1700, 2300), verifierAlerte(b, t0, 1700, 2300)]);
  });

  test("US2-5 une alerte pendant une alerte la relance depuis le début", async ({ page, serveur }) => {
    await ouvrir(page, "overlay-a", "score");
    const c = await serveur.client();
    const t0 = Date.now();
    c.alert();
    await page.waitForTimeout(1000);
    c.alert();
    await page.waitForTimeout(t0 + 2200 - Date.now());
    await expect(page.locator("[data-alert]").first()).toHaveAttribute("data-alert", "on", { timeout: 50 });
    const off = await waitAttr(page, "[data-alert]", "data-alert", "off", 3000, t0);
    expect(off).toBeGreaterThanOrEqual(2700);
    expect(off).toBeLessThanOrEqual(3300);
  });

  test("US2-6 l'overlay se reconnecte seul après un redémarrage du service", async ({ page, serveur }) => {
    await ouvrir(page, "overlay-a", "score");
    await serveur.stop();
    await page.waitForTimeout(1500);
    await serveur.start();
    const c = await serveur.client();
    c.set("score", 99);
    await expect(page.locator('[data-var="score"]')).toHaveAttribute("data-value", "99", { timeout: 5000 });
  });

  for (const name of ["overlay-a", "overlay-b"] as const) {
    test(`US2-7 ${name} : fond transparent et aucune barre de défilement en 1920×1080`, async ({ page }) => {
      await ouvrir(page, name, name === "overlay-a" ? "score" : "bandeau");
      const mesure = await page.evaluate(() => ({
        html: getComputedStyle(document.documentElement).backgroundColor,
        body: getComputedStyle(document.body).backgroundColor,
        debordeX: document.documentElement.scrollWidth > innerWidth,
        debordeY: document.documentElement.scrollHeight > innerHeight,
      }));
      expect(["rgba(0, 0, 0, 0)", "transparent"]).toContain(mesure.html);
      expect(["rgba(0, 0, 0, 0)", "transparent"]).toContain(mesure.body);
      expect(mesure.debordeX).toBe(false);
      expect(mesure.debordeY).toBe(false);
    });
  }
});
