# Propz Twitch Bot - Dokumentation

## Projekt-Übersicht

Der Propz Twitch Bot ist ein umfassender TypeScript-basierter Twitch-Bot, der mit Deno entwickelt wurde und das Twurple-Framework für die Twitch-API-Integration nutzt. Der Bot ist als Monorepo-Struktur organisiert und bietet erweiterte Features für Twitch-Streaming, OBS-Integration, Discord-Anbindung und verschiedene externe APIs.

### Hauptzweck
- **Interaktiver Twitch-Chat-Bot** mit umfangreichen Commands
- **Event-Handler** für Twitch-Events (Follows, Subs, Raids, etc.)
- **OBS-Studio-Integration** für Stream-Overlays und Szenen-Steuerung
- **Discord-Bot-Funktionalität** mit GitHub-Webhooks
- **Multi-Platform-Support** (YouTube, Spotify, Ko-fi, StreamElements)

### Wichtigste Features
- 🎮 **100+ Chat-Commands** (AI-Integration, Sounds, Quotes, Jokes)
- 📊 **Stream-Analytics** und Viewer-Statistiken
- 🎵 **Spotify-Integration** mit Playlist-Steuerung
- 🎬 **OBS-Automation** für Alerts und Szenen-Switching
- 💰 **Ko-fi Donation-Tracking**
- 🌍 **Multi-Language-Support** (Deutsch/Englisch)
- 🤖 **AI-Powered Responses** (Gemini/OpenAI)

## Architektur-Analyse

### Ordnerstruktur

```
propz-bot/
├── twitch-bot/              # Haupt-Bot-Application
│   ├── bot/                 # Core Bot-Komponenten
│   │   ├── Bot.ts           # HTTP-Server & WebSocket-Handler
│   │   ├── BotData.ts       # Statische Daten & Config-Loader
│   │   ├── BotWebsocket.ts  # WebSocket-Management für OBS
│   │   └── Database.ts      # SQLite-Datenbankklasse
│   ├── twitch/              # Twitch-spezifische Module
│   │   ├── Twitch.ts        # Haupt-Controller (extends TwitchUtils)
│   │   ├── TwitchUtils.ts   # Abstract Base Class
│   │   ├── TwitchAuth.ts    # OAuth-Authentifizierung
│   │   ├── TwitchChat.ts    # Chat-Client & Message-Handler
│   │   ├── TwitchCommands.ts # Command-System
│   │   └── TwitchEvents.ts  # EventSub-Listener
│   ├── discord/             # Discord-Bot-Integration
│   │   ├── Discord.ts       # Discord-Client (extends DiscordUtils)
│   │   └── DiscordUtils.ts  # Helper-Funktionen
│   ├── external/            # Externe API-Integrationen
│   │   ├── Spotify.ts       # Spotify Web API
│   │   ├── OpenAi.ts        # OpenAI GPT-Integration
│   │   ├── Gemini.ts        # Google Gemini AI
│   │   ├── Youtube.ts       # YouTube Data API
│   │   ├── OpenWeather.ts   # Wetter-API
│   │   └── [weitere APIs]
│   ├── config/              # JSON-Konfigurationsdateien
│   │   ├── twitchEvents.json    # Event-Konfiguration
│   │   ├── twitchRewards.json   # Channel Point Rewards
│   │   ├── twitchTimers.json    # Chat-Timer
│   │   └── discordEvents.json   # Discord-Event-Config
│   └── index.ts             # Entry Point
├── obs-overlays/            # OBS-Overlays & Web-Interface
├── shared/                  # Geteilte Utilities
│   ├── types.ts             # TypeScript-Interfaces
│   ├── helpers.ts           # Hilfsfunktionen
│   ├── prototypes.ts        # Date-Prototyp-Erweiterungen
│   └── websocket.ts         # WebSocket-Utils
├── local-scripts/           # Lokale Entwicklungstools
└── pm2.json                 # Produktions-Konfiguration
```

### Architektur-Pattern

1. **Inheritance-basierte Struktur**
   - `Twitch extends TwitchUtils` (Abstract Base Class Pattern)
   - `Discord extends DiscordUtils`
   - `Database extends DB` (Deno SQLite-Wrapper)

2. **Dependency Injection**
   - Konstruktor-basierte Dependency-Injection
   - Zyklische Abhängigkeiten durch Interface-Segregation vermieden

3. **Event-Driven Architecture**
   - EventSub WebSocket-Listener für Twitch-Events
   - Custom Event-System für interne Kommunikation
   - Observer Pattern für Chat-Message-Processing

### Datenfluss

```
Twitch API ─┐
           ├─► TwitchUtils ─► Database (SQLite)
Discord ───┤                      │
           └─► WebSocket ──────────┼─► OBS Overlays
                                  │
Ko-fi/GitHub ──► HTTP Server ─────┘
```

## Dependencies & Imports

