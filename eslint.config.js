// ESLint 9 (flat config). Installation : npm i -D eslint typescript-eslint eslint-plugin-vue eslint-plugin-vuejs-accessibility
// « essential » = seulement les vraies erreurs (pas de bruit de mise en forme) ; vuejs-accessibility = règles RGAA/WCAG sur les templates.
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import a11y from "eslint-plugin-vuejs-accessibility";

export default [
  {
    ignores: [
      ".nuxt/**", ".output/**", ".vercel/**", "node_modules/**", "coverage/**", "playwright-report/**", "test-results/**",
      "assets/loop/**",   // boucle 3D : JS/CSS compilés à la main, hors périmètre du lint
      "public/**", "content/**", "Claude outputs/**", "models-src/**",
    ],
  },
  ...tseslint.configs.recommended,
  ...vue.configs["flat/essential"],
  ...a11y.configs["flat/recommended"],
  { files: ["**/*.vue"], languageOptions: { parserOptions: { parser: tseslint.parser } } },
  {
    rules: {
      "vue/multi-word-component-names": "off",   // pages Nuxt (index.vue, about.vue…)
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
