import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

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
    rules: {
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
