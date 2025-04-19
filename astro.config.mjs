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
      mode: 'local',
      type: 'pages',
      bindings: {
        DB: {
          type: 'd1',
          databaseId: 'f0c6cda1-883d-4bca-9e20-3f4571e77c36',
        }
      }
    },
    routes: {
      strategy: 'include',
      patterns: ['/*']
    },
    assets: {
      upload: true,
      pathPrefix: '_astro'
    }
  }),
  vite: {
    build: {
      assetsDir: '_astro',
      rollupOptions: {
        output: {
          assetFileNames: '_astro/[name].[hash][extname]'
        }
      }
    }
  },
  site: 'https://novaesports.uk'
});
