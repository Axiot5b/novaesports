export interface Player {
  id: string;
  summoner_name: string;
  role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
  team: string;
  rank: string;
  win_rate: number;
  games_played: number;
  hours_per_week: number;
  hours_per_month: number;
  champion_pool: string[];
  puuid?: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  winRate: number;
  totalGames: number;
  recentMatches: {
    wins: number;
    losses: number;
  };
}

export interface Match {
  id: string;
  gameId: string;
  timestamp: number;
  teamId: string;
  result: 'WIN' | 'LOSS';
  duration: number;
  playerStats: PlayerMatchStats[];
}

export interface PlayerMatchStats {
  summonerId: string;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  vision: number;
  role: string;
}