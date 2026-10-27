// Contrat d'intégration : specs/002-infra-commune/contracts/integration-apps.md
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const shared = fileURLToPath(new URL("../../shared", import.meta.url));
const page = (name: string) => fileURLToPath(new URL(`./${name}.html`, import.meta.url));

export default defineConfig({
  resolve: { alias: { "@shared": shared } },
  server: { fs: { allow: [".", shared] } },
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        dashboard: page("dashboard"),
        "overlay-a": page("overlay-a"),
        "overlay-b": page("overlay-b"),
        "overlay-3d": page("overlay-3d"),
      },
    },
  },
  preview: { port: 4170, strictPort: true },
});
