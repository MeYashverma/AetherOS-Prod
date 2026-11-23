// AetherOS — Module Feature Registry, SystemState, Settings & LocalStorage Persistence

const AETHER_MODULE_PACKS = window.AETHER_MODULE_PACKS = [
    {
        id: 'core',
        label: 'Core Workspace & Creative Studios',
        icon: 'cpu',
        description: 'Files, Dev Studio, Photopea, Whiteboard, Synth/BeepBox/Blockbench studios, Museums, and Gutenberg Library.'
    },
    {
        id: 'network',
        label: 'Sync & Integrations',
        icon: 'share-2',
        description: 'Encrypted WebRTC file transfer, peer-to-peer rooms, cloud sync, and Discord presence.'
    },
    {
        id: 'telemetry',
        label: 'World, Space & Live Data',
        icon: 'satellite',
        description: 'NASA 3D Solar System, Space Launches, Earth Monitor, Atlas & Landmarks, World Factbook, ISS, Flight Radar, and Markets.'
    },
    {
        id: 'entertainment',
        label: 'Audio, Retro & Arcade',
        icon: 'tv',
        description: 'Winamp + SomaFM, Internet Archive & MS-DOS Vault, Retro TV, Arcade, and Reddit Gallery.'
    },
    {
        id: 'anime',
        label: 'Anime, Manga & Pixel Worlds',
        icon: 'sparkles',
        description: 'Seasonal anime browser, MangaDex reader, Character & Pokédex encyclopedia, Floor796, and Wplace.'
    },
    {
        id: 'devtools',
        label: 'Shaders, Code & Open-Source',
        icon: 'wrench',
        description: '60fps WebGL GLSL Shader Studio, GitHub Explorer, and Live HTML/CSS/JS Code Sandbox.'
    }
];

