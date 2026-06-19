# AetherOS-Prod

> A browser-native operating environment built as a side project with Claude.  
> Single-file, client-side, overbuilt on purpose.

Live demo: <https://meyashverma.github.io/AetherOS-Prod/>  
Repository: <https://github.com/MeYashverma/AetherOS-Prod>

AetherOS is not trying to behave like a normal website. It is closer to a desktop shell that happens to live inside the browser: multi-window, themeable, noisy in the right places, and packed with realtime modules, local memory, and a lot of visual polish.

## What this is

The app runs as a full UI shell inside a single HTML file. It includes its own window manager, dock, command palette, settings system, local persistence layer, media tools, tracking dashboards, research tools, and a pile of experimental modules.

This is not a landing page. It is not a dashboard either. It is a browser-native workstation.

## Visual language

The UI leans hard into a dark, premium desktop style:

- macOS-style dock with magnification and running indicators
- draggable windows with custom minimize / restore motion
- liquid-glass surfaces, layered shadows, and subtle chromatic effects
- custom cursors, Oneko-style companions, sakura petals, and animated trail modes
- cinematic wallpaper, scanlines, particle overlays, and other ambient noise
- eco and cinematic performance modes for weaker or stronger machines

## Main window inventory

These are the actual window modules present in the source:

- **System Config** (`settings`)
- **Data Stream** (`terminal`)
- **Media Console** (`media`)
- **Global Radio Network** (`radiobrowser`)
- **System Diagnostics** (`sysmon`)
- **NoSleep Screen Lock** (`nosleep`)
- **Uplink Presence** (`presence`)
- **Global Signal Feed** (`feed`)
- **Web Proxy Interface** (`browser`)
- **Wplace Live Canvas** (`wplace`)
- **Floor796 Explorer** (`floor796`)
- **Tactical Airspace Radar** (`globe`)
- **Market Matrix** (`market`)
- **Optics Node** (`surveillance`)
- **Memory Scratchpad** (`notes`)
- **Memetic Intelligence** (`memes`)
- **Retro TV (YTCH.TV)** (`ytchtv`)
- **Universal Entity Scanner** (`entityscanner`)
- **Living Archive** (`filemanager`)
- **WikiBoard Research** (`wikiboard`)
- **Weather Station** (`weather`)
- **NASA Deep Space** (`nasa`)
- **Task Manager** (`taskmanager`)
- **Game Vault** (`games`)
- **ISS Tracker** (`iss`)
- **YouTube Ambient** (`youtubeambient`)
- **Anime Discovery** (`anime`)
- **Manga Launcher** (`manga`)
- **Storage Inspector** (`storage`)
- **Error Console** (`errorconsole`)
- **API Status Board** (`apistatus`)
- **Packet Visualizer** (`packetviz`)
- **System Encyclopedia** (`about`)

## Feature wiki / docs sections inside the app

The source includes internal documentation and a hidden “wiki” area. The main sections are:

- Desktop Environment
- Media Workstation
- Knowledge & Research Canvas
- Space & Tracking Radar
- Companion System

### What those sections say

**Desktop Environment** — Window manager, drag boundaries, focus z-indexing, minimization scaling.; GSAP Draggable inertia and snap behavior.; Dock interactions with process indicators, context menus, and Genie minimize targets.
**Media Workstation** — Vapor Plaza tuner / radio streams with cover art and retro metadata.; Procedural canvas visualizer.; Scrollable lyric scroller with spotlight, minimal, and karaoke styles.
**Knowledge & Research Canvas** — WikiBoard infinite grid with pan / zoom / double-click card creation.; Connected node graphs for article relationships.; Live web and PDF previews inside cards.
**Space & Tracking Radar** — 3D ISS orbital tracking in a WebGL Earth globe.; Live telemetry for coordinates, altitude, velocity, visibility.; Open-Meteo weather-based visibility checks.
**Companion System** — JARVIS-style passive background intelligence.; Cursor eye-tracking in the header avatar.; Emotion GIF reactions or built-in OLED face.; Offline voice watchdog to avoid Chrome speech cutoffs.

## Settings and personalization

These are the top-level persisted settings keys visible in the source:

