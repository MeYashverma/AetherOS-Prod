# App audit and implementation boundaries

All **48 registered apps** received a static source review. This is not a claim that
all external APIs, embeds, devices or permission paths were exercised live.
The same inventory powers About → App guide and each window’s information button.

## Improvements in this change

- Removed invented hardware specifications, static fictional release history and performance guarantees from About.
- Added Yash Verma attribution with portfolio/source links; registry-derived counts, browser observations, implementation links and capability boundaries.
- Changelog fetches real GitHub main commits, caches for 15 minutes, and falls back to a clearly labelled bundled Git snapshot (cached data expires after 24 hours).
- Workspace privacy curtain: responsive glass layout, accessible modal/focus isolation, restored focus, passphrase verifier (PBKDF2-SHA256, 210,000 iterations, random salt), legacy migration, five-attempt cooldown and no plaintext settings field. This does not encrypt files or prevent same-origin script/devtools access. Background audio/network may continue. Ctrl/⌘+Shift+L leaves the browser address-bar shortcut intact.
- Photopea and diagrams.net bridges check exact origin AND active iframe source, bound incoming payload sizes, and target exact outgoing origins. Photopea script arguments use JSON serialization.
- Sandbox console checks iframe identity and message schema, caps text at 8,000 characters and retains at most 200 rows. This does not stop hostile sandbox code consuming CPU.
- Sample revenue card is explicitly labelled; decorative music animation no longer claims to be a measured spectrum. Playback timing uses actual audio time or displays unavailable.
- VFS writes/deletes/metadata transactions report session-only fallback rather than silently implying persistence. Session-only file writes survive subsequent cached reads, but not reload.
- Task Manager lists all closed apps instead of silently truncating to twelve; removed seeded performance chart samples.

## Remaining work / acceptance boundaries

Permission denial, media cleanup on every error path, relay outages, third-party embed policy changes, large datasets, reduced-capability browsers and full mobile visual QA need ongoing testing. Regex utilities may block the main thread; JWT decode is not signature verification. Provider credentials stored in the browser are not secrets. No external provider uptime or universal 60 FPS guarantee is made.

## Automatic metadata

Run `python3 scripts/generate-project-metadata.py` at build/release time. It reads tracked source paths and real Git commits; revision means snapshot origin, not proof of the deployed bundle revision. About also refreshes GitHub history automatically; no API key is required. Offline use shows the bundled snapshot with a freshness warning. Do not hand-author release entries.

## Per-app findings

### System Settings (`settings`) · local

Implementation: `src/modules/shell-and-theme.js`. Local preferences, feature gates, themes and optional wallpaper adapters.

**Boundary / follow-up:** Browser-stored client keys and backups are not a secret vault; provider keys belong on a backend.

### About AetherOS (`about`) · local

Implementation: `src/ui/about-system.js`. Registry-derived app guide, measured browser capabilities and Git/GitHub commit history.

**Boundary / follow-up:** Build metadata is a snapshot; GitHub history may be cached or unavailable. No invented hardware or performance guarantees.

### Terminal (`terminal`) · local

Implementation: `src/modules/diagnostics-and-tasks.js`. JavaScript command dispatcher operating on the browser VFS.

**Boundary / follow-up:** Not a Unix shell; cannot execute host commands or inspect operating-system processes.

### Files (`filemanager`) · hybrid

Implementation: `src/modules/workspace-apps.js`. IndexedDB files, uploads, previews and Wikipedia imports.

**Boundary / follow-up:** Storage can be evicted, denied or session-only; export backups. Not access to arbitrary host files.

### WikiBoard (`wikiboard`) · hybrid

Implementation: `src/modules/workspace-apps.js`. WikiBoardEngine DOM/SVG research canvas with Wikipedia requests.

**Boundary / follow-up:** External content can fail; verify graph persistence and large-board performance.

### Web Browser (`browser`) · embed

Implementation: `src/modules/web-and-feeds.js`. Iframe navigation plus a reader/clipper.

**Boundary / follow-up:** Sites can refuse framing; not a full isolated browser. External sites receive requests.

### Music & Podcasts (`media`) · hybrid

Implementation: `src/modules/media-and-lyrics.js`. Music-theater player adapters, podcast/audio playback, LRCLIB and Last.fm metadata.

**Boundary / follow-up:** External presence is not a playback clock. Missing lyrics do not imply an instrumental track. Legacy visual meter is not an FFT.

### Stickers & Profiles (`stickers`) · network

