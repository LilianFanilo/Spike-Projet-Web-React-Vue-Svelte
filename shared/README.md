# shared/ : outillage commun du spike

Ce dossier contient tout ce qui ne dépend pas du framework. Il a été écrit une seule fois et il est **figé au tag `base-commune`** (constitution, principe II) : une implémentation ne le modifie jamais.

- **Brancher une app** : importer `connect` depuis `@shared/client.ts`, puis respecter [contracts/integration-apps.md](../specs/002-infra-commune/contracts/integration-apps.md) (Vite, entrées, contrat DOM, ports).
- **Protocole et modules** : [contracts/protocole.md](../specs/002-infra-commune/contracts/protocole.md). Le service : [contracts/service.md](../specs/002-infra-commune/contracts/service.md).
- **Service** : `npm run serveur` (port 8787).
- **Suite d'acceptation** : `$env:APP_URL="http://localhost:4173"; $env:FRAMEWORK="react"; npm run e2e`. **Toujours fournir `FRAMEWORK`** : chaque campagne est enregistrée, et l'historique compte les passages avant le vert.
- **Mesures** : [contracts/commandes.md](../specs/002-infra-commune/contracts/commandes.md) et [results/protocole-obs.md](../results/protocole-obs.md).
- **Validation de l'outillage** sur la page témoin (`apps/temoin`) : [quickstart.md](../specs/002-infra-commune/quickstart.md).
- **Modèle 3D** : `assets/model.glb` (Suzanne, CC0), généré par `assets/build-model.ts`, voir `assets/LICENSE-model.md`.
