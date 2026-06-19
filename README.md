# AetherOS-Prod

> A browser-native operating environment built as a side project with Claude.  
> Single-file, client-side, and intentionally overbuilt.

Live demo: <https://meyashverma.github.io/AetherOS-Prod/>  
Repository: <https://github.com/MeYashverma/AetherOS-Prod>

AetherOS is not trying to behave like a normal website. It is closer to a desktop shell that happens to live inside the browser: multi-window, themeable, noisy in the right places, and packed with realtime modules, local memory, and a lot of visual polish.

## What it is

AetherOS runs as a full UI shell inside a single HTML file. The app includes its own window manager, dock, command palette, settings system, local persistence layer, media tools, tracking dashboards, research tools, and a bunch of experimental modules that sit somewhere between useful and completely unnecessary.

It is built to feel like a workstation rather than a page.

## Visual feel

The UI leans hard into a dark, premium, glass-heavy desktop language:

- macOS-style dock with magnification and active indicators
- draggable desktop windows with custom minimize / restore animations
- liquid-glass inspired surfaces and layered shadows
- cinematic wallpapers, particle overlays, scanlines, and cursor effects
- custom cursor modes, Oneko-style companions, sakura petals, and motion-heavy accents
- separate eco and cinematic performance modes

There is a lot of motion in the interface, but it is still meant to stay readable and usable.

## Core shell

### Desktop and window system
- Multi-window desktop environment
- Custom window manager
- Open / close / minimize / restore flow
- Window focus and z-index handling
- Genie-style minimize / restore animation
- Resizable windows
- Dock tooltips and live previews
- Command palette
- Task manager / force-kill support
- Local state persistence in `localStorage`
- Session restore after reload

### Control and system utilities
- Terminal / data stream window
- System monitor with live telemetry
- API status board
- Packet visualizer
- Error console for runtime errors and rejected promises
- Memory scratchpad / encrypted notes
- NoSleep / keep-awake panel
- System encyclopedia / about panel with searchable documentation
- Searchable wiki-style module docs
- Local planner that maps user requests to built-in actions

## Main modules

This is the full module family that shows up in the source and the internal module map.

### Media and audio
- Media Console
- Global Radio Browser
- YouTube Ambient
- Lyrics engine
- Audio visualizer
- Vinyl / tonearm radio view
- Station favorites
- Music history / scrobble-style history
- GIF mood layers for media and radio

### Communication and presence
- Uplink Presence
- Discord / Lanyard telemetry
- Aether Bridge
- Aether Link
- Webhook transmitter
- Local clipboard and file sync flow between paired devices

### Research and knowledge
- WikiBoard
- Living Archive / file manager
- Searchable knowledge planner
- Wikipedia-backed content cards
- Notes / scratchpad
- Feed / signal feed tools

### Space, weather, and maps
- Weather Station
- ISS tracker
- Tactical airspace / globe radar module
- Flight and airspace tracking style tools
- NASA / APOD style integrations

### Creative and entertainment modules
- Games
- Meme / memetic intelligence
- Anime discovery
- Manga launcher
- Retro TV / YTCH.TV
- Wplace / live canvas style modules
- Floor796 exploration
- Entity scanner / pokédex-style lookup tools

### System and diagnostics
- System Config
- System Diagnostics
- Storage inspector
- Performance / FPS / latency / memory reporting
- Screen awake controls
- Theme and appearance controls

## Settings and personalization

The settings panel is split into four main tabs: API Keys, Appearance, Themes, and System.

### API keys and account fields
These are stored locally in the browser and are not meant to be shipped to third parties by the app itself.

- `api_lastfm`
- `api_lastfm_user`
- `api_discord`
- `api_github`
- `api_rss`
- `api_custom_subreddits`

### Appearance and motion
- `theme_accent`
- `active_theme`
- `cursor_theme`
- `cursor_nyan_standard`
- `cursor_oneko`
- `cursor_oneko_variant`
- `cursor_oneko_kuro`
- `cursor_oneko_ball`
- `sakura_petals`
- `sakura_intensity`
- `motion_intensity`
- `performance_mode`
- `wallpaper_mode`
- `anime_quotes`
- `quote_bg_mode`
- `quote_position`
- `quote_bg_gif_provider`

### Media and radio
- `media_tuner_station`
- `media_tuner_volume`
- `media_player_mode`
- `media_gif_provider`
- `radio_gif_enabled`
- `radio_gif_provider`
- `radio_tonearm_x`
- `radio_tonearm_y`
- `radio_tonearm_rot`
- `radio_tonearm_edit`

### Speech and companion
- `speech_synthesis`
- `speech_voice`
- `speech_rate`
- `speech_pitch`
- `speech_volume`
- `speech_companion`
- `speech_afk_timeout`
- `companion_emotion_mode`

### Screen and transport
- `screen_awake_enabled`
- `discord_webhook_url`
- `discord_webhook_username`
- `discord_webhook_avatar`

## APIs and services used

This is the actual integration stack that appears in the source.

### Music and lyrics
- **Last.fm** — music identity, now playing, and listening data
- **LRCLib** — primary synced lyrics lookup
- **lyrics.ovh** — fallback lyrics provider when synced lyrics are not available

