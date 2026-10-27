# Data Model — Outillage commun

## VariableDef (`shared/variables.json`, `shared/variables.alt.json`)

| Champ | Type | Règle |
| --- | --- | --- |
| `id` | string | Unique dans la liste, en minuscules : `[a-z][a-z0-9-]*` |
| `label` | string | Libellé affiché par le dashboard |
| `type` | `"text"` \| `"number"` \| `"boolean"` \| `"color"` \| `"speed"` | Détermine le contrôle et la validation. Correspondance avec les types de la spec gelée : texte = `text`, nombre = `number`, booléen = `boolean`, couleur = `color`, vitesse = `speed`. |
| `default` | string \| number \| boolean | Doit lui-même respecter les règles de validation |
| `maxLength` | number? | Uniquement pour `text` |
| `min`, `max` | number? | Pour `number` et `speed` |
| `step` | number? | Pour `number` (1) et `speed` (0,05) |

**Validation d'une valeur** (`validate(def, value)` dans `protocol.ts`) :

| Type | Règle |
| --- | --- |
| `text` | Chaîne de longueur ≤ `maxLength` |
| `number` | Entier, compris entre `min` et `max` |
| `boolean` | Booléen |
| `color` | Chaîne respectant `^#[0-9a-f]{6}$`, en minuscules après normalisation |
| `speed` | Nombre entre `min` et `max`, multiple de `step` (tolérance 1e-9) |

**Sérialisation de `data-value`** (`serialize(type, value)`) :

| Type | Sérialisation |
| --- | --- |
| `text` | La valeur telle quelle |
| `number`, `speed` | `String(value)` (`0.25`, `-12`) |
| `boolean` | `"true"` ou `"false"` |
| `color` | En minuscules |

**Liste principale** : `titre`, `score`, `bandeau`, `couleur`, `vitesse`, avec les valeurs de la spec gelée.

**Liste alternative** : elle retire `vitesse`, renomme le libellé de `titre` en « Titre du live » et ajoute `sous-titre` (texte, 60 caractères maximum, valeur par défaut vide).

## État courant (service)

Une table `id → valeur`, initialisée avec les `default` de la liste chargée au démarrage. Elle n'est pas persistée.

## Message

Le format exact de chaque message est donné dans [contracts/protocole.md](contracts/protocole.md).

| Type | Sens | Champs |
| --- | --- | --- |
| `hello` | client → service | `role` (`dashboard` \| `overlay` \| `bench` \| `test`), `name?` (`overlay-a`…) |
| `welcome` | service → client | `vars: VariableDef[]`, `values: Record<id, valeur>` |
| `set` | client → service | `id`, `value` |
| `update` | service → tous | `seq`, `id`, `value` |
| `alert` (demande) | client → service | — |
| `alert` (diffusion) | service → tous | `seq` |
| `ack` | overlay → service | `seq`, `overlay` |
| `fps` | overlay → service | `overlay`, `value` |

`seq` est un entier unique, croissant de 1 à chaque diffusion, partagé entre `update` et `alert`. Il repart à 1 à chaque démarrage du service.

## Échantillon de latence (service, en mémoire)

| Champ | Description |
| --- | --- |
| `seq`, `id`, `overlay` | Identification de la mise à jour et de l'overlay |
| `sentAt`, `ackAt` | `performance.now()` du service, en ms |
| `ms` | `ackAt − sentAt` |

Seul le premier `ack` d'un couple `(seq, overlay)` est retenu. Un `ack` dont la `seq` est inconnue est ignoré.

## Échantillon FPS (service, en mémoire)

`overlay`, `value` (nombre d'images dans la dernière seconde), `at` (ms).

## Entrée de mesure (`results/mesures.json`)

| Champ | Type | Description |
| --- | --- | --- |
| `id` | string | `<horodatage ISO>-<mesure>-<framework>` |
| `framework` | `react` \| `vue` \| `svelte` \| `temoin` \| `temoin-defaut` \| `reference` | `reference` désigne OBS sur une scène vide. `temoin-defaut` désigne les campagnes avec défauts injectés, ignorées par la grille. |
| `mesure` | string | Une valeur du catalogue ci-dessous |
| `valeur` | number | Valeur principale (brute) |
| `unite` | string | `ms`, `Ko`, `%`, `fps`, `lignes`, `tests` |
| `net` | number? | Valeur nette de la référence (mesures `cpu-*` et `gpu-*`) |
| `valide` | boolean | `false` si une règle d'invalidité s'applique (accusés perdus > 2 %, par exemple) |
| `horodatage` | string ISO | — |
| `conditions` | object | `obsFps`, `accelerationMaterielle`, `navigateur`, `commit` |
| `details` | object | Détails propres à la mesure |

**Catalogue des mesures** (correspond aux lignes de la grille) :

| Mesure | Unité | Contenu |
| --- | --- | --- |
| `e2e` | tests | `valeur` = nombre de réussis ; `details` = `{ echoues, listeEchecs, manuels, dureeMs }` |
| `latence-mediane`, `latence-p95` | ms | `details` = valeurs par overlay et taux d'accusés perdus |
| `poids-dashboard`, `poids-overlay-a`, `poids-overlay-b`, `poids-overlay-3d` | Ko | `details` = `{ differeKo, fichiers }` |
| `cpu-reference`, `cpu-repos`, `cpu-alertes`, `cpu-3d` | % | `details` = `{ max, echantillons }` |
| `gpu-reference`, `gpu-repos`, `gpu-alertes`, `gpu-3d` | % | Même chose pour le GPU |
| `fps-min`, `fps-moyen` | fps | `details` = `{ plafond: obsFps, ratio }` |
| `lignes` | lignes | `details` = détail par langage |

## Rapport d'acceptation

Il est porté par l'entrée `e2e`. Le nombre de passages avant le vert se déduit de l'historique : c'est le nombre d'entrées `e2e` d'un framework jusqu'à la première où `echoues = 0`.
