# Feature Specification: Outillage commun du spike

**Feature Branch**: `002-infra-commune`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "infra-commune : outillage commun du spike (dossier shared/), écrit une seule fois avant les trois implémentations. Protocole et variables, service de diffusion, sonde de latence, tests d'acceptation E2E, scripts de mesure, modèle 3D, protocole OBS, validés par une page témoin sans framework."

## Contexte

La spec fonctionnelle gelée (`specs/001-spec-spike/spec.md`, tag `spec-gelee`) est implémentée trois fois. La constitution (principe II) impose que tout ce qui ne dépend pas du framework soit écrit une seule fois, avant les implémentations, puis ne soit plus jamais modifié par elles : le transport, la sonde, les tests d'acceptation et les mesures.

Cette feature livre cet outillage. Elle sert deux publics :
- les **trois implémentations**, qui consomment le protocole, le service de diffusion, la sonde et le modèle 3D ;
- l'**équipe de mesure** (Lilian et l'agent IA), qui lance les tests d'acceptation et les scripts de mesure, puis remplit la grille.

Avant toute implémentation, l'outillage est éprouvé sur une **page témoin sans framework**. Elle permet de vérifier que les tests et les mesures fonctionnent, indépendamment de React, Vue ou Svelte.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Brancher une implémentation sur un socle commun (Priority: P1)

Un développeur (humain ou agent IA) qui implémente la spec dans un framework importe les définitions des variables, les types de messages, l'adresse du service de diffusion et la sonde de latence depuis `shared/`, sans rien recopier. Il lance le service de diffusion localement, puis ses pages s'y connectent.

**Why this priority**: sans socle commun, les trois implémentations divergeraient sur le transport, ce qui fausserait la comparaison.

**Independent Test**: lancer le service de diffusion, connecter un client de test, vérifier qu'il reçoit le message de bienvenue, puis qu'une mise à jour et une alerte envoyées par un deuxième client lui sont rediffusées.

**Acceptance Scenarios**:

1. **Given** le service lancé, **When** un client se connecte, **Then** il reçoit un message de bienvenue avec les définitions des 5 variables et leurs valeurs courantes.
2. **Given** deux clients connectés, **When** l'un envoie une mise à jour valide, **Then** les deux reçoivent la mise à jour, avec un numéro de séquence attribué par le service, et l'état courant est modifié.
3. **Given** deux clients connectés, **When** l'un envoie une alerte, **Then** les deux la reçoivent.
4. **Given** le service lancé avec une liste de variables alternative, **When** un client se connecte, **Then** le message de bienvenue contient cette liste alternative.
5. **Given** une mise à jour invalide (variable inconnue, type incorrect, valeur hors bornes), **When** le service la reçoit, **Then** il l'ignore sans la rediffuser, enregistre un avertissement et ne s'arrête pas.
6. **Given** les définitions, les types de messages et la sonde, **When** une app de chacun des trois frameworks et un script Node les importent, **Then** l'import fonctionne sans recopie ni étape de build propre à `shared/`.

---

### User Story 2 - Vérifier automatiquement une implémentation contre la spec gelée (Priority: P1)

L'équipe lance la suite de tests d'acceptation en indiquant l'adresse de l'implémentation à tester (le port de son build de production). La suite démarre et arrête elle-même le service de diffusion, joue tous les scénarios automatisables de la spec gelée, puis produit un rapport avec le nombre de scénarios réussis et échoués.

**Why this priority**: ces tests sont le contrat d'acceptation (constitution, principe II) et la source du critère SC-001. Sans eux, « terminé » n'a pas de définition objective.

**Independent Test**: lancer la suite contre la page témoin. Tout doit passer. Puis lancer la même suite contre une version volontairement cassée de la page témoin : les échecs attendus doivent apparaître.

**Acceptance Scenarios**:

