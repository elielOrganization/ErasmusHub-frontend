import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// Le decimos dónde está nuestra configuración
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  /* tus configuraciones previas si tenías alguna */
  devIndicators: false
};

export default withNextIntl(nextConfig);