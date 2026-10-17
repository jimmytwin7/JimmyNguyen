import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

/**
 * ESLint flat config.
 *
 * eslint-config-next v16 ships native flat-config entry points, so we spread
 * them directly instead of going through the legacy FlatCompat shim.
 */
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "src/lib/travel/photos.manifest.json",
      "public/**",
    ],
  },
  {
    /**
     * Accessibility: eslint-config-next already registers the jsx-a11y plugin
     * but only turns on a handful of rules as warnings. We opt into the
     * plugin's full `recommended` rule set here (the plugin is already
     * registered by Next, so we reference its rules rather than re-adding the
     * plugin, which flat config forbids) and promote the lot to errors so a
     * real a11y problem fails the build and the pre-commit hook.
     */
    rules: {
      ...jsxA11y.configs.recommended.rules,

      /**
       * Several components intentionally flip a boolean in a mount effect
       * (`setMounted(true)`, `setPortalReady(true)`) so that the server render
       * and the first client render produce identical markup. Anything that
       * touches `document` (React portals) or renders non-deterministic output
       * (the SVG map projection, entrance animations) has to wait until after
       * hydration, and this is the standard way to gate that.
       *
       * The rule flags it as a cascading render, which is technically true but
       * unavoidable here — the alternative is the hydration mismatches this
       * pattern exists to prevent. The extra render happens once, on mount.
       */
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