const AETHER_MODULE_REGISTRY = window.AETHER_MODULE_REGISTRY = {
    // Core Workspace & Creative Studios (Enabled by default)
    settings:       { id: 'settings',       label: 'System Settings',         pack: 'core',          icon: 'sliders',     required: true,  defaultEnabled: true,  desc: 'Themes, wallpapers, app modules, audio, and workspace backups' },
    about:          { id: 'about',          label: 'About AetherOS',          pack: 'core',          icon: 'info',        required: true,  defaultEnabled: true,  desc: 'System specifications, architecture diagram, and keyboard shortcuts' },
    terminal:       { id: 'terminal',       label: 'Terminal',                pack: 'core',          icon: 'terminal',    required: false, defaultEnabled: true,  desc: 'Interactive Unix-style shell with file commands, process tools, and HTTP client' },
    filemanager:    { id: 'filemanager',    label: 'Files',                   pack: 'core',          icon: 'folder-tree', required: false, defaultEnabled: true,  desc: 'Local IndexedDB file manager with quick editor, uploads, and Wikipedia import' },
    wikiboard:      { id: 'wikiboard',      label: 'WikiBoard',               pack: 'core',          icon: 'network',     required: false, defaultEnabled: true,  desc: 'Infinite spatial research board with linked Wikipedia cards' },
    browser:        { id: 'browser',        label: 'Web Browser',             pack: 'core',          icon: 'globe',       required: false, defaultEnabled: true,  desc: 'Multi-tab reader & live iframe web browser with Markdown clipper' },
    media:          { id: 'media',          label: 'Music & Podcasts',        pack: 'core',          icon: 'radio',       required: false, defaultEnabled: true,  desc: 'Music search, podcasts, synced lyrics, and Last.fm listening analytics' },
    stickers:       { id: 'stickers',       label: 'Stickers & Profiles',     pack: 'core',          icon: 'smile',       required: false, defaultEnabled: true,  desc: 'Browse StickersAPI stickers, emotes, Telegram sets, profile images and banners' },
    radiobrowser:   { id: 'radiobrowser',   label: 'World Radio',             pack: 'core',          icon: 'radio-tower', required: false, defaultEnabled: true,  desc: 'Stream 30,000+ live global FM and internet stations with audio visualizer' },
    weather:        { id: 'weather',        label: 'Weather',                 pack: 'core',          icon: 'cloud-rain',  required: false, defaultEnabled: true,  desc: '7-day forecast, hourly precipitation, UV index, and live Air Quality' },
    feed:           { id: 'feed',           label: 'News & RSS',              pack: 'core',          icon: 'rss',         required: false, defaultEnabled: true,  desc: 'Split-pane Hacker News, Dev.to, GitHub, Reddit, and RSS reader with comments' },
    sysmon:         { id: 'sysmon',         label: 'Activity & Speed',        pack: 'core',          icon: 'cpu',         required: false, defaultEnabled: true,  desc: 'Real-time frame pacing, JS heap usage, and Cloudflare network speed test' },
    taskmanager:    { id: 'taskmanager',    label: 'Task Manager',            pack: 'core',          icon: 'list-checks', required: false, defaultEnabled: true,  desc: 'Inspect open windows, memory footprint, and close background apps' },
    focus:          { id: 'focus',          label: 'Focus & Soundscapes',     pack: 'core',          icon: 'timer',       required: false, defaultEnabled: true,  desc: 'Pomodoro timer, session checklist, and procedural WebAudio soundscapes' },
    devpad:         { id: 'devpad',         label: 'Dev Studio',              pack: 'core',          icon: 'code-2',      required: false, defaultEnabled: true,  desc: 'Multi-tab Markdown editor plus JSON, Base64, JWT, Regex & SHA-256 toolkit' },
    kanban:         { id: 'kanban',         label: 'Kanban Board',            pack: 'core',          icon: 'kanban',      required: false, defaultEnabled: true,  desc: 'Multi-board Kanban planner with drag-and-drop cards, priority, and Markdown export' },
    photobooth:     { id: 'photobooth',     label: 'Photo Booth',             pack: 'core',          icon: 'aperture',    required: false, defaultEnabled: true,  desc: 'Camera & live FX studio with 9 real-time filters, 3×3 grid & photo strips' },
    synthstudio:    { id: 'synthstudio',    label: 'SynthPad Studio',         pack: 'core',          icon: 'music',       required: false, defaultEnabled: true,  desc: 'Playable polyphonic piano synthesizer, 16-step beat machine & live oscilloscope' },
    photopea:       { id: 'photopea',       label: 'Photopea Studio',         pack: 'core',          icon: 'layers',      required: false, defaultEnabled: true,  desc: 'Full Photoshop/PSD layer studio integrated with Files' },
    whiteboard:     { id: 'whiteboard',     label: 'Whiteboard Studio',       pack: 'core',          icon: 'pen-tool',    required: false, defaultEnabled: true,  desc: 'Excalidraw, Draw.io dark diagramming & tldraw infinite canvas' },
    chiptune:       { id: 'chiptune',       label: 'Retro & 3D Makers',       pack: 'core',          icon: 'boxes',       required: false, defaultEnabled: true,  desc: 'Open-source BeepBox chiptune DAW, Blockbench 3D studio & JSPaint pixel art' },
    worldmuseums:   { id: 'worldmuseums',   label: 'World Museum Gallery',    pack: 'core',          icon: 'landmark',    required: false, defaultEnabled: true,  desc: 'Art Institute of Chicago IIIF & Met Museum open-access HD masterpieces' },
    gutendex:       { id: 'gutendex',       label: 'Open Bookshelf',          pack: 'core',          icon: 'library',     required: false, defaultEnabled: true,  desc: '70,000+ public-domain classics via Gutendex API with Sepia & OLED e-reader' },

    // World, Space & Live Data (Enabled by default)
    earthpulse:     { id: 'earthpulse',     label: 'Earth Monitor',           pack: 'telemetry',     icon: 'globe-2',     required: false, defaultEnabled: true,  desc: 'Live USGS global earthquakes, NASA EONET natural events & Windy weather radar' },
    spacexhub:      { id: 'spacexhub',      label: 'Space Launches',          pack: 'telemetry',     icon: 'rocket',      required: false, defaultEnabled: true,  desc: 'Live global rocket launch countdowns & astronauts currently in orbit' },
    stellarium:     { id: 'stellarium',     label: '3D Solar System & Sky',   pack: 'telemetry',     icon: 'orbit',       required: false, defaultEnabled: true,  desc: 'Official NASA JPL 3D Solar System, Asteroids, Earth Fleet & Stellarium sky' },
    georadar:       { id: 'georadar',       label: 'Atlas & Landmarks',       pack: 'telemetry',     icon: 'compass',     required: false, defaultEnabled: true,  desc: 'OpenStreetMap live viewport paired with nearby geo-tagged Wikipedia articles' },
    worldfactbook:  { id: 'worldfactbook',  label: 'World Factbook & FX',     pack: 'telemetry',     icon: 'flag',        required: false, defaultEnabled: true,  desc: '250+ nations via REST Countries v3.1, GDP history & live ECB currency rates' },

    // Audio, Shaders & Open-Source (Enabled by default)
    wayback:        { id: 'wayback',        label: 'Archive & DOS Vault',     pack: 'entertainment', icon: 'history',     required: false, defaultEnabled: true,  desc: 'Wayback Time Machine, playable MS-DOS classics & Internet Archive media' },
    winamp:         { id: 'winamp',         label: 'Winamp + SomaFM',         pack: 'entertainment', icon: 'disc-3',      required: false, defaultEnabled: true,  desc: 'Classic Winamp 2.9 skinnable desktop deck with 10-band EQ & live SomaFM radio' },
    ossradar:       { id: 'ossradar',       label: 'GitHub Explorer',         pack: 'devtools',      icon: 'git-branch',  required: false, defaultEnabled: true,  desc: 'Breakout GitHub repositories, live repository file-tree & README code viewer' },
    shadertoy:      { id: 'shadertoy',      label: 'Shader Studio',           pack: 'devtools',      icon: 'flame',       required: false, defaultEnabled: true,  desc: '60fps WebGL Shadertoy-compatible GLSL compiler & live wallpaper capture' },
    codeplay:       { id: 'codeplay',       label: 'Code Sandbox',            pack: 'devtools',      icon: 'play-square', required: false, defaultEnabled: true,  desc: 'Live HTML/CSS/JS playground with CDN library loader & interactive console' },

    // Sync & Integrations (Opt-in via Settings -> App Modules)
    aetherbridge:   { id: 'aetherbridge',   label: 'Device Sync',             pack: 'network',       icon: 'share-2',     required: false, defaultEnabled: false, desc: 'Encrypted WebRTC device folder sharing, QR pairing & DevPad sync' },
    aetherlink:     { id: 'aetherlink',     label: 'AetherLink P2P',          pack: 'network',       icon: 'link-2',      required: false, defaultEnabled: false, desc: 'Encrypted WebRTC peer-to-peer file transfer, clipboard & room chat' },
    presence:       { id: 'presence',       label: 'Discord Presence',        pack: 'network',       icon: 'user',        required: false, defaultEnabled: false, desc: 'Live Discord Lanyard status card and rich-embed Webhook composer' },

    // Additional Space, Flight & Crypto Apps (Opt-in)
    iss:            { id: 'iss',            label: 'ISS 3D Tracker',          pack: 'telemetry',     icon: 'satellite',   required: false, defaultEnabled: false, desc: 'Interactive Three.js Earth globe tracking the International Space Station' },
    nasa:           { id: 'nasa',           label: 'NASA Space',              pack: 'telemetry',     icon: 'telescope',   required: false, defaultEnabled: false, desc: 'Astronomy Picture of the Day archive, EPIC Earth, Mars rovers & solar flares' },
    globe:          { id: 'globe',          label: 'Flight Radar',            pack: 'telemetry',     icon: 'plane',       required: false, defaultEnabled: false, desc: 'Live ADS-B flight map, region quick-jump, and aircraft transponder inspector' },
    market:         { id: 'market',         label: 'Crypto Markets',          pack: 'telemetry',     icon: 'trending-up', required: false, defaultEnabled: false, desc: 'Multi-asset crypto watchlist, live OHLC candlestick charts, and USD converter' },

    // Culture & Arcade (Opt-in)
    games:          { id: 'games',          label: 'Arcade',                  pack: 'entertainment', icon: 'gamepad-2',   required: false, defaultEnabled: false, desc: 'Playable web arcade games including Tetris, Slow Roads, Krunker & PAC-MAN' },
    ytchtv:         { id: 'ytchtv',         label: 'Retro TV',                pack: 'entertainment', icon: 'tv',          required: false, defaultEnabled: false, desc: 'Channel-surfing CRT television with curated streams & custom YouTube tuner' },
    memes:          { id: 'memes',          label: 'Reddit Gallery',          pack: 'entertainment', icon: 'smile',       required: false, defaultEnabled: false, desc: 'Browse image feeds from popular or custom subreddits with lightbox zoom' },
    anime:          { id: 'anime',          label: 'Anime',                   pack: 'anime',         icon: 'sparkles',    required: false, defaultEnabled: false, desc: 'Seasonal & top anime browser with trailers, episode guides & streaming links' },
    manga:          { id: 'manga',          label: 'Manga Reader',            pack: 'anime',         icon: 'book-open',   required: false, defaultEnabled: false, desc: 'Manga discovery, personal reading list & English MangaDex chapter reader' },
    entityscanner:  { id: 'entityscanner',  label: 'Character Dex',           pack: 'anime',         icon: 'scan',        required: false, defaultEnabled: false, desc: 'Pokédex, Anime & Dragon Ball character encyclopedia with stats and 1v1 arena' },
    floor796:       { id: 'floor796',       label: 'Floor796 Panorama',       pack: 'anime',         icon: 'building-2',  required: false, defaultEnabled: false, desc: 'Animated isometric pixel-art space station explorer and changelog' },
    wplace:         { id: 'wplace',         label: 'Wplace World Canvas',     pack: 'anime',         icon: 'paintbrush',  required: false, defaultEnabled: false, desc: 'Collaborative world map pixel canvas viewer' }
};