### Deno-spezifische APIs
- **Deno.serve()** - HTTP-Server (Port 1337)
- **Deno.upgradeWebSocket()** - WebSocket-Handling
- **Deno.cron()** - Scheduled Tasks (minutely/daily)
- **Deno.env.get()** - Environment Variables
- **Deno.args** - CLI-Argumente für Dev/Prod-Mode

### Hauptabhängigkeiten (bot/deno.json)
```json
{
  "@twurple/auth": "^7.4.0",           // OAuth-Authentifizierung
  "@twurple/api": "^7.4.0",            // Twitch Helix API
  "@twurple/chat": "^7.4.0",           // IRC-Chat-Client
  "@twurple/eventsub-ws": "^7.4.0",    // EventSub WebSocket
  "discord.js": "^14.22.1",            // Discord-Bot-Framework
  "puppeteer": "^24.19.0",             // Web-Scraping für OBS
  "cld": "^2.10.1"                     // Spracherkennung
}
```

### Workspace-Konfiguration
- **Monorepo-Setup** mit Deno Workspaces
- **@shared/ Imports** für shared Module
- **JSX-Support** für React-Komponenten (OBS-Overlays)

## Wichtige Funktionen & Commands

### Command-System (TwitchCommands.ts:22)

Das Command-System nutzt eine Map-basierte Struktur mit erweiterten Optionen:

```typescript
public commands: Map<string, TwitchCommand> = new Map(Object.entries({
  // AI-Integration
  ai: {
    aliases: ['ki'],
    handler: async (options) => await Gemini.generate(options.message),
    disableIfOffline: true
  },
  
  // Audio/Visual Commands  
  alarm: {
    cooldown: 10,
    hasSound: true,
    disableOnFocus: true
  },
  
  // Datenbank-Operationen
  addquote: {
    handler: async (options) => await this.twitch.addQuote(options.messageObject),
    message: { de: 'Zitat gespeichert: #[count]', en: 'Quote saved: #[count]' }
  }
}));
```

### Event-Handler (TwitchEvents.ts:28)

```typescript
handleEvents() {
  this.listener.onStreamOnline(this.userId, this.onStreamOnline);
  this.listener.onChannelFollow(this.userId, this.userId, this.onChannelFollow);
  this.listener.onChannelRedemptionAdd(this.userId, this.onChannelRedemptionAdd);
  // ... weitere Events
}
```

### WebSocket-Integration (Bot.ts:82)

```typescript
private handleWebsocket(req: Request): Response {
  const { socket, response } = Deno.upgradeWebSocket(req);
  const wsId = crypto.randomUUID();
  
  socket.addEventListener('open', () => {
    this.ws.wsConnections.set(wsId, socket);
  });
}
```

### Wichtige Helper-Funktionen

**shared/helpers.ts:16** - Erweiterte Log-Funktion:
```typescript
export function log(input: string | number | unknown, isWarning = false, verbose?: boolean) {
  // Stack-trace-basiertes Logging mit Datei/Zeilen-Info
  // Format: DD.MM.YYYY HH:mm:ss <datei:zeile> funktion
}
```

## Konfiguration

### Environment-Variablen (.env.example)

**Twitch-Setup:**
```bash
TWITCH_USERNAME='propz_tv'
TWITCH_CLIENT_ID='XXX'
TWITCH_CLIENT_SECRET='XXX' 
TWITCH_INITIAL_OAUTH_CODE='XXX'    # OAuth-Flow
```

**Externe APIs:**
```bash
DISCORD_BOT_TOKEN='XXX'
YOUTUBE_API_KEY='XXX'
SPOTIFY_CLIENT_ID='XXX'
OPENAI_API_KEY='XXX'
GEMINI_API_KEY='XXX'
KOFI_TOKEN='XXX'                   # Webhook-Verification
```

**Optional:**
```bash
OBS_WEBSOCKET_PASSWORD='XXX'       # OBS-Studio-Verbindung
SE_ACCOUNT_ID='XXX'                # StreamElements
OPENWEATHER_API_KEY='XXX'          # Wetter-Commands
DEEPL_API_KEY='XXX'                # Übersetzung
```

### Deno-Permissions (deno.json:39)

```bash
deno run -A --unstable-cron --unstable-detect-cjs --env-file ./twitch-bot/index.ts
```

- `-A` - Alle Permissions (Network, FileSystem, Environment)
- `--unstable-cron` - Cron-Jobs für Scheduled Tasks
- `--unstable-detect-cjs` - CommonJS-Module-Support
- `--env-file` - .env-Datei-Loading

### JSON-Konfiguration

**twitchEvents.json** - Event-Konfiguration:
```json
{
  "follow": {
    "isAnnouncement": true,
    "saveEvent": true,
    "message": {
      "de": ["Willkommen @[user]! 🚀", "..."],
      "en": ["Welcome @[user]! 🚀", "..."]
    },
    "extra": {
      "de": { "titleAlert": "Neuer Follower" }
    }
  }
}
```

