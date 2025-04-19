import type { APIRoute } from 'astro';
import { updatePlayerByPuuid } from '../../lib/updateStats';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const puuid = data.puuid;

    if (!puuid) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Se requiere el PUUID del jugador' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    console.log(`Actualizando jugador con PUUID: ${puuid}`);
    await updatePlayerByPuuid(puuid);
    console.log('Actualización completada exitosamente');
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.error('Error al actualizar jugador:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Error al actualizar jugador: ${error.message}` 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};