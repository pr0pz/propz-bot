-- BotData Database Schema
-- Version 1.9.0

-- Authentication
CREATE TABLE IF NOT EXISTS auth (
    name PRIMARY KEY,
    data TEXT NOT NULL
);

INSERT OR IGNORE INTO auth (name, data) VALUES ('twitch', '');

-- Twitch Users Table
CREATE TABLE IF NOT EXISTS twitch_users (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE DEFAULT '',
    profile_picture TEXT DEFAULT '',
    color TEXT DEFAULT '',
    follow_date INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    first_count INTEGER DEFAULT 0,
    sub_count INTEGER DEFAULT 0,
    gift_count INTEGER DEFAULT 0,
    gift_subs INTEGER DEFAULT 0,
    raid_count INTEGER DEFAULT 0,
    raid_viewers INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_users_user_name ON twitch_users(name);
CREATE INDEX IF NOT EXISTS idx_users_follow_date ON twitch_users (follow_date);

-- Twitch Events Table
CREATE TABLE IF NOT EXISTS twitch_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    user_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES twitch_users(id)
);
CREATE INDEX IF NOT EXISTS idx_events_type ON twitch_events(type);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON twitch_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON twitch_events(timestamp);

-- Twitch Quotes Table
CREATE TABLE IF NOT EXISTS twitch_quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL DEFAULT '',
    user_id TEXT NOT NULL,
    vod_url TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES twitch_users(id)
);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON twitch_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_category ON twitch_quotes(category);
CREATE INDEX IF NOT EXISTS idx_quotes_date ON twitch_quotes(date);

-- Twitch Jokes Table
CREATE TABLE IF NOT EXISTS twitch_jokes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL DEFAULT '',
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES twitch_users(id)
);
CREATE INDEX IF NOT EXISTS idx_jokes_user_id ON twitch_jokes(user_id);

-- Stream Stats
CREATE TABLE IF NOT EXISTS stream_stats (
    user_id TEXT PRIMARY KEY,
    message INTEGER DEFAULT 0,
    cheer INTEGER DEFAULT 0,
    follow INTEGER DEFAULT 0,
    raid INTEGER DEFAULT 0,
    first_chatter INTEGER DEFAULT 0,
    sub INTEGER DEFAULT 0,
    subgift INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES twitch_users(id)
);
