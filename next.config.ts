import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    authInterrupts: true,
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  headers: async () => {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  rewrites: async () => [
    {
      source: '/sign-in',
      destination: '/auth/sign-in',
    },
  ],
};

export default nextConfig;
