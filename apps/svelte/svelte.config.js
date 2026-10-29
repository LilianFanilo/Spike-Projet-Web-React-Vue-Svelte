/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
export default {
  compilerOptions: {
    // Runes imposées au code du projet (constitution) ; les dépendances gardent leur propre mode.
    runes: ({ filename }) => (filename.split(/[/\\]/).includes("node_modules") ? undefined : true),
  },
};
