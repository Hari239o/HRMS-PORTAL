export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hrms.geonixa.com';
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/dashboard', '/attendance', '/approvals', '/employees', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
