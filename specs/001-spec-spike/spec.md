# Feature Specification: Spike overlays live (dashboard, overlays OBS, élément 3D)

**Feature Branch**: `001-spec-spike`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "spec-spike : spécification fonctionnelle unique du spike, indépendante du framework, rédigée en français. Dashboard live, deux overlays diffusés dans OBS, un élément 3D, pilotés par un serveur WebSocket local commun. Critères de succès = la grille de résultats du spike."

## Contexte

Le logiciel crée des overlays pour streamers. Ce sont des pages web qu'OBS capture via une source navigateur, au-dessus du flux vidéo. Pendant le live, le streamer pilote ces overlays depuis un dashboard. Un service local de diffusion, fourni par l'outillage commun du spike, transmet chaque changement à toutes les pages connectées.

Cette spécification est **unique et indépendante du framework**. Elle est implémentée trois fois, à l'identique, en React, en Vue et en Svelte. Les implémentations sont ensuite comparées avec la grille de résultats du spike.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Piloter les variables du live depuis le dashboard (Priority: P1)

Le streamer ouvre le dashboard dans son navigateur. Il y trouve un champ par variable du projet, généré automatiquement à partir de la liste des variables :
- le **titre** (texte) ;
- le **score** (nombre) ;
- le **bandeau visible** (booléen) ;
- la **couleur du modèle** (couleur) ;
- la **vitesse de rotation** (nombre borné).

Chaque champ affiche la valeur courante. Toute modification est diffusée aussitôt, sans bouton de validation. Un bouton « Alerte » déclenche un événement ponctuel que tous les overlays jouent.

**Why this priority**: sans dashboard, les overlays n'ont aucune donnée à afficher. C'est la source de toutes les mises à jour mesurées par le spike.

**Independent Test**: ouvrir le dashboard avec le service de diffusion lancé. Vérifier qu'un champ adapté à son type existe pour chaque variable de la liste, que chaque modification est reçue par un client d'écoute, et que le bouton « Alerte » émet un événement.

**Acceptance Scenarios**:

1. **Given** le service de diffusion lancé et la liste des 5 variables, **When** le streamer ouvre le dashboard, **Then** il voit exactement 5 champs, chacun avec un contrôle adapté à son type (zone de texte, champ numérique, interrupteur, sélecteur de couleur, curseur borné), son libellé et la valeur courante.
2. **Given** le dashboard ouvert, **When** le streamer modifie un champ, **Then** la nouvelle valeur est diffusée sans action supplémentaire : à chaque frappe pour le texte, à chaque changement de valeur pour les autres types.
3. **Given** le dashboard ouvert, **When** le streamer clique sur « Alerte », **Then** un événement d'alerte est diffusé à tous les overlays connectés.
4. **Given** une variable modifiée par un autre dashboard ouvert en parallèle, **When** la modification est diffusée, **Then** le champ correspondant du dashboard affiche la nouvelle valeur.
5. **Given** le service de diffusion arrêté, **When** le streamer regarde le dashboard, **Then** un indicateur signale que la connexion est perdue, et il signale son rétablissement dès que le service revient.
6. **Given** une liste de variables où un élément a été ajouté, retiré ou renommé, **When** le dashboard est rechargé, **Then** les champs reflètent la nouvelle liste, sans modification du dashboard lui-même.

---

### User Story 2 - Diffuser deux overlays 2D synchronisés dans OBS (Priority: P1)

Le streamer ajoute deux overlays dans OBS sous forme de sources navigateur, en 1920×1080 avec un fond transparent.
- L'**overlay A** affiche le titre et le score.
- L'**overlay B** affiche un bandeau, visible ou masqué selon la variable « bandeau visible ».

Chaque modification faite dans le dashboard met à jour les deux overlays. L'alerte joue une animation bien visible, d'environ 2 secondes, dans chacun des deux.

**Why this priority**: c'est le cœur du produit (des overlays affichés en direct dans OBS) et le point où les frameworks diffèrent le plus en coût CPU et en latence.

**Independent Test**: ouvrir les deux overlays, avec ou sans OBS, et piloter les variables avec un client de test qui envoie des mises à jour et des alertes. Vérifier l'affichage, la synchronisation, l'animation et la reconnexion.

**Acceptance Scenarios**:

