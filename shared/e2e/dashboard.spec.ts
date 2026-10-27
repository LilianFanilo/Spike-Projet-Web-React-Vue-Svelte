// US1 de la spec gelée : piloter les variables du live depuis le dashboard (contrat FR-045).

import { test, expect, pageUrl } from "./fixtures.ts";

const TYPES = { titre: "text", score: "number", bandeau: "checkbox", couleur: "color", vitesse: "range" } as const;

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pageUrl("dashboard"));
    await expect(page.locator("[data-connection]").first()).toHaveAttribute("data-connection", "on");
  });

  test("US1-1 un contrôle natif par variable, avec libellé et valeur courante", async ({ page }) => {
    await expect(page.locator("[data-var]")).toHaveCount(5);
    for (const [id, type] of Object.entries(TYPES)) {
      await expect(page.locator(`input[data-var="${id}"]`)).toHaveAttribute("type", type);
    }
    await expect(page.locator('[data-var="titre"]')).toHaveValue("Bienvenue sur le live");
    await expect(page.locator('[data-var="score"]')).toHaveValue("0");
    await expect(page.locator('[data-var="bandeau"]')).toBeChecked();
    await expect(page.locator('[data-var="couleur"]')).toHaveValue("#4f8cff");
    await expect(page.locator('[data-var="vitesse"]')).toHaveValue("0.25");
    for (const label of ["Titre", "Score", "Bandeau visible", "Couleur du modèle", "Vitesse de rotation"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("US1-2 chaque modification est diffusée immédiatement", async ({ page, serveur }) => {
    const c = await serveur.client();
    const recu = (id: string, value: unknown) =>
      c.waitFor((m) => m.type === "update" && m.id === id && m.value === value);

    await page.locator('[data-var="titre"]').fill("Nouveau titre");
    await recu("titre", "Nouveau titre");
    await page.locator('[data-var="score"]').fill("42");
    await recu("score", 42);
    await page.locator('[data-var="bandeau"]').setChecked(false);
    await recu("bandeau", false);
    await page.locator('[data-var="couleur"]').fill("#ff0000");
    await recu("couleur", "#ff0000");
    await page.locator('[data-var="vitesse"]').evaluate((el: HTMLInputElement) => {
      el.value = "1.5";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await recu("vitesse", 1.5);
  });

  test("US1-2 la saisie au clavier envoie une mise à jour par frappe", async ({ page, serveur }) => {
    const c = await serveur.client();
    const champ = page.locator('[data-var="titre"]');
    await champ.fill("");
    await champ.pressSequentially("abc");
    await c.waitFor((m) => m.type === "update" && m.id === "titre" && m.value === "abc");
    const valeurs = c.messages.filter((m) => m.type === "update" && m.id === "titre").map((m) => m.value);
    expect(valeurs).toEqual(expect.arrayContaining(["a", "ab", "abc"]));
  });

  test("US1-3 le bouton Alerte diffuse une alerte", async ({ page, serveur }) => {
    const c = await serveur.client();
    await page.locator('[data-action="alerte"]').click();
    await c.waitFor((m) => m.type === "alert");
  });

  test("US1-4 une modification venue d'ailleurs s'affiche dans le champ", async ({ page, serveur }) => {
    const c = await serveur.client();
    c.set("titre", "Depuis un autre dashboard");
    c.set("score", -12);
    c.set("bandeau", false);
    c.set("couleur", "#00ff88");
    c.set("vitesse", 0.75);
    await expect(page.locator('[data-var="titre"]')).toHaveValue("Depuis un autre dashboard");
    await expect(page.locator('[data-var="score"]')).toHaveValue("-12");
    await expect(page.locator('[data-var="bandeau"]')).not.toBeChecked();
    await expect(page.locator('[data-var="couleur"]')).toHaveValue("#00ff88");
    await expect(page.locator('[data-var="vitesse"]')).toHaveValue("0.75");
  });

  test("US1-5 l'indicateur suit la perte et le retour de la connexion", async ({ page, serveur }) => {
    const racine = page.locator("[data-connection]").first();
    await serveur.stop();
    await expect(racine).toHaveAttribute("data-connection", "off", { timeout: 3000 });
    await serveur.start();
    await expect(racine).toHaveAttribute("data-connection", "on", { timeout: 5000 });
  });

  test("US1-6 une liste de variables modifiée est prise en compte au rechargement", async ({ page, serveur }) => {
    await serveur.restart({ vars: "variables.alt.json" });
    await page.reload();
    await expect(page.locator("[data-connection]").first()).toHaveAttribute("data-connection", "on");
    await expect(page.locator("[data-var]")).toHaveCount(5);
    const ids = await page.locator("[data-var]").evaluateAll((els) => els.map((e) => e.getAttribute("data-var")));
    expect(ids).toEqual(["titre", "sous-titre", "score", "bandeau", "couleur"]);
    await expect(page.getByText("Titre du live", { exact: true })).toBeVisible();
    await expect(page.locator('[data-var="sous-titre"]')).toHaveAttribute("type", "text");
  });
});