function buildDefaultEnabledModules() {
    const map = {};
    Object.values(AETHER_MODULE_REGISTRY).forEach((mod) => {
        map[mod.id] = Boolean(mod.required || mod.defaultEnabled);
    });
    return map;
}

const SystemState = window.SystemState = {
    defaultEnabledModules: buildDefaultEnabledModules,
    windows: {
        settings:       { id: 'settings',       title: 'System Settings',         icon: 'sliders',     width: 840,  height: 580, x: 90,  y: 50,  isOpen: true,  isMinimized: false, zIndex: 1,  content: 'settings' },
        terminal:       { id: 'terminal',       title: 'Terminal',                icon: 'terminal',    width: 860,  height: 540, x: 140, y: 75,  isOpen: false, isMinimized: false, zIndex: 2,  content: 'terminal' },
        media:          { id: 'media',          title: 'Music & Podcasts',        icon: 'radio',       width: 1040, height: 660, x: 160, y: 70,  isOpen: false, isMinimized: false, zIndex: 3,  content: 'media' },
        stickers:       { id: 'stickers',       title: 'Stickers & Profiles',     icon: 'smile',       width: 820,  height: 570, x: 185, y: 86,  isOpen: false, isMinimized: false, zIndex: 67, content: 'stickers' },
        radiobrowser:   { id: 'radiobrowser',   title: 'World Radio',             icon: 'radio-tower', width: 780,  height: 540, x: 180, y: 85,  isOpen: false, isMinimized: false, zIndex: 12, content: 'radiobrowser' },
        sysmon:         { id: 'sysmon',         title: 'Activity & Speed',        icon: 'cpu',         width: 960,  height: 640, x: 120, y: 50,  isOpen: false, isMinimized: false, zIndex: 4,  content: 'sysmon' },
        presence:       { id: 'presence',       title: 'Discord Presence',        icon: 'user',        width: 780,  height: 560, x: 190, y: 80,  isOpen: false, isMinimized: false, zIndex: 5,  content: 'presence' },
        feed:           { id: 'feed',           title: 'News & RSS',              icon: 'rss',         width: 920,  height: 580, x: 130, y: 65,  isOpen: false, isMinimized: false, zIndex: 6,  content: 'feed' },
        browser:        { id: 'browser',        title: 'Web Browser',             icon: 'globe',       width: 940,  height: 600, x: 100, y: 55,  isOpen: false, isMinimized: false, zIndex: 7,  content: 'browser' },
        wplace:         { id: 'wplace',         title: 'Wplace World Canvas',     icon: 'paintbrush',  width: 1120, height: 720, x: 60,  y: 35,  isOpen: false, isMinimized: false, zIndex: 33, content: 'wplace' },
        floor796:       { id: 'floor796',       title: 'Floor796 Panorama',       icon: 'building-2',  width: 1180, height: 740, x: 50,  y: 32,  isOpen: false, isMinimized: false, zIndex: 34, content: 'floor796' },
        globe:          { id: 'globe',          title: 'Flight Radar',            icon: 'plane',       width: 920,  height: 590, x: 130, y: 55,  isOpen: false, isMinimized: false, zIndex: 8,  content: 'globe' },
        market:         { id: 'market',         title: 'Crypto Markets',          icon: 'trending-up', width: 920,  height: 580, x: 135, y: 60,  isOpen: false, isMinimized: false, zIndex: 9,  content: 'market' },
        memes:          { id: 'memes',          title: 'Reddit Gallery',          icon: 'smile',       width: 760,  height: 600, x: 200, y: 70,  isOpen: false, isMinimized: false, zIndex: 13, content: 'memes' },
        ytchtv:         { id: 'ytchtv',         title: 'Retro TV',                icon: 'tv',          width: 860,  height: 580, x: 120, y: 70,  isOpen: false, isMinimized: false, zIndex: 14, content: 'ytchtv' },
        entityscanner:  { id: 'entityscanner',  title: 'Character Dex',           icon: 'scan',        width: 920,  height: 620, x: 100, y: 45,  isOpen: false, isMinimized: false, zIndex: 15, content: 'entityscanner' },
        filemanager:    { id: 'filemanager',    title: 'Files',                   icon: 'folder-tree', width: 1100, height: 680, x: 70,  y: 38,  isOpen: false, isMinimized: false, zIndex: 17, content: 'filemanager' },
        wikiboard:      { id: 'wikiboard',      title: 'WikiBoard',               icon: 'network',     width: 1050, height: 680, x: 80,  y: 34,  isOpen: false, isMinimized: false, zIndex: 16, content: 'wikiboard' },
        weather:        { id: 'weather',        title: 'Weather',                 icon: 'cloud-rain',  width: 800,  height: 570, x: 110, y: 58,  isOpen: false, isMinimized: false, zIndex: 20, content: 'weather' },
        nasa:           { id: 'nasa',           title: 'NASA Space',              icon: 'telescope',   width: 820,  height: 580, x: 120, y: 62,  isOpen: false, isMinimized: false, zIndex: 21, content: 'nasa' },
        taskmanager:    { id: 'taskmanager',    title: 'Task Manager',            icon: 'list-checks', width: 700,  height: 500, x: 160, y: 75,  isOpen: false, isMinimized: false, zIndex: 22, content: 'taskmanager' },
        games:          { id: 'games',          title: 'Arcade',                  icon: 'gamepad-2',   width: 980,  height: 660, x: 70,  y: 35,  isOpen: false, isMinimized: false, zIndex: 23, content: 'games' },
        iss:            { id: 'iss',            title: 'ISS 3D Tracker',          icon: 'satellite',   width: 980,  height: 660, x: 140, y: 70,  isOpen: false, isMinimized: false, zIndex: 24, content: 'iss' },
        anime:          { id: 'anime',          title: 'Anime',                   icon: 'sparkles',    width: 920,  height: 620, x: 95,  y: 45,  isOpen: false, isMinimized: false, zIndex: 26, content: 'anime' },
        manga:          { id: 'manga',          title: 'Manga Reader',            icon: 'book-open',   width: 940,  height: 620, x: 105, y: 50,  isOpen: false, isMinimized: false, zIndex: 27, content: 'manga' },
        about:          { id: 'about',          title: 'About AetherOS',          icon: 'info',        width: 940,  height: 640, x: 120, y: 55,  isOpen: false, isMinimized: false, zIndex: 35, content: 'about' },
        aetherbridge:   { id: 'aetherbridge',   title: 'Device Sync',             icon: 'share-2',     width: 1040, height: 660, x: 80,  y: 40,  isOpen: false, isMinimized: false, zIndex: 36, content: 'aetherbridge' },
        aetherlink:     { id: 'aetherlink',     title: 'AetherLink P2P',          icon: 'link-2',      width: 1020, height: 660, x: 90,  y: 45,  isOpen: false, isMinimized: false, zIndex: 37, content: 'aetherlink' },
        focus:          { id: 'focus',          title: 'Focus & Soundscapes',     icon: 'timer',       width: 780,  height: 540, x: 130, y: 65,  isOpen: false, isMinimized: false, zIndex: 38, content: 'focus' },
        devpad:         { id: 'devpad',         title: 'Dev Studio',              icon: 'code-2',      width: 960,  height: 620, x: 100, y: 50,  isOpen: false, isMinimized: false, zIndex: 39, content: 'devpad' },
        kanban:         { id: 'kanban',         title: 'Kanban Board',            icon: 'kanban',      width: 980,  height: 620, x: 95,  y: 48,  isOpen: false, isMinimized: false, zIndex: 40, content: 'kanban' },
        codeplay:       { id: 'codeplay',       title: 'Code Sandbox',            icon: 'play-square', width: 1040, height: 660, x: 75,  y: 38,  isOpen: false, isMinimized: false, zIndex: 44, content: 'codeplay' },
        photobooth:     { id: 'photobooth',     title: 'Photo Booth',             icon: 'aperture',    width: 820,  height: 600, x: 115, y: 48,  isOpen: false, isMinimized: false, zIndex: 47, content: 'photobooth' },
        synthstudio:    { id: 'synthstudio',    title: 'SynthPad Studio',         icon: 'music',       width: 900,  height: 580, x: 100, y: 52,  isOpen: false, isMinimized: false, zIndex: 49, content: 'synthstudio' },
        earthpulse:     { id: 'earthpulse',     title: 'Earth Monitor',           icon: 'globe-2',     width: 1060, height: 670, x: 75,  y: 38,  isOpen: false, isMinimized: false, zIndex: 53, content: 'earthpulse' },
        wayback:        { id: 'wayback',        title: 'Archive & DOS Vault',     icon: 'history',     width: 1040, height: 660, x: 85,  y: 42,  isOpen: false, isMinimized: false, zIndex: 54, content: 'wayback' },
        ossradar:       { id: 'ossradar',       title: 'GitHub Explorer',         icon: 'git-branch',  width: 1050, height: 660, x: 80,  y: 40,  isOpen: false, isMinimized: false, zIndex: 55, content: 'ossradar' },
        photopea:       { id: 'photopea',       title: 'Photopea Studio',         icon: 'layers',      width: 1120, height: 700, x: 60,  y: 34,  isOpen: false, isMinimized: false, zIndex: 56, content: 'photopea' },
        whiteboard:     { id: 'whiteboard',     title: 'Whiteboard Studio',       icon: 'pen-tool',    width: 1080, height: 680, x: 70,  y: 36,  isOpen: false, isMinimized: false, zIndex: 57, content: 'whiteboard' },
        winamp:         { id: 'winamp',         title: 'Winamp + SomaFM',         icon: 'disc-3',      width: 820,  height: 560, x: 110, y: 60,  isOpen: false, isMinimized: false, zIndex: 58, content: 'winamp' },
        worldmuseums:   { id: 'worldmuseums',   title: 'World Museum Gallery',    icon: 'landmark',    width: 1080, height: 680, x: 72,  y: 36,  isOpen: false, isMinimized: false, zIndex: 59, content: 'worldmuseums' },
        spacexhub:      { id: 'spacexhub',      title: 'Space Launches',          icon: 'rocket',      width: 1050, height: 660, x: 82,  y: 40,  isOpen: false, isMinimized: false, zIndex: 60, content: 'spacexhub' },
        worldfactbook:  { id: 'worldfactbook',  title: 'World Factbook & FX',     icon: 'flag',        width: 1040, height: 660, x: 88,  y: 42,  isOpen: false, isMinimized: false, zIndex: 61, content: 'worldfactbook' },
        gutendex:       { id: 'gutendex',       title: 'Open Bookshelf',          icon: 'library',     width: 1060, height: 670, x: 78,  y: 38,  isOpen: false, isMinimized: false, zIndex: 62, content: 'gutendex' },
        shadertoy:      { id: 'shadertoy',      title: 'Shader Studio',           icon: 'flame',       width: 1080, height: 660, x: 74,  y: 36,  isOpen: false, isMinimized: false, zIndex: 63, content: 'shadertoy' },
        stellarium:     { id: 'stellarium',     title: '3D Solar System & Sky',   icon: 'orbit',       width: 1120, height: 700, x: 64,  y: 34,  isOpen: false, isMinimized: false, zIndex: 64, content: 'stellarium' },
        chiptune:       { id: 'chiptune',       title: 'Retro & 3D Makers',       icon: 'boxes',       width: 1100, height: 690, x: 68,  y: 35,  isOpen: false, isMinimized: false, zIndex: 65, content: 'chiptune' },
        georadar:       { id: 'georadar',       title: 'Atlas & Landmarks',       icon: 'compass',     width: 1060, height: 660, x: 80,  y: 40,  isOpen: false, isMinimized: false, zIndex: 66, content: 'georadar' }
    },
    settings: {
        api_lastfm: '',
        api_lastfm_user: '',
        api_discord: '',
        api_github: '',
        api_rss: '',
        api_custom_subreddits: '',
        theme_accent: '#ffffff',
        cursor_theme: 'aether',
        cursor_nyan_standard: 'off',
        lyrics_theme: 'default',
        cursor_oneko: 'off',
        cursor_oneko_variant: 'classic',
        cursor_oneko_kuro: 'off',
        cursor_oneko_ball: 'off',
        sakura_petals: 'off',
        sakura_intensity: 'normal',
        motion_intensity: 'high',
        performance_mode: 'eco',
        desktop_sidebar: 'off',
        active_space: 1,
        lock_pin: '',
        media_tuner_station: 'lastfm',
        media_tuner_volume: 0.7,
        media_player_mode: 'monitor',
        media_gif_provider: 'mixed',
        chat_sticker_source: 'auto',
        chat_media_avatar: null,
        chat_media_banner: null,
        radio_gif_enabled: 'off',
        radio_gif_provider: 'nekos',
        radio_tonearm_x: 0,
        radio_tonearm_y: 0,
        radio_tonearm_rot: 0,
        radio_tonearm_edit: 'off',
        wallpaper_mode: 'default',
        wallpaper_custom_url: '',
        wallpaper_dim: 25,
        wallpaper_blur: 0,
        wallpaper_mesh_c1: '#4f46e5',
        wallpaper_mesh_c2: '#ec4899',
        wallpaper_mesh_c3: '#14b8a6',
        anime_quotes: 'off',
        quote_bg_mode: 'none',
        quote_position: 'top-left',
        quote_gif_api_key: '',
        quote_bg_gif_provider: 'nekos',
        speech_synthesis: 'off',
        speech_voice: 'auto-real',
        speech_rate: 0.92,
        speech_pitch: 0.88,
        speech_volume: 0.85,
        speech_companion: 'off',
        speech_afk_timeout: 90,
        companion_emotion_mode: 'gif',
        screen_awake_enabled: 'off',
        discord_webhook_url: '',
        discord_webhook_username: 'AetherOS',
        discord_webhook_avatar: '',
        enabled_modules: buildDefaultEnabledModules()
    },
    history: [],
    activeZIndex: 38,
    init() {
        const defaultWindows = {};
        Object.keys(this.windows).forEach((k) => {
            defaultWindows[k] = { ...this.windows[k] };
        });

        this.load(defaultWindows);
        delete this.settings.about;

        // Ensure every registered window exists and synchronize clean titles/icons/minimums
        Object.keys(defaultWindows).forEach((k) => {
            if (!this.windows[k]) {
                this.windows[k] = { ...defaultWindows[k] };
            } else {
                this.windows[k].title = defaultWindows[k].title;
                this.windows[k].icon = defaultWindows[k].icon;
                this.windows[k].content = defaultWindows[k].content;
            }
        });
        if (this.windows.settings) {
            this.windows.settings.width = Math.max(this.windows.settings.width || 0, 820);
            this.windows.settings.height = Math.max(this.windows.settings.height || 0, 560);
        }
        if (this.windows.sysmon) {
            this.windows.sysmon.width = Math.max(this.windows.sysmon.width || 0, 920);
            this.windows.sysmon.height = Math.max(this.windows.sysmon.height || 0, 620);
            this.windows.sysmon.x = Math.min(this.windows.sysmon.x || 120, Math.max(20, window.innerWidth - 980));
            this.windows.sysmon.y = Math.min(this.windows.sysmon.y || 50, 80);
        }
        if (this.windows.presence) {
            this.windows.presence.width = Math.max(this.windows.presence.width || 0, 760);
            this.windows.presence.height = Math.max(this.windows.presence.height || 0, 560);
        }
        if (this.windows.feed) {
            this.windows.feed.width = Math.max(this.windows.feed.width || 0, 860);
            this.windows.feed.height = Math.max(this.windows.feed.height || 0, 540);
        }
        if (this.windows.market) {
            this.windows.market.width = Math.max(this.windows.market.width || 0, 860);
            this.windows.market.height = Math.max(this.windows.market.height || 0, 540);
        }
        if (this.windows.terminal) {
            this.windows.terminal.width = Math.max(this.windows.terminal.width || 0, 820);
            this.windows.terminal.height = Math.max(this.windows.terminal.height || 0, 520);
        }
        if (this.windows.media) {
            this.windows.media.width = Math.max(this.windows.media.width || 0, 1040);
            this.windows.media.height = Math.max(this.windows.media.height || 0, 660);
        }
        if (this.windows.iss) {
            this.windows.iss.width = Math.max(this.windows.iss.width || 0, 980);
            this.windows.iss.height = Math.max(this.windows.iss.height || 0, 660);
        }

        // Normalize enabled_modules registry and ensure required modules stay enabled
        const normalizedModules = buildDefaultEnabledModules();
        if (this.settings.enabled_modules && typeof this.settings.enabled_modules === 'object') {
            Object.keys(normalizedModules).forEach((id) => {
                if (typeof this.settings.enabled_modules[id] === 'boolean') {
                    normalizedModules[id] = this.settings.enabled_modules[id];
                }
            });
        }
        Object.values(AETHER_MODULE_REGISTRY).forEach((mod) => {
            if (mod.required) normalizedModules[mod.id] = true;
            if (!normalizedModules[mod.id] && this.windows[mod.id]) {
                this.windows[mod.id].isOpen = false;
                this.windows[mod.id].isMinimized = false;
            }
        });
        this.settings.enabled_modules = normalizedModules;
    },
    load(defaultWindowsMap) {
        try {
            const saved = localStorage.getItem('AetherOS_State');
            if (saved) {
                const parsed = JSON.parse(saved);
                const defaults = { ...this.settings, enabled_modules: buildDefaultEnabledModules() };
                if (parsed.windows && typeof parsed.windows === 'object') {
                    const allowed = defaultWindowsMap || this.windows;
                    Object.keys(parsed.windows).forEach((id) => {
                        if (id in allowed) {
                            this.windows[id] = { ...(this.windows[id] || {}), ...parsed.windows[id] };
                        }
                    });
                }
                if (parsed.settings && typeof parsed.settings === 'object') {
                    this.settings = {
                        ...defaults,
                        ...parsed.settings,
                        enabled_modules: {
                            ...defaults.enabled_modules,
                            ...(parsed.settings.enabled_modules && typeof parsed.settings.enabled_modules === 'object'
                                ? parsed.settings.enabled_modules
                                : {})
                        }
                    };
                }
                delete this.settings.about;
                if (this.settings.quote_gif_api_key === '1Oz2uD6DabK9pVK7zaqkXxLiEwuKje1vQSSrj8mTIiM6tV5qnuSn8b7lEqSPyvGw') {
                    this.settings.quote_gif_api_key = '';
                }
                if (parsed.history) this.history = parsed.history;
            }
        } catch (e) {
            console.error('Save state corrupted', e);
        }
    },
    _saveTimer: null,
    _lastSavePayload: '',
    saveNow() {
        const payload = JSON.stringify({
            windows: this.windows,
            settings: this.settings,
            history: this.history
        });
        if (payload !== this._lastSavePayload) {
            localStorage.setItem('AetherOS_State', payload);
            this._lastSavePayload = payload;
        }
    },
    save() {
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this.saveNow(), 180);
    },
    reset() {
        localStorage.removeItem('AetherOS_State');
        location.reload();
    }
};
window.SystemState = SystemState;

window.addEventListener('pagehide', () => SystemState.saveNow(), { passive: true });
document.addEventListener('visibilitychange', () => {
    if (document.hidden) SystemState.saveNow();
}, { passive: true });
