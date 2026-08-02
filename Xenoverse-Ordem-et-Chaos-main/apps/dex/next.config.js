/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow serving static assets from repo
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Ignore TypeScript/ESLint errors during build for rapid development
  typescript: {
    ignoreBuildErrors: true,
  },

};

module.exports = nextConfig;