### Presence and social
- **Lanyard** — Discord presence over WebSocket
- **Lanyard REST fallback** — used when the socket path fails
- **Discord webhooks** — outbound status / alert / media packets
- **GitHub API / GitHub data hooks** — used for GitHub-related integrations in settings and side features

### Weather and location
- **Open-Meteo** — forecast engine
- **ipwho.is** — first geolocation fallback
- **ipapi.co** — second geolocation fallback
- **Geocoding service** — manual city lookup for weather override

### Radio and media discovery
- **Radio Browser** — global radio station discovery and metadata
- **ytch.tv / ytch.xyz** — retro TV / stream layer and mirror fallback
- **Piped instances** — used for YouTube-style stream lookup and fallback playback flow
- **Nekos / Giphy / Tenor** — GIF mood layers for radio and media states

### Space and maps
- **Where The ISS At** — ISS telemetry
- **OpenSky Network** — flight / airspace style tracking
- **CesiumJS** — 3D globe rendering
- **Three.js** — scene rendering and vector math support

### Research and knowledge
- **Wikipedia** — wiki search and research cards
- **WikiBoard local persistence** — local card storage and restoration
- **Floor796** — live-shell rewrite / mirror support
- **OpenAI / local planner glue** — the app includes a local action planner that maps UI requests to built-in functions

### Miscellaneous services
- **OpenStreetMap-style / geospatial helpers**
- **Nekos Best**
- **Animechan**
- **OpenWeather-style fallback chains via the weather station**
- **File System Access API**
- **PeerJS / WebRTC**
- **BroadcastChannel**
- **File / clipboard sync between peers**

## Fallback chains

This project is full of fallback paths because browser apps break in weird ways. The source already handles a lot of that.

### Presence
1. Lanyard WebSocket
2. Lanyard REST fallback
3. Offline slate when the user is unreachable or the ID is not available

### Weather
1. `ipwho.is` geolocation
2. `ipapi.co` geolocation fallback
3. Open-Meteo forecast request
4. Cached weather data when it is fresh enough
5. Manual city override when geocoding is used

### Lyrics
1. LRCLib synced lyrics
2. LRCLib plain lyrics
3. lyrics.ovh fallback
4. No lyrics available state when nothing is returned

### Keep awake
1. Native Screen Wake Lock API
2. In-page media keep-awake loop
3. External `nosleep.page` helper

### Retro TV / video
1. Direct `ytch.tv`
2. Mirror `ytch.xyz`
3. Custom embed path
4. External fallback behavior when the browser blocks embedded playback

### Aether Bridge
1. File System Access API for real shared folders
2. Demo / fallback mode when folder access is denied
3. PeerJS / WebRTC for remote pairing
4. BroadcastChannel for same-browser pairing and presence sync
5. QR-based join flow

### YouTube / ambient playback
1. Piped instance search
2. Alternative Piped instance if the first one fails
3. Best-match video scoring
4. Timestamp / chapter jumping for hooks, choruses, and drops

### Notes
1. Password-derived AES-GCM key
2. Encrypted local storage buffer
3. Decrypt-on-unlock flow
4. Local-only storage, no obvious server round trip

## Hidden or easy-to-miss bits

These are not the headline features, but they are real and worth documenting.

- Local memory and session counters
- Sarcastic companion lines and AFK / return messages
- Terminal logs for most actions
- Saved radio favorites
- WikiBoard saved state and connections
- Shared file archive navigation
- Searchable about / feature encyclopedia
- Theme docs and module docs
- Runtime error capture
- Diagnostics export to clipboard
- Window previews from the dock
- Live top-bar indicators for performance and presence
- Audio stream cleanup when force-killing media windows
- Motion and particle effects that are swapped based on performance mode

## Performance modes

### Eco
- Lower-cost visual behavior
- Reduced glass blur
- Less visual overhead
- Better for weak machines or battery use

### Cinematic
- Heavier glass / blur / motion effects
- More polished presentation
- More expensive to render, but looks better

## Theme names

The source includes a theme family that goes beyond the default dark look:

- Midnight
- Ember
- Ice
- Rose
- Solar
- Hacker
- Neon Void
- Sakura
- Carbon
- Ocean Depth

## Visual tour

AetherOS is the kind of project that makes more sense when you see it than when you read about it. The best screenshots to include in the repo are:

- check `docs/screenshots/` 

## Local persistence

AetherOS stores its state in the browser so the desktop does not feel like it resets every time.

Saved state includes:
- open windows
- current settings
- media / radio state
- history
- WikiBoard data
- encrypted notes
- some module-specific memory and logs

## Browser requirements

AetherOS depends on modern browser features. The source uses or benefits from:

- `localStorage`
- `WebSocket`
- `BroadcastChannel`
- `WebRTC` / PeerJS
- `File System Access API`
- `Screen Wake Lock API`
- `Web Crypto`
- `Canvas`
- `requestAnimationFrame`
- `navigator.connection` where available

## A note on the build

This was built as a side project with Claude helping out along the way. It is still very much a hands-on project, not a polished product spec.

## Status

This repo is a live experiment, not a minimal demo. A lot of the value is in the combination of modules rather than any single feature.
