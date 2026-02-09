import { baseConfig } from '@rikal/config/eslint/base';
import tseslint from 'typescript-eslint';

export default tseslint.config(...baseConfig, {
  ignores: ['generated/**'],
});