## Setup-Anleitung

### 1. Voraussetzungen
```bash
# Deno installieren (Version 1.40+)
curl -fsSL https://deno.land/install.sh | sh

# Repository klonen
git clone [repository-url]
cd propz-bot
```

### 2. Environment-Setup
```bash
# .env-Datei erstellen
cp .env.example .env

# Twitch-Credentials konfigurieren:
# 1. Twitch Dev Console: https://dev.twitch.tv/console/
# 2. User-ID ermitteln: https://streamscharts.com/tools/convert-username
# 3. OAuth-Code generieren (siehe .env.example URL)
```

### 3. Entwicklung starten
```bash
# Bot mit Auto-Reload
deno task botwatch

# OBS-Overlays-Server
deno task dev

# Lokale Scripts
deno task local
```

### 4. Produktions-Deployment
```bash
# PM2-basiertes Deployment
pm2 start pm2.json
pm2 save
pm2 startup
```

### 5. OBS-Studio-Integration
- **WebSocket-Plugin** installieren
- **Browser-Source** hinzufügen: `http://localhost:3000/alerts`
- **OBS_WEBSOCKET_PASSWORD** in .env setzen

## Potentielle Verbesserungen

### Code-Quality Issues

1. **Type Safety (gefunden in mehreren Dateien)**
   ```typescript
   // Schwache Typisierung vermeiden:
   catch (error: unknown)  // ✅ Gut
   [key: string]: any      // ❌ Vermeiden
   ```

2. **TODO-Items (TwitchChat.ts)**
   ```typescript
   // TODO: check if this collides with onResub event
   // TODO: check if this collides with onSubExtend event
   ```

3. **Console-Logging entfernen**
   - 4 Dateien nutzen noch `console.*` statt der custom `log()`-Funktion
   - Migration zu einheitlichem Logging-System

### Architekturelle Verbesserungen

1. **Error Handling**
   ```typescript
   // Statt unspezifischer try-catch-Blöcke:
   try {
     await this.twitchApi.someMethod();
   } catch (error: TwitchApiError | NetworkError) {
     // Spezifische Error-Behandlung
   }
   ```

2. **Dependency Injection**
   ```typescript
   // Service-Container für bessere Testbarkeit:
   interface ServiceContainer {
     twitchApi: ApiClient;
     database: Database;
     logger: Logger;
   }
   ```

3. **Configuration Management**
   ```typescript
   // Typisierte Konfiguration statt Deno.env.get():
   interface BotConfig {
     twitch: TwitchConfig;
     discord?: DiscordConfig;
     apis: ApiConfigs;
   }
   ```

### Performance-Optimierungen

1. **Database-Queries**
   - Prepared Statements für häufige Queries
   - Connection Pooling für gleichzeitige Zugriffe
   - Indizierung für User-Lookups

2. **WebSocket-Management**
   ```typescript
   // Heartbeat-System für Connection-Health:
   private heartbeat = setInterval(() => {
     this.wsConnections.forEach(socket => {
       socket.ping();
     });
   }, 30000);
   ```

3. **Caching-Layer**
   ```typescript
   // Redis-ähnliches Caching für API-Responses:
   class CacheManager {
     private cache = new Map<string, CacheEntry>();
     get<T>(key: string, fallback: () => Promise<T>): Promise<T>
   }
   ```

### Security-Verbesserungen

1. **Input-Validation**
   ```typescript
   // Zod-basierte Schema-Validation:
   const MessageSchema = z.object({
     command: z.string().min(1).max(50),
     args: z.array(z.string()).optional()
   });
   ```

2. **Rate-Limiting**
   ```typescript
   // Per-User Command-Rate-Limiting:
   class RateLimit {
     private userLimits = new Map<string, number[]>();
     isAllowed(userId: string, command: string): boolean
   }
   ```

3. **Environment-Validation**
   ```typescript
   // Startup-Validation für kritische Env-Vars:
   const requiredEnvVars = ['TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET'];
   requiredEnvVars.forEach(envVar => {
     if (!Deno.env.get(envVar)) {
       throw new Error(`Missing required environment variable: ${envVar}`);
     }
   });
   ```

### Deno-Best-Practices

1. **Import-Maps optimieren**
   ```json
   {
     "imports": {
       "@shared/": "./shared/",
       "@twurple/": "npm:@twurple/",
       "@std/": "jsr:@std/"
     }
   }
   ```

2. **Permission-Granularität**
   ```bash
   # Statt -A spezifische Permissions:
   deno run --allow-net=api.twitch.tv,discord.com --allow-env --allow-read=./config
   ```

3. **Worker-Threads für CPU-intensive Tasks**
   ```typescript
   // Audio-Processing in separatem Worker:
   const worker = new Worker(new URL('./audio-processor.ts', import.meta.url));
   ```

---

*Dokumentation erstellt am 2025-09-09 für Propz Twitch Bot v1.7.17*
