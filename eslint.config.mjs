import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".vercel/**",
      "coverage/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  ...nextVitals,
  ...nextTypeScript,
  prettier,
  {
    rules: {
      "no-console": ["warn", { allow: ["log", "warn", "error"] }],
    },
  },
];

export default eslintConfig;
