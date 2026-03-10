import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import withSerwistInit from '@serwist/next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const revision = crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  additionalPrecacheEntries: [{ url: '/en/offline', revision }],
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  devIndicators: false,
};

export default withSerwist(withNextIntl(nextConfig));