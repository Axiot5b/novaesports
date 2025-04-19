import type { D1Database } from '@cloudflare/workers-types';
import type { Player, Team } from '../types';

// La instancia de D1 se inyecta automáticamente en el contexto de la aplicación
declare global {
  interface Env {
    DB: D1Database;
  }
}

export async function getTeams(): Promise<Team[]> {
  const { results: teams } = await env.DB.prepare(
    'SELECT id, name, win_rate as winRate, total_games as totalGames FROM teams'
  ).all<Team>();

  // Obtener estadísticas actualizadas para cada equipo
  const teamsWithStats = await Promise.all(
    teams.map(async (team) => {
      const { results: players } = await env.DB.prepare(
        'SELECT * FROM players WHERE team = ?'
      ).bind(team.id).all<Player>();

      const totalGames = players.reduce((sum, player) => sum + player.games_played, 0);
      const totalWins = players.reduce((sum, player) => {
        const winRate = player.win_rate / 100;
        return sum + Math.round(player.games_played * winRate);
      }, 0);
      const totalLosses = totalGames - totalWins;
      const teamWinRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

      // Actualizar las estadísticas en la base de datos
      await env.DB.prepare(`
        UPDATE teams
        SET win_rate = ?,
            total_games = ?,
            recent_wins = ?,
            recent_losses = ?,
            updated_at = DATETIME('now')
        WHERE id = ?
      `).bind(
        teamWinRate,
        totalGames,
        totalWins,
        totalLosses,
        team.id
      ).run();

      return {
        ...team,
        winRate: Math.round(teamWinRate * 10) / 10,
        totalGames,
        players,
        recentMatches: {
          wins: totalWins,
          losses: totalLosses
        }
      };
    })
  );

  return teamsWithStats;
}

export async function getTeamById(id: string): Promise<Team | null> {
  const result = await env.DB.prepare(`
    SELECT 
      id,
      name,
      win_rate as winRate,
      total_games as totalGames,
      recent_wins,
      recent_losses
    FROM teams WHERE id = ?
  `).bind(id).first<{
    id: string;
    name: string;
    winRate: number;
    totalGames: number;
    recent_wins: number;
    recent_losses: number;
  }>();
  
  if (!result) return null;

  // Obtener todos los jugadores del equipo
  const { results: players } = await env.DB.prepare(`
    SELECT * FROM players WHERE team = ?
  `).bind(id).all<Player>();

  // Calcular estadísticas basadas en los jugadores
  const totalGames = players.reduce((sum, player) => sum + player.games_played, 0);
  const totalWins = players.reduce((sum, player) => {
    const winRate = player.win_rate / 100; // Convertir porcentaje a decimal
    return sum + Math.round(player.games_played * winRate);
  }, 0);
  const totalLosses = totalGames - totalWins;
  const teamWinRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

  // Actualizar las estadísticas del equipo en la base de datos
  await env.DB.prepare(`
    UPDATE teams
    SET win_rate = ?,
        total_games = ?,
        recent_wins = ?,
        recent_losses = ?,
        updated_at = DATETIME('now')
    WHERE id = ?
  `).bind(
    teamWinRate,
    totalGames,
    totalWins,
    totalLosses,
    id
  ).run();

  return {
    id: result.id,
    name: result.name,
    winRate: Math.round(teamWinRate * 10) / 10, // Redondear a 1 decimal
    totalGames: totalGames,
    players: players,
    recentMatches: {
      wins: totalWins,
      losses: totalLosses
    }
  };
}

export async function getPlayersByTeamId(teamId: string): Promise<Player[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM players WHERE team = ?'
  ).bind(teamId).all<Player>();
  return results;
}

export async function createPlayer(player: Omit<Player, 'id'>): Promise<Player> {
  const result = await env.DB.prepare(`
    INSERT INTO players (
      summoner_name, role, team, rank,
      win_rate, games_played, hours_per_week,
      hours_per_month, champion_pool
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(
    player.summonerName,
    player.role,
    player.team,
    player.rank,
    player.winRate,
    player.gamesPlayed,
    player.hoursPerWeek,
    player.hoursPerMonth,
    JSON.stringify(player.championPool)
  ).first<Player>();

  return result!;
}

export async function updatePlayerStats(
  playerId: string,
  stats: Partial<Player>
): Promise<Player> {
  const setClause = Object.keys(stats)
    .filter(key => key !== 'id')
    .map(key => `${key} = ?`)
    .join(', ');

  const values = Object.entries(stats)
    .filter(([key]) => key !== 'id')
    .map(([_, value]) => typeof value === 'object' ? JSON.stringify(value) : value);

  const result = await env.DB.prepare(`
    UPDATE players
    SET ${setClause}
    WHERE id = ?
    RETURNING *
  `).bind(...values, playerId).first<Player>();

  return result!;
}