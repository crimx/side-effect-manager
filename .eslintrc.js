/** @type {import("eslint").Linter.Config */
const config = {
  root: true,
  env: {
    browser: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  rules: {
    "@typescript-eslint/consistent-type-imports": ["warn"],
    "@typescript-eslint/no-empty-interface": "off",
  },
};

// eslint-disable-next-line no-undef
module.exports = config;
