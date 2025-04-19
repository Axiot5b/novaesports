import {
  getSummonerByName,
  getPlayerRank,
  getRecentMatches,
  getMatchDetails
} from './riotApi';
import type { Player, Match } from '../types';

// Función de utilidad para esperar entre peticiones
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function updatePlayerStats(player: Player) {
  try {
    // Esperar 2 segundos entre cada jugador para evitar rate limits
    await delay(2000);
    
    // Obtener estadísticas de rango usando el PUUID
    const rankData = await getPlayerRank(player.puuid!);
    await delay(1000); // Esperar entre peticiones
    
    const matches = await getRecentMatches(player.puuid!, 20);
    await delay(1000); // Esperar entre peticiones
    
    // Procesar las partidas en serie en lugar de en paralelo
    const matchDetails = [];
    for (const matchId of matches) {
      await delay(1000); // Esperar entre cada petición de detalles
      const details = await getMatchDetails(matchId);
      matchDetails.push(details);
    }

    // Actualizar en la base de datos con las estadísticas de ranked
    await env.DB.prepare(`
      UPDATE players
      SET 
        rank = ?,
        win_rate = ?,
        games_played = ?,
        updated_at = DATETIME('now')
      WHERE id = ?
    `).bind(
      `${rankData.tier} ${rankData.rank}`.trim(),
      rankData.winRate,
      rankData.wins + rankData.losses,
      player.id
    ).run();

    // Insertar datos de partidas
    for (const match of matchDetails) {
      const playerStats = match.playerStats.find(p => p.summonerId === player.puuid);
      if (!playerStats) continue;

      await env.DB.prepare(`
        INSERT INTO matches (game_id, team_id, result, duration, timestamp)
        VALUES (?, ?, ?, ?, datetime(?))
        ON CONFLICT (game_id) DO NOTHING
      `).bind(
        match.gameId,
        player.team,
        match.result,
        match.duration,
        new Date(match.timestamp).toISOString()
      ).run();

      const result = await env.DB.prepare(
        'SELECT id FROM matches WHERE game_id = ?'
      ).bind(match.gameId).first<{ id: string }>();

      if (result) {
        await env.DB.prepare(`
          INSERT INTO player_match_stats (
            match_id, player_id, champion, kills, deaths,
            assists, cs, vision_score, role
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (match_id, player_id) DO NOTHING
        `).bind(
          result.id,
          player.id,
          playerStats.champion,
          playerStats.kills,
          playerStats.deaths,
          playerStats.assists,
          playerStats.cs,
          playerStats.vision,
          playerStats.role
        ).run();
      }
    }
  } catch (error) {
    console.error(`Error actualizando estadísticas para ${player.summoner_name}:`, error);
    throw error;
  }
}

export async function updateAllStats() {
  const { results: players } = await env.DB.prepare(
    'SELECT * FROM players WHERE puuid IS NOT NULL'
  ).all<Player>();
  
  for (const player of players) {
    try {
      await updatePlayerStats(player);
      console.log(`Actualizado: ${player.summoner_name}`);
      // Esperar entre actualizaciones de jugadores
      await delay(2000);
    } catch (error) {
      console.error(`Error actualizando ${player.summoner_name}:`, error);
    }
  }

  // Actualizar estadísticas de equipos - Corregir la consulta SQL
  await env.DB.prepare(`
    UPDATE teams
    SET
      win_rate = (
        SELECT COALESCE(AVG(CASE WHEN result = 'WIN' THEN 100 ELSE 0 END), 0)
        FROM matches
        WHERE team_id = teams.id
        AND datetime(timestamp) > datetime('now', '-30 days')
      ),
      total_games = (
        SELECT COUNT(*)
        FROM matches
        WHERE team_id = teams.id
      ),
      recent_wins = (
        SELECT COUNT(*)
        FROM matches
        WHERE team_id = teams.id
        AND result = 'WIN'
        AND datetime(timestamp) > datetime('now', '-7 days')
      ),
      recent_losses = (
        SELECT COUNT(*)
        FROM matches
        WHERE team_id = teams.id
        AND result = 'LOSS'
        AND datetime(timestamp) > datetime('now', '-7 days')
      ),
      updated_at = datetime('now')
  `).run();
}

export async function updateExistingPlayers() {
  try {
    // Obtener todos los jugadores que no tienen PUUID
    const { results: players } = await env.DB.prepare(
      'SELECT * FROM players WHERE puuid IS NULL'
    ).all();

    console.log(`Encontrados ${players.length} jugadores para actualizar`);

    for (const player of players) {
      try {
        // Extraer el nombre y tag del summoner_name (formato: nombre#tag)
        const [gameName, tagLine] = player.summoner_name.split('#');
        
        if (!gameName || !tagLine) {
          console.error(`Formato inválido de summoner_name para ${player.summoner_name}`);
          continue;
        }

        // Obtener datos del invocador
        const summonerData = await getSummonerByRiotId(gameName, tagLine);
        
        if (summonerData) {
          // Obtener estadísticas de rango
          const rankData = await getPlayerRank(summonerData.puuid);

          // Actualizar el jugador con su PUUID y estadísticas
          await env.DB.prepare(`
            UPDATE players
            SET 
              puuid = ?,
              rank = ?,
              win_rate = ?,
              games_played = ?
            WHERE id = ?
          `).bind(
            summonerData.puuid,
            `${rankData.tier} ${rankData.rank}`.trim(),
            rankData.winRate,
            rankData.wins + rankData.losses,
            player.id
          ).run();

          console.log(`✅ Actualizado: ${player.summoner_name}`);
        }
      } catch (error) {
        console.error(`Error actualizando ${player.summoner_name}:`, error);
      }
    }

    console.log('Actualización completada');
  } catch (error) {
    console.error('Error en la actualización masiva:', error);
    throw error;
  }
}

export async function updatePlayerByPuuid(puuid: string) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM players WHERE puuid = ?'
    ).bind(puuid).all<Player>();

    if (!results || results.length === 0) {
      throw new Error('Jugador no encontrado');
    }

    const player = results[0];
    await updatePlayerStats(player);
    
    return true;
  } catch (error) {
    console.error(`Error actualizando jugador con PUUID ${puuid}:`, error);
    throw error;
  }
}