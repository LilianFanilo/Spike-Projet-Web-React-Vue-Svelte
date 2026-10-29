// Contrat d'intégration : specs/002-infra-commune/contracts/integration-apps.md
import { fileURLToPath } from "node:url";
import templateCompilerOptions from "@tresjs/core/template-compiler-options";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const shared = fileURLToPath(new URL("../../shared", import.meta.url));
const page = (name: string) => fileURLToPath(new URL(`./${name}.html`, import.meta.url));

export default defineConfig({
  // Les balises Tres* sont des éléments du moteur de rendu TresJS, pas des composants Vue.
  plugins: [vue({ template: { compilerOptions: templateCompilerOptions.template.compilerOptions } })],
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
  preview: { port: 4174, strictPort: true },
});
