import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import "../globals.css"; // Ojo a la ruta, ahora que bajaste un nivel puede que sea '../globals.css' o '@/app/globals.css'

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ErasmusHub",
  description: "La plataforma para estudiantes Erasmus",
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
        {/* El proveedor oficial de next-intl */}
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}