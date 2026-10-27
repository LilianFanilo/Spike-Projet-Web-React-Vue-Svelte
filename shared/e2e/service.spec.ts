// US1 de la feature 002 : le socle commun (protocole et service de diffusion).
// Ne dépend d'aucune app : passe sans APP_URL.

import { test, expect } from "./fixtures.ts";

test.describe("Socle commun", () => {
  test("SOCLE-1 bienvenue avec les 5 définitions et leurs valeurs", async ({ serveur }) => {
    const c = await serveur.client();
    const welcome = c.messages.find((m) => m.type === "welcome")!;
    expect(welcome.vars.map((v: { id: string }) => v.id)).toEqual(["titre", "score", "bandeau", "couleur", "vitesse"]);
    expect(welcome.values).toEqual({
      titre: "Bienvenue sur le live",
      score: 0,
      bandeau: true,
      couleur: "#4f8cff",
      vitesse: 0.25,
    });
  });

  test("SOCLE-2 une mise à jour est rediffusée à tous avec un numéro de séquence", async ({ serveur }) => {
    const a = await serveur.client();
    const b = await serveur.client();
    a.set("score", 42);
    const ua = await a.waitFor((m) => m.type === "update");
    const ub = await b.waitFor((m) => m.type === "update");
    expect(ua).toEqual({ type: "update", seq: 1, id: "score", value: 42 });
    expect(ub).toEqual(ua);
    const c = await serveur.client();
    expect(c.messages.find((m) => m.type === "welcome")!.values.score).toBe(42);
  });

  test("SOCLE-3 une alerte est rediffusée à tous", async ({ serveur }) => {
    const a = await serveur.client();
    const b = await serveur.client();
    b.alert();
    expect(await a.waitFor((m) => m.type === "alert")).toEqual({ type: "alert", seq: 1 });
    expect(await b.waitFor((m) => m.type === "alert")).toEqual({ type: "alert", seq: 1 });
  });

  test("SOCLE-4 le service relancé avec la liste alternative la transmet", async ({ serveur }) => {
    await serveur.restart({ vars: "variables.alt.json" });
    const c = await serveur.client();
    const welcome = c.messages.find((m) => m.type === "welcome")!;
    expect(welcome.vars.map((v: { id: string }) => v.id)).toEqual(["titre", "sous-titre", "score", "bandeau", "couleur"]);
    expect(welcome.vars[0].label).toBe("Titre du live");
  });

  test("SOCLE-5 les mises à jour invalides sont ignorées sans arrêter le service", async ({ serveur }) => {
    const c = await serveur.client();
    c.set("inconnue", 1);
    c.set("score", 1.5);
    c.set("vitesse", 3);
    c.set("couleur", "red");
    c.set("titre", "x".repeat(81));
    c.set("score", 7);
    const update = await c.waitFor((m) => m.type === "update");
    expect(update).toMatchObject({ seq: 1, id: "score", value: 7 });
    expect(c.messages.filter((m) => m.type === "update")).toHaveLength(1);
    expect((await serveur.stats()).rejected).toBe(5);
    expect((await serveur.health()).ok).toBe(true);
  });

  test("SOCLE-6 les modules partagés s'importent sous Node sans build", async () => {
    const protocol = await import("../protocol.ts");
    const client = await import("../client.ts");
    expect(typeof client.connect).toBe("function");
    expect(protocol.serialize("boolean", true)).toBe("true");
    expect(protocol.serialize("speed", 0.25)).toBe("0.25");
    expect(protocol.serialize("color", "#4F8CFF")).toBe("#4f8cff");
    const vitesse = { id: "vitesse", label: "", type: "speed", default: 0, min: 0, max: 2, step: 0.05 } as const;
    expect(protocol.validate(vitesse, 0.35)).toBe(true);
    expect(protocol.validate(vitesse, 0.33)).toBe(false);
  });
});
