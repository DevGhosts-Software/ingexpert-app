import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  reactCompiler: true,
  transpilePackages: ['@ingexpert/database'],
};

export default nextConfig;
