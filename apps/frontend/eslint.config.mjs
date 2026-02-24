import nextConfig from '@ingexpert/config/eslint/next';

// eslint-disable-next-line import/no-anonymous-default-export
export default [
  ...nextConfig,
  {
    ignores: ['src/components/ui/**', 'src-tauri/**'],
  },
];