1. **Given** le service de diffusion lancé avec un état courant, **When** un overlay s'ouvre, **Then** il affiche immédiatement l'état courant, sans attendre une nouvelle modification.
2. **Given** les deux overlays ouverts, **When** le titre ou le score change, **Then** l'overlay A affiche la nouvelle valeur.
3. **Given** les deux overlays ouverts, **When** « bandeau visible » passe à vrai ou à faux, **Then** l'overlay B affiche ou masque le bandeau.
4. **Given** les deux overlays ouverts, **When** une alerte est déclenchée, **Then** chacun joue une animation visible qui dure entre 1,5 et 3 secondes, puis revient à son état normal.
5. **Given** une alerte en cours, **When** une nouvelle alerte arrive, **Then** l'animation redémarre depuis le début, sans se cumuler ni se bloquer.
6. **Given** un overlay ouvert, **When** le service de diffusion s'arrête puis redémarre, **Then** l'overlay se reconnecte seul dans les 5 secondes qui suivent le redémarrage et affiche l'état courant.
7. **Given** un overlay chargé dans OBS en 1920×1080, **When** aucune variable n'est affichée à un endroit, **Then** la vidéo reste visible au travers : aucun fond opaque ni barre de défilement.

---

### User Story 3 - Afficher un élément 3D piloté par les variables (Priority: P2)

Le streamer ajoute un troisième overlay, qui affiche un modèle 3D tournant en continu sur lui-même.
- La couleur du modèle suit la variable « couleur ».
- Sa vitesse de rotation suit la variable « vitesse ».
- L'alerte déclenche une animation 3D : un saut accompagné d'une rotation rapide, puis le retour à la rotation normale.

Si la 3D est indisponible (accélération matérielle désactivée dans OBS, par exemple), un repli 2D lisible s'affiche à la place, au lieu d'une page vide ou en erreur.

**Why this priority**: c'est une capacité différenciante, mais elle dépend des deux premières stories. Sur ce critère, l'écart entre frameworks porte surtout sur l'écosystème 3D.

**Independent Test**: ouvrir l'overlay 3D et le piloter avec le client de test (couleur, vitesse, alerte). Puis l'ouvrir dans un navigateur où la 3D est désactivée, pour vérifier le repli.

**Acceptance Scenarios**:

1. **Given** l'overlay 3D ouvert, **When** la page est chargée, **Then** le modèle est visible, centré, et tourne en continu à la vitesse courante.
2. **Given** l'overlay 3D ouvert, **When** la couleur change, **Then** le modèle prend la nouvelle couleur.
3. **Given** l'overlay 3D ouvert, **When** la vitesse change, **Then** la rotation accélère ou ralentit en conséquence. Une vitesse de 0 arrête la rotation.
4. **Given** l'overlay 3D ouvert, **When** une alerte est déclenchée, **Then** le modèle saute et tourne rapidement pendant 1,5 à 3 secondes, puis reprend sa rotation normale.
5. **Given** un navigateur sans 3D disponible, **When** l'overlay 3D est ouvert, **Then** un repli 2D s'affiche (une forme de la couleur courante et le libellé « 3D indisponible »), et il continue de suivre la variable couleur.
6. **Given** l'overlay 3D ouvert avec le paramètre de débogage, **When** la scène tourne, **Then** un compteur d'images par seconde est affiché et ses valeurs sont transmises au service de diffusion. Sans ce paramètre, aucun compteur n'est visible.

---

### Edge Cases

- **Service de diffusion absent au démarrage d'un overlay** : l'overlay reste transparent, retente la connexion au moins toutes les 2 secondes, puis affiche l'état courant dès qu'il est joint.
- **Rafale de modifications** (frappe rapide, curseur glissé) : chaque overlay finit par afficher la dernière valeur. Une valeur intermédiaire peut être sautée, mais jamais la dernière.
- **Titre vide** : l'overlay A n'affiche aucun texte pour le titre et ne casse pas sa mise en page.
- **Titre long** : jusqu'à 80 caractères, il reste lisible, sans déborder de la zone 1920×1080. Au-delà, le dashboard refuse la saisie.
- **Score hors bornes** : le dashboard limite la saisie à des entiers entre −999 999 et 999 999.
- **Vitesse** : bornée de 0 à 2 tours par seconde, par pas de 0,05.
- **Dashboard ouvert deux fois** : la dernière modification l'emporte, et les deux dashboards affichent la même valeur.
- **Modèle 3D qui ne se charge pas** : le repli 2D s'affiche, comme en cas d'absence de 3D.

