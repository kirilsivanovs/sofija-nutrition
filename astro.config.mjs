// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://sofijaivanova.lv',
  output: 'static',
  compressHTML: true,
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Geologica',
      cssVariable: '--font-sans',
      weights: [300, 400, 600],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext', 'cyrillic'],
    },
  ],
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin') && !page.includes('/cabinet'),
      i18n: {
        defaultLocale: 'lv',
        locales: {
          lv: 'lv',
          ru: 'ru',
          en: 'en',
        },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:7071',
          changeOrigin: true,
        },
      },
    },
  },
});
