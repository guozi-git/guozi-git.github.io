import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier/flat';

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    ...nextPlugin.configs['core-web-vitals'],
  },
  prettier,
  globalIgnores([
    'src/lib/.generated/**',
    'trash/**',
    '.next/**',
    '.preview/**',
    'out/**',
    'coverage/**',
    'next-env.d.ts',
  ]),
]);
