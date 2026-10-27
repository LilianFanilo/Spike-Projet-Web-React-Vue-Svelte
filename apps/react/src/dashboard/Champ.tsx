// Un contrôle natif par variable, choisi selon son type (FR-011, FR-045, research R4).
// Les bornes viennent toujours de la définition : rien n'est codé en dur par variable.

import { useState } from "react";
import type { VariableDef, VarValue } from "@shared/protocol.ts";
import { saisir } from "../live/connexion.ts";
import { useLive } from "../live/store.ts";

export function Champ({ def }: { def: VariableDef }) {
  const valeur = useLive((s) => s.values[def.id]);
  return (
    <label className="champ">
      <span>{def.label}</span>
      <Controle def={def} valeur={valeur} />
    </label>
  );
}

function Controle({ def, valeur }: { def: VariableDef; valeur: VarValue | undefined }) {
  switch (def.type) {
    case "text":
      return (
        <input
          type="text"
          data-var={def.id}
          maxLength={def.maxLength}
          value={String(valeur ?? "")}
          onChange={(e) => saisir(def.id, e.target.value)}
        />
      );
    case "number":
      return <ChampNombre def={def} valeur={valeur} />;
    case "boolean":
      return (
        <input
          type="checkbox"
          data-var={def.id}
          checked={valeur === true}
          onChange={(e) => saisir(def.id, e.target.checked)}
        />
      );
    case "color":
      return (
        <input
          type="color"
          data-var={def.id}
          value={String(valeur ?? "#000000")}
          onChange={(e) => saisir(def.id, e.target.value.toLowerCase())}
        />
      );
    case "speed":
      // Écoute native de `input` : si un script modifie `el.value` avant l'événement, le suivi de valeur
      // de React croit le champ inchangé et n'appelle pas onChange (correction n° 1 du journal).
      return (
        <input
          type="range"
          data-var={def.id}
          min={def.min}
          max={def.max}
          step={def.step}
          value={String(valeur ?? def.default)}
          onChange={ignorer}
          ref={(el) => {
            if (!el) return;
            const surSaisie = () => saisir(def.id, Number(el.value));
            el.addEventListener("input", surSaisie);
            return () => el.removeEventListener("input", surSaisie);
          }}
        />
      );
  }
}

/** La saisie du curseur passe par l'écouteur natif ; onChange reste requis pour un champ contrôlé. */
function ignorer(): void {}

/** Champ numérique : la saisie en cours (« », « - ») reste affichée, seul un entier est envoyé. */
function ChampNombre({ def, valeur }: { def: VariableDef; valeur: VarValue | undefined }) {
  const [brouillon, setBrouillon] = useState(String(valeur ?? ""));
  const [vue, setVue] = useState(valeur);
  if (valeur !== vue) {
    setVue(valeur);
    setBrouillon(String(valeur ?? ""));
  }
  return (
    <input
      type="number"
      data-var={def.id}
      min={def.min}
      max={def.max}
      step={1}
      value={brouillon}
      onChange={(e) => {
        const texte = e.target.value;
        setBrouillon(texte);
        const n = Number(texte);
        if (texte.trim() !== "" && Number.isInteger(n)) saisir(def.id, n);
      }}
    />
  );
}
