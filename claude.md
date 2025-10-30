# Propz Twitch Bot

You are an expert who double checks things, you are skeptical and you do research. I am not always right. Neither are you, but we both strive for accuracy.

## Project Overview

A modular TypeScript Twitch bot built with Deno and Twurple framework. Service-based architecture with clear separation of concerns across 46 TypeScript files (~7,200 lines of code).

### Core Features
- 100+ chat commands organized in 5 categories
- Real-time event handling (follows, subs, raids, channel updates)
- OBS overlay integration via WebSocket
- Discord bot with GitHub webhook support
- External integrations (Spotify, YouTube, AI, Weather APIs)
- Multi-language support (German/English with auto-detection)
- SQLite database with prepared statements
- Hot-reload command system

## Architecture

### Tech Stack
- **Runtime:** Deno 2.0+ with TypeScript 5.x (strict mode)
- **Framework:** Twurple 7.4.0 (Twitch API, Chat, EventSub)
- **Database:** SQLite
- **Frontend:** React (OBS overlays)
- **Process Manager:** PM2 (production)

### Directory Structure

```
propz-bot/
├── bot/                          # Main application (46 files)
│   ├── index.ts                  # Entry point - Bot orchestrator
│   ├── services/                 # Core infrastructure (6 files)
│   │   ├── Server.ts             # HTTP server, WebSocket, webhooks
│   │   ├── Websocket.ts          # WebSocket connection management
│   │   ├── Database.ts           # SQLite singleton
│   │   ├── UserData.ts           # User CRUD operations
│   │   ├── StreamStats.ts        # Session statistics
│   │   └── StreamEvents.ts       # Event repository
│   ├── twitch/                   # Twitch modules (5 subdirectories)
│   │   ├── core/                 # Foundation (3 files)
│   │   │   ├── Twitch.ts         # Main controller - orchestrates all modules
│   │   │   ├── TwitchAuth.ts     # OAuth & token refresh
│   │   │   └── TwitchRewards.ts  # Channel points management
│   │   ├── chat/                 # IRC chat system (3 files)
│   │   │   ├── TwitchChat.ts     # Chat client & event handlers
│   │   │   ├── MessageProcessor.ts # Validation, translation, scoring
│   │   │   └── Emotes.ts         # BTTV, FFZ, 7TV emote handling
│   │   ├── commands/             # Modular command system (6 files)
│   │   │   ├── Commands.ts       # Registry & orchestrator
│   │   │   ├── CommandsFun.ts    # Jokes, quotes, shoutouts
│   │   │   ├── CommandsInfo.ts   # Stats, rankings, stream info
│   │   │   ├── CommandsMod.ts    # Mod tools, bot config
│   │   │   ├── CommandsSoundboard.ts # Audio alerts (~70 commands)
│   │   │   └── CommandsUtils.ts  # Spotify, weather, YouTube
│   │   ├── events/               # EventSub WebSocket (2 files)
│   │   │   ├── TwitchEvents.ts   # Listener setup
│   │   │   └── EventProcessor.ts # Event validation & processing
│   │   └── utils/                # Helper classes (3 files)
│   │       ├── UserHelper.ts     # User conversions & broadcaster info
│   │       ├── StreamHelper.ts   # Stream status & Discord integration
│   │       └── LastFollowers.ts  # Recent follower tracking
│   ├── discord/                  # Discord bot (2 files)
│   │   ├── Discord.ts            # Client & event handlers
│   │   └── DiscordUtils.ts       # Welcome images, embeds
│   ├── modules/
│   │   ├── features/             # Bot-specific features (10 files)
│   │   │   └── Api.ts, Cronjobs.ts, Focus.ts, Killswitch.ts, etc.
│   │   └── integrations/         # External API wrappers (10 files)
│   │       └── Spotify.ts, Gemini.ts, OpenAi.ts, Youtube.ts, etc.
│   └── config/                   # JSON configuration (4 files)
│       ├── twitchEvents.json     # 50+ event configurations
│       ├── twitchRewards.json    # Channel point rewards
│       ├── twitchTimers.json     # Timed chat messages
│       └── discordEvents.json    # Discord event config
├── frontend/                     # React OBS overlays
├── shared/                       # Shared utilities (8 files)
│   ├── types.ts                  # TypeScript interfaces
│   ├── helpers.ts                # Utility functions (log, getMessage, sanitize)
│   ├── prototypes.ts             # Date/String extensions
│   ├── websocket.ts              # WebSocket message types
│   └── obs.ts                    # OBS data structures
├── local/                        # Local development scripts
├── deno.json                     # Workspace config & import maps
├── pm2.json                      # Production deployment
└── .env                          # Environment variables
```

## Design Patterns & Principles

### 1. Composition over Inheritance
Bot orchestrates services via dependency injection rather than inheritance.

