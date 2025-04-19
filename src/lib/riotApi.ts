import axios from 'axios';
import type { Player, Match } from '../types';

const RIOT_API_KEY = import.meta.env.RIOT_API_KEY;
const REGION = 'la1';  // Región LAS
const ROUTING = 'americas';  // Región de enrutamiento para Americas
const BASE_URL = `https://${REGION}.api.riotgames.com`;
const ROUTING_URL = `https://${ROUTING}.api.riotgames.com`;

// Función auxiliar para añadir el api_key a la URL
const addApiKey = (url: string) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}api_key=${RIOT_API_KEY}`;
};

export async function getSummonerByRiotId(gameName: string, tagLine: string) {
  try {
    // 1. Obtener PUUID usando riot-account-v1 (usa ROUTING_URL)
    const accountUrl = `${ROUTING_URL}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const accountResponse = await axios.get(addApiKey(accountUrl));

    if (!accountResponse.data.puuid) {
      throw new Error('No se encontró el PUUID del jugador');
    }

    // 2. Obtener datos del invocador usando el PUUID (usa BASE_URL con la región LA1)
    const summonerUrl = `${BASE_URL}/lol/summoner/v4/summoners/by-puuid/${accountResponse.data.puuid}`;
    const summonerResponse = await axios.get(addApiKey(summonerUrl));

    return {
      ...summonerResponse.data,
      puuid: accountResponse.data.puuid,
      gameName,
      tagLine
    };
  } catch (error: any) {
    console.error('Error fetching summoner:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

export async function getSummonerByName(summonerName: string) {
  try {
    const url = `${BASE_URL}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
    const response = await axios.get(addApiKey(url));
    return response.data;
  } catch (error) {
    console.error('Error fetching summoner:', error);
    throw error;
  }
}

export async function getPlayerRank(puuid: string) {
  try {
    const url = `${BASE_URL}/lol/league/v4/entries/by-puuid/${puuid}`;
    const response = await axios.get(addApiKey(url));
    
    // Filtrar solo las estadísticas de ranked solo/duo
    const soloQStats = response.data.find((queue: any) => queue.queueType === 'RANKED_SOLO_5x5');
    
    if (soloQStats) {
      return {
        tier: soloQStats.tier,
        rank: soloQStats.rank,
        leaguePoints: soloQStats.leaguePoints,
        wins: soloQStats.wins,
        losses: soloQStats.losses,
        winRate: Math.round((soloQStats.wins / (soloQStats.wins + soloQStats.losses)) * 100)
      };
    }
    
    // Si no tiene rango en solo/duo
    return {
      tier: 'UNRANKED',
      rank: '',
      leaguePoints: 0,
      wins: 0,
      losses: 0,
      winRate: 0
    };
  } catch (error) {
    console.error('Error fetching rank:', error);
    throw error;
  }
}

export async function getRecentMatches(puuid: string, count: number = 20) {
  try {
    // Para matches se usa ROUTING_URL (americas)
    const url = `${ROUTING_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`;
    const response = await axios.get(addApiKey(url));
    return response.data;
  } catch (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }
}

export async function getMatchDetails(matchId: string): Promise<Match> {
  try {
    // Para detalles de partidas se usa ROUTING_URL (americas)
    const url = `${ROUTING_URL}/lol/match/v5/matches/${matchId}`;
    const response = await axios.get(addApiKey(url));
    return transformMatchData(response.data);
  } catch (error) {
    console.error('Error fetching match details:', error);
    throw error;
  }
}

function transformMatchData(matchData: any): Match {
  return {
    id: matchData.metadata.matchId,
    gameId: matchData.info.gameId,
    timestamp: matchData.info.gameCreation,
    teamId: matchData.info.teams[0].teamId,
    result: matchData.info.teams[0].win ? 'WIN' : 'LOSS',
    duration: matchData.info.gameDuration,
    playerStats: matchData.info.participants.map((p: any) => ({
      summonerId: p.summonerId,
      champion: p.championName,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      cs: p.totalMinionsKilled,
      vision: p.visionScore,
      role: p.teamPosition
    }))
  };
}