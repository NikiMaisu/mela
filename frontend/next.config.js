const withNextIntl = require('next-intl/plugin')('./i18n.ts');

const nextConfig = {
  output: 'standalone',
  async rewrites() {
    if (!process.env.BACKEND_ORIGIN) return [];
    return [
      { source: '/api/:path*', destination: `${process.env.BACKEND_ORIGIN}/:path*` },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
