# Implementation Plan: Outillage commun du spike

**Branch**: `002-infra-commune` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-infra-commune/spec.md`

## Summary

L'outillage partagé du spike est livré dans `shared/`, avec une page témoin sans framework dans `apps/temoin`. Il se compose de :
- un protocole typé et des variables ;
- un service de diffusion (Node 26 + `ws`) avec statistiques HTTP ;
- un client WebSocket commun, qui gère la reconnexion et appelle lui-même la sonde de latence et le compteur FPS ;
- une suite d'acceptation Playwright, paramétrée par l'adresse de l'app ;
- des scripts de mesure (latence, poids gzip via le manifeste Vite, CPU et GPU via WMI, FPS, `cloc`), qui écrivent tous dans `results/mesures.json` ;
- un modèle glTF Suzanne sans textures (CC0) ;
- le protocole OBS.

L'ensemble est validé sur la page témoin avant de poser le tag `base-commune`. Les décisions techniques sont détaillées dans [research.md](research.md).

## Technical Context

**Language/Version** : TypeScript effaçable, exécuté nativement par Node 26.7 (type stripping) ; PowerShell 5.1 pour `cpu.ps1`.

**Primary Dependencies** :
- `ws` : serveur WebSocket ;
- `@playwright/test` : suite d'acceptation, avec Chromium ;
- `cloc` : comptage des lignes, lancé avec le Perl de Git for Windows ;
- Vite : uniquement pour `apps/temoin`.

Côté client, rien de plus : on utilise le `WebSocket` natif et `zlib` de Node.

**Storage** : `results/mesures.json` (ajout seul, écriture atomique). L'état du service vit en mémoire.

**Testing** : Playwright. La suite est le livrable lui-même : elle est validée sur le témoin et sur des défauts injectés.

**Target Platform** : Windows 11 fr-FR (machine de Lilian), Chromium (Playwright), OBS (version installée, source navigateur CEF, à noter dans le protocole).

**Project Type** : outillage local, c'est-à-dire une bibliothèque partagée, un service, des outils en ligne de commande et une app témoin.

**Performance Goals** :
- suite d'acceptation en moins de 5 min par app ;
- surcoût de la sonde négligeable (une lecture d'attribut par image, uniquement pendant l'attente d'un accusé).

**Constraints** :
- `shared/` n'est jamais compilé ;
- aucune dépendance côté navigateur dans `shared/` ;
- le service écoute uniquement sur `127.0.0.1` ;
- compteurs système indépendants de la langue de Windows.

**Scale/Scope** : 5 variables, 4 pages, 3 apps et le témoin, environ 40 tests d'acceptation.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Vérification | Statut |
| --- | --- | --- |
| I. Équité | Le transport (client partagé), la sonde, le compteur FPS et les tests sont identiques pour les trois. Le témoin est commun à tous et n'appartient à aucun framework. Son usage comme exemple est noté comme biais commun. | ✅ |
| II. Outillage en lecture seule | Tout est livré avant `base-commune`. Le code est en TS effaçable (`erasableSyntaxOnly`) avec des imports `.ts`. Les tests ne dépendent que du contrat DOM. | ✅ |
| III. Stack minimale | `shared/` ne contient aucune librairie UI. Le témoin est en Vite vanilla, sans méta-framework. Les apps restent des projets npm indépendants (contrat [integration-apps](contracts/integration-apps.md)). | ✅ |
| IV. Contrat DOM | Formalisé dans [integration-apps](contracts/integration-apps.md) (avec FR-045, issu de l'amendement). Le compteur FPS n'apparaît qu'avec `debug=1`. Les tests de repli passent par le projet `sans-3d`. | ✅ |
| V. Mesures reproductibles | Mesures faites sur le build de production (`preview`). Grille unique horodatée avec ses conditions. Barème inchangé. L'historique des entrées `e2e` donne le nombre de passages avant le vert. | ✅ |
| VI. Simplicité | Pas de tests unitaires : la validation passe par le témoin et les défauts injectés. Un seul fichier par script. | ✅ |

**Re-check après la Phase 1** : la conception ajoute un client partagé, ce qui renforce le principe I sans en enfreindre aucun. Aucune violation, donc la section Complexity Tracking reste vide.

## Project Structure

### Documentation (this feature)

```text
specs/002-infra-commune/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── protocole.md          # messages, client.ts, probe.ts, fps.ts
│   ├── service.md            # lancement et HTTP du service
│   ├── integration-apps.md   # ce que chaque app doit respecter
│   └── commandes.md          # scripts de test et de mesure
└── tasks.md                  # /speckit-tasks
```

### Source Code (repository root)

```text
shared/
├── package.json              # type: module ; deps : ws ; devDeps : @playwright/test, cloc, @types/ws, @types/node, typescript
├── tsconfig.json             # strict, erasableSyntaxOnly, allowImportingTsExtensions, noEmit, lib dom + node
├── protocol.ts               # types, constantes, validate/normalize/serialize
├── client.ts                 # connect() : hello, reconnexion, sonde, fps
├── probe.ts
├── fps.ts
├── variables.json
├── variables.alt.json
├── server/
│   └── index.ts              # HTTP + WS, état, seq, stats, CLI
├── assets/
│   ├── build-model.ts        # Suzanne glTF → model.glb sans textures
│   ├── model.glb
│   └── LICENSE-model.md
├── e2e/
│   ├── playwright.config.ts  # projets standard / sans-3d, workers 1
│   ├── fixtures.ts           # fixture serveur (start/stop/restart/client/stats), helpers d'URL
│   ├── service.spec.ts       # US1 de cette feature (protocole et service)
│   ├── dashboard.spec.ts     # US1-1 à US1-6 de la spec gelée
│   ├── overlays.spec.ts      # US2-1 à US2-7
│   ├── overlay-3d.spec.ts    # US3-1 à US3-6 (dont @repli)
│   ├── bords.spec.ts         # cas limites testables
│   ├── manuels.ts            # liste des scénarios manuels
│   └── mesures-reporter.ts   # ajoute l'entrée e2e
└── bench/
    ├── record.ts             # append atomique + CLI (stdin JSON) + calcul net
    ├── latency.ts
    ├── alerts.ts
    ├── sizes.ts
    ├── fps.ts
    ├── cloc.ts
    ├── cpu.ps1
    └── grille.ts

apps/temoin/                  # Vite vanilla TS, port 4170
├── package.json  vite.config.ts  tsconfig.json
├── dashboard.html  overlay-a.html  overlay-b.html  overlay-3d.html
└── src/
    ├── dashboard.ts  overlay-a.ts  overlay-b.ts  overlay-3d.ts
    ├── defauts.ts            # lecture de ?defaut=
    └── style.css             # fond transparent, animation d'alerte (×1,15 + flash, 2 s ease-out)

results/
├── protocole-obs.md
└── mesures.json              # créé par la première mesure
```

**Structure Decision** : `shared/` est une bibliothèque et un outillage non compilés, exécutés tels quels par Node et importés par Vite via `@shared`. Le témoin vit dans `apps/temoin` pour suivre exactement le même contrat d'intégration que les apps des frameworks, ce qui rend ses mesures comparables. `results/` est à la racine, car il est partagé par toutes les branches et fusionné à la fin.

## Complexity Tracking

Aucune violation de la constitution.
