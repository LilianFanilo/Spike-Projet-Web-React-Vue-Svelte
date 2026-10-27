# Contrat : protocole et modules partagés

Ce contrat est **gelé au tag `base-commune`** (constitution, principe II). Les trois apps l'importent via l'alias `@shared`.

## Messages (JSON sur WebSocket, `ws://127.0.0.1:8787`)

```jsonc
// client → service, dès l'ouverture de la connexion
{ "type": "hello", "role": "overlay", "name": "overlay-a" }
// role : "dashboard" | "overlay" | "bench" | "test" ; name obligatoire si role = "overlay"

// service → client, en réponse au hello
{ "type": "welcome", "vars": [ /* VariableDef[] */ ], "values": { "titre": "Bienvenue sur le live", "score": 0 } }

// client → service
{ "type": "set", "id": "score", "value": 42 }
{ "type": "alert" }

// service → tous les clients (y compris l'émetteur)
{ "type": "update", "seq": 17, "id": "score", "value": 42 }
{ "type": "alert", "seq": 18 }

// overlay → service
{ "type": "ack", "seq": 17, "overlay": "overlay-a" }
{ "type": "fps", "overlay": "overlay-3d", "value": 30 }
```

Règles :
- Un `set` invalide (variable inconnue, type incorrect, valeur hors bornes) est ignoré, sans diffusion. Un avertissement est écrit sur la sortie d'erreur et le compteur `rejected` augmente.
- Un message mal formé (JSON invalide, `type` inconnu) est ignoré et compté de la même façon. La connexion n'est pas fermée.
- Les noms d'overlay valides sont `overlay-a`, `overlay-b` et `overlay-3d`.

## `shared/protocol.ts` — exports

| Export | Rôle |
| --- | --- |
| `SERVICE_PORT = 8787`, `SERVICE_HOST = "127.0.0.1"`, `WS_URL`, `HTTP_URL` | Adresse du service |
| `type VariableDef`, `type VarType`, `type VarValue`, `type Values` | Voir le data-model |
| `type ClientMessage`, `type ServerMessage` | Unions discriminées sur `type` |
| `type OverlayName = "overlay-a" \| "overlay-b" \| "overlay-3d"` | — |
| `validate(def, value): boolean` | Règles de validation du data-model |
| `normalize(def, value): VarValue` | Couleur en minuscules, nombres arrondis au pas |
| `serialize(type, value): string` | Valeur à placer dans `data-value` (FR-041 de la spec gelée) |
| `ALERT_DURATION_MS = 2000` | Durée de l'animation d'alerte |

## `shared/client.ts` — `connect(options)`

```ts
connect({
  role: "dashboard" | "overlay",
  name?: OverlayName,            // obligatoire pour un overlay : active la sonde de latence et le compteur FPS
  reconnect?: boolean,           // true par défaut ; nouvelle tentative toutes les 1000 ms
  onWelcome(vars, values): void,
  onUpdate(id, value, seq): void,
  onAlert(seq): void,
  onStatus(connected: boolean): void,
}): {
  set(id, value): void,          // envoie un `set` ; sans effet si le client est déconnecté
  alert(): void,
  close(): void,
}
```

Garanties :
- `onWelcome` est rappelé à **chaque** (re)connexion, ce qui permet de rétablir l'état (FR-024 de la spec gelée).
- Pour un overlay, la sonde est appelée **après** `onUpdate`, dans la même tâche. Le code de l'app n'a rien à faire de plus.
- Si `name` est fourni et que l'URL contient `debug=1`, le compteur FPS (`shared/fps.ts`) démarre.

## `shared/probe.ts` — `createProbe(overlay, send)`

`probe.track(seq, def, value)` : ne fait rien si aucun `[data-var="<id>"]` n'existe. Sinon, la sonde vérifie l'élément à chaque `requestAnimationFrame`, attend une image supplémentaire une fois la valeur égale à `serialize(def.type, value)`, puis envoie `ack`. Elle abandonne au bout de 2000 ms.

## `shared/fps.ts` — `startFps(overlay, send)`

Il compte les `requestAnimationFrame` par seconde, affiche un élément `<div data-fps>` en haut à gauche et envoie `fps` chaque seconde. Il est appelé uniquement par `client.ts`, quand l'URL contient `debug=1`.
