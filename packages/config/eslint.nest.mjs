import { baseConfig } from './eslint.base.mjs';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(...baseConfig, {
  languageOptions: {
    globals: {
      ...globals.jest,
    },
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
});
