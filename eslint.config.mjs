import pluginJs from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

const baseConfig = {
  ...pluginJs.configs.recommended,
  plugins: { import: importPlugin },
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node,
      ...globals.jest,
    },
  },
  ignores: ['coverage/**', 'node_modules/**'],
  rules: {
    'import/named': 'off',
    'import/prefer-default-export': 'off',
    'import/order': ['error', {
      alphabetize: { order: 'asc', caseInsensitive: true },
      'newlines-between': 'always',
    }],
    indent: ['error', 2],
    'object-curly-newline': ['error', { multiline: true, minProperties: 6 }],
    'no-trailing-spaces': 'error',
    'spaced-comment': ['error', 'always'],
    'no-multi-spaces': 'error',
    semi: ['error', 'always'],
    'comma-spacing': ['error', { before: false, after: true }],
    'eol-last': ['error', 'always'],
    'padded-blocks': ['error', 'never'],
    quotes: ['error', 'single'],
    'no-multiple-empty-lines': ['error', { max: 1 }],
  },
};
const fileSpecificConfig = {
  files: ['src/formatters/plain.js', 'src/formatters/stylish.js', 'src/parsers.js'],
  rules: { indent: 'off' },
};

const eslintConfig = [
  baseConfig,
  fileSpecificConfig,
];

export default eslintConfig;
