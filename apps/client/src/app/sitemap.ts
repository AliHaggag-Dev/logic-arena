import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.CLIENT_URL || 'https://logicarena.dev';
  const lastModified = process.env.SITEMAP_LAST_MODIFIED
    ? new Date(process.env.SITEMAP_LAST_MODIFIED)
    : new Date('2024-01-01T00:00:00.000Z');

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