## Requirements *(mandatory)*

### Functional Requirements

**Variables et état**

- **FR-001** : Le système DOIT décrire les variables du projet dans une liste unique et partagée. Chaque variable a un identifiant, un libellé, un type (texte, nombre, booléen, couleur, vitesse), une valeur par défaut et d'éventuelles bornes.
- **FR-002** : Le service de diffusion DOIT conserver la valeur courante de chaque variable pendant sa durée d'exécution, et l'envoyer à tout client qui se connecte.
- **FR-003** : Toute modification reçue DOIT être diffusée à tous les clients connectés : dashboards et overlays.

**Dashboard (US1)**

- **FR-010** : Le dashboard DOIT générer ses champs à partir de la liste des variables, sans champ codé en dur par variable.
- **FR-011** : Le dashboard DOIT proposer un contrôle adapté à chaque type et appliquer les bornes définies dans la liste.
- **FR-012** : Le dashboard DOIT diffuser chaque modification immédiatement, sans bouton de validation.
- **FR-013** : Le dashboard DOIT proposer un bouton « Alerte » qui diffuse un événement d'alerte ponctuel.
- **FR-014** : Le dashboard DOIT afficher l'état de connexion au service de diffusion (connecté ou déconnecté).

**Overlays 2D (US2)**

- **FR-020** : Chaque overlay DOIT être une page distincte, accessible à sa propre adresse locale, conçue pour 1920×1080 et avec un fond transparent.
- **FR-021** : L'overlay A DOIT afficher le titre et le score. L'overlay B DOIT afficher le bandeau quand « bandeau visible » est vrai, et le masquer sinon.
- **FR-022** : Les overlays DOIVENT afficher l'état courant dès leur connexion, puis chaque modification dès sa réception.
- **FR-023** : À chaque alerte, chaque overlay DOIT jouer une animation visible de 1,5 à 3 secondes, qui redémarre si une alerte arrive pendant qu'elle est en cours.
- **FR-024** : Les overlays DOIVENT se reconnecter automatiquement après une coupure du service de diffusion, et rétablir l'état courant.

**Overlay 3D (US3)**

- **FR-030** : L'overlay 3D DOIT afficher le modèle 3D fourni par l'outillage commun, en rotation continue.
- **FR-031** : La couleur du modèle DOIT suivre la variable « couleur », et sa vitesse de rotation la variable « vitesse ».
- **FR-032** : À chaque alerte, le modèle DOIT jouer une animation de saut et de rotation rapide de 1,5 à 3 secondes, qui redémarre si une alerte arrive pendant qu'elle est en cours.
- **FR-033** : Si la 3D est indisponible ou si le modèle ne se charge pas, l'overlay DOIT afficher un repli 2D qui suit la variable couleur et porte le libellé « 3D indisponible ».
- **FR-034** : Avec le paramètre de débogage, l'overlay 3D DOIT afficher un compteur d'images par seconde et en transmettre les valeurs au service de diffusion. Sans ce paramètre, rien ne DOIT être affiché.

**Contrat d'observation (exigences transverses de la constitution)**

Ce contrat est identique pour les trois implémentations. Il permet aux tests d'acceptation et aux mesures partagés de lire les pages de la même façon, quel que soit le framework.

- **FR-040** : Dans chaque overlay, chaque variable liée DOIT être portée par un élément marqué avec l'identifiant de la variable (`data-var`) et sa valeur courante sérialisée (`data-value`). C'est le cas même quand l'élément est masqué : bandeau à faux, ou variables 3D qui n'ont pas d'affichage textuel.
- **FR-041** : La sérialisation de `data-value` est fixée ainsi :
  - texte tel quel ;
  - nombre en notation décimale simple ;
  - booléen `true` ou `false` ;
  - couleur en `#rrggbb` minuscules ;
  - vitesse en notation décimale simple.
