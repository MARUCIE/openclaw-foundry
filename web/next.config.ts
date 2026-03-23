import type { NextConfig } from 'next';

const API_BASE = process.env.OCF_API_URL || 'http://localhost:18800';

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // Proxy API calls to OCF Express server (dev only, ignored in static export)
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_BASE}/api/:path*` },
    ];
  },
};

export default nextConfig;
