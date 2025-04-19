-- Migration: 0002_add_puuid
-- Description: Agregar campo puuid a la tabla players

-- Agregar columna puuid
ALTER TABLE players ADD COLUMN puuid TEXT;
CREATE INDEX idx_players_puuid ON players(puuid);