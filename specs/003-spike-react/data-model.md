# Data Model — implémentation React

Les entités partagées (`VariableDef`, état courant, messages) sont définies une seule fois dans [002-infra-commune/data-model.md](../002-infra-commune/data-model.md), et leurs types viennent de `@shared/protocol.ts`. Ce document ne décrit que l'état **côté app React** : le store Zustand de chaque page.

## Store `useLive` (`src/live/store.ts`)

Il y a un store par page, car chaque entrée Vite est un bundle distinct. Le store est alimenté par `src/live/connexion.ts` (research R2) et lu par les composants avec des sélecteurs (R3).

| Champ | Type | Initial | Rôle |
| --- | --- | --- | --- |
| `vars` | `VariableDef[]` | `[]` | Définitions reçues dans `welcome`. Elles servent au dashboard (FR-010) et à la sérialisation de `data-value`. |
| `values` | `Values` (`Record<string, VarValue>`) | `{}` | Valeurs courantes. Un overlay n'affiche rien tant que la variable est absente : il reste transparent, comme en BORD-service-absent. |
| `connected` | `boolean` | `false` | Reflète `onStatus`. Alimente `data-connection` sur le dashboard (FR-014, FR-045). |
| `alerte` | `{ seq: number; active: boolean }` | `{ seq: 0, active: false }` | `seq` est le numéro de la dernière alerte (sert de `key` pour relancer l'animation). `active` alimente `data-alert` (FR-042). |
| `pending` | `Record<string, number>` | `{}` | Dashboard uniquement : nombre de `set` envoyés dont l'écho n'est pas encore revenu (R4). |

### Actions

| Action | Appelée par | Effet |
| --- | --- | --- |
| `bienvenue(vars, values)` | `onWelcome` (à chaque connexion et reconnexion) | Remplace `vars` et `values`, et remet `pending` à `{}`. Rétablit l'état après une coupure (FR-024, US1-6). |
| `miseAJour(id, value)` | `onUpdate` | Si `pending[id] > 0` : décrémente, et n'applique `value` que si le compteur atteint 0. Sinon : `values[id] = value`. |
| `statut(connected)` | `onStatus` | `connected = connected` |
| `alerter(seq)` | `onAlert` | `alerte = { seq, active: true }`, puis relance du minuteur de module (2000 ms) qui remet `active = false` (R5). |
| `appliquerSaisie(id, v)` | `saisir` (voir ci-dessous) | `values[id] = v` et `pending[id] += 1` |

`saisir` et `declencherAlerte` sont exportées par `src/live/connexion.ts`, qui détient la `Connection` (pas de cycle d'import avec le store) :

| Fonction | Appelée par | Effet |
| --- | --- | --- |
| `saisir(id, valeur)` | `Champ` du dashboard | On calcule `v = normalize(def, valeur)`. Seulement si `connected` et `validate(def, v)` : `appliquerSaisie(id, v)`, puis `connexion.set(id, v)`. |
| `declencherAlerte()` | Bouton « Alerte » | `connexion.alert()`. L'animation ne part qu'à la réception de l'`alert` diffusée, comme pour les autres clients. |

### Règles de validation (rappel)

Le dashboard normalise d'abord avec `normalize` (couleur en minuscules, vitesse arrondie au pas), puis n'envoie que les valeurs pour lesquelles `validate(def, v)` est vrai. Les bornes viennent de `def` (`maxLength`, `min`, `max`, `step`) : rien n'est codé en dur par variable (FR-010, FR-011).

### Transitions de `alerte.active`

```text
off ──alert(seq)──▶ on ──2000 ms sans nouvelle alerte──▶ off
                    on ──alert(seq')──▶ on   (minuteur relancé, keyframe relancée via key = seq')
```

### Transitions de `connected`

```text
false (initial, avant toute connexion) ──onopen──▶ true ──onclose──▶ false ──reconnexion (1000 ms)──▶ true
```

## État dérivé par page

| Page | Lit dans le store | Rend |
| --- | --- | --- |
| Dashboard | `vars`, `values[id]` (par champ), `connected` | Un `Champ` par `vars[i]`, dans l'ordre reçu (US1-6 vérifie l'ordre) |
| Overlay A | `values.titre`, `values.score`, `alerte` | Texte et `data-value = serialize("text" ou "number", value)` |
| Overlay B | `values.bandeau`, `alerte` | Bandeau affiché si `true`, masqué sinon, mais toujours présent dans le DOM |
| Overlay 3D | `values.couleur`, `values.vitesse` (le sélecteur pour le DOM, `getState()` dans `useFrame`), `alerte` | Couleur du matériau, rotation, saut. Spans `data-var`, ou repli. |

La sérialisation de `data-value` utilise toujours `serialize(type, value)` de `@shared/protocol.ts`, et c'est la seule source. La sonde compare exactement cette chaîne. Sur le dashboard, le type est `def.type`, car les champs sont génériques. Dans les overlays, le type est écrit en dur (`"text"`, `"number"`, `"boolean"`, `"color"`, `"speed"`), car chaque overlay connaît ses variables : il ne lit pas `vars`.
