import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Astroが自動生成するファイルとビルド成果物を除外
  { ignores: ['.astro/**', 'dist/**'] },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  eslintConfigPrettier
);
