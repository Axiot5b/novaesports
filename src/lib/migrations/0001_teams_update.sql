-- Migration: 0001_teams_update
-- Description: Agregar nuevos equipos de Nova Esports

-- Insertar los nuevos equipos usando INSERT OR IGNORE
INSERT OR IGNORE INTO teams (id, name, win_rate, total_games, recent_wins, recent_losses) VALUES
('vanguards', 'Nova Vanguards', 0, 0, 0, 0),
('sector', 'Sector Nova', 0, 0, 0, 0),
('quantum', 'Nova Quantum', 0, 0, 0, 0);