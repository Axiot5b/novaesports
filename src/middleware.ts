import type { D1Database } from '@cloudflare/workers-types';
import { defineMiddleware } from 'astro:middleware';

declare global {
  var env: {
    DB: D1Database;
  };
}

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    if (!context.locals.runtime?.env?.DB) {
      throw new Error('Database binding not found');
    }

    if (!globalThis.env) {
      globalThis.env = {
        DB: context.locals.runtime.env.DB,
      };
    }
    
    return await next();
  } catch (error) {
    console.error('Middleware error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});