-- app/db/schema.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    pokecoins INTEGER NOT NULL DEFAULT 0,
    has_chosen_starter INTEGER NOT NULL DEFAULT 0,
    current_lat REAL,
    current_lng REAL,
    last_seen_at TEXT
);

CREATE TABLE IF NOT EXISTS auth_tokens (
    token TEXT PRIMARY KEY,
    player_id INTEGER NOT NULL,
    issued_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_player ON auth_tokens(player_id);

CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_tokens (
    token TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    issued_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pokemon_species (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    primary_type TEXT NOT NULL,
    secondary_type TEXT,
    base_hp INTEGER NOT NULL,
    base_attack INTEGER NOT NULL,
    base_defense INTEGER NOT NULL,
    base_special_attack INTEGER NOT NULL,
    base_special_defense INTEGER NOT NULL,
    base_speed INTEGER NOT NULL,
    capture_rate INTEGER NOT NULL,
    base_experience INTEGER NOT NULL,
    is_starter INTEGER NOT NULL DEFAULT 0,
    is_rare INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS moves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('physical','special','status')),
    power INTEGER,
    accuracy INTEGER,
    pp INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS species_learnable_moves (
    species_id INTEGER NOT NULL,
    move_id INTEGER NOT NULL,
    learn_level INTEGER NOT NULL,
    PRIMARY KEY (species_id, move_id),
    FOREIGN KEY (species_id) REFERENCES pokemon_species(id) ON DELETE CASCADE,
    FOREIGN KEY (move_id) REFERENCES moves(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pokemon_instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    species_id INTEGER NOT NULL,
    owner_player_id INTEGER,
    nickname TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    current_hp INTEGER NOT NULL,
    iv_hp INTEGER NOT NULL,
    iv_attack INTEGER NOT NULL,
    iv_defense INTEGER NOT NULL,
    iv_special_attack INTEGER NOT NULL,
    iv_special_defense INTEGER NOT NULL,
    iv_speed INTEGER NOT NULL,
    caught_at TEXT NOT NULL DEFAULT (datetime('now')),
    caught_lat REAL,
    caught_lng REAL,
    FOREIGN KEY (species_id) REFERENCES pokemon_species(id),
    FOREIGN KEY (owner_player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pokemon_owner ON pokemon_instances(owner_player_id);

CREATE TABLE IF NOT EXISTS pokemon_instance_moves (
    pokemon_instance_id INTEGER NOT NULL,
    slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 4),
    move_id INTEGER NOT NULL,
    current_pp INTEGER NOT NULL,
    PRIMARY KEY (pokemon_instance_id, slot),
    FOREIGN KEY (pokemon_instance_id) REFERENCES pokemon_instances(id) ON DELETE CASCADE,
    FOREIGN KEY (move_id) REFERENCES moves(id)
);

CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('pokeball','potion','revive','key','misc')),
    description TEXT NOT NULL,
    buy_price INTEGER,
    sell_price INTEGER,
    effect_value INTEGER,
    stackable INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS player_inventory (
    player_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    PRIMARY KEY (player_id, item_id),
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS map_objects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    name TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by_admin_id INTEGER,
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_map_objects_geo ON map_objects(lat, lng);

CREATE TABLE IF NOT EXISTS npcs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('merchant','healer','questgiver','trainer','auctioneer')),
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    dialogue TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by_admin_id INTEGER,
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_npcs_geo ON npcs(lat, lng);

CREATE TABLE IF NOT EXISTS npc_inventory (
    npc_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    stock INTEGER NOT NULL,
    price_override INTEGER,
    PRIMARY KEY (npc_id, item_id),
    FOREIGN KEY (npc_id) REFERENCES npcs(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS npc_team_pokemon (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    npc_id INTEGER NOT NULL,
    species_id INTEGER NOT NULL,
    level INTEGER NOT NULL,
    slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 6),
    FOREIGN KEY (npc_id) REFERENCES npcs(id) ON DELETE CASCADE,
    FOREIGN KEY (species_id) REFERENCES pokemon_species(id),
    UNIQUE (npc_id, slot)
);

CREATE TABLE IF NOT EXISTS rare_wild_pokemon (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    species_id INTEGER NOT NULL,
    level INTEGER NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    current_hp INTEGER NOT NULL,
    expires_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by_admin_id INTEGER,
    FOREIGN KEY (species_id) REFERENCES pokemon_species(id),
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_rare_geo ON rare_wild_pokemon(lat, lng);
CREATE INDEX IF NOT EXISTS idx_rare_active ON rare_wild_pokemon(is_active);

CREATE TABLE IF NOT EXISTS rare_pokemon_captures (
    rare_pokemon_id INTEGER PRIMARY KEY,
    captured_by_player_id INTEGER NOT NULL,
    pokemon_instance_id INTEGER NOT NULL,
    captured_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (rare_pokemon_id) REFERENCES rare_wild_pokemon(id) ON DELETE CASCADE,
    FOREIGN KEY (captured_by_player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (pokemon_instance_id) REFERENCES pokemon_instances(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS spawn_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    center_lat REAL NOT NULL,
    center_lng REAL NOT NULL,
    radius_meters REAL NOT NULL,
    primary_type TEXT NOT NULL,
    secondary_type TEXT,
    spawn_weight REAL NOT NULL DEFAULT 1.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by_admin_id INTEGER,
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_spawn_geo ON spawn_areas(center_lat, center_lng);

CREATE TABLE IF NOT EXISTS event_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    center_lat REAL NOT NULL,
    center_lng REAL NOT NULL,
    radius_meters REAL NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by_admin_id INTEGER,
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_event_geo ON event_areas(center_lat, center_lng);
CREATE INDEX IF NOT EXISTS idx_event_window ON event_areas(starts_at, ends_at);

CREATE TABLE IF NOT EXISTS gyms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    current_leader_player_id INTEGER,
    leader_since TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by_admin_id INTEGER,
    FOREIGN KEY (current_leader_player_id) REFERENCES players(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_gyms_geo ON gyms(lat, lng);

CREATE TABLE IF NOT EXISTS gym_defenders (
    gym_id INTEGER NOT NULL,
    slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 6),
    pokemon_instance_id INTEGER NOT NULL,
    effective_level INTEGER NOT NULL,
    placed_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (gym_id, slot),
    FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
    FOREIGN KEY (pokemon_instance_id) REFERENCES pokemon_instances(id) ON DELETE CASCADE,
    UNIQUE (pokemon_instance_id)
);
