import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const iconLibMessage =
  'Use @phosphor-icons/react instead (FRONTEND-STANDARD §3.11).'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'lucide-react', message: iconLibMessage }],
        patterns: [{ group: ['react-icons', 'react-icons/*'], message: iconLibMessage }],
      }],
    },
  },
  {
    // Temporary escape hatch: shadcn primitives still import lucide-react until
    // slice 3 re-themes them. react-icons stays banned everywhere.
    files: ['src/components/ui/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['react-icons', 'react-icons/*'], message: iconLibMessage }],
      }],
    },
  },
])
