import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['es', 'en', 'cs'],
  defaultLocale: 'en'
});

// Re-export next-intl's navigation helpers so they automatically preserve the locale in the URL
export const {Link, redirect, usePathname, useRouter} = createNavigation(routing);