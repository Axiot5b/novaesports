import type { D1Database } from '@cloudflare/workers-types';
import { defineMiddleware } from 'astro:middleware';

declare global {
  var env: {
    DB: D1Database;
  };
}

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    // Verificar si tenemos acceso a la base de datos
    const db = context.locals.runtime?.env?.DB;
    if (!db) {
      console.error('Database binding not available');
      throw new Error('Database binding not found');
    }

    if (!globalThis.env) {
      globalThis.env = {
        DB: db,
      };
    }
    
    // Verificar la conexión a la base de datos
    await db.prepare('SELECT 1').first();
    
    return await next();
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Si es un error de base de datos, redirigir a una página de error
    return new Response('Error de conexión a la base de datos. Por favor, intenta más tarde.', {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }
});