// Défauts injectables dans la page témoin (?defaut=<code>) pour prouver que la suite les détecte.
export type Defaut = "bandeau" | "score" | "alerte" | "reconnexion";

export function defaut(code: Defaut): boolean {
  return new URLSearchParams(location.search).get("defaut") === code;
}
