import { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

const staticPages = [
  {
    url: `${APP_URL}/`,
    lastModified: new Date().toISOString(),
    priority: 1,
  },
];

/**
 * Sitemap
 * @returns {Promise<MetadataRoute.Sitemap>}
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // TODO: Add dynamic pages here
  return [
    ...staticPages,
    // TODO: Add dynamic pages here
  ];
}
