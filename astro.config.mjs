// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://teritamas.github.io',
  base: '/portal',
  vite: {
    plugins: [tailwindcss()],
  },
});
