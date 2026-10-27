// Scénarios de la spec gelée qui ne sont pas observables automatiquement (FR-030 de la feature 002).
// Ils sont listés dans chaque entrée e2e et vérifiés à la main (protocole OBS, ressenti).

export const MANUELS: readonly { id: string; raison: string }[] = [
  { id: "SC-002", raison: "Découverte du dashboard en moins d'une minute : test utilisateur" },
  { id: "US2-4 (rendu)", raison: "Grossissement ×1,15 et flash : seule la durée est observée automatiquement" },
  { id: "US2-7 (OBS)", raison: "Transparence réelle au-dessus de la vidéo dans OBS" },
  { id: "US3-1 (rendu)", raison: "Rotation continue visible du modèle" },
  { id: "US3-2 (rendu)", raison: "Teinte visible du modèle" },
  { id: "US3-3 (rendu)", raison: "Vitesse de rotation perçue" },
  { id: "US3-4 (rendu)", raison: "Saut de 0,5 unité et 2 tours visibles" },
];