- **FR-042** : Pendant l'animation d'alerte, l'élément racine de chaque overlay DOIT porter `data-alert="on"`, puis `data-alert="off"` une fois revenu à l'état normal.
- **FR-043** : Chaque overlay DOIT notifier la sonde de latence partagée à chaque message de mise à jour reçu.
- **FR-044** : Chaque page (dashboard, overlay A, overlay B, overlay 3D) DOIT être une entrée de build distincte, afin que son poids puisse être mesuré séparément.

### Key Entities

- **Variable** : une donnée pilotable du live. Elle a un identifiant, un libellé, un type, une valeur par défaut et d'éventuelles bornes. Le spike en compte cinq :

  | Identifiant | Libellé | Type | Défaut | Bornes |
  | --- | --- | --- | --- | --- |
  | `titre` | Titre | texte | « Bienvenue sur le live » | 80 caractères max |
  | `score` | Score | nombre entier | 0 | −999 999 à 999 999 |
  | `bandeau` | Bandeau visible | booléen | vrai | — |
  | `couleur` | Couleur du modèle | couleur | `#4f8cff` | — |
  | `vitesse` | Vitesse de rotation | vitesse (tours/s) | 0,25 | 0 à 2, pas de 0,05 |

- **État courant** : l'ensemble des valeurs courantes des variables, détenu par le service de diffusion et transmis à chaque nouvelle connexion.
- **Alerte** : un événement ponctuel sans valeur. Chaque overlay le joue sous forme d'animation.
- **Overlay** : une page affichée dans OBS, qui affiche un sous-ensemble de variables et réagit aux alertes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Ces critères correspondent aux lignes de la grille de résultats du spike. Chaque valeur est relevée pour chacune des trois implémentations, puis convertie en note avec le barème figé (`results/bareme.md`).

**Fonctionnel**

- **SC-001** : 100 % des scénarios d'acceptation de cette spécification sont validés par les tests d'acceptation partagés, sur la version de production.
- **SC-002** : un streamer qui découvre le dashboard modifie les 5 variables et déclenche une alerte en moins de 1 minute, sans explication.

**Réactivité et fluidité**

- **SC-003** : une modification faite dans le dashboard est visible dans tous les overlays ouverts en moins de 100 ms dans 95 % des cas. La latence médiane et le 95e centile sont relevés.
- **SC-004** : pendant une série de 10 alertes, les overlays 2D s'animent sans saccade visible. La charge processeur supplémentaire d'OBS est relevée.
- **SC-005** : l'élément 3D tourne de façon fluide. Le nombre minimum d'images par seconde atteint au moins 80 % de la cadence d'OBS. La charge processeur et graphique supplémentaire est relevée sur 1 minute.

**Coût de chargement**

- **SC-006** : le poids transféré au chargement de l'overlay 2D le plus lourd et de l'overlay 3D est relevé (en Ko compressés).

**Coût de réalisation**

- **SC-007** : le temps total d'implémentation, le nombre de corrections manuelles du code généré, le nombre de passages des tests d'acceptation avant le vert et le volume de code source sont relevés.
- **SC-008** : le ressenti de l'équipe (sur 5) sur le dashboard, les overlays et la 3D est relevé.

## Assumptions

- Le service de diffusion, la liste des variables, le modèle 3D, la sonde de latence, les tests d'acceptation et les scripts de mesure sont fournis par l'outillage commun (`shared/`). Ils ne font pas partie de ce qui est implémenté trois fois.
- Tout tourne sur une seule machine : OBS, le service de diffusion, les overlays et le dashboard. Aucun accès réseau externe n'est requis.
- Un seul streamer utilise le système. Ni authentification ni gestion de droits ne sont nécessaires.
- L'état n'est pas persisté : au redémarrage du service, les variables reprennent leurs valeurs par défaut. Un overlay reconnecté affiche donc l'état du service, éventuellement réinitialisé.
- Le placement visuel des éléments dans les overlays est libre, tant que tout reste lisible en 1080p, à l'intérieur du cadre 1920×1080. Le style visuel n'est pas évalué.
- La 3D dans OBS suppose que l'accélération matérielle des sources navigateur est activée. Le repli 2D couvre le cas contraire.
- **Hors périmètre** : l'éditeur type Figma, la persistance, l'authentification, le multi-projets, l'import Figma et le MCP applicatif.
