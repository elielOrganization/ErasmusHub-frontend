import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['es', 'en', 'cs'], // Tus idiomas
  defaultLocale: 'en'          // El idioma por defecto
});

// Exportamos nuestras propias versiones de Link y useRouter para que mantengan el idioma en la URL
export const {Link, redirect, usePathname, useRouter} = createNavigation(routing);