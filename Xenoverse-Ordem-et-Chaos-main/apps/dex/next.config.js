/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow serving static assets from repo
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Keep Vercel serverless functions small: the diagnostics route references
    // repo-level paths (../../out, Graphics) for local dev only — exclude them
    // from output file tracing so they are not bundled into deployed functions.
    outputFileTracingExcludes: {
      '*': [
        '../../out/**',
        '../../Graphics/**',
        '../../Audio/**',
        '../../Data/**',
        'public/Graphics/**',
        'public/Audio/**',
      ],
    },
  },
  // Ignore TypeScript/ESLint errors during build for rapid development
  typescript: {
    ignoreBuildErrors: true,
  },

};

module.exports = nextConfig;