Implementation: `src/modules/media-library.js`. Manual StickersAPI media search with licensed-source links and fallbacks.

**Boundary / follow-up:** CDN failures and content moderation depend on providers; automatic reaction matching is heuristic.

### World Radio (`radiobrowser`) · network

Implementation: `src/modules/radio-and-youtube.js`. Radio Browser station directory and HTML audio streams.

**Boundary / follow-up:** Station counts are not guaranteed; browser codec, HTTPS, CORS and autoplay restrictions apply.

### Weather (`weather`) · network

Implementation: `src/modules/space-and-weather.js`. Open-Meteo forecast and air-quality requests.

**Boundary / follow-up:** Forecasts are model output, not a personal weather sensor; location requires consent or manual entry.

### News & RSS (`feed`) · network

Implementation: `src/modules/web-and-feeds.js`. HN, Dev.to, GitHub, Reddit and RSS retrieval.

**Boundary / follow-up:** RSS/CORS relays and provider rate limits can fail; verify source timestamps before calling data live.

### Activity & Speed (`sysmon`) · local

Implementation: `src/modules/diagnostics-and-tasks.js`. requestAnimationFrame deltas, optional JS heap/storage/battery APIs and network speed requests.

**Boundary / follow-up:** Measures this page, not host CPU/RAM. Missing metrics must remain unavailable; speed tests transfer data.

### Task Manager (`taskmanager`) · local

Implementation: `src/modules/diagnostics-and-tasks.js`. Window registry and optional page-wide JS heap inspection.

**Boundary / follow-up:** Windows are not OS processes; per-app RAM is not observable. Shared heap cannot be attributed to individual apps.

### Focus & Soundscapes (`focus`) · local

Implementation: `src/modules/focus-and-devpad.js`. Pomodoro/session state and generated WebAudio soundscapes.

**Boundary / follow-up:** Soundscapes are synthesis, not live environmental recordings; background tab throttling can affect timing.

### Dev Studio (`devpad`) · local

Implementation: `src/modules/focus-and-devpad.js`. Markdown editor and JSON/Base64/JWT/regex/SHA tools.

**Boundary / follow-up:** Decoding JWT does not verify its signature; untrusted regex can block the main thread. Review Markdown sanitization.

### Kanban Board (`kanban`) · local

Implementation: `src/modules/power-tools.js`. Saved boards/cards, priorities, drag-and-drop and export.

**Boundary / follow-up:** Drag-and-drop needs a keyboard alternative; browser-only persistence is not team synchronization.

### Photo Booth (`photobooth`) · local

Implementation: `src/modules/native-media-studios.js`. getUserMedia capture, real canvas filters and exports.

**Boundary / follow-up:** Camera permission and a secure context are required. Procedural preview is a demo, not camera input. Pending camera requests are invalidated on close and their tracks are stopped.

### SynthPad Studio (`synthstudio`) · local

Implementation: `src/modules/native-media-studios.js`. WebAudio synthesis, sequencer and oscillator display.

**Boundary / follow-up:** Procedural audio is intentional, not a recording; timing may drift when backgrounded.

### Photopea Studio (`photopea`) · embed

Implementation: `src/modules/opensource-webapps-suite.js`. Official Photopea iframe and postMessage file bridge.

**Boundary / follow-up:** Third-party editor, not a native implementation. Uploaded content goes to the iframe; bridge now checks exact origin and source.

### Whiteboard Studio (`whiteboard`) · embed

Implementation: `src/modules/opensource-webapps-suite.js`. Excalidraw, diagrams.net and tldraw embeds.

**Boundary / follow-up:** Cross-origin persistence and framing policies vary; Draw.io messages require source/origin verification.

### Retro & 3D Makers (`chiptune`) · embed

Implementation: `src/modules/iconic-web-universes.js`. BeepBox, Blockbench and JSPaint external studios.

**Boundary / follow-up:** Third-party tools; availability, storage and export formats are controlled by each service.

### World Museum Gallery (`worldmuseums`) · network

Implementation: `src/modules/live-world-and-science-apis.js`. Art Institute of Chicago and Met Museum object APIs.

**Boundary / follow-up:** Open-access flags vary per object; retain provenance. Failed image fetches are not missing artworks.

### Open Bookshelf (`gutendex`) · network

Implementation: `src/modules/live-world-and-science-apis.js`. Gutendex discovery and Gutenberg reading sources.

