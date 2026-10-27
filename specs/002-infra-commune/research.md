# Research — Outillage commun du spike

Phase 0 de `/speckit-plan` pour `002-infra-commune`. Chaque décision ci-dessous suit le format décision, justification, alternatives écartées.

## R1. Exécution du TypeScript de `shared/` sans build

- **Décision** : Node 26 exécute directement les `.ts` grâce au retrait des annotations de type (type stripping). Le code de `shared/` ne contient que de la syntaxe effaçable, et le `tsconfig.json` de `shared/` active `erasableSyntaxOnly`, `allowImportingTsExtensions`, `verbatimModuleSyntax` et `noEmit`. Les imports internes portent l'extension `.ts`. Vite résout ces imports sans configuration particulière. Les apps n'ont qu'à activer `allowImportingTsExtensions` dans leur propre `tsconfig`.
- **Justification** : c'est la règle de la constitution (principe II). Un même fichier sert au navigateur (via Vite) et à Node, sans étape de compilation intermédiaire.
- **Alternatives écartées** :
  - `tsx` / `ts-node` : une dépendance de plus, sans nécessité ;
  - un build de `shared/` vers du JS : on aurait deux sources à tenir synchronisées.

## R2. Transport et service de diffusion

- **Décision** :
  - un seul processus Node expose sur `127.0.0.1:8787` un serveur HTTP (statistiques et santé) et un serveur WebSocket (paquet `ws`, branché sur l'upgrade HTTP) ;
  - côté client (navigateur et scripts Node 26), on utilise le `WebSocket` natif, sans dépendance ;
  - les horodatages sont pris avec `performance.now()` du service.
- **Justification** :
  - Node n'a pas de serveur WebSocket natif, d'où `ws`, la référence ;
  - écouter sur `127.0.0.1` plutôt que `localhost` évite l'ambiguïté IPv4/IPv6 sous Windows ;
  - `performance.now()` est monotone et précis à la sous-milliseconde (FR-013).
- **Alternatives écartées** :
  - Server-Sent Events : un seul sens de communication, alors que les accusés et les FPS remontent ;
  - `socket.io` : protocole propriétaire et poids côté client, ce qui fausserait les mesures de poids.

## R3. Client WebSocket partagé (`shared/client.ts`)

- **Décision** : `shared/` fournit un client commun avec reconnexion automatique (nouvelle tentative toutes les 1 s, sous le seuil de 2 s de la spec gelée). Il se présente au service (`hello`), puis distribue les messages (`welcome`, `update`, `alert`) aux fonctions de rappel de l'app. Quand on lui donne un nom d'overlay, il appelle lui-même la sonde de latence à chaque mise à jour.
- **Justification** :
  - la constitution impose le « même transport » pour les trois frameworks ;
  - la reconnexion et l'appel de la sonde sont du code de transport, pas de la réactivité ;
  - partager ce client garantit que l'écart mesuré ne vient que de la façon dont chaque framework applique une valeur au DOM, ce que le spike veut comparer.
- **Alternatives écartées** : un client écrit par chaque implémentation. Il aurait introduit des différences de reconnexion et de cadence d'accusés sans lien avec le framework.
- **Conséquence** : FR-024 de la spec gelée (reconnexion des overlays) est assuré par le client partagé, chaque app se contentant de le brancher. C'est identique pour les trois.

## R4. Sonde de latence

- **Décision** : à chaque `update`, la sonde vérifie qu'au moins un élément `[data-var="<id>"]` existe :
  - s'il n'existe pas, l'overlay n'affiche pas cette variable et rien n'est fait ;
  - s'il existe, la sonde contrôle à chaque `requestAnimationFrame` que sa `data-value` est égale à `serialize(type, value)`. Dès que c'est le cas, elle attend un `requestAnimationFrame` de plus, puis envoie `ack {seq, overlay}`. Elle abandonne au bout de 2 s.
- **Justification** :
  - l'image supplémentaire garantit que la mise à jour a été peinte ;
  - la latence est calculée par le service seul (`t_ack − t_diffusion`), sur une seule horloge ;
  - pour un même `(seq, overlay)`, seul le premier accusé est retenu, ce qui neutralise les doublons (un onglet en arrière-plan en plus d'OBS, par exemple).
- **Alternatives écartées** :
  - `MutationObserver` : il déclenche avant la peinture, donc la mesure serait trop optimiste ;
  - un horodatage fait dans le navigateur : il faudrait synchroniser deux horloges.

## R5. Compteur FPS (`shared/fps.ts`)

- **Décision** : un module partagé, actif seulement si l'URL contient `debug=1`. Il compte les `requestAnimationFrame` par fenêtre d'une seconde, affiche un petit élément `[data-fps]` créé hors framework, puis envoie `fps {overlay, value}` chaque seconde.
- **Justification** : le coût et la méthode de comptage sont identiques pour les trois frameworks (FR-034 de la spec gelée). La boucle de rendu des trois librairies 3D est elle-même pilotée par `requestAnimationFrame`.
- **Alternative écartée** : le compteur propre à chaque librairie 3D, par exemple `stats.js` ou les outils de drei. Méthodes hétérogènes.

## R6. Choix du modèle 3D

- **Décision** : **Suzanne**, tirée de Khronos glTF-Sample-Assets (licence CC0-1.0, auteur Norbert Nopper / UX3D). Un script unique, `shared/assets/build-model.ts`, la convertit en `model.glb` :
  - il retire les textures, les images et les samplers ;
  - il donne au matériau une couleur de base blanche (`baseColorFactor` = 1, 1, 1, 1, `metallicFactor` 0, `roughnessFactor` 0,5) ;
  - il emballe le tout en GLB.

  Taille attendue : environ 590 Ko. La licence et la source sont notées dans `shared/assets/LICENSE-model.md`.
- **Justification** :
  - CC0, sans attribution obligatoire ;
  - un seul maillage, sans squelette ;
  - sans texture, la teinte via la couleur de base s'applique directement (FR-050) ;
  - moins de 1 Mo.
- **Alternatives écartées** :

  | Modèle | Poids | Raison du rejet |
  | --- | --- | --- |
  | Fox | 163 Ko | CC-BY pour le squelette, texture brune qui assombrit la teinte, maillage avec squelette |
  | Duck | 120 Ko | Licence SCEA, moins libre ; texture |
  | Avocado | 8 Mo | Trop lourd |
  | Box | 1,6 Ko | Visuellement trop pauvre pour juger la 3D |

## R7. Tests d'acceptation

- **Décision** : `@playwright/test` avec Chromium, configuré dans `shared/e2e/playwright.config.ts` :
  - `workers: 1` et `fullyParallel: false`, car les tests pilotent le service partagé ;
  - l'adresse de l'app est passée par la variable `APP_URL` (obligatoire), avec `APP_QUERY` en option, ajoutée à chaque URL, pour injecter des défauts dans la page témoin ;
  - le framework testé est passé par `FRAMEWORK`.

  Deux projets Playwright :
  - **`standard`** : arguments `--use-angle=swiftshader --enable-unsafe-swiftshader`. WebGL logiciel, déterministe, sans GPU. Le repli automatique vers SwiftShader n'est plus garanti dans les Chromium récents, d'où l'argument explicite.
  - **`sans-3d`** : argument `--disable-3d-apis`, ne joue que les tests marqués `@repli`.

  Une fixture `serveur` démarre un service neuf (processus enfant) **avant chaque test** et l'arrête après. Elle expose `restart({ vars })`, `stop()`, `start()`, un client de test et `stats()`.

  Chaque titre de test commence par l'identifiant du scénario (`US2-6 …`, `BORD-titre-long …`).
- **Justification** :
  - un service neuf par test garantit l'isolation et les valeurs par défaut ;
  - Playwright exécute le TypeScript des tests nativement ;
  - les deux projets couvrent FR-033.
- **Alternative écartée** : Puppeteer avec un exécuteur maison. Rapports et fixtures à réécrire.
- **Rapport** : un rapporteur maison (`shared/e2e/mesures-reporter.ts`) ajoute en fin de campagne une entrée `e2e` à `results/mesures.json` : réussis, échoués, liste des échecs, liste des scénarios manuels, durée. L'historique de ces entrées donne directement le « nombre de passages avant le vert ».

## R8. Mesure système sous Windows (CPU et GPU)

- **Décision** : `shared/bench/cpu.ps1` interroge chaque seconde les classes WMI suivantes :
  - `Win32_PerfFormattedData_PerfProc_Process` (champs `Name`, `IDProcess`, `PercentProcessorTime`), filtrée sur `obs64` et `obs-browser-page*` ;
  - `Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine` (`UtilizationPercentage`), en sommant les moteurs `engtype_3D` des PID retenus.

  Le CPU est divisé par le nombre de cœurs logiques (12 sur la machine cible). Le script calcule la moyenne et le maximum, puis transmet le résumé à `shared/bench/record.ts`, qui calcule la valeur nette à partir de la dernière référence.
- **Justification** : vérifié sur la machine cible, Windows en fr-FR. `Get-Counter` avec des noms anglais échoue (« L'objet spécifié n'a pas été trouvé »), car les noms de compteurs sont traduits. Les classes WMI, elles, ne sont pas traduites et fonctionnent.
- **Alternatives écartées** :
  - `Get-Counter` avec les noms français : fragile, dépend de la langue ;
  - le Gestionnaire des tâches relu à l'œil : non reproductible.

## R9. Poids des pages

- **Décision** : `shared/bench/sizes.ts` lit `apps/<fw>/dist/.vite/manifest.json` (les apps doivent activer `build.manifest: true`). Pour chaque entrée (`dashboard.html`, `overlay-a.html`, `overlay-b.html`, `overlay-3d.html`), il additionne la taille gzip (zlib, niveau par défaut) de plusieurs éléments :
  - le HTML ;
  - le fichier d'entrée ;
  - ses `imports`, suivis récursivement et dédupliqués ;
  - tous les `css` associés.

  Les `dynamicImports` (suivis récursivement) sont comptés à part. Les `assets` `.glb` sont exclus.
- **Justification** : Vite factorise le runtime du framework dans des chunks partagés entre les entrées. Seul le parcours du manifeste donne le vrai coût de chargement d'une page (FR-042).
- **Alternative écartée** : additionner les fichiers de `dist/assets`. Cela mélange les pages entre elles.

## R10. Comptage des lignes

- **Décision** : `cloc` (paquet npm, en dépendance de développement de `shared/`) est lancé avec le Perl fourni par Git for Windows (`C:\Program Files\Git\usr\bin\perl.exe`), via `shared/bench/cloc.ts`, sur `apps/<fw>/src` avec `--json`. On retient le nombre de lignes de code, hors commentaires et lignes vides, au total et par langage. `cloc` reconnaît `.tsx`, `.vue` et `.svelte`.
- **Justification** : Perl est absent du PATH PowerShell mais présent avec Git, ce qui a été vérifié. Ça évite une installation supplémentaire.
- **Alternatives écartées** :
  - `npx cloc` direct : il échoue sans Perl dans le PATH ;
  - un compteur maison : il gère mal les commentaires des fichiers `.vue` et `.svelte`.

## R11. Page témoin

- **Décision** : un projet Vite en TypeScript vanilla, `apps/temoin`, avec les mêmes entrées que les apps, servi en preview sur le **port 4170**. L'overlay 3D témoin efface un contexte WebGL avec la couleur courante et fait clignoter la luminosité pendant l'alerte, sans librairie 3D. Il télécharge le modèle : si ce téléchargement échoue ou si WebGL est absent, il affiche le repli.

  On injecte des défauts avec `?defaut=<code>` :
  - `bandeau` : l'overlay B ignore la variable ;
  - `score` : l'overlay A ne met pas le score à jour ;
  - `alerte` : `data-alert` n'est jamais posé ;
  - `reconnexion` : le client partagé est créé sans reconnexion.
- **Justification** :
  - l'utilisateur proposait « un petit serveur statique Node ». Vite est préféré pour trois raisons : les navigateurs n'exécutent pas les `.ts` de `shared/` ; le témoin produit ainsi un manifeste mesurable par `sizes.ts` ; il sert de référence « sans framework » directement comparable (US4-4) ;
  - le témoin vit dans `apps/` comme les autres apps : il fait partie de la base commune et est visible des trois implémentations à égalité. Ce n'est pas le code d'un autre framework (principe I). Le fait qu'il serve d'exemple est noté comme biais commun dans la recommandation.
- **Alternative écartée** : un serveur statique avec retrait des types à la volée. Il faudrait le maintenir, et il ne produirait pas de manifeste comparable.

## R12. Grille de mesures

- **Décision** : `results/mesures.json` contient `{ "version": 1, "entrees": [...] }`, complété en ajout seul par `shared/bench/record.ts` (fonction et petite interface en ligne de commande). L'écriture est atomique : fichier temporaire, puis renommage. `shared/bench/grille.ts` produit `results/grille.md` à partir de la dernière entrée valide de chaque couple (framework, mesure).
- **Justification** : un seul point d'écriture, aussi bien pour Node que pour PowerShell. L'historique est conservé (cas limite « mesure relancée »), et SC-005 est couvert (grille générée sans saisie).
- **Alternative écartée** : CSV. Les détails imbriqués (par langage, par overlay, conditions) s'y représentent mal.