**Entry Point (bot/index.ts):**
- Bot class composes Server, Discord, Twitch, Websocket
- Dependencies injected via constructor
- `run()` method initializes all services

**Twitch Controller (bot/twitch/core/Twitch.ts):**
- Orchestrates all Twitch modules (chat, commands, events, rewards)
- Composes utilities (userHelper, stream, emotes)
- Integrations (spotify, killswitch, focus)

### 2. Static Service Pattern
UserData, StreamStats, StreamEvents use static methods - no instantiation needed for pure data operations.

### 3. Singleton Pattern
Database uses getInstance() for single SQLite connection with prepared statements.

### 4. Repository Pattern
Data access layer abstracts database operations (UserData, StreamEvents).

### 5. Observer Pattern
EventSub and Chat use event listeners for reactive behavior.

### 6. Strategy Pattern
Command handlers are interchangeable strategies registered in a Map.

## Import Maps & Path Aliases

```typescript
// deno.json imports
@services/      -> ./bot/services/
@config/        -> ./bot/config/
@discord/       -> ./bot/discord/
@modules/       -> ./bot/modules/
@features/      -> ./bot/modules/features/
@integrations/  -> ./bot/modules/integrations/
@shared/        -> ./shared/
@twitch/        -> ./bot/twitch/
@twitch/core/   -> ./bot/twitch/core/
@twitch/chat/   -> ./bot/twitch/chat/
@twitch/commands/ -> ./bot/twitch/commands/
@twitch/events/ -> ./bot/twitch/events/
@twitch/utils/  -> ./bot/twitch/utils/
```

**Always use path aliases instead of relative imports.**

## Data Flow

### Server Endpoints (bot/services/Server.ts)
- **Port 1337** - HTTP server with 4 routes
- `/websocket` - OBS overlay connections (WebSocket upgrade)
- `/api` - Frontend API requests (POST with JSON body)
- `/webhook` - GitHub, Ko-fi, PropzDE webhooks (POST)
- CORS enabled for all origins

### Command Processing Flow
```
User: !command
  ↓ TwitchChat.onMessage()
  ↓ MessageProcessor.validate()
  ↓ Commands.validate() - cooldown, permissions, focus mode, offline check
  ↓ Commands.process()
    ├─ WebSocket.send() - OBS alerts
    ├─ handler() execution - async logic
    └─ Chat.sendAction() - response message
```

### Event Processing Flow
```
Twitch EventSub → TwitchEvents.onChannelFollow()
  ↓ EventProcessor.process()
    ├─ UserHelper.convertToSimplerUser()
    ├─ StreamEvents.get() - load config from JSON
    ├─ EventProcessor.validate() - killswitch, focus, duplicate check
    ├─ WebSocket.send() - OBS alerts
    ├─ Database updates - UserData, StreamStats, StreamEvents
    └─ Chat.sendAnnouncement() - if configured
```

### Message Processing Flow
```
Chat Message (non-command)
  ↓ MessageProcessor.validate() - bot check, spam filter, duplicate detection
  ↓ MessageProcessor.process()
    ├─ UserData.update() - increment message_count
    ├─ StreamStats.update() - session stats
    ├─ Language detection (cld library)
    ├─ Translation (DeepL if non-DE/EN)
    └─ WebSocket.send() - to OBS overlay
```

## Database Schema

**twitch_users** - Persistent user data
- Primary key: id (TEXT)
- Fields: name, profile_picture, color, follow_date, message_count, first_count, sub_count, gift_count, gift_subs, raid_count, raid_viewers

**twitch_events** - Event history
- Auto-increment id, type, user_id, timestamp, count
- Foreign key to twitch_users

**stream_stats** - Session statistics (ephemeral, cleared daily at 04:00)
- Primary key: user_id
- Fields: message, cheer, follow, raid, first_chatter, sub, subgift

## Important Conventions

### Command Structure
Commands are defined as objects with properties:
- `aliases` - Alternative command names
- `cooldown` - Seconds between uses
- `description` - Help text
- `disableOnFocus` - Disabled during focus mode
- `disableIfOffline` - Only works when stream is live
- `onlyMods` - Moderator-only
- `hasSound` / `hasVideo` - Trigger OBS media
- `obs` - OBS scene/duration data
- `message` - Response (string, array, or multi-lang object)
- `handler` - Async function for custom logic

### Event Configuration (twitchEvents.json)
- `isAnnouncement` - Send as chat announcement
- `saveEvent` - Persist to database
- `message` - Multi-lang messages (de/en arrays)
- `extra` - Additional data for OBS overlays
- `hasSound` - Trigger audio alert
- `obs` - Scene switching config

### Logging
Use `log()` from @shared/helpers.ts - provides stack-trace-based logging with file:line information.

### Multi-Language Messages
Use `getMessage()` from @shared/helpers.ts - resolves multi-lang objects and random array selection.