**Boundary / follow-up:** Public-domain status varies by jurisdiction; large book loads need cancellation/pagination.

### Earth Monitor (`earthpulse`) · hybrid

Implementation: `src/modules/api-earth-archive-oss.js`. USGS earthquake and EONET event APIs with Windy embed.

**Boundary / follow-up:** Not an emergency alert service; refresh time and network status determine freshness.

### Space Launches (`spacexhub`) · network

Implementation: `src/modules/api-earth-archive-oss.js`. Launch APIs and astronauts feed.

**Boundary / follow-up:** Schedules change and feeds can be stale; countdown is computed from provider dates, not a confirmed launch guarantee.

### 3D Solar System & Sky (`stellarium`) · embed

Implementation: `src/modules/iconic-web-universes.js`. NASA Eyes and Stellarium web embeds.

**Boundary / follow-up:** Remote simulations/visualizations, not measurements made by AetherOS.

### Atlas & Landmarks (`georadar`) · hybrid

Implementation: `src/modules/iconic-web-universes.js`. OSM map embeds and geotagged Wikipedia articles.

**Boundary / follow-up:** Nearby article matches do not guarantee tourist access or precise physical location.

### World Factbook & FX (`worldfactbook`) · network

Implementation: `src/modules/live-world-and-science-apis.js`. REST Countries, World Bank and currency-rate requests.

**Boundary / follow-up:** Country indicators/FX have publication dates; not tick-level financial data.

### Archive & DOS Vault (`wayback`) · hybrid

Implementation: `src/modules/api-earth-archive-oss.js`. Archive.org search, Wayback snapshots and DOS embeds.

**Boundary / follow-up:** An archive may have no snapshot or block embeds; preserve the actual snapshot date and original link.

### Winamp + SomaFM (`winamp`) · hybrid

Implementation: `src/modules/opensource-webapps-suite.js`. Webamp integration and SomaFM stream metadata.

**Boundary / follow-up:** Winamp skin is third-party Webamp, not a rewritten native player; external stream rights and availability vary.

### GitHub Explorer (`ossradar`) · network

Implementation: `src/modules/api-earth-archive-oss.js`. GitHub repository search, tree and README APIs.

**Boundary / follow-up:** Search ranking is not an objective trending metric; unauthenticated GitHub rate limits apply.

### Shader Studio (`shadertoy`) · hybrid

Implementation: `src/modules/iconic-web-universes.js`. Local WebGL shader compilation plus optional Shadertoy embeds.

**Boundary / follow-up:** WebGL and driver support required. Compilation does not guarantee a particular FPS; shader/program/buffer resources are released on recompile and close. External Shadertoy embeds have separate availability.

### Code Sandbox (`codeplay`) · local

Implementation: `src/modules/dev-workbench.js`. Sandboxed srcdoc HTML/CSS/JS and captured console.

**Boundary / follow-up:** Starter metric card uses sample data, now labelled. Source-verified bounded console bridge; user code can still freeze its frame.

### Device Sync (`aetherbridge`) · network

Implementation: `src/modules/shell-and-theme.js`. WebRTC device/folder sharing through AetherBridge service.

**Boundary / follow-up:** Requires signaling/peers; DTLS transport is not proof of peer identity or an authenticated filesystem.

### AetherLink P2P (`aetherlink`) · network

Implementation: `src/modules/shell-and-theme.js`. WebRTC data channels for rooms, chat and transfers.

**Boundary / follow-up:** STUN/signaling may fail behind NAT without TURN; room codes are not a complete authentication system.

### Discord Presence (`presence`) · network

Implementation: `src/modules/web-and-feeds.js`. Lanyard public Discord presence and optional webhook requests.

**Boundary / follow-up:** Presence requires Lanyard participation. Webhook URLs are credentials; do not expose them in shared backups.

### ISS 3D Tracker (`iss`) · hybrid

Implementation: `src/modules/space-and-weather.js`. WhereTheISS position feed on a procedural Three.js globe.

**Boundary / follow-up:** Globe texture/stars are illustrative; coordinates are feed data, not a precision orbital propagator.

### NASA Space (`nasa`) · network

Implementation: `src/modules/space-and-weather.js`. NASA APOD, EPIC and related source endpoints.

**Boundary / follow-up:** Demo-key limits and per-image copyrights apply; APOD can be video, not always a wallpaper.

### Flight Radar (`globe`) · network

Implementation: `src/modules/radar-and-optics.js`. ADS-B provider flights drawn on a geographic viewport.

