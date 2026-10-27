# Barème de conversion des mesures en notes

Ce barème fixe à l'avance comment chaque mesure du spike devient une note sur 5. Il est figé avant la première mesure d'un framework : on ne l'ajuste pas après avoir vu les résultats.

**Historique**
- v1 (2026-10-27) : validé par Lilian.
- v2 (2026-10-27) : recalage validé par Lilian **avant toute mesure d'un framework**, à partir des seules mesures du témoin dans OBS.
  - **Latence** : les seuils en images supposaient un plancher d'environ 1,5 image, alors que le témoin mesure 0,81 image. Les seuils sont désormais relatifs au témoin.
  - **Charge 3D** : le témoin seul coûte déjà 12,5 %, ce qui aurait tassé les trois frameworks. Les seuils sont désormais relatifs au meilleur des trois.

  Les autres seuils sont inchangés.

## Règles générales

- Une note de critère est la moyenne de ses sous-notes, arrondie au 0,25 le plus proche.
- **Seuils absolus** quand une valeur cible existe (poids, CPU, FPS). **Seuils relatifs au meilleur des trois** quand seule la comparaison a un sens (lignes de code, temps).
- Si un framework ne valide pas 100 % des tests d'acceptation E2E, chaque critère touché par le test en échec est plafonné à 2.
- **Écosystème éditeur (20 %)** et **Intégration desktop (5 %)** ne sont pas re-notés : le spike ne les teste pas, ils gardent leur note issue des recherches.
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
La latence est notée **par rapport au témoin sans framework**, mesuré dans les mêmes conditions (OBS, même cadence). Le ratio mesure donc le surcoût du framework.

| Sous-mesure | Poids | 5 | 4 | 3 | 2 | 1 |
| --- | --- | --- | --- | --- | --- | --- |
| Latence médiane ÷ médiane du témoin | 1/2 | ≤ 1,25 | ≤ 1,5 | ≤ 2 | ≤ 3 | > 3 |
| Latence p95 ÷ p95 du témoin | 1/2 | ≤ 1,25 | ≤ 1,5 | ≤ 2 | ≤ 3 | > 3 |

Référence témoin (OBS à 30 i/s, 2026-10-27) : médiane 27,05 ms, p95 55,69 ms. Si la cadence d'OBS change, le témoin est remesuré dans la même session que les frameworks.

## Intégration 3D (15 %)

| Sous-mesure | Poids | 5 | 4 | 3 | 2 | 1 |
| --- | --- | --- | --- | --- | --- | --- |
| FPS minimum ÷ plafond OBS | 1/3 | ≥ 0,95 | ≥ 0,90 | ≥ 0,80 | ≥ 0,60 | < 0,60 |
| CPU + GPU net de l'overlay 3D sur 1 min (%) | 1/3 | Le meilleur des trois obtient 5, puis on retire 1 point par tranche de +25 % au-delà du meilleur (minimum 1) |
| Ressenti 3D (ta note /5) | 1/3 | note reprise telle quelle |

La charge 3D est relative au meilleur des trois frameworks, et non au témoin : la 3D témoin n'a ni modèle ni Three.js, elle n'est donc pas comparable. À titre indicatif, elle coûte 12,5 % (CPU 0,96 + GPU 11,55).

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
