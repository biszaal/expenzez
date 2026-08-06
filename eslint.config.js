// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // The service/constants layer is reached from AuthContext, which
    // initialises at app root before native modules are ready. A *value*
    // import of a UI package here gets eagerly evaluated in release bundles
    // (development resolves lazily, so it looks fine locally) and crashes the
    // app on launch — exactly what shipped in 1.9.0. Type-only imports are
    // erased at compile time and stay allowed.
    files: ['services/**/*.ts', 'constants/**/*.ts', 'utils/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@expo/vector-icons',
              message:
                'Use `import type` here. A value import drags expo-font into the app-root module graph and crashes release builds on launch.',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
]);
