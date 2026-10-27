# Barème de conversion des mesures en notes (proposition, à valider avant de mesurer)

Ce barème fixe à l'avance comment chaque mesure du spike devient une note sur 5. Il est figé avant la première mesure : on ne l'ajuste pas après avoir vu les résultats.

## Règles générales

- Une note de critère est la moyenne de ses sous-notes, arrondie au 0,25 le plus proche.
- **Seuils absolus** quand une valeur cible existe (poids, CPU, FPS). **Seuils relatifs au meilleur des trois** quand seule la comparaison a un sens (lignes de code, temps).
- Si un framework ne valide pas 100 % des tests d'acceptation E2E, chaque critère touché par le test en échec est plafonné à 2.
- **Écosystème éditeur (20 %)** et **Intégration desktop (5 %)** ne sont pas re-notés : le spike ne les teste pas, ils gardent leur note issue des recherches.
- `F` désigne la durée d'une image dans OBS (33,3 ms à 30 i/s, 16,7 ms à 60 i/s), relevée au moment des mesures.
- « CPU net » désigne le CPU d'OBS et de ses processus `obs-browser-page`, moins la référence mesurée sur une scène vide, en % du CPU total de la machine.

## Performance des overlays (20 %)

| Sous-mesure | Poids dans le critère | 5 | 4 | 3 | 2 | 1 |
| --- | --- | --- | --- | --- | --- | --- |
| Poids de l'overlay 2D (Ko gzip, entrée + imports statiques) | 1/3 | ≤ 10 | ≤ 25 | ≤ 50 | ≤ 100 | > 100 |
| CPU net pendant les 10 alertes (%) | 2/3 | ≤ 1 | ≤ 2,5 | ≤ 5 | ≤ 10 | > 10 |

Le CPU pèse le double du poids : c'est le vrai coût pour le streamer.

## Réactivité temps réel (20 %)

| Sous-mesure | Poids | 5 | 4 | 3 | 2 | 1 |
| --- | --- | --- | --- | --- | --- | --- |
| Latence médiane serveur → overlay peint | 1/2 | ≤ 1,75 F | ≤ 2,25 F | ≤ 3 F | ≤ 4 F | > 4 F |
| Latence p95 | 1/2 | ≤ 2,25 F | ≤ 3 F | ≤ 4 F | ≤ 6 F | > 6 F |

Plancher théorique de la sonde : elle attend le prochain `requestAnimationFrame` (0,5 F en moyenne), puis une image de plus pour que la mise à jour soit peinte. Une médiane d'environ 1,5 F correspond donc à une mise à jour appliquée dès l'image suivante. Les seuils 5/4 sont calés sur ce plancher.

## Intégration 3D (15 %)

| Sous-mesure | Poids | 5 | 4 | 3 | 2 | 1 |
| --- | --- | --- | --- | --- | --- | --- |
| FPS minimum ÷ plafond OBS | 1/3 | ≥ 0,95 | ≥ 0,90 | ≥ 0,80 | ≥ 0,60 | < 0,60 |
| CPU + GPU net de l'overlay 3D sur 1 min (%) | 1/3 | ≤ 5 | ≤ 10 | ≤ 15 | ≤ 25 | > 25 |
| Ressenti 3D (ta note /5) | 1/3 | note reprise telle quelle |

Le poids de l'overlay 3D est relevé mais n'est pas noté, car Three.js domine la taille. Il apparaît dans la recommandation.

## Expérience de dev (10 %)

| Sous-mesure | Poids | Règle |
| --- | --- | --- |
| Lignes de code (`cloc` sur `src/`) | 1/3 | Le meilleur des trois obtient 5, puis on retire 1 point par tranche de +25 % au-delà du meilleur (minimum 1) |
| Temps total d'implémentation | 1/3 | Même règle |
| Ressenti dashboard + overlays (moyenne de tes notes /5) | 1/3 | Note reprise telle quelle |

## Outillage IA (10 %)

| Sous-mesure | Poids | 5 | 4 | 3 | 2 | 1 |
| --- | --- | --- | --- | --- | --- | --- |
| Corrections manuelles du code généré | 1/2 | 0 | 1–2 | 3–5 | 6–10 | > 10 |
| Passages E2E avant le vert | 1/2 | 1 | 2 | 3 | 4–5 | > 5 |

## Rappel des poids (à valider)

| Critère | Poids | Re-noté par le spike ? |
| --- | --- | --- |
| Écosystème éditeur | 20 % | Non |
| Performance des overlays | 20 % | Oui |
| Réactivité temps réel | 20 % | Oui |
| Intégration 3D | 15 % | Oui |
| Expérience de dev | 10 % | Oui |
| Outillage IA | 10 % | Oui |
| Intégration desktop | 5 % | Non |
