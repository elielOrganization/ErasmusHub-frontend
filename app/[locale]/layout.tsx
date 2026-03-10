import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { AuthProvider } from '@/context/AuthContext'; // <--- IMPORTANTE: Importa tu AuthProvider
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ErasmusHub",
  description: "La plataforma para estudiantes Erasmus",
  applicationName: "ErasmusHub",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ErasmusHub",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  // En Next.js 15, params es asíncrono
  const { locale } = await params;

  // Validar que el idioma existe
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Cargar los diccionarios del servidor
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {/* Envolvemos los children con el AuthProvider. 
              Ahora TODA la aplicación tiene acceso al usuario logueado 
          */}
          <AuthProvider>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}