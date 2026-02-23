import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // TODO REPLACE MIDDLEWARE WITH CLIENTSIDE AUTHPROVIDER
  reactCompiler: true,
  transpilePackages: ['@ingexpert/database'],
};

export default nextConfig;
