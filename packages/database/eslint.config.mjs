import { baseConfig } from '@ingexpert/config/eslint/base';
import tseslint from 'typescript-eslint';

export default tseslint.config(...baseConfig, {
  ignores: ['generated/**', 'supabase/functions/**'],
});
