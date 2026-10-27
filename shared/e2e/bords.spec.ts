// Cas limites testables de la spec gelée (section Edge Cases).

import { test, expect, pageUrl } from "./fixtures.ts";

test.describe("Cas limites", () => {
  test("BORD-service-absent l'overlay attend le service puis affiche l'état", async ({ page, serveur }) => {
    await serveur.stop();
    await page.goto(pageUrl("overlay-a"));
    await page.waitForTimeout(1500);
    const fond = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(["rgba(0, 0, 0, 0)", "transparent"]).toContain(fond);
    await serveur.start();
    await expect(page.locator('[data-var="titre"]')).toHaveAttribute("data-value", "Bienvenue sur le live", {
      timeout: 3000,
    });
  });

  test("BORD-rafale la dernière valeur d'une rafale est affichée", async ({ page, serveur }) => {
    await page.goto(pageUrl("overlay-a"));
    await expect(page.locator('[data-var="score"]')).toHaveAttribute("data-value", "0");
    const c = await serveur.client();
    for (let i = 1; i <= 50; i++) c.set("score", i);
    await expect(page.locator('[data-var="score"]')).toHaveAttribute("data-value", "50");
  });

  test("BORD-titre-vide un titre vide ne casse pas l'overlay", async ({ page, serveur }) => {
    const erreurs: string[] = [];
    page.on("pageerror", (e) => erreurs.push(e.message));
    await page.goto(pageUrl("overlay-a"));
    await expect(page.locator('[data-var="score"]')).toHaveAttribute("data-value", "0");
    const c = await serveur.client();
    c.set("titre", "");
    await expect(page.locator('[data-var="titre"]')).toHaveAttribute("data-value", "");
    c.set("score", 3);
    await expect(page.locator('[data-var="score"]')).toHaveAttribute("data-value", "3");
    expect(erreurs).toEqual([]);
  });

  test("BORD-titre-long le dashboard refuse plus de 80 caractères", async ({ page }) => {
    await page.goto(pageUrl("dashboard"));
    const titre = page.locator('[data-var="titre"]');
    await expect(titre).toHaveValue("Bienvenue sur le live");
    await titre.fill("");
    await titre.pressSequentially("x".repeat(100));
    expect((await titre.inputValue()).length).toBe(80);
  });

  test("BORD-bornes le dashboard borne le score et la vitesse", async ({ page }) => {
    await page.goto(pageUrl("dashboard"));
    const score = page.locator('[data-var="score"]');
    await expect(score).toHaveAttribute("min", "-999999");
    await expect(score).toHaveAttribute("max", "999999");
    await expect(score).toHaveAttribute("step", "1");
    const vitesse = page.locator('[data-var="vitesse"]');
    await expect(vitesse).toHaveAttribute("min", "0");
    await expect(vitesse).toHaveAttribute("max", "2");
    await expect(vitesse).toHaveAttribute("step", "0.05");
  });

  test("BORD-deux-dashboards une modification apparaît dans l'autre dashboard", async ({ page, context }) => {
    const autre = await context.newPage();
    await page.goto(pageUrl("dashboard"));
    await autre.goto(pageUrl("dashboard"));
    await expect(autre.locator('[data-var="score"]')).toHaveValue("0");
    await page.locator('[data-var="score"]').fill("314");
    await expect(autre.locator('[data-var="score"]')).toHaveValue("314");
  });

  test("BORD-modele-absent un modèle introuvable affiche le repli", async ({ page }) => {
    await page.route("**/*.glb", (route) => route.abort());
    await page.goto(pageUrl("overlay-3d"));
    await expect(page.getByText("3D indisponible")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-var="couleur"]')).toHaveCount(1);
  });
});