**Boundary / follow-up:** Not navigation/safety equipment; provider coverage, latency and rate limits apply. Network errors must not synthesize aircraft.

### Crypto Markets (`market`) · network

Implementation: `src/modules/radar-and-optics.js`. CoinGecko crypto prices and chart history.

**Boundary / follow-up:** Delayed provider data, not executable quotes or investment advice; verify rate-limit and stale states.

### Arcade (`games`) · embed

Implementation: `src/modules/anime-and-tv.js`. External web-game embeds.

**Boundary / follow-up:** Browser framing, input and availability vary; not locally implemented games.

### Retro TV (`ytchtv`) · embed

Implementation: `src/modules/anime-and-tv.js`. Curated video channels and YouTube embeds.

**Boundary / follow-up:** Curated playlists are not live television; no playback clock without a player adapter.

### Reddit Gallery (`memes`) · network

Implementation: `src/modules/web-and-feeds.js`. Reddit image feeds and lightbox.

**Boundary / follow-up:** Reddit can block anonymous browser requests; source content moderation/licensing varies.

### Anime (`anime`) · network

Implementation: `src/modules/anime-and-tv.js`. Anime metadata search, seasons, trailers and external links.

**Boundary / follow-up:** Metadata does not grant streaming rights; trailers and episode links may be unavailable.

### Manga Reader (`manga`) · network

Implementation: `src/modules/anime-and-tv.js`. Manga discovery, reading list and MangaDex chapter data.

**Boundary / follow-up:** Chapters depend on language, availability and region; no promise of licensed access to every title.

### Character Dex (`entityscanner`) · hybrid

Implementation: `src/modules/workspace-apps.js`. Character API metadata and a local randomized battle mini-game.

**Boundary / follow-up:** Battle damage and outcomes are game mechanics, not canon power rankings or live measurements.

### Floor796 Panorama (`floor796`) · embed

Implementation: `src/modules/web-and-feeds.js`. Floor796 external panorama/mirror viewer.

**Boundary / follow-up:** Artwork and updates belong to Floor796; mirrors may lag or block framing.

### Wplace World Canvas (`wplace`) · embed

Implementation: `src/modules/web-and-feeds.js`. External collaborative canvas viewer.

**Boundary / follow-up:** No local implementation of the global canvas or guarantee of write access; provider controls sign-in/availability.


## Follow-up: Mac-style lock, author voice & app-wide polish

- Full-wallpaper lock with date/clock, lower user profile, editable display name, reveal/hide passphrase, Caps Lock feedback, optional idle/tab-hide locking, and a real dark-display overlay. No imitation Touch ID, device sleep, power-off or account switching buttons.
- About me is now first-person editorial adapted from the author's repository, using his actual halftone portrait with provenance in `assets/creator/SOURCES.md`.
- All 50 shared icon identities (48 apps plus launcher/notes helpers) have generated dark-tile variants preserving vendored Fluent artwork. Settings offers Dark, Original color and Match device. These are custom presentation variants, not official Microsoft dark assets.
- All 48 window info buttons now open an in-place, keyboard-accessible capability sheet with real implementation, limits, offline context and HTTPS external-embed escape links, rather than forcing a context switch to About.
- Photo Booth stops late camera streams if closed while permission is pending; camera startup/playback errors clean up tracks. Removed the fabricated FaceTime HD hardware label.
- Shader Studio no longer claims 60 FPS or successful compilation without WebGL, and disposes GPU shaders/programs/buffers on failures, recompile and close.
- Shared JSON client now has a compatible abort timer, explicit HTTP/rate-limit/invalid-data errors and a response-size check. It does not substitute demo data on failure.
- Removed stale app counts and fictional shell version labels. Escaped provider errors in feed/Last.fm HTML. Clipboard failure no longer reports a successful copy in Retro TV.

Validation: the local lock/creator layouts were exercised in Chromium at 1440×960 and 390×844 with local substitutes for CDN runtime libraries; remote providers were blocked, not live-certified. The all-app shell probe created all 48 window nodes without uncaught exceptions, but does not establish rendered content or remote functionality. Continue provider-specific, permission and deep interaction checks before calling the entire suite production-hardened.

Final regression check: 83 JavaScript tests and 9 Python server tests passed. Chromium also verified passphrase visibility, dark-display wake, and closing the app details modal before locking. Dark icon regeneration: `npm run icons:dark`; Git history snapshot: `npm run metadata`.
