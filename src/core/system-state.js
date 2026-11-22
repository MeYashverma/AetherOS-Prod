// AetherOS — Module Feature Registry, SystemState, Settings & LocalStorage Persistence

const AETHER_MODULE_PACKS = window.AETHER_MODULE_PACKS = [
    {
        id: 'core',
        label: 'Core Workstation',
        icon: 'cpu',
        description: 'Essential desktop utilities, files, browser, notes, media, and diagnostics enabled out of the box.'
    },
    {
        id: 'network',
        label: 'P2P & Social Sync',
        icon: 'share-2',
        description: 'WebRTC file sync, peer-to-peer chat/voice rooms, and live Discord Lanyard presence.'
    },
    {
        id: 'telemetry',
        label: 'Space, Radar & Live Sensors',
        icon: 'satellite',
        description: '3D ISS orbital tracker, NASA space weather, ADS-B flight radar, crypto matrix, and camera HUD.'
    },
    {
        id: 'entertainment',
        label: 'Entertainment & Media Extras',
        icon: 'tv',
        description: 'Retro channel-surfing TV, ambient YouTube deck, embedded arcade vault, and Reddit meme feed.'
    },
    {
        id: 'anime',
        label: 'Anime, Manga & Pixel Worlds',
        icon: 'sparkles',
        description: 'Seasonal anime tracker, MangaDex reader, entity combat scanner, Floor796, and Wplace canvas.'
    },
    {
        id: 'devtools',
        label: 'Developer & Power Utilities',
        icon: 'wrench',
        description: 'Wake-lock screen utility, LocalStorage inspector, runtime error console, API health, and packet monitor.'
    }
];

