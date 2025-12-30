import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VantaVerse Admin',
    short_name: 'VantaVerse',
    description: 'VantaVerse Admin Dashboard',
    start_url: '/',
    display: 'standalone',
    background_color: '#2454FF',
    theme_color: '#2454FF',
    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
