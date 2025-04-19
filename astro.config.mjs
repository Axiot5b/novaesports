// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  output: 'server',
  adapter: cloudflare({
    runtime: {
      mode: 'advanced',
      persistTo: 'cf-pages',
      type: 'pages',
      bindings: {
        DB: {
          type: 'd1',
          id: 'f0c6cda1-883d-4bca-9e20-3f4571e77c36',
        }
      }
    }
  }),
  site: 'https://novaesports.uk'
});