const AETHER_MODULE_REGISTRY = window.AETHER_MODULE_REGISTRY = {
    // Core Workstation (Enabled by default)
    settings:       { id: 'settings',       label: 'System Settings',         pack: 'core', icon: 'sliders',     required: true,  defaultEnabled: true,  desc: 'System preferences, feature toggles, themes, and diagnostics' },
    about:          { id: 'about',          label: 'System Encyclopedia',     pack: 'core', icon: 'info',        required: true,  defaultEnabled: true,  desc: 'Architecture overview, shortcuts, and platform documentation' },
    terminal:       { id: 'terminal',       label: 'Terminal (Data Stream)',  pack: 'core', icon: 'terminal',    required: false, defaultEnabled: true,  desc: 'Interactive command shell and live system log stream' },
    filemanager:    { id: 'filemanager',    label: 'File Explorer',           pack: 'core', icon: 'folder-tree', required: false, defaultEnabled: true,  desc: 'Virtual filesystem browser, asset previewer, and text editor' },
    notes:          { id: 'notes',          label: 'Memory Scratchpad',       pack: 'core', icon: 'lock',        required: false, defaultEnabled: true,  desc: 'Local persistent notes and quick encrypted scratchpad' },
    wikiboard:      { id: 'wikiboard',      label: 'WikiBoard Canvas',        pack: 'core', icon: 'network',     required: false, defaultEnabled: true,  desc: 'Infinite spatial research board with Wikipedia cards' },
    browser:        { id: 'browser',        label: 'Web Proxy Browser',       pack: 'core', icon: 'globe',       required: false, defaultEnabled: true,  desc: 'Sandboxed web frame with reader & proxy fallback' },
    media:          { id: 'media',          label: 'Media Console',           pack: 'core', icon: 'radio',       required: false, defaultEnabled: true,  desc: 'Last.fm scrobble analytics, synced lyrics, and audio player' },
    radiobrowser:   { id: 'radiobrowser',   label: 'Global Radio',            pack: 'core', icon: 'radio-tower', required: false, defaultEnabled: true,  desc: 'Worldwide live internet radio directory and vinyl tuner' },
    weather:        { id: 'weather',        label: 'Weather Station',         pack: 'core', icon: 'cloud-rain',  required: false, defaultEnabled: true,  desc: 'Local forecast, hourly atmospheric chart, and topbar pill' },
    feed:           { id: 'feed',           label: 'Signal Feed',             pack: 'core', icon: 'rss',         required: false, defaultEnabled: true,  desc: 'Unified Hacker News, Reddit, and custom RSS reader' },
    sysmon:         { id: 'sysmon',         label: 'System Monitor',          pack: 'core', icon: 'cpu',         required: false, defaultEnabled: true,  desc: 'Real-time FPS, memory, GPU, and hardware telemetry' },
    taskmanager:    { id: 'taskmanager',    label: 'Task Manager',            pack: 'core', icon: 'list-checks', required: false, defaultEnabled: true,  desc: 'Active window process list and memory management' },

    // P2P & Social Sync (Disabled by default — opt-in via Settings -> App Modules)
    aetherbridge:   { id: 'aetherbridge',   label: 'Aether Bridge',           pack: 'network', icon: 'share-2',     required: false, defaultEnabled: false, desc: 'Encrypted WebRTC peer-to-peer file transfer & topbar badge' },
    aetherlink:     { id: 'aetherlink',     label: 'Aether Link',             pack: 'network', icon: 'link-2',      required: false, defaultEnabled: false, desc: 'Peer-to-peer room chat, voice channels & topbar badge' },
    presence:       { id: 'presence',       label: 'Discord Presence Studio', pack: 'network', icon: 'user',        required: false, defaultEnabled: false, desc: 'Live Lanyard status sync, sidebar widget, and webhook sender' },

    // Space, Radar & Live Sensors (Disabled by default)
    iss:            { id: 'iss',            label: 'ISS 3D Tracker',          pack: 'telemetry', icon: 'satellite',   required: false, defaultEnabled: false, desc: 'Interactive Three.js Earth globe tracking the Space Station' },
    nasa:           { id: 'nasa',           label: 'NASA Deep Space',         pack: 'telemetry', icon: 'telescope',   required: false, defaultEnabled: false, desc: 'Astronomy Picture of the Day and DONKI solar storm alerts' },
    globe:          { id: 'globe',          label: 'Airspace Radar',          pack: 'telemetry', icon: 'plane',       required: false, defaultEnabled: false, desc: 'Live ADS-B tactical flight map and aircraft transponder inspector' },
    market:         { id: 'market',         label: 'Crypto Market Matrix',    pack: 'telemetry', icon: 'trending-up', required: false, defaultEnabled: false, desc: 'Live Binance WebSocket price stream and sparkline matrix' },
    surveillance:   { id: 'surveillance',   label: 'Optics Node',             pack: 'telemetry', icon: 'camera',      required: false, defaultEnabled: false, desc: 'Local webcam viewfinder with HUD overlays and frame capture' },

    // Entertainment & Media Extras (Disabled by default)
    games:          { id: 'games',          label: 'Game Vault',              pack: 'entertainment', icon: 'gamepad-2', required: false, defaultEnabled: false, desc: 'Embedded lightweight web arcade and puzzle collection' },
    ytchtv:         { id: 'ytchtv',         label: 'Retro TV (YTCH.TV)',      pack: 'entertainment', icon: 'tv',        required: false, defaultEnabled: false, desc: 'Nostalgic channel-surfing television simulator' },
    youtubeambient: { id: 'youtubeambient', label: 'YouTube Ambient Deck',    pack: 'entertainment', icon: 'youtube',   required: false, defaultEnabled: false, desc: 'Curated lo-fi, synthwave, and ambient focus streams' },
    memes:          { id: 'memes',          label: 'Memetic Intelligence',    pack: 'entertainment', icon: 'smile',     required: false, defaultEnabled: false, desc: 'Curated Reddit visual humor and image stream browser' },

    // Anime, Manga & Pixel Worlds (Disabled by default)
    anime:          { id: 'anime',          label: 'Anime Discovery',         pack: 'anime', icon: 'sparkles',   required: false, defaultEnabled: false, desc: 'Seasonal anime charts, rankings, and synopses via Jikan' },
    manga:          { id: 'manga',          label: 'Manga Launcher',          pack: 'anime', icon: 'book-open',  required: false, defaultEnabled: false, desc: 'Manga discovery dossiers and chapter reader links' },
    entityscanner:  { id: 'entityscanner',  label: 'Entity Scanner',          pack: 'anime', icon: 'scan',       required: false, defaultEnabled: false, desc: 'Character & Pokémon stat lookup and battle simulator' },
    floor796:       { id: 'floor796',       label: 'Floor796 Explorer',       pack: 'anime', icon: 'building-2', required: false, defaultEnabled: false, desc: 'Huge animated isometric pixel-art space station explorer' },
    wplace:         { id: 'wplace',         label: 'Wplace Live Canvas',      pack: 'anime', icon: 'paintbrush', required: false, defaultEnabled: false, desc: 'Collaborative world map pixel canvas viewer' },

    // Developer & Power Utilities (Disabled by default)
    nosleep:        { id: 'nosleep',        label: 'NoSleep Wake Lock',       pack: 'devtools', icon: 'sun',      required: false, defaultEnabled: false, desc: 'Prevent display sleep via Wake Lock API + topbar indicator' },
    storage:        { id: 'storage',        label: 'Storage Inspector',       pack: 'devtools', icon: 'database', required: false, defaultEnabled: false, desc: 'Inspect, edit, and export browser LocalStorage keys' },
    errorconsole:   { id: 'errorconsole',   label: 'Error Console',           pack: 'devtools', icon: 'bug',      required: false, defaultEnabled: false, desc: 'Captured runtime exceptions and promise rejection log' },
    apistatus:      { id: 'apistatus',      label: 'API Status Board',        pack: 'devtools', icon: 'activity', required: false, defaultEnabled: false, desc: 'Latency and uptime probe across external public APIs' },
    packetviz:      { id: 'packetviz',      label: 'Packet Visualizer',       pack: 'devtools', icon: 'radar',    required: false, defaultEnabled: false, desc: 'Browser ResourceTiming host traffic and payload inspector' }
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
        terminal:       { id: 'terminal',       title: 'Data Stream',             icon: 'terminal',    width: 860,  height: 560, x: 140, y: 80,  isOpen: false, isMinimized: false, zIndex: 2,  content: 'terminal' },
        media:          { id: 'media',          title: 'Media Console',           icon: 'radio',       width: 1040, height: 660, x: 180, y: 150, isOpen: false, isMinimized: false, zIndex: 3,  content: 'media' },
        radiobrowser:   { id: 'radiobrowser',   title: 'Global Radio Network',    icon: 'radio-tower', width: 640,  height: 480, x: 220, y: 130, isOpen: false, isMinimized: false, zIndex: 12, content: 'radiobrowser' },
        sysmon:         { id: 'sysmon',         title: 'System Diagnostics',      icon: 'cpu',         width: 980,  height: 650, x: 120, y: 50,  isOpen: false, isMinimized: false, zIndex: 4,  content: 'sysmon' },
        nosleep:        { id: 'nosleep',        title: 'NoSleep Screen Lock',     icon: 'sun',         width: 560,  height: 430, x: 180, y: 90,  isOpen: false, isMinimized: false, zIndex: 32, content: 'nosleep' },
        presence:       { id: 'presence',       title: 'Uplink Presence',         icon: 'user',        width: 760,  height: 560, x: 220, y: 90,  isOpen: false, isMinimized: false, zIndex: 5,  content: 'presence' },
        feed:           { id: 'feed',           title: 'Global Signal Feed',      icon: 'rss',         width: 440,  height: 580, x: 450, y: 80,  isOpen: false, isMinimized: false, zIndex: 6,  content: 'feed' },
        browser:        { id: 'browser',        title: 'Web Proxy Interface',     icon: 'globe',       width: 800,  height: 550, x: 100, y: 60,  isOpen: false, isMinimized: false, zIndex: 7,  content: 'browser' },
        wplace:         { id: 'wplace',         title: 'Wplace Live Canvas',      icon: 'paintbrush',  width: 1120, height: 720, x: 60,  y: 35,  isOpen: false, isMinimized: false, zIndex: 33, content: 'wplace' },
        floor796:       { id: 'floor796',       title: 'Floor796 Explorer',       icon: 'building-2',  width: 1180, height: 740, x: 50,  y: 32,  isOpen: false, isMinimized: false, zIndex: 34, content: 'floor796' },
        globe:          { id: 'globe',          title: 'Tactical Airspace Radar', icon: 'plane',       width: 850,  height: 580, x: 150, y: 50,  isOpen: false, isMinimized: false, zIndex: 8,  content: 'globe' },
        market:         { id: 'market',         title: 'Market Matrix',           icon: 'trending-up', width: 640,  height: 400, x: 300, y: 120, isOpen: false, isMinimized: false, zIndex: 9,  content: 'market' },
        surveillance:   { id: 'surveillance',   title: 'Optics Node',             icon: 'camera',      width: 980,  height: 620, x: 110, y: 55,  isOpen: false, isMinimized: false, zIndex: 10, content: 'surveillance' },
        notes:          { id: 'notes',          title: 'Memory Scratchpad',       icon: 'lock',        width: 400,  height: 500, x: 450, y: 150, isOpen: false, isMinimized: false, zIndex: 11, content: 'notes' },
        memes:          { id: 'memes',          title: 'Memetic Intelligence',    icon: 'smile',       width: 640,  height: 600, x: 350, y: 90,  isOpen: false, isMinimized: false, zIndex: 13, content: 'memes' },
        ytchtv:         { id: 'ytchtv',         title: 'Retro TV (YTCH.TV)',      icon: 'tv',          width: 850,  height: 580, x: 120, y: 80,  isOpen: false, isMinimized: false, zIndex: 14, content: 'ytchtv' },
        entityscanner:  { id: 'entityscanner',  title: 'Universal Entity Scanner',icon: 'scan',        width: 900,  height: 620, x: 100, y: 40,  isOpen: false, isMinimized: false, zIndex: 15, content: 'entityscanner' },
        filemanager:    { id: 'filemanager',    title: 'Living Archive',          icon: 'folder-tree', width: 1120, height: 690, x: 70,  y: 35,  isOpen: false, isMinimized: false, zIndex: 17, content: 'filemanager' },
        wikiboard:      { id: 'wikiboard',      title: 'WikiBoard Research',      icon: 'network',     width: 1050, height: 680, x: 80,  y: 30,  isOpen: false, isMinimized: false, zIndex: 16, content: 'wikiboard' },
        weather:        { id: 'weather',        title: 'Weather Station',         icon: 'cloud-rain',  width: 820,  height: 560, x: 100, y: 60,  isOpen: false, isMinimized: false, zIndex: 20, content: 'weather' },
        nasa:           { id: 'nasa',           title: 'NASA Deep Space',         icon: 'telescope',   width: 780,  height: 560, x: 120, y: 70,  isOpen: false, isMinimized: false, zIndex: 21, content: 'nasa' },
        taskmanager:    { id: 'taskmanager',    title: 'Task Manager',            icon: 'list-x',      width: 680,  height: 480, x: 160, y: 80,  isOpen: false, isMinimized: false, zIndex: 22, content: 'taskmanager' },
        games:          { id: 'games',          title: 'Game Vault',              icon: 'gamepad-2',   width: 980,  height: 660, x: 70,  y: 35,  isOpen: false, isMinimized: false, zIndex: 23, content: 'games' },
        iss:            { id: 'iss',            title: 'ISS Tracker',             icon: 'satellite',   width: 980,  height: 660, x: 140, y: 70,  isOpen: false, isMinimized: false, zIndex: 24, content: 'iss' },
        youtubeambient: { id: 'youtubeambient', title: 'YouTube Ambient',         icon: 'youtube',     width: 860,  height: 560, x: 120, y: 70,  isOpen: false, isMinimized: false, zIndex: 25, content: 'youtubeambient' },
        anime:          { id: 'anime',          title: 'Anime Discovery',         icon: 'sparkles',    width: 900,  height: 620, x: 95,  y: 45,  isOpen: false, isMinimized: false, zIndex: 26, content: 'anime' },
        manga:          { id: 'manga',          title: 'Manga Launcher',          icon: 'book-open',   width: 920,  height: 620, x: 105, y: 50,  isOpen: false, isMinimized: false, zIndex: 27, content: 'manga' },
        storage:        { id: 'storage',        title: 'Storage Inspector',       icon: 'database',    width: 820,  height: 560, x: 130, y: 70,  isOpen: false, isMinimized: false, zIndex: 28, content: 'storage' },
        errorconsole:   { id: 'errorconsole',   title: 'Error Console',           icon: 'bug',         width: 820,  height: 520, x: 150, y: 80,  isOpen: false, isMinimized: false, zIndex: 29, content: 'errorconsole' },
        apistatus:      { id: 'apistatus',      title: 'API Status Board',        icon: 'activity',    width: 920,  height: 600, x: 110, y: 55,  isOpen: false, isMinimized: false, zIndex: 30, content: 'apistatus' },
        packetviz:      { id: 'packetviz',      title: 'Packet Visualizer',       icon: 'network',     width: 980,  height: 640, x: 90,  y: 45,  isOpen: false, isMinimized: false, zIndex: 31, content: 'packetviz' },
        about:          { id: 'about',          title: 'System Encyclopedia',     icon: 'info',        width: 940,  height: 640, x: 120, y: 60,  isOpen: false, isMinimized: false, zIndex: 35, content: 'about' },
        aetherbridge:   { id: 'aetherbridge',   title: 'Aether Bridge',           icon: 'radio-tower', width: 1080, height: 680, x: 80,  y: 40,  isOpen: false, isMinimized: false, zIndex: 36, content: 'aetherbridge' },
        aetherlink:     { id: 'aetherlink',     title: 'Aether Link',             icon: 'link-2',      width: 1020, height: 680, x: 90,  y: 45,  isOpen: false, isMinimized: false, zIndex: 37, content: 'aetherlink' }
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
        media_tuner_station: 'lastfm',
        media_tuner_volume: 0.7,
        media_player_mode: 'monitor',
        media_gif_provider: 'mixed',
        radio_gif_enabled: 'off',
        radio_gif_provider: 'nekos',
        radio_tonearm_x: 0,
        radio_tonearm_y: 0,
        radio_tonearm_rot: 0,
        radio_tonearm_edit: 'off',
        wallpaper_mode: 'default',
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
        discord_webhook_username: 'AetherOS Uplink',
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

        this.load();
        delete this.settings.about;

        // Ensure every registered window exists and upgrade legacy small settings frame
        Object.keys(defaultWindows).forEach((k) => {
            if (!this.windows[k]) {
                this.windows[k] = { ...defaultWindows[k] };
            }
        });
        if (this.windows.settings) {
            this.windows.settings.title = 'System Settings';
            this.windows.settings.width = Math.max(this.windows.settings.width || 0, 820);
            this.windows.settings.height = Math.max(this.windows.settings.height || 0, 560);
        }
        if (this.windows.sysmon) {
            this.windows.sysmon.width = Math.max(this.windows.sysmon.width || 0, 980);
            this.windows.sysmon.height = Math.max(this.windows.sysmon.height || 0, 650);
            this.windows.sysmon.x = Math.min(this.windows.sysmon.x || 120, Math.max(20, window.innerWidth - 1040));
            this.windows.sysmon.y = Math.min(this.windows.sysmon.y || 50, 80);
        }
        if (this.windows.presence) {
            this.windows.presence.width = Math.max(this.windows.presence.width || 0, 760);
            this.windows.presence.height = Math.max(this.windows.presence.height || 0, 560);
        }
        if (this.windows.surveillance) {
            this.windows.surveillance.width = Math.max(this.windows.surveillance.width || 0, 980);
            this.windows.surveillance.height = Math.max(this.windows.surveillance.height || 0, 620);
        }
        if (this.windows.terminal) {
            this.windows.terminal.width = Math.max(this.windows.terminal.width || 0, 860);
            this.windows.terminal.height = Math.max(this.windows.terminal.height || 0, 560);
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
    load() {
        try {
            const saved = localStorage.getItem('AetherOS_State');
            if (saved) {
                const parsed = JSON.parse(saved);
                const defaults = { ...this.settings, enabled_modules: buildDefaultEnabledModules() };
                if (parsed.windows && typeof parsed.windows === 'object') {
                    Object.keys(parsed.windows).forEach((id) => {
                        this.windows[id] = { ...(this.windows[id] || {}), ...parsed.windows[id] };
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

window.addEventListener('pagehide', () => SystemState.saveNow(), { passive: true });
document.addEventListener('visibilitychange', () => {
    if (document.hidden) SystemState.saveNow();
}, { passive: true });
