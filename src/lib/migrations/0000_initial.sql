-- Migration: 0000_initial
-- Description: Configuración inicial de la base de datos

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    win_rate REAL DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    recent_wins INTEGER DEFAULT 0,
    recent_losses INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch('now')),
    updated_at INTEGER DEFAULT (unixepoch('now'))
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    summoner_name TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT')),
    team TEXT REFERENCES teams(id) ON DELETE CASCADE,
    rank TEXT NOT NULL,
    win_rate REAL DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    hours_per_week INTEGER DEFAULT 0,
    hours_per_month INTEGER DEFAULT 0,
    champion_pool TEXT DEFAULT '[]',
    created_at INTEGER DEFAULT (unixepoch('now')),
    updated_at INTEGER DEFAULT (unixepoch('now'))
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    game_id TEXT NOT NULL UNIQUE,
    team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
    result TEXT NOT NULL CHECK (result IN ('WIN', 'LOSS')),
    duration INTEGER NOT NULL,
    timestamp INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch('now'))
);

-- Player match stats table
CREATE TABLE IF NOT EXISTS player_match_stats (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
    player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
    champion TEXT NOT NULL,
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    cs INTEGER DEFAULT 0,
    vision_score INTEGER DEFAULT 0,
    role TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch('now')),
    UNIQUE(match_id, player_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team);
CREATE INDEX IF NOT EXISTS idx_matches_team_id ON matches(team_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_match ON player_match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_player ON player_match_stats(player_id);