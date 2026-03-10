import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import withSerwistInit from '@serwist/next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js', 
  disable: false, 
  register: true,
});

const nextConfig: NextConfig = {
  devIndicators: false,
};

export default withSerwist(withNextIntl(nextConfig));