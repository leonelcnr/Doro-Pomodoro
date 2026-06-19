import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Código que NO se mantiene a mano y por eso queda fuera del lint:
  //  - 'dist': salida del build.
  //  - '.agents': plantillas de skills instaladas, no son código de la app.
  //  - 'src/components/ui' y 'src/components/animate-ui': UI generada (shadcn/ui y animate-ui).
  //  - 'src/hooks/use-is-in-view.tsx': helper de animate-ui.
  //  - blocks de shadcn generados con la CLI (dashboard-01).
  globalIgnores([
    'dist',
    '.agents',
    'src/components/ui',
    'src/components/animate-ui',
    'src/hooks/use-is-in-view.tsx',
    'src/components/app-sidebar.tsx',
    'src/components/data-table.tsx',
    'src/components/nav-main.tsx',
    'src/components/nav-secondary.tsx',
    'src/components/site-header.tsx',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
