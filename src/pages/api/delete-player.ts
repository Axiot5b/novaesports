import type { APIRoute } from 'astro';
import type { D1Database } from '@cloudflare/workers-types';

declare global {
  var env: {
    DB: D1Database;
  };
}

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Se requiere el ID del jugador' }),
        { status: 400 }
      );
    }

    // Usar el objeto env global
    await env.DB.prepare('DELETE FROM players WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error al eliminar jugador:', error);
    return new Response(
      JSON.stringify({ error: 'Error al eliminar el jugador' }),
      { status: 500 }
    );
  }
};