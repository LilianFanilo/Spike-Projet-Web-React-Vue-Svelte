# Spike – React vs Vue vs Svelte

Oct 27, 2026 · @Lilian Peuron

## Verdict en bref

Premier avis : **Svelte 5 en favori, React en challenger sérieux, Vue en retrait.** Sur la grille pondérée (section « Tableau comparatif »), Svelte obtient 4,25/5, React 3,9/5 et Vue 3,65/5. L'écart est faible : c'est précisément ce que le spike doit trancher.

- **Pourquoi Svelte** : les overlays tournent dans la source navigateur d'OBS, gourmande en CPU. Un runtime de quelques Ko et des mises à jour ciblées du DOM collent exactement à ce besoin, comme au dashboard qui pousse des valeurs en direct.
- **Pourquoi React reste en course** : c'est le meilleur écosystème pour l'éditeur type Figma (canvas, éditeur de nœuds, animation, kits UI) et pour la 3D, avec React Three Fiber comme référence.
- **Pourquoi Vue est en retrait** : bon compromis, mais aucun avantage décisif ici. Son atout performance (Vapor Mode) est encore en release candidate.

Piste à valider pendant le spike : les overlays sont des pages web indépendantes de l'éditeur. Leur runtime peut donc être pensé séparément du framework de l'éditeur, ce qui réduit l'enjeu du choix.

## Contexte et critères

Le logiciel crée des overlays sous forme de pages web, capturées par OBS au-dessus du flux vidéo. Il comprend un éditeur inspiré de Figma (templates, médias, timeline, propriétés, liaison aux données), une page preview, un dashboard live et un MCP pour une IA externe. Les critères ci-dessous découlent directement de ces besoins ; les poids sont une proposition à ajuster en équipe avant de coder.

| Critère | Ce qu'on évalue | Poids |
| --- | --- | --- |
| Écosystème éditeur | Canvas, drag/resize, éditeur de nœuds pour la liaison de données, animation, kit UI | 20 % |
| Performance des overlays | Taille du runtime, coût CPU dans la source navigateur d'OBS | 20 % |
| Réactivité temps réel | Une valeur modifiée dans le dashboard met à jour N overlays sans latence | 20 % |
| Intégration 3D | Binding Three.js, chargement de modèles, liaison d'une propriété 3D à une variable | 15 % |
| Expérience de dev | Courbe d'apprentissage, TypeScript, quantité de code | 10 % |
| Outillage IA | Qualité du code généré, MCP officiels, documentation pour LLM | 10 % |
| Intégration desktop | Support par Tauri / Electron | 5 % |

## État des trois frameworks (octobre 2026)

Les trois ont convergé vers une réactivité plus fine : React par la compilation (mémoïsation automatique), Svelte et Vue par les signaux.

