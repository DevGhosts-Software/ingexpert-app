import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  reactCompiler: true,
  transpilePackages: ['@ingexpert/database'],
  trailingSlash: true,
};

export default nextConfig;