- `api_lastfm` — Last.fm API key
- `api_lastfm_user` — Last.fm username
- `api_discord` — Discord / Lanyard user ID
- `api_github` — GitHub username
- `api_rss` — Custom RSS feed URL
- `api_custom_subreddits` — Custom subreddit list
- `theme_accent` — Accent color
- `cursor_theme` — Cursor theme
- `cursor_nyan_standard` — Nyan standard cursor overlay
- `lyrics_theme` — Lyrics theme
- `cursor_oneko` — Oneko cat toggle
- `cursor_oneko_variant` — Oneko variant
- `cursor_oneko_kuro` — Kuro variant toggle
- `cursor_oneko_ball` — Ball toggle
- `sakura_petals` — Sakura petals toggle
- `sakura_intensity` — Sakura intensity
- `motion_intensity` — Motion intensity
- `performance_mode` — Performance mode
- `media_tuner_station` — Default media station
- `media_tuner_volume` — Media tuner volume
- `media_player_mode` — Media player mode
- `media_gif_provider` — Media GIF provider
- `radio_gif_enabled` — Radio GIF overlay toggle
- `radio_gif_provider` — Radio GIF provider
- `radio_tonearm_x` — Radio tonearm X
- `radio_tonearm_y` — Radio tonearm Y
- `radio_tonearm_rot` — Radio tonearm rotation
- `radio_tonearm_edit` — Radio tonearm edit toggle
- `wallpaper_mode` — Wallpaper mode
- `anime_quotes` — Anime quotes toggle
- `quote_bg_mode` — Quote background mode
- `quote_position` — Quote position
- `quote_bg_gif_provider` — Quote GIF provider
- `speech_synthesis` — Speech synthesis toggle
- `speech_voice` — Speech voice
- `speech_rate` — Speech rate
- `speech_pitch` — Speech pitch
- `speech_volume` — Speech volume
- `speech_companion` — Companion chatter toggle
- `speech_afk_timeout` — Companion AFK timeout
- `companion_emotion_mode` — Companion emotion mode
- `screen_awake_enabled` — Screen wake toggle
- `discord_webhook_url` — Discord webhook URL
- `discord_webhook_username` — Discord webhook username
- `discord_webhook_avatar` — Discord webhook avatar

### Appearance controls exposed in the UI

