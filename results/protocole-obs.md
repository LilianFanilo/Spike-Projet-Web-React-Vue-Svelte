# Protocole de mesure dans OBS

Ce protocole fixe les réglages d'OBS, l'ordre des mesures et la commande à lancer à chaque étape. Les mesures ne sont comparables d'un framework à l'autre que si elles suivent exactement ce protocole (constitution, principe V).

Toutes les commandes se lancent depuis `shared/`, dans un terminal PowerShell. Les résultats s'écrivent dans `results/mesures.json`, et `npm run grille` met à jour `results/grille.md`.

## 0. Avant la session

- [ ] Noter la **version d'OBS** (Aide > À propos) : `________`
- [ ] Fermer tous les onglets de navigateur qui affichent un overlay. Sinon, ils envoient eux aussi des accusés, ce qui fausse la latence.
- [ ] Fermer les applications gourmandes (jeux, IDE en compilation, navigateur avec vidéo).
- [ ] Brancher le PC portable sur secteur et choisir le même mode d'alimentation pour toutes les sessions.
- [ ] Lancer le service : `npm run serveur` (laisser ce terminal ouvert).
- [ ] Lancer la preview de l'app à mesurer : `cd apps/<fw>; npm run build; npm run preview`.

| App | Port | Base des URL |
| --- | --- | --- |
| Témoin | 4170 | `http://localhost:4170/` |
| React | 4173 | `http://localhost:4173/` |
| Vue | 4174 | `http://localhost:4174/` |
| Svelte | 4175 | `http://localhost:4175/` |

## Repères dans OBS (première utilisation)

- Au premier lancement, OBS propose un **assistant de configuration automatique** : clique sur **Annuler**.
- Au centre de la fenêtre se trouve l'**aperçu** (le rectangle noir), c'est-à-dire ce qui serait diffusé.
- En bas se trouvent plusieurs panneaux. Ceux qui servent ici sont **Scènes** (à gauche), **Sources** (à côté) et **Commandes** (à droite, avec le bouton **Paramètres**, aussi accessible par **Fichier > Paramètres**).
- **Rendre une scène active** : clic sur son nom dans le panneau **Scènes**. L'aperçu l'affiche aussitôt.
- **Ajouter une page web à une scène** :
  1. sélectionner la scène ;
  2. dans le panneau **Sources**, cliquer sur **+**, choisir **Navigateur**, puis **Créer une nouvelle source** ;
  3. donner un nom, puis **OK**. La fenêtre des propriétés s'ouvre (réglages en section 2), **Fichier local** doit rester décoché.

## 1. Réglages d'OBS (une seule fois, à garder identiques ensuite)

1. **Paramètres > Avancé > Sources** (« Avancé » est en bas de la liste de gauche) : cocher **« Activer l'accélération matérielle des sources navigateur »**, cliquer sur **Appliquer** puis **OK**, et **fermer puis rouvrir OBS**.
2. **Paramètres > Vidéo** :
   - résolution de base et de sortie : 1920×1080 ;
   - **valeurs FPS communes** : noter la valeur (`30` ou `60`) : `____`. Elle sert de `-ObsFps` / `--obs-fps` à toutes les commandes.
3. Ne pas lancer d'enregistrement ni de diffusion pendant les mesures. On mesure le rendu des sources, pas l'encodage.

## 2. Scènes

Créer ces scènes une seule fois. Pour chaque **source navigateur** :
- **Largeur** 1920 et **Hauteur** 1080 ;
- **FPS personnalisé** décoché ;
- CSS personnalisé laissé à la valeur par défaut ;
- **« Arrêter la source lorsqu'elle n'est pas visible »** coché. C'est indispensable : sans cette case, les sources des autres scènes continuent de consommer du CPU ;
- **« Actualiser le navigateur lorsque la scène devient active »** coché.

