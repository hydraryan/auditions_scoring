module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:@typescript-eslint/recommended'],
  settings: { react: { version: 'detect' } },
  overrides: [
    {
      files: ['server/**/*.*'],
      env: { node: true },
    },
  ],
};