- Wallpaper: `default` / `gif`
- Anime quotes: `on` / `off`
- Quote background: `none` / `static` / `gif`
- Quote position: `top-left` / `top-right` / `bottom-left` / `bottom-right` / `center`
- Speech alerts: `on` / `off`
- Companion chatter: `on` / `off`
- Companion emotion mode: `gif` / `emo`
- Performance mode: `eco` / `cinematic`
- Motion intensity: `high` / `low`
- Cursor themes: `aether, minimal, neon, comet, cursorly, ripple, sparkle, binary, crosshair, gold, void, nyan
- Nyan standard overlay: `on` / `off`
- Oneko cat: `on` / `off`
- Oneko ball: `on` / `off`
- Sakura overlay: `on` / `off`
- Sakura intensity: `light` / `normal` / `storm`

### Cursor and companion details

The cursor system supports several modes, including Aether Ring, Minimal, Neon Trail, Comet Dust, Cursorly Bubbles, Click Ripple, Sparkle, Binary Rain, Crosshair, Gold Pulse, Void Lens, and Nyan Rainbow Cat.

The Oneko system is much bigger than a simple toggle. The source ships a large embedded variant catalog that includes classic pets, web colorways, bom-prefixed character variants, and a long tail of specialty skins. The catalog is bundled locally so the project stays single-file.

The companion voice layer uses browser speech synthesis, and the UI notes that it tries to prioritize natural voices when the browser provides them. The source mentions voices such as Microsoft Aria / Jenny / Guy, Google English, Samantha, Karen, Serena, and Daniel where available.

## Internal architecture

The app has an internal architecture view. The main nodes are:

- **WINDOW_MGR** — Window compositor and focus routing.
- **JARVIS_SOUL** — Companion / background director.
- **DOCK_SYS** — Launcher, previews, and running indicators.
- **CLI_STREAM** — Terminal and command stream.
- **THEMES_FX** — Theme / wallpaper / motion engine.
- **WIKIBOARD** — Spatial research canvas.
- **SPATIAL_SAT** — ISS / airspace / tracking layer.
- **DIAG_MON** — Diagnostics and telemetry.

The architecture panel connects those nodes to the rest of the shell, including the window manager, command stream, theming engine, research canvas, tracking modules, and diagnostics monitor.

## Core systems

### Desktop / shell
- Absolute-positioned multi-window workspace
- Dragging, resizing, snapping, focusing, minimizing
- Dock previews and running-state dots
- Command palette with module launch shortcuts
- Error console and runtime capture
- Task manager
- Storage inspector
- System encyclopedia / about area
- Local state restore and session persistence

### Research / knowledge
- WikiBoard infinite canvas
- Card spawning from search / terminal commands
- Connected article graphs
- Live preview cards for web / PDF content
- Searchable built-in documentation
- Notes / scratchpad with encrypted storage

### Media
- Last.fm-driven media console
- Global radio browser
- Lyrics lookup with fallback chain
- Animated cover art / GIF overlay system
- Vinyl / tonearm style radio view
- YouTube ambient playback module
- Retro TV / YTCH module

### Tracking / telemetry
- Weather station
- ISS tracker
- Tactical airspace radar
- Packet visualizer
- System diagnostics
- API status board
- Presence and signal-feed style cards

### Communication and pairing
- Aether Bridge
- Aether Link
- WebRTC / PeerJS style pairing
- BroadcastChannel local sync
- QR / code-based join flow
- File and note exchange style actions

## Public API / service inventory

This repo references a lot of services. The important ones are below, grouped by what they actually do in the app.

### Music and lyrics
- **Last.fm** — now playing, listening stats, and music identity.
- **LRCLib** — first-pass synced lyrics.
- **lyrics.ovh** — lyrics fallback when synced text is missing.
- **Deezer** — music lookup and metadata fallback paths.
- **iTunes / Apple lookup** — album / track lookup and artwork support.
- **Web scrobble helpers** — used around the media console and history views.

### Presence and social
- **Lanyard** — Discord presence.
- **Discord CDN / avatars** — profile image and activity imagery.
- **GitHub API** — GitHub activity / profile data.
- **RSS services** — custom feeds and feed aggregation.
- **Reddit feed helpers** — subreddit and post aggregation.
- **Hacker News** — feed-style content cards.

### Weather and geography
- **Open-Meteo** — weather and forecast data.
- **Open-Meteo geocoding** — city lookup and weather override.
- **ipwho.is** — first geolocation fallback.
- **ipapi.co** — second geolocation fallback.

### Space / tracking
- **Where The ISS At** — ISS coordinates and telemetry.
- **OpenSky Network** — flight / airspace tracking.
- **NASA** — APOD, EPIC, Mars, and DONKI-style data paths.
- **CesiumJS** — 3D globe rendering.
- **Three.js** — scene / geometry / rendering support.

### Radio / media / GIFs
- **Radio Browser** — station discovery.
- **OtakuGIFs** — reaction GIFs.
- **Nekos / NekosAPI** — GIF and image reactions.
- **Giphy** — alternative GIF source.
- **Tenor** — alternative GIF source.
- **Klipy** — character-specific GIF support.
- **YTCH.TV / mirrors** — retro TV / stream handling.
- **Piped instances** — YouTube-style playback fallback.
- **Invidious mirrors** — alternate video access.
- **Rammerhead** — web proxy / browser relay style fallback.

### Research and content
- **Wikipedia / Wikimedia** — research cards and wiki lookups.
- **MangaDex** — manga source.
- **Jikan** — anime / manga metadata and seasonal browsing.
- **AniList** — anime discovery fallback.
- **Kitsu** — anime discovery fallback.
- **Dragon Ball API** — character / entity browsing.
- **Animechan** — anime quote content.
- **Quotable / Advice Slip / joke APIs** — assorted feed / fun content.

### Proxy / helper / transport
- **AllOrigins**
- **Codetabs proxy**
- **CORS proxy helpers**
- **R.jina.ai**
- **cors.isomorphic-git**
- **BroadcastChannel**
- **PeerJS / WebRTC**
- **File System Access API**
- **Screen Wake Lock API**
- **Web Crypto**

## Fallback chains

The source is full of fallback paths because browser apps break in odd ways.

### Presence
1. Lanyard WebSocket
2. Lanyard REST fallback
3. Offline state when nothing can be fetched

### Weather
1. `ipwho.is`
2. `ipapi.co`
3. Open-Meteo forecast
4. Cached data when fresh enough
5. Manual city override

### Lyrics
1. LRCLib synced lyrics
2. LRCLib plain lyrics
3. lyrics.ovh fallback
4. No-lyrics state when nothing returns

### Video / ambient playback
1. Piped search
2. Alternate Piped instance
3. Best-match selection
4. Browser-safe embed fallback / proxy path
5. Invidious-style mirrors when needed

### Keep-awake
1. Native Screen Wake Lock API
2. In-page keep-awake loop
3. External helper fallback

### Aether Bridge
1. File System Access API
2. Demo / denied-access mode
3. PeerJS / WebRTC pair channel
4. BroadcastChannel sync
5. QR / code join flow

### Notes
1. Password-derived AES-GCM style lock flow
2. Encrypted local storage buffer
3. Unlock before viewing
4. Local-only persistence

## Hidden details, commands, and small power-user tricks

These are directly present in the source:

```text
wiki <topic>    → spawns a WikiBoard card for the topic
matrix          → maxes out stream entropy
Delete          → deletes selected WikiBoard card
+ / -           → zoom in / zoom out on WikiBoard canvas
oneko           → opens the Oneko picker
```

Other tiny things worth knowing:

- The Oneko pet can be dragged around.
- The ball can be toggled separately.
- Dog variants fetch.
- The cat can idle-autoplay after a short timeout.
- The companion can speak on boot, after AFK, and during state changes.
- The notes module is meant to feel private and local.
- The error console captures runtime errors and rejected promises.
- The system diagnostics panel includes a hard format action that wipes saved keys, APIs, and layouts.

## Roadmap / evolution notes from the source

The built-in timeline panel describes the project like this:

- **v1.0** — core workspace, multi-window compositor, dock launchers, terminal shell
- **v2.0** — tracking modules, weather, audio visualizers, lyric decks, living archives
- **v3.0** — Jarvis-style companion, gaze cursor effects, reaction overlays, offline speech heartbeats, Nyan trail systems
- **v4.0** — planned automation, client-side custom shader compilation, decentralized signal nodes

## System statistics shown in the app

The system stats panel displays:

- total modules
- API integrations
- lines of code
- render rate
- runtime storage type
- open windows
- saved state size
- performance mode
- CPU cores
- device RAM
- pixel ratio
- online / offline status

Those counters are part of the UI, so they are part of the project story too.

## Theme catalog

The source contains these themes:

- `midnight`
- `aurora`
- `synthwave`
- `ember`
- `ice`
- `rose`
- `solar`
- `hacker`
- `neonvoid`
- `sakura`
- `carbon`
- `ocean`

Each theme changes accent color, wallpaper, glass intensity, and panel styling.

## Local persistence

The project stores state in the browser, so the desktop does not feel like a fresh boot every time.

Typical persisted pieces include:

- open window layout
- settings
- media/radio preferences
- notes
- WikiBoard data
- some companion and system state
- webhook and API configuration fields

## Browser features used:

- `localStorage`
- `WebSocket`
- `BroadcastChannel`
- `WebRTC` / PeerJS
- `File System Access API`
- `Web Crypto`
- `Screen Wake Lock API`
- `Canvas`
- `requestAnimationFrame`
- `navigator.hardwareConcurrency`
- `navigator.deviceMemory`
- `navigator.onLine`

## Credits

The source’s credit panel calls out:

- GSAP
- Three.js
- Leaflet
- Lucide
- Open-Meteo
- WhereTheISS
- Lanyard API
- OtakuGIFs / Nekos

The code also directly imports or references Tailwind, CesiumJS, WebLLM, PeerJS, and several API helper and proxy services.

## Build note

This started as a side project with Claude helping along the way. The file is intentionally ambitious and a little extra. That is the point.
