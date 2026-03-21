import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Proxy API calls to OCF Express server in dev
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:18800/api/:path*' },
    ];
  },
};

export default nextConfig;
