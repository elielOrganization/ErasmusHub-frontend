import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import withSerwistInit from '@serwist/next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js', 
  disable: process.env.NODE_ENV !== "production", 
  register: true,
});

const nextConfig: NextConfig = {
  devIndicators: false,
  skipTrailingSlashRedirect: true,
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default withSerwist(withNextIntl(nextConfig));