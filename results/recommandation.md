# Recommandation du spike React vs Vue vs Svelte

Spike du 2026-10-27 au 2026-10-29. Détail des mesures : [grille.md](grille.md). Barème : [bareme.md](bareme.md). Journaux : `journal-react.md`, `journal-vue.md`, `journal-svelte.md`.

## En bref

- **Les performances ne départagent pas les trois frameworks.** Dans OBS, la latence, les FPS et la charge 3D sont identiques, et les écarts de CPU restent sous 1 point de la machine.
- **Svelte est le plus léger et le plus rapide à écrire, mais ce gain ne se voit pas à l'usage** : les overlays sont chargés en local par OBS.
- **Recommandation : React.** À performances égales, c'est son écosystème qui fait la différence pour la suite du projet (éditeur, three.js, Spline).

## Ce que disent les mesures

| | React | Vue | Svelte | Lecture |
| --- | --- | --- | --- | --- |
| Tests d'acceptation (34) | 34/34, 2 passages | 34/34, 1 passage | 34/34, 1 passage | Les trois remplissent la spec |
| Corrections manuelles du code | 1 | 0 | 0 | |
| Temps, de la préparation au vert | 31 min | 36 min | 28 min | Écarts faibles |
| Lignes de code | 565 | 470 | 420 | Svelte est le plus concis |
| Overlay 2D (Ko gzip) | 61,7 | 30,6 | 18,6 | Quelques ms en local |
| Overlay 3D (Ko gzip) | 318 | 277 | 220 | Surtout three.js |
| CPU net, 10 alertes | 1,68 % | 1,10 % | 0,99 % | Tous sous 2 % |
| CPU net au repos | 0,12 % | 0,15 % | 0,09 % | Dans le bruit (témoin : −0,08 %) |
| CPU + GPU net, 3D | 9,5 % | 9,6 % | 9,5 % | Identique |
| FPS minimum de la 3D | 30/30 | 30/30 | 30/30 | Identique |
| Latence médiane / p95 | 26 / 55 ms | 26 / 56 ms | 27 / 55 ms | Comme sans framework (27 / 56 ms) |

## Notes du barème

Notes sur 5, pondérées selon le barème figé. L'écosystème éditeur et l'intégration desktop gardent leur note issue des recherches, car le spike ne les teste pas. Le ressenti personnel n'a pas été noté (décision du 2026-10-29) : les critères « 3D » et « Expérience de dev » sont calculés sur leurs seules sous-mesures objectives.

| Critère (poids) | React | Vue | Svelte |
| --- | --- | --- | --- |
| Écosystème éditeur (20 %), recherches | 5 | 3 | 3 |
| Performance des overlays (20 %) | 3,25 | 3,75 | 4,75 |
| Réactivité temps réel (20 %) | 5 | 5 | 5 |
| Intégration 3D (15 %) | 5 | 5 | 5 |
| Expérience de dev (10 %) | 4,5 | 4,5 | 5 |
| Outillage IA (10 %) | 4 | 5 | 5 |
| Intégration desktop (5 %), recherches | 5 | 5 | 5 |
| **Total pondéré** | **4,50** | **4,30** | **4,55** |
| Rappel : total issu des recherches seules | 3,9 | 3,65 | 4,25 |

Svelte et React finissent à égalité. L'avance de Svelte est fragile : elle tient surtout au poids de l'overlay 2D, sans effet visible dans OBS, et à un CPU d'alertes de 0,99 %, juste sous le seuil de 1 %. À 1,01 %, Svelte tomberait à 4,40.

## Recommandation

**Choisir React pour l'ensemble du produit.**

1. **Les performances sont un faux critère ici.** Les mesures dans OBS contredisent l'avantage que les recherches donnaient à Svelte (5 contre 3 en réactivité) : les trois frameworks sont aussi réactifs que des pages sans framework.
2. **L'écosystème est le vrai critère, et React y est devant.** Pour three.js, React Three Fiber et drei sont la référence. Pour Spline, React dispose d'un composant officiel (`@splinetool/react-spline`) ; en Vue et en Svelte, il faut utiliser le runtime générique `@splinetool/runtime`, ce qui reste possible. Pour l'éditeur, React propose le plus de briques mûres (canvas, glisser-déposer, éditeur de nœuds, composants UI).
3. **Le surcoût de React est faible.** Il demande un peu plus de code et pèse 3 fois plus lourd qu'avec Svelte, mais une page locale de 62 Ko ne pose aucun problème dans OBS.

**Option à garder en réserve :** séparer le runtime des overlays de l'éditeur. Il ne se justifie que si les overlays doivent un jour être servis à distance à grande échelle ; le témoin sans framework montre qu'un runtime de 3 Ko suffirait. Rien ne l'impose aujourd'hui.

**Ce qui remettrait ce choix en cause :** une bibliothèque indispensable à l'éditeur qui n'existerait pas en React.

## Limites

- **MCP Svelte** : Svelte a bénéficié du MCP officiel, mais pas React ni Vue. Ce biais était prévu.
- **Effet d'ordre** : React, implémenté en premier, a essuyé les ambiguïtés de la spec. Sa correction et sa 2e campagne E2E en découlent peut-être en partie.
- **Une seule machine, une seule mesure par scénario** : les résultats donnent des ordres de grandeur, ce ne sont pas des benchmarks.
- **Cadence d'OBS de 30 images/s** : elle arrondit la latence à l'image près et tasse les écarts, de la même façon pour les trois.
- **Rendu visuel dans OBS** : il n'a été vérifié à l'œil que pour Svelte. Pour React et Vue, seuls les tests automatiques le couvrent.
- **Éditeur hors périmètre** : le critère le plus discriminant n'a pas été testé.

## Prochaine étape

Lister les besoins de l'éditeur (canvas, timeline, liaison de données, Spline) et vérifier qu'une bibliothèque React existe pour chacun.