| Framework | Version stable | Nouveauté clé | Modèle de rendu | Runtime minimal (gzip) |
| --- | --- | --- | --- | --- |
| [React](https://react.dev/blog/2025/10/07/react-compiler-1) | 19.2 | React Compiler 1.0, stable depuis le 7 oct. 2025 : mémoïsation automatique, plus besoin de useMemo/useCallback | DOM virtuel, le composant se ré-exécute puis diff | \~42–45 Ko |
| [Vue](https://dev.to/codigoaoponto/vue-vapor-mode-what-it-is-and-what-changes-in-vue-36-2cmc) | 3.5.43 (17 sept. 2026) | 3.6 en RC (rc.10 au 30 sept. 2026) : Vapor Mode opt-in et réactivité réécrite sur alien-signals | DOM virtuel ; Vapor = mises à jour directes du DOM, par composant | Entre React et Svelte |
| [Svelte](https://alexcloudstar.com/md/blog/svelte-5-vs-react-2026/) | 5 (runes, fin 2024) | Runes $state / $derived / $effect, utilisables aussi hors composants (.svelte.ts) | Compilé, mises à jour ciblées sans DOM virtuel | \~3–5 Ko |

Popularité, d'après le [Stack Overflow Survey 2025](https://www.refontelearning.com/blog/top-javascript-frameworks-for-web-development-2026) :

| Framework | Utilisation | Score « admired » |
| --- | --- | --- |
| React | 44,7 % | 52,1 % |
| Vue | 17,6 % | 50,9 % |
| Svelte | 7,2 % | 62,4 % |

Côté State of JS 2025, l'usage de Svelte est passé de 26 % à 27 % ([Svelte Radio](https://podcastaddict.com/svelte-radio/episode/216828324)), et l'écart de téléchargements npm reste énorme : environ 190 M/semaine pour React contre 2,7 M pour Svelte ([PkgPulse](https://www.pkgpulse.com/guides/solidjs-vs-svelte-5-vs-react-reactivity-2026), à prendre comme ordre de grandeur).

## Tableau comparatif

Svelte arrive en tête (4,25/5) grâce à la performance et à la réactivité, React le talonne (3,9/5) grâce à l'écosystème éditeur et 3D. Les notes sur 5 sont un premier jugement issu des recherches ; le spike doit les confirmer ou les corriger avec des mesures.

| Critère (poids) | React | Vue | Svelte |
| --- | --- | --- | --- |
| Écosystème éditeur (20 %) | **5** — tldraw, React Flow, react-konva, Motion, shadcn/ui | **3** — vue-konva, Vue Flow (communautaire), motion-v, shadcn-vue | **3** — svelte-konva, Svelte Flow (officiel), shadcn-svelte, transitions natives |
| Performance des overlays (20 %) | **3** — runtime \~42–45 Ko, ré-exécution des composants | **3,5** — plus léger que React ; Vapor pas encore stable | **5** — runtime \~3–5 Ko, pas de DOM virtuel |
| Réactivité temps réel (20 %) | **3** — store externe nécessaire (Zustand, Jotai), Compiler limite les re-rendus | **4** — réactivité intégrée, refs partagées ou Pinia | **5** — runes partageables dans un simple fichier .svelte.ts |
| Intégration 3D (15 %) | **5** — React Three Fiber + drei, la référence ; composant Spline officiel | **4** — TresJS + Cientos (équivalent de drei) ; Spline via élément web | **4** — Threlte 8 (Svelte 5), avec physique et animation Theatre.js ; Spline via élément web |
| Expérience de dev (10 %) | **3** — tableaux de dépendances, plus de code de câblage | **4** — templates simples, prise en main rapide | **4** — moins de code ; typage des props verbeux |
| Outillage IA (10 %) | **4** — énorme corpus public (hypothèse à tester) | **3** — pas d'atout spécifique identifié | **4** — MCP officiel avec autofixer, docs llms.txt |
| Intégration desktop (5 %) | **5** — template Tauri officiel | **5** — template Tauri officiel | **5** — template Tauri officiel |
| **Total pondéré** | **3,9** | **3,65** | **4,25** |

## Analyse par besoin du projet

### Overlays affichés dans OBS

C'est le critère où Svelte creuse le plus l'écart. La source navigateur d'OBS repose sur CEF (Chromium embarqué) ([obs-browser](https://github.com/streamlabs/obs-browser)). Des utilisateurs rapportent qu'une animation y coûte nettement plus de CPU que dans Chrome, faute d'accélération matérielle efficace ([forum OBS](https://obsproject.com/forum/threads/browser-source-cpu-optimization.82406)). Chaque overlay est une page chargée séparément : le runtime du framework est donc payé à chaque source.

- Un compteur minimal pèse \~3–5 Ko en Svelte contre \~42–45 Ko pour React + React DOM. Sur une grosse application, l'écart se réduit à 30–50 % ([retour d'expérience Svelte 5 vs React](https://alexcloudstar.com/md/blog/svelte-5-vs-react-2026/)).
- Les API JavaScript d'OBS (`window.obsstudio`, événements de scène et de visibilité) sont indépendantes du framework.

### Données live et dashboard

Le transport (WebSocket entre le logiciel et les pages) est le même pour les trois ; la différence porte sur la façon d'appliquer une mise à jour.

- **Svelte** : `$state` et `$derived` fonctionnent aussi dans un fichier `.svelte.ts`, ce qui donne un store de variables partagé sans librairie. Seuls les nœuds DOM concernés sont mis à jour.
- **Vue** : réactivité intégrée et Pinia, très adaptés à un dashboard. La 3.6 améliore la réactivité pour toutes les apps, même sans Vapor ([Epicmax](https://epicmax.co/blog/vue-vapor-mode-migration)).
- **React** : il faut un store externe (Zustand, Jotai) et le composant se ré-exécute à chaque changement. Le Compiler 1.0 réduit le coût, sans changer le modèle ([React](https://react.dev/blog/2025/10/07/react-compiler-1)).

### Élément 3D

Les trois frameworks s'appuient sur Three.js via une couche déclarative : l'écart porte sur l'API et l'écosystème, pas sur le moteur de rendu.

| Framework | Librairie 3D | Points forts | Spline |
| --- | --- | --- | --- |
| React | [React Three Fiber](https://zenn.dev/ymnkx/articles/a28eb5a20250ae) + drei | La référence, celle dont TresJS et Threlte s'inspirent ; le plus d'exemples et de helpers | Composant officiel `@splinetool/react-spline` |
| Vue | [TresJS](https://zenn.dev/nonejp/articles/877ecdcfa93b4f) + Cientos | Composants générés à partir des constructeurs Three.js, donc peu de retard sur les mises à jour ; Cientos joue le rôle de drei | Élément web `<spline-viewer>` |
| Svelte | [Threlte](https://github.com/FoHoOV/threlte) 8 | Compatible Svelte 5 ; paquets officiels pour glTF, physique (Rapier) et animation via Theatre.js | Élément web `<spline-viewer>` |

- **Spline** (une de vos inspirations) ne fournit aucun paquet officiel Vue ou Svelte, mais son élément web fonctionne partout ([docs Spline](https://docs.spline.design/codegen-tools/adding-spline-to-bolt-new.md)).
- **OBS** : le WebGL ne fonctionne dans une source navigateur que si l'option d'accélération matérielle des sources navigateur est activée dans les paramètres avancés d'OBS ([exemple d'overlay Three.js](https://github.com/aaackerman/pubg-overlay)). À tester en premier.
- **Poids** : Three.js est bien plus lourd que le runtime de chacun des trois frameworks. Sur un overlay 3D, l'avantage de taille de Svelte devient donc marginal (à mesurer).
- **Bonus Threlte** : l'intégration Theatre.js offre un éditeur d'animation sur timeline, une piste pour la Timeline de la page Édition.

### Éditeur type Figma

C'est le critère où React domine, mais l'écart est moins grand qu'attendu.

- **Canvas** : Konva propose des bindings officiels pour React, Vue et Svelte, avec transformations, drag-and-drop et export ([Konva](https://konvajs.org/docs/about.html)). Un éditeur type Canva a été construit en production sur react-konva : 60 FPS, 250+ objets ([GeekyAnts](https://geekyants.com/blog/building-a-production-ready-canva-like-editor-with-konva-js-react-19-and-next-js-15)).
- **Canvas infini clé en main** : tldraw est réservé à React, et son usage en production exige une clé de licence ([tldraw](https://github.com/tldraw/tldraw)).
- **Liaison des données / fonctions préétablies** (éditeur de nœuds) : xyflow maintient officiellement React Flow et Svelte Flow ; Vue Flow est un projet communautaire distinct ([xyflow](https://www.issoh.co.jp/tech/details/2347/)).
- **Animation** : Motion est officiel pour React et Vue (motion-v) ; Svelte passe par l'API vanilla, un portage communautaire (motion-sv) ou ses transitions intégrées ([Motion](https://github.com/motiondivision/motion)).
- **Kit UI** : shadcn/ui est React ; shadcn-vue et shadcn-svelte sont des portages communautaires. Ark UI couvre les trois depuis une même base ([PkgPulse](https://www.pkgpulse.com/guides/shadcn-ui-vs-park-ui-vs-melt-ui-headless-2026)).
- **Timeline** : aucune brique prête identifiée dans les recherches. Elle sera probablement à construire, quel que soit le framework (point à vérifier).

### Logiciel desktop

Aucun écart. Tauri fournit des templates officiels pour React, Vue et Svelte via create-tauri-app ([Tauri](https://v2.tauri.app/start/create-project)).

### IA et MCP

Le MCP intégré au logiciel est un protocole côté application : il ne dépend pas du framework UI. La différence porte sur l'assistance au développement.

- Svelte publie un serveur MCP officiel qui fournit la documentation Svelte 5 et analyse le code généré pour le corriger ([Svelte](https://svelte.dev/docs/ai)).
- React bénéficie du plus gros volume de code public. On peut supposer que les IA le génèrent de façon plus fiable, mais c'est une hypothèse à mesurer dans le spike.

### Import Figma

Aucun écart : l'import passe par l'API de Figma et produit des données, pas des composants liés à un framework.

## Risques et points de vigilance

Le principal risque de Svelte est l'écosystème ; celui de React est le poids des overlays ; celui de Vue est de parier sur une fonctionnalité non stable.

| Framework | Risque | Parade |
| --- | --- | --- |
| Svelte | Librairies moins nombreuses, parfois maintenues par une seule personne ; trou possible sur une brique de l'éditeur | Vérifier que canvas, nœuds et animation tiennent avec svelte-konva, Svelte Flow et les transitions |
| Svelte | Beaucoup de tutos (et de code généré par IA) utilisent encore la syntaxe Svelte 4 | Imposer les runes dans la spec, brancher le MCP officiel Svelte dans l'agent IA |
| Svelte | Typage des props verbeux en TypeScript | Accepter le surcoût ou typer via des types partagés |
| React | Runtime plus lourd dans chaque source OBS | Mesurer le CPU réel ; envisager un runtime d'overlay plus léger, séparé de l'éditeur |
| React | Re-rendus coûteux dans un éditeur riche en objets | Activer le React Compiler dès le départ, store à sélecteurs (Zustand) |
| React | tldraw payant en production | Partir sur Konva, gratuit (MIT) |
| Vue | Vapor Mode encore en RC : fonctionnellement complet mais pas stable ([Vue 3.6 beta](https://github.com/vuejs/core/releases/tag/v3.6.0-beta.1)) | Évaluer Vue sur sa version stable 3.5, sans compter sur Vapor |
| Tous | La 3D dans OBS dépend de l'accélération matérielle de la source navigateur, désactivée chez certains streamers | Vérifier le réglage, prévoir un repli 2D si le contexte WebGL échoue |
| Tous | Les benchmarks synthétiques ne reflètent pas forcément la production ([Strapi](https://strapi.io/blog/frameworks-for-javascript-app-developlemt)) | Mesurer sur votre propre prototype, dans OBS |
| Tous | Une architecture hybride (éditeur dans un framework, overlays dans un autre) double la maintenance | Ne la retenir que si les mesures le justifient |

## Comment mener le spike (spec-driven)

Une seule spécification fonctionnelle, écrite une fois et indépendante du framework, est implémentée trois fois : seul le plan technique change. Le spike teste trois capacités : le dashboard, la diffusion des overlays dans OBS et un élément 3D. L'éditeur type Figma sort du périmètre ; son critère reste noté d'après les recherches.

### Déroulé avec GitHub Spec Kit

[Spec Kit](https://github.com/LinkedInLearning/spec-driven-development-with-github-spec-kit-4641001) est l'outil open source de GitHub pour le spec-driven development. Il fonctionne avec Claude Code, Copilot ou Gemini CLI et enchaîne constitution, spécification, plan, tâches puis implémentation.

1. **Constitution commune** (`/speckit.constitution`) : TypeScript, Vite, même transport WebSocket, mêmes règles de qualité, aucune librairie UI hormis la librairie 3D.
2. **Spécification unique** (`/speckit.specify`) : les trois user stories ci-dessous avec leurs critères d'acceptation.
3. **Clarification** (`/speckit.clarify`) avant de dupliquer, pour que les trois versions partent d'une spec sans zone floue. Ensuite, la spec est gelée : toute modification s'applique aux trois.
4. **Un plan par framework** (`/speckit.plan`), dans trois dossiers : React + React Three Fiber + Zustand ; Vue + TresJS + Pinia ; Svelte + Threlte + runes.
5. **Tâches puis implémentation** (`/speckit.tasks`, `/speckit.analyze`, `/speckit.implement`), en notant chaque correction manuelle.

Point de vigilance : avec un agent IA, vous mesurez aussi la capacité de l'IA à écrire chaque framework. Gardez le même modèle et le même agent pour les trois, branchez le MCP Svelte pour Svelte, et distinguez dans le journal ce que l'IA a réussi seule de ce que vous avez corrigé.

### Contenu de la spécification

1. **Dashboard** : le streamer modifie un texte, un nombre et un booléen, et déclenche un événement « alerte ». Les champs sont générés automatiquement à partir de la liste des variables du projet.
2. **Overlays diffusés** : deux overlays, servis sur des URL locales, ajoutés comme sources navigateur dans OBS (1920×1080, fond transparent). Une variable modifiée met à jour les deux ; l'alerte joue une animation.
3. **Élément 3D** : un modèle glTF tourne en continu dans un overlay. Sa couleur ou sa vitesse est liée à une variable du dashboard, et l'alerte déclenche une animation 3D.

### Grille de résultats à remplir

| Mesure | Comment la mesurer | React | Vue | Svelte |
| --- | --- | --- | --- | --- |
| Critères d'acceptation validés | Checklist de la spec |  |  |  |
| Temps total (h) | Journal de temps |  |  |  |
| Corrections manuelles du code généré | Journal |  |  |  |
| Lignes de code | cloc sur src/ |  |  |  |
| Poids de l'overlay 2D (Ko gzip) | Build de production |  |  |  |
| Poids de l'overlay 3D (Ko gzip) | Build de production |  |  |  |
| CPU d'OBS, overlay 2D pendant l'alerte (%) | Gestionnaire des tâches, 10 déclenchements |  |  |  |
| CPU / GPU d'OBS, overlay 3D (%) | Gestionnaire des tâches, 1 min |  |  |  |
| FPS de la scène 3D dans OBS | Compteur FPS dans la page |  |  |  |
| Latence dashboard → overlay (ms) | Horodatage envoi / affichage |  |  |  |
| Ressenti : dashboard / overlays / 3D (/5) | Avis de chaque participant |  |  |  |

Une fois la grille remplie, reportez les mesures dans le tableau comparatif, recalculez le total pondéré et rédigez une recommandation finale d'une page.

## Sources

Sources officielles :

- [React Compiler v1.0 — react.dev](https://react.dev/blog/2025/10/07/react-compiler-1)
- [Vue 3.6.0-beta.1 — notes de version vuejs/core](https://github.com/vuejs/core/releases/tag/v3.6.0-beta.1)
- [Svelte AI / MCP — svelte.dev](https://svelte.dev/docs/ai)
- [Konva — intégrations frameworks](https://konvajs.org/docs/about.html)
- [tldraw — dépôt GitHub](https://github.com/tldraw/tldraw)
- [Motion — dépôt GitHub](https://github.com/motiondivision/motion)
- [Tauri — Create a Project](https://v2.tauri.app/start/create-project)
- [obs-browser — dépôt GitHub](https://github.com/streamlabs/obs-browser)

Analyses et retours d'expérience :

- [Svelte 5 vs React in 2026 — Alex Cloudstar](https://alexcloudstar.com/md/blog/svelte-5-vs-react-2026/)
- [Vue Vapor Mode et Vue 3.6 — Código ao Ponto](https://dev.to/codigoaoponto/vue-vapor-mode-what-it-is-and-what-changes-in-vue-36-2cmc)
- [Vue Vapor Mode Migration — Epicmax](https://epicmax.co/blog/vue-vapor-mode-migration)
- [Éditeur type Canva avec Konva et React — GeekyAnts](https://geekyants.com/blog/building-a-production-ready-canva-like-editor-with-konva-js-react-19-and-next-js-15)
- [React Flow / Svelte Flow / Vue Flow — issoh](https://www.issoh.co.jp/tech/details/2347/)
- [SolidJS vs Svelte 5 vs React — PkgPulse](https://www.pkgpulse.com/guides/solidjs-vs-svelte-5-vs-react-reactivity-2026)
- [shadcn/ui vs Park UI vs Melt UI — PkgPulse](https://www.pkgpulse.com/guides/shadcn-ui-vs-park-ui-vs-melt-ui-headless-2026)
- [Frameworks frontend 2026 (données Stack Overflow 2025) — Refonte Learning](https://www.refontelearning.com/blog/top-javascript-frameworks-for-web-development-2026)
- [Svelte dans le State of JS 2025 — Svelte Radio](https://podcastaddict.com/svelte-radio/episode/216828324)
- [Frameworks JavaScript — Strapi](https://strapi.io/blog/frameworks-for-javascript-app-developlemt)
- [Browser Source & CPU — forum OBS](https://obsproject.com/forum/threads/browser-source-cpu-optimization.82406)
- [Offres Svelte en France — devjobsscanner](https://www.devjobsscanner.com/svelte-jobs-in-france/)
- [React, Vue, Angular 2026 : lequel pour l'emploi — JobRise](https://jobrise.io/fr/blog/react-vs-vue-vs-angular-emploi-2026/)

3D et méthode du spike :

- [Threlte — dépôt GitHub](https://github.com/FoHoOV/threlte)
- [TresJS, Three.js déclaratif pour Vue — Zenn](https://zenn.dev/nonejp/articles/877ecdcfa93b4f)
- [Équivalents R3F / TresJS / Threlte — Zenn](https://zenn.dev/ymnkx/articles/a28eb5a20250ae)
- [Intégrer Spline (règles par framework) — docs Spline](https://docs.spline.design/codegen-tools/adding-spline-to-bolt-new.md)
- [Overlay Three.js pour OBS, réglage d'accélération matérielle — pubg-overlay](https://github.com/aaackerman/pubg-overlay)
- [Spec-Driven Development avec GitHub Spec Kit — LinkedIn Learning](https://github.com/LinkedInLearning/spec-driven-development-with-github-spec-kit-4641001)

Les articles PkgPulse et les comparatifs de blogs donnent des ordres de grandeur, pas des mesures de référence.
