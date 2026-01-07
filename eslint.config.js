import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

const ignoredFiles = [
  'dist',
  'src/LegacyApp.jsx',
  'src/AIChatAssistant.jsx',
  'src/AIAssistant.jsx',
  'src/MobileApp.jsx',
  'src/DeviceSelection.jsx',
  'src/Tutorial.jsx',
  'src/Login.jsx',
  'src/Signup.jsx',
  'src/CustomAuthContext.jsx',
  'src/useTypingSounds.js',
  'src/WorkspaceTemplates.jsx',
];

export default defineConfig([
  globalIgnores(ignoredFiles),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
