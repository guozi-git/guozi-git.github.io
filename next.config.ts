import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: { unoptimized: true },
  // Keep deferred section styles out of the small home-page CSS group.
  experimental: { cssChunking: { type: 'graph', requestCost: 10000 } },
};

export default nextConfig;
