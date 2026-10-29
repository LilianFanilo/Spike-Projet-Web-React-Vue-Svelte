// Contrat d'intégration : specs/002-infra-commune/contracts/integration-apps.md
// React Compiler par la voie Babel (specs/003-spike-react/research.md, R1).
import { fileURLToPath } from "node:url";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const shared = fileURLToPath(new URL("../../shared", import.meta.url));
const page = (name: string) => fileURLToPath(new URL(`./${name}.html`, import.meta.url));

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
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
  preview: { port: 4173, strictPort: true },
});
