-- Crear tabla de equipos
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    win_rate REAL DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    recent_wins INTEGER DEFAULT 0,
    recent_losses INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Crear tabla de jugadores
CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    summoner_name TEXT NOT NULL,
    role TEXT NOT NULL,
    team TEXT,
    rank TEXT NOT NULL,
    win_rate REAL DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    hours_per_week INTEGER DEFAULT 0,
    hours_per_month INTEGER DEFAULT 0,
    champion_pool TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(team) REFERENCES teams(id) ON DELETE CASCADE
);

-- Crear tabla de partidas
CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL UNIQUE,
    team_id TEXT,
    result TEXT NOT NULL,
    duration INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Crear tabla de estadísticas de jugadores en partidas
CREATE TABLE IF NOT EXISTS player_match_stats (
    id TEXT PRIMARY KEY,
    match_id TEXT,
    player_id TEXT,
    champion TEXT NOT NULL,
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    cs INTEGER DEFAULT 0,
    vision_score INTEGER DEFAULT 0,
    role TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(match_id, player_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_players_team ON players(team);
CREATE INDEX idx_matches_team_id ON matches(team_id);
CREATE INDEX idx_player_match_stats_match ON player_match_stats(match_id);
CREATE INDEX idx_player_match_stats_player ON player_match_stats(player_id);