import { baseConfig } from './eslint.base.mjs';
import tseslint from 'typescript-eslint';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default tseslint.config(...nextVitals, ...nextTs, ...baseConfig, {
  ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
});
