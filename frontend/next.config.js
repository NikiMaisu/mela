const withNextIntl = require('next-intl/plugin')('./i18n.ts');

const nextConfig = {
  output: 'standalone',
};

module.exports = withNextIntl(nextConfig);