### String Extensions (shared/prototypes.ts)
- `String.prototype.isCommand()` - Checks if starts with !
- `String.prototype.toRegExp()` - Converts to RegExp
- `Date.timestamp()` - Unix timestamp in seconds

### WebSocket Communication
All WebSocket messages follow WebsocketData type (shared/websocket.ts):
- `type` - message | command | event | alert | focus
- `user` - SimpleUser object
- `message` - Chat message content
- `translation` - Translated message
- `hasSound` / `hasVideo` - Media triggers
- `obs` - OBS data
- `extra` - Additional metadata

## Key Module Responsibilities

### Twitch.ts (bot/twitch/core/Twitch.ts)
Main controller that orchestrates:
- Authentication (TwitchAuth)
- API client (Twurple ApiClient)
- Chat system (TwitchChat)
- Command system (Commands)
- Event system (TwitchEvents)
- Utilities (UserHelper, StreamHelper, Emotes)
- Integrations (Spotify, Focus, Killswitch)

**init() sequence matters** - auth → api → utils → modules → start

### Commands.ts (bot/twitch/commands/Commands.ts)
- Registry for all commands (Map)
- Validates cooldowns, permissions, focus mode
- Hot-reload support via dynamic imports with cache-busting

### EventProcessor.ts (bot/twitch/events/EventProcessor.ts)
- Processes all Twitch events (follow, sub, raid, etc.)
- Validates against killswitch, focus mode, duplicates
- Sends to WebSocket, updates database, triggers chat announcements

### UserHelper.ts (bot/twitch/utils/UserHelper.ts)
- Converts between ChatUser, HelixUser, SimpleUser
- Static broadcaster/bot info (IDs, names)
- User lookup via Twitch API

### StreamHelper.ts (bot/twitch/utils/StreamHelper.ts)
- Stream status (isLive, title, game, viewers, language)
- Discord integration for stream online announcements
- API response formatting

### Database.ts (bot/services/Database.ts)
- Singleton pattern
- Initializes schema from BotData.sql
- Daily cleanup cronjob (Deno.cron)
- Prepared statements for all queries

### UserData.ts (bot/services/UserData.ts)
Static methods for user operations:
- `get(userId)` - Fetch user data
- `update(user, field, value)` - Increment counters
- `addUser(id, name)` - Create new user
- `getAll()` - All users for rankings

### Server.ts (bot/services/Server.ts)
- HTTP server on port 1337
- WebSocket upgrade handling
- API request routing
- Webhook processing (GitHub, Ko-fi, PropzDE)

### Websocket.ts (bot/services/Websocket.ts)
- Manages OBS overlay connections (Map<id, WebSocket>)
- `send(data)` - Broadcast to all connected clients
- Auto-cleanup of closed connections

## Environment Variables

**Required:**
- BROADCASTER_ID, BROADCASTER_NAME
- BOT_ID, BOT_NAME
- TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET
- BOT_INITIAL_OAUTH_CODE, BROADCASTER_INITIAL_OAUTH_CODE

**Optional:**
- DISCORD_BOT_TOKEN
- SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_INITIAL_OAUTH_CODE
- GEMINI_API_KEY, OPENAI_API_KEY
- YOUTUBE_API_KEY, OPENWEATHER_API_KEY, DEEPL_API_KEY
- KOFI_TOKEN, SE_ACCOUNT_ID
- OBS_WEBSOCKET_PASSWORD

## Deno Tasks

```bash
deno task botwatch    # Development with hot-reload
deno task dev         # Frontend development server
deno task local       # Local scripts
deno task botdebug    # Debug mode with inspector
```

**Production:** `pm2 start pm2.json`

## Critical Notes

### Dependency Order
Twitch.ts init() has strict dependency order - auth must complete before API client, utils before modules.

### Static vs Instance
- Static: UserData, StreamStats, StreamEvents (pure data operations)
- Instance: Everything else (needs state/dependencies)

### Error Handling
All errors caught as `unknown` type, logged via `log(error)` - graceful degradation, no throws.

### Async Patterns
- `void this.chat.init()` - Fire-and-forget
- `await this.stream.set()` - When result needed

### Cronjobs
- **Minutely:** Timed messages (if stream live)
- **Daily (04:00):** Database cleanup (stream_stats table)

### Hot-Reload
Commands can be reloaded without bot restart via `!reloadcommands` - uses dynamic imports with timestamp cache-busting.

### Focus Mode
Disables commands/events with `disableOnFocus: true` - for concentrated work without alerts.

### Killswitch
Emergency disable all events - automatically activated by Shield Mode, manually via `!killswitch`.

### TODOs in Codebase
- TwitchChat.ts:511-512 - Check collision between onResub and onSubExtend events

---

*Documentation for Propz Twitch Bot v2.0.0 - Service-based architecture, 46 TypeScript files, ~7,200 lines of code*
