import { MetadataRoute } from 'next';

const publicPages = [
  { url: '', priority: 1, freq: 'weekly' as const },
  { url: '/how-it-works', priority: 0.9, freq: 'monthly' as const },
  { url: '/patch-notes', priority: 0.7, freq: 'weekly' as const },
  { url: '/privacy', priority: 0.3, freq: 'yearly' as const },
  { url: '/terms', priority: 0.3, freq: 'yearly' as const },
  { url: '/cookies', priority: 0.3, freq: 'yearly' as const },
  { url: '/contact', priority: 0.5, freq: 'monthly' as const },
  { url: '/feature-requests', priority: 0.5, freq: 'monthly' as const },
  { url: '/bug-report', priority: 0.5, freq: 'monthly' as const },
  { url: '/login', priority: 0.8, freq: 'monthly' as const },
  { url: '/register', priority: 0.8, freq: 'monthly' as const },
  { url: '/leaderboard', priority: 0.8, freq: 'hourly' as const },
];

const campaignTabs = ['cond', 'loop', 'arr', 'ds', 'rec', 'gfx'];
const campaignLevels = Array.from({ length: 10 }, (_, i) => i + 1);

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.CLIENT_URL || 'https://logicarena.dev';
  const lastModified = process.env.SITEMAP_LAST_MODIFIED
    ? new Date(process.env.SITEMAP_LAST_MODIFIED)
    : new Date('2025-01-01T00:00:00.000Z');

  const staticPages = publicPages.map(({ url, priority, freq }) => ({
    url: `${baseUrl}${url}`,
    lastModified,
    changeFrequency: freq,
    priority,
  }));

  const campaignPages = campaignTabs.flatMap((tab) =>
    campaignLevels.map((level) => ({
      url: `${baseUrl}/campaign/${tab}/${level}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  );

  return [...staticPages, ...campaignPages];
}