| Scène | Sources (URL relatives à la base de l'app) |
| --- | --- |
| `Référence` | Aucune source (scène vide) |
| `<fw> 2D` | `overlay-a.html` et `overlay-b.html` |
| `<fw> 3D` | `overlay-3d.html` |
| `<fw> FPS` | `overlay-3d.html?debug=1` |

Pour changer de framework, il suffit de modifier le port dans les URL des trois scènes (double-clic sur la source pour rouvrir ses propriétés), ou de dupliquer les scènes.

**Contrôle avant de mesurer** : clique sur chaque scène, l'aperçu doit afficher :

| Scène | Ce qu'on doit voir |
| --- | --- |
| `<fw> 2D` | Le titre et le score en haut à gauche, le bandeau rouge « EN DIRECT » en bas |
| `<fw> 3D` | La scène 3D (témoin : un simple voile bleu semi-transparent) |
| `<fw> FPS` | La même scène, avec un compteur « xx fps » en haut à gauche |

Pour vérifier la liaison, ouvrir `dashboard.html` dans un navigateur et modifier le titre : il doit changer dans OBS. **Refermer ensuite cet onglet.**

**L'agent sait quelle scène est active** : `GET http://127.0.0.1:8787/health` liste les overlays connectés. Une scène cachée n'en a aucun, grâce à « Arrêter la source lorsqu'elle n'est pas visible ».

## 3. Déroulé des mesures

Pour toutes les commandes : `-ObsFps` et `--obs-fps` = la valeur notée en 1.2. `-Acceleration on` (ou `off` si tu mesures volontairement sans accélération).

### 3.1 Référence (une fois par session, avant les frameworks)

Activer la scène **`Référence`**, attendre 10 s, puis lancer :

```powershell
powershell -File bench/cpu.ps1 -Framework reference -Scenario reference -Duration 60 -ObsFps 30 -Acceleration on
```

Résultat : `cpu-reference` et `gpu-reference`. Ces valeurs servent à calculer les valeurs nettes de tous les frameworks.

### 3.2 Pour chaque framework (`react`, `vue`, `svelte`, ou `temoin` pour la répétition)

| # | Scène active | Commande | Durée | Résultat |
| --- | --- | --- | --- | --- |
| a | `<fw> 2D` (attendre 10 s) | `powershell -File bench/cpu.ps1 -Framework <fw> -Scenario repos -Duration 60 -ObsFps 30` | 1 min | `cpu-repos`, `gpu-repos` |
| b | `<fw> 2D` | Terminal 1 : `npm run alertes`. **Aussitôt**, terminal 2 : `powershell -File bench/cpu.ps1 -Framework <fw> -Scenario alertes -Duration 30 -ObsFps 30` | 30 s | `cpu-alertes`, `gpu-alertes` |
| c | `<fw> 2D` | `npm run latence -- --framework <fw> --obs-fps 30` | ~25 s | `latence-mediane`, `latence-p95` (doit afficher « valide ») |
| d | `<fw> 3D` (attendre 10 s) | `powershell -File bench/cpu.ps1 -Framework <fw> -Scenario 3d -Duration 60 -ObsFps 30` | 1 min | `cpu-3d`, `gpu-3d` |
| e | `<fw> FPS` (attendre 10 s) | `npm run fps -- --framework <fw> --duration 60 --obs-fps 30` | 1 min | `fps-min`, `fps-moyen` |

Remarques :
- Pendant la mesure (b), regarder l'aperçu d'OBS : les deux overlays doivent s'animer 10 fois.
- Si (c) affiche « INVALIDE », c'est qu'un overlay n'était pas visible, ou qu'un onglet de navigateur était ouvert. Corriger, puis relancer : l'ancienne entrée reste dans l'historique, mais elle est ignorée.
- Pour (d), seule la source 3D doit être visible (scène `<fw> 3D`). Le compteur FPS n'y est **pas** affiché, car il a lui-même un coût.

### 3.3 Fin de session

```powershell
npm run grille
```

Relire `results/grille.md` : les lignes CPU doivent afficher une valeur nette, `net`.

## 4. Vérifications visuelles (scénarios manuels)

Les tests automatiques ne peuvent pas juger ces points. À cocher dans l'aperçu d'OBS, pour chaque framework :

- [ ] US2-7 : la vidéo est visible au travers des overlays (aucun fond opaque).
- [ ] US2-4 : à l'alerte, les éléments grossissent (×1,15) et flashent pendant environ 2 s.
- [ ] US3-1 : le modèle tourne en continu.
- [ ] US3-2 : la couleur choisie dans le dashboard s'applique au modèle.
- [ ] US3-3 : la vitesse 0 arrête la rotation, et la vitesse 2 l'accélère nettement.
- [ ] US3-4 : à l'alerte, le modèle saute et fait 2 tours en environ 2 s.

## 5. Ressenti (à saisir à la main dans `results/journal-<fw>.md`)

Note sur 5, avec une phrase de justification, pour : le **dashboard**, les **overlays 2D** et la **3D**.

## 6. Conditions à reporter

À chaque session, ajouter une ligne dans le journal du framework :

| Date | Version d'OBS | FPS d'OBS | Accélération matérielle | Alimentation | Remarques |
| --- | --- | --- | --- | --- | --- |