1. **Given** une implémentation servie sur un port, **When** l'équipe lance la suite avec ce port, **Then** chaque scénario automatisable de la spec gelée est joué et le rapport le liste comme réussi ou échoué, sous son identifiant (par exemple US2-6).
2. **Given** la suite lancée, **When** un scénario exige de couper puis de relancer le service, ou de le relancer avec une liste alternative, **Then** la suite le fait elle-même, sans intervention manuelle.
3. **Given** la suite lancée, **When** les scénarios de l'overlay 3D sont joués, **Then** ils sont joués une fois avec la 3D disponible et une fois avec la 3D désactivée, ce qui vérifie le repli 2D.
4. **Given** la page témoin volontairement cassée (par exemple, l'overlay B ignore la variable `bandeau`), **When** la suite est lancée, **Then** au moins le scénario correspondant échoue.
5. **Given** une implémentation, **When** la suite se termine, **Then** le résultat (réussis, échoués, durée, date) est ajouté à la grille de mesures pour ce framework.

---

### User Story 3 - Mesurer chaque implémentation de façon reproductible (Priority: P1)

L'équipe mesure chaque implémentation avec les mêmes scripts : latence, poids des pages, charge processeur et graphique d'OBS, FPS et volume de code. Chaque script écrit son résultat au même endroit, identifié par le framework, ce qui permet de remplir la grille du spike sans recopie.

**Why this priority**: c'est le but même du spike. Des mesures faites différemment selon le framework seraient inexploitables.

**Independent Test**: lancer chaque script contre la page témoin (et contre OBS pour les mesures système), puis vérifier que la grille de mesures contient une entrée complète et plausible pour le témoin.

**Acceptance Scenarios**:

1. **Given** les overlays d'une implémentation ouverts et visibles, **When** l'équipe lance la mesure de latence, **Then** 200 mises à jour sont envoyées à 100 ms d'intervalle, et la médiane et le 95e centile sont calculés pour chaque overlay à partir des accusés de peinture.
2. **Given** une mesure de latence en cours, **When** un accusé manque pour une mise à jour (overlay masqué ou fermé), **Then** il est compté comme perdu et signalé. La mesure est déclarée invalide si plus de 2 % des accusés sont perdus.
3. **Given** le build de production d'une implémentation, **When** l'équipe lance la mesure de poids, **Then** chaque page obtient son poids compressé au chargement initial (entrée, imports statiques et styles), les chargements différés sont comptés à part, et le modèle 3D est exclu.
4. **Given** OBS ouvert, **When** l'équipe lance l'échantillonnage système pour une durée donnée, **Then** la charge processeur d'OBS et de ses processus de rendu navigateur (ramenée au nombre de cœurs) et la charge graphique sont relevées chaque seconde, puis résumées en moyenne et en maximum.
5. **Given** une mesure de référence faite sur une scène vide, **When** une mesure système est enregistrée pour un framework, **Then** sa valeur nette (référence déduite) est aussi calculée.
6. **Given** l'overlay 3D ouvert en mode débogage, **When** l'équipe lance la mesure des FPS pendant 1 minute, **Then** le minimum et la moyenne des FPS reçus par le service sont enregistrés.
7. **Given** le code d'une implémentation, **When** l'équipe lance le comptage, **Then** le nombre de lignes de code source est enregistré, hors commentaires et lignes vides.
8. **Given** le déclencheur d'alertes, **When** il est lancé, **Then** il envoie 10 alertes à intervalle fixe de 3 secondes, ce qui laisse chaque animation de 2 s se terminer avant la suivante.

---

### User Story 4 - Prouver l'outillage sur une page témoin sans framework (Priority: P1)

Avant toute implémentation, l'équipe sert la page témoin : un dashboard, deux overlays 2D et un overlay 3D minimal, écrits sans framework et conformes au contrat d'observation. Elle y fait tourner la suite d'acceptation et la mesure de latence. Si tout passe, l'outillage est déclaré prêt et le tag `base-commune` est posé.

**Why this priority**: c'est le garde-fou qui permet d'imputer un échec ultérieur à l'implémentation, et non aux tests.

**Independent Test**: servir la page témoin, lancer la suite et la mesure de latence, et vérifier le vert et des latences plausibles.

**Acceptance Scenarios**:

1. **Given** la page témoin servie, **When** la suite d'acceptation est lancée, **Then** 100 % des scénarios automatisables passent.
2. **Given** les overlays témoins visibles, **When** la mesure de latence est lancée, **Then** elle se termine avec moins de 2 % d'accusés perdus, et une médiane inférieure à 3 images.
3. **Given** l'overlay 3D témoin, **When** il est ouvert, **Then** il utilise un rendu graphique minimal sans librairie 3D. Il ne sert qu'à valider les tests (contrat d'observation, repli, compteur FPS), pas le rendu du modèle.
4. **Given** la page témoin, **When** ses poids et sa charge sont mesurés, **Then** ils sont enregistrés comme référence « sans framework ». Cette référence ne compte pas dans le barème, mais elle alimente la recommandation (piste du runtime d'overlay séparé).

---

### User Story 5 - Préparer les mesures manuelles dans OBS (Priority: P2)

Lilian suit un protocole écrit, étape par étape, pour configurer OBS (accélération matérielle, une scène par framework, sources navigateur en 1920×1080, arrêt des sources non visibles) et dérouler les mesures dans le bon ordre avec les scripts.

**Why this priority**: les mesures dans OBS dépendent d'une configuration manuelle. Sans protocole, elles ne seraient pas reproductibles d'un framework à l'autre.

**Independent Test**: dérouler le protocole sur la page témoin, du début à la fin, sans aide extérieure.

**Acceptance Scenarios**:

1. **Given** le protocole, **When** Lilian le suit, **Then** chaque étape indique quoi régler dans OBS, quel script lancer, pendant combien de temps et où le résultat est enregistré.
2. **Given** le protocole, **When** une mesure est faite, **Then** la cadence d'images d'OBS et l'état de l'accélération matérielle sont notés avec le résultat.

---

### Edge Cases

- **Port déjà occupé au lancement du service** : message d'erreur explicite, et arrêt avec un code d'échec.
- **Client qui se déconnecte brutalement** : le service continue de servir les autres clients.
- **Accusé reçu pour une séquence inconnue ou déjà reçue** : il est ignoré, sans fausser les statistiques.
- **Build sans manifeste** : la mesure de poids échoue avec un message qui indique le réglage manquant.
- **OBS non lancé** pendant l'échantillonnage système : le script échoue explicitement, sans écrire de valeur nulle.
- **Mesure relancée pour le même framework** : la nouvelle valeur est enregistrée avec son horodatage. L'historique est conservé et la grille utilise la dernière valeur valide.

## Requirements *(mandatory)*

### Functional Requirements

**Protocole et variables**

- **FR-001** : L'outillage DOIT fournir une définition unique des 5 variables de la spec gelée (identifiant, libellé, type, valeur par défaut, bornes), ainsi qu'une liste alternative pour le scénario US1-6 de la spec gelée.
- **FR-002** : L'outillage DOIT définir les messages échangés :
  - bienvenue (définitions et valeurs courantes) ;
  - mise à jour (identifiant, valeur, numéro de séquence attribué par le service) ;
  - alerte (numéro de séquence) ;
  - accusé de peinture (séquence, nom de l'overlay) ;
  - FPS (valeur, nom de l'overlay).
- **FR-003** : L'outillage DOIT fournir l'adresse du service, ainsi que les fonctions de sérialisation de `data-value` définies par FR-041 de la spec gelée. Les trois apps les importent pour ne pas diverger.
- **FR-004** : Tout ce que les apps importent DOIT être utilisable tel quel, aussi bien par l'outil de build des apps que par l'environnement d'exécution des scripts, sans étape de compilation propre à `shared/`.

**Service de diffusion**

- **FR-010** : Le service DOIT écouter sur le port local 8787, conserver l'état courant en mémoire, et envoyer le message de bienvenue à chaque connexion.
- **FR-011** : Le service DOIT valider chaque mise à jour selon la définition de la variable (type et bornes), attribuer un numéro de séquence et rediffuser à tous les clients. Les mises à jour invalides sont ignorées et journalisées.
- **FR-012** : Le service DOIT rediffuser les alertes à tous les clients.
- **FR-013** : Le service DOIT horodater chaque diffusion et chaque accusé reçu avec sa propre horloge, à la milliseconde près ou mieux. Il calcule la latence de chaque couple (séquence, overlay) et la rend disponible aux scripts de mesure.
- **FR-014** : Le service DOIT enregistrer les valeurs FPS reçues, par overlay, et les rendre disponibles aux scripts de mesure.
- **FR-015** : Le service DOIT pouvoir être lancé avec une liste de variables alternative, et être arrêté puis relancé par un script (tests de reconnexion).

**Sonde de latence**

- **FR-020** : La sonde DOIT pouvoir être appelée par un overlay à chaque message reçu. Pour une mise à jour, elle attend que l'élément `data-var` correspondant porte la `data-value` attendue, attend une image supplémentaire, puis envoie l'accusé de peinture.
- **FR-021** : La sonde DOIT abandonner une attente au bout de 2 secondes, sans envoyer d'accusé. C'est ce qui permet au script de mesure de compter un accusé comme perdu.
- **FR-022** : Le coût de la sonde DOIT être le même pour tous les overlays : même code, aucune variante par framework.

**Tests d'acceptation**

- **FR-030** : La suite DOIT couvrir chaque scénario d'acceptation de la spec gelée qui est observable automatiquement, et chaque cas limite testable. Elle référence chacun par son identifiant (US1-1 à US3-6). Les scénarios non automatisables (SC-002, rendu visuel fin de l'animation, transparence réelle dans OBS) sont listés comme « manuels » dans le rapport.
- **FR-031** : La suite DOIT être paramétrée par l'adresse de l'implémentation, et ne rien supposer du framework au-delà du contrat d'observation.
- **FR-032** : La suite DOIT démarrer, arrêter et relancer elle-même le service de diffusion.
- **FR-033** : La suite DOIT jouer les scénarios de l'overlay 3D avec la 3D disponible, puis désactivée.
- **FR-034** : La suite DOIT vérifier les durées d'animation par l'observation de `data-alert`, avec une tolérance de ±300 ms autour de 2 secondes.
- **FR-035** : La suite DOIT piloter et observer le dashboard uniquement par le contrat défini dans FR-045 de la spec gelée, ajouté par amendement :
  - les contrôles natifs sont repérés par `data-var` ;
  - le bouton d'alerte par `data-action="alerte"` ;
  - l'état de connexion par l'attribut `data-connection` de la racine.

**Mesures**

- **FR-040** : Chaque script de mesure DOIT enregistrer son résultat dans une grille de mesures unique, avec le framework (ou « témoin »), la mesure, la valeur, l'unité, l'horodatage et les conditions (cadence d'OBS, accélération matérielle) quand elles s'appliquent.
- **FR-041** : La mesure de latence DOIT envoyer 200 mises à jour à 100 ms d'intervalle, en alternant les variables affichées par les overlays 2D. Elle calcule la médiane, le 95e centile et le taux d'accusés perdus par overlay.
- **FR-042** : La mesure de poids DOIT additionner, pour chaque page, l'entrée, ses imports statiques (transitifs) et ses styles, en taille compressée. Les chargements différés sont comptés à part, et le modèle 3D est exclu.
- **FR-043** : L'échantillonnage système DOIT relever chaque seconde la charge processeur d'OBS et de ses processus de rendu navigateur (ramenée au nombre de cœurs logiques), ainsi que la charge graphique. Il calcule ensuite la moyenne, le maximum et la valeur nette de la référence.
- **FR-044** : Le déclencheur d'alertes DOIT envoyer 10 alertes à 3 secondes d'intervalle.
- **FR-045** : Le comptage DOIT relever les lignes de code source de chaque implémentation, hors commentaires et lignes vides.

**Ressources et documentation**

- **FR-050** : L'outillage DOIT fournir un modèle 3D libre de droits, de moins de 1 Mo, dont la couleur peut être modifiée. Sa licence et sa source sont notées à côté du fichier.
- **FR-051** : L'outillage DOIT fournir le protocole de mesure dans OBS (`results/protocole-obs.md`), couvrant la configuration, l'ordre des mesures, les durées et l'emplacement des résultats.
- **FR-052** : L'outillage DOIT fournir une page témoin sans framework (dashboard, overlay A, overlay B, overlay 3D minimal), conforme au contrat d'observation de la spec gelée.

### Key Entities

- **Définition de variable** : identifiant, libellé, type, valeur par défaut, bornes. Elle vient de la liste principale ou de la liste alternative.
- **Message** : bienvenue, mise à jour, alerte, accusé de peinture ou FPS. Les mises à jour et les alertes portent un numéro de séquence.
- **Échantillon de latence** : séquence, overlay, heure de diffusion, heure de l'accusé, latence.
- **Entrée de mesure** : framework (React, Vue, Svelte ou témoin), mesure, valeur, unité, horodatage, conditions. Une entrée correspond à une ligne de la grille du spike.
- **Rapport d'acceptation** : framework, scénarios réussis, échoués et manuels, durée, date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** : la page témoin passe 100 % des scénarios automatisables de la suite d'acceptation.
- **SC-002** : une version volontairement cassée de la page témoin fait échouer le scénario visé dans 100 % des cas testés (au moins 3 défauts injectés).
- **SC-003** : sur la page témoin, la mesure de latence se termine avec moins de 2 % d'accusés perdus et une médiane inférieure à 3 images.
- **SC-004** : 100 % des scénarios d'acceptation de la spec gelée sont soit couverts par la suite, soit explicitement listés comme manuels.
- **SC-005** : toutes les lignes de la grille de résultats du spike, sauf le ressenti et le temps passé, sont produites par un script, sans saisie manuelle de valeur.
- **SC-006** : la suite d'acceptation complète s'exécute en moins de 5 minutes par implémentation.
- **SC-007** : une personne qui découvre le protocole OBS déroule toutes les mesures du témoin en moins de 30 minutes.

## Assumptions

- Tout tourne sur la machine de Lilian (Windows 11, OBS installé). Les mesures système sont donc propres à Windows et à OBS.
- La suite d'acceptation teste le build de production servi par l'implémentation. Elle ne lance pas ce build : elle reçoit seulement son adresse.
- La désactivation de la 3D dans les tests se fait par une option du navigateur de test. Elle ne reproduit pas exactement le cas d'OBS sans accélération matérielle, qui est couvert par le protocole OBS.
- La page témoin n'entre pas dans le barème. Elle sert à valider l'outillage et de référence « sans framework ».
- Une fois le tag `base-commune` posé, `shared/` n'est plus modifié que par un amendement appliqué aux trois implémentations (constitution, principe II).
- **Hors périmètre** : toute UI de framework, ainsi que le dashboard et les overlays définitifs.
