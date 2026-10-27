# Contrat : service de diffusion

## Lancement

```text
node shared/server/index.ts [--vars <chemin.json>] [--port <n>]
```

| Option | Défaut | Effet |
| --- | --- | --- |
| `--vars` | `shared/variables.json` | Liste de variables chargée (validée au démarrage) |
| `--port` | `8787` | Port d'écoute, sur `127.0.0.1` |

Comportement :
- Une fois prêt, le service écrit `PRET <port>` sur la sortie standard. C'est ce que les tests attendent avant de commencer.
- Si le port est occupé, il écrit un message d'erreur explicite sur la sortie d'erreur et s'arrête avec le code 1.
- Si la liste de variables est invalide (une valeur par défaut hors règles, par exemple), il écrit le détail et s'arrête avec le code 1.
- Sur `SIGINT` ou `SIGTERM`, il ferme les connexions et s'arrête avec le code 0.

## HTTP (même port)

| Méthode et chemin | Réponse |
| --- | --- |
| `GET /health` | `{ "ok": true, "seq": 42, "clients": [{ "role": "overlay", "name": "overlay-a" }] }` |
| `GET /stats` | `{ "latency": [{ "seq", "id", "overlay", "ms" }], "fps": [{ "overlay", "value", "at" }], "sent": [{ "seq", "id", "at" }], "rejected": 0 }` |
| `POST /stats/reset` | `204`. Vide `latency`, `fps`, `sent` et `rejected`, mais conserve l'état et `seq`. |

Toute autre route répond `404`. Il n'y a ni CORS ni authentification : le service n'écoute qu'en local.
