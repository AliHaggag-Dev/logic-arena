import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.CLIENT_URL || 'https://logicarena.dev';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard', '/arena', '/settings'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
