module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    "jest",
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    "jest/no-disabled-tests": "warn",
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
    "jest/prefer-to-have-length": "warn",
    "jest/valid-expect": "error",
    'array-bracket-spacing':["error"],
    'space-in-parens':["error"],
    "@typescript-eslint/no-namespace": "off",
    "indent": ["error", 2, {
      "FunctionDeclaration": {"parameters": 2},
      "FunctionExpression": {"parameters": 2}
    }]
  }
};