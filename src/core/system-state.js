// AetherOS — SystemState Registry, Settings & LocalStorage Persistence
const SystemState = window.SystemState = {
            windows: {
                settings: { id: 'settings', title: 'System Config', icon: 'sliders', width: 650, height: 500, x: 80, y: 50, isOpen: true, isMinimized: false, zIndex: 1, content: 'settings' },
                terminal: { id: 'terminal', title: 'Data Stream', icon: 'terminal', width: 860, height: 560, x: 140, y: 80, isOpen: false, isMinimized: false, zIndex: 2, content: 'terminal' },
                media: { id: 'media', title: 'Media Console', icon: 'radio', width: 1040, height: 660, x: 180, y: 150, isOpen: false, isMinimized: false, zIndex: 3, content: 'media' },
                radiobrowser: { id: 'radiobrowser', title: 'Global Radio Network', icon: 'radio-tower', width: 640, height: 480, x: 220, y: 130, isOpen: false, isMinimized: false, zIndex: 12, content: 'radiobrowser' },
                sysmon: { id: 'sysmon', title: 'System Diagnostics', icon: 'cpu', width: 980, height: 650, x: 120, y: 50, isOpen: false, isMinimized: false, zIndex: 4, content: 'sysmon' },
                nosleep: { id: 'nosleep', title: 'NoSleep Screen Lock', icon: 'sun', width: 560, height: 430, x: 180, y: 90, isOpen: false, isMinimized: false, zIndex: 32, content: 'nosleep' },
                presence: { id: 'presence', title: 'Uplink Presence', icon: 'user', width: 760, height: 560, x: 220, y: 90, isOpen: false, isMinimized: false, zIndex: 5, content: 'presence' },
                feed: { id: 'feed', title: 'Global Signal Feed', icon: 'rss', width: 440, height: 580, x: 450, y: 80, isOpen: false, isMinimized: false, zIndex: 6, content: 'feed' },
                browser: { id: 'browser', title: 'Web Proxy Interface', icon: 'globe', width: 800, height: 550, x: 100, y: 60, isOpen: false, isMinimized: false, zIndex: 7, content: 'browser' },
                wplace: { id: 'wplace', title: 'Wplace Live Canvas', icon: 'paintbrush', width: 1120, height: 720, x: 60, y: 35, isOpen: false, isMinimized: false, zIndex: 33, content: 'wplace' },
                floor796: { id: 'floor796', title: 'Floor796 Explorer', icon: 'building-2', width: 1180, height: 740, x: 50, y: 32, isOpen: false, isMinimized: false, zIndex: 34, content: 'floor796' },
                globe: { id: 'globe', title: 'Tactical Airspace Radar', icon: 'plane', width: 850, height: 580, x: 150, y: 50, isOpen: false, isMinimized: false, zIndex: 8, content: 'globe' },
                market: { id: 'market', title: 'Market Matrix', icon: 'trending-up', width: 640, height: 400, x: 300, y: 120, isOpen: false, isMinimized: false, zIndex: 9, content: 'market' },
                surveillance: { id: 'surveillance', title: 'Optics Node', icon: 'camera', width: 980, height: 620, x: 110, y: 55, isOpen: false, isMinimized: false, zIndex: 10, content: 'surveillance' },
                notes: { id: 'notes', title: 'Memory Scratchpad', icon: 'lock', width: 400, height: 500, x: 450, y: 150, isOpen: false, isMinimized: false, zIndex: 11, content: 'notes' },
                memes: { id: 'memes', title: 'Memetic Intelligence', icon: 'smile', width: 640, height: 600, x: 350, y: 90, isOpen: false, isMinimized: false, zIndex: 13, content: 'memes' },
                ytchtv: { id: 'ytchtv', title: 'Retro TV (YTCH.TV)', icon: 'tv', width: 850, height: 580, x: 120, y: 80, isOpen: false, isMinimized: false, zIndex: 14, content: 'ytchtv' },
                entityscanner: { id: 'entityscanner', title: 'Universal Entity Scanner', icon: 'scan', width: 900, height: 620, x: 100, y: 40, isOpen: false, isMinimized: false, zIndex: 15, content: 'entityscanner' },
                filemanager: { id: 'filemanager', title: 'Living Archive', icon: 'folder-tree', width: 1120, height: 690, x: 70, y: 35, isOpen: false, isMinimized: false, zIndex: 17, content: 'filemanager' },
                wikiboard: { id: 'wikiboard', title: 'WikiBoard Research', icon: 'network', width: 1050, height: 680, x: 80, y: 30, isOpen: false, isMinimized: false, zIndex: 16, content: 'wikiboard' },
                weather: { id: 'weather', title: 'Weather Station', icon: 'cloud-rain', width: 820, height: 560, x: 100, y: 60, isOpen: false, isMinimized: false, zIndex: 20, content: 'weather' },
                nasa: { id: 'nasa', title: 'NASA Deep Space', icon: 'telescope', width: 780, height: 560, x: 120, y: 70, isOpen: false, isMinimized: false, zIndex: 21, content: 'nasa' },
                taskmanager: { id: 'taskmanager', title: 'Task Manager', icon: 'list-x', width: 680, height: 480, x: 160, y: 80, isOpen: false, isMinimized: false, zIndex: 22, content: 'taskmanager' },
                games: { id: 'games', title: 'Game Vault', icon: 'gamepad-2', width: 980, height: 660, x: 70, y: 35, isOpen: false, isMinimized: false, zIndex: 23, content: 'games' },
                iss: { id: 'iss', title: 'ISS Tracker', icon: 'satellite', width: 980, height: 660, x: 140, y: 70, isOpen: false, isMinimized: false, zIndex: 24, content: 'iss' },
                youtubeambient: { id: 'youtubeambient', title: 'YouTube Ambient', icon: 'youtube', width: 860, height: 560, x: 120, y: 70, isOpen: false, isMinimized: false, zIndex: 25, content: 'youtubeambient' },
                anime: { id: 'anime', title: 'Anime Discovery', icon: 'sparkles', width: 900, height: 620, x: 95, y: 45, isOpen: false, isMinimized: false, zIndex: 26, content: 'anime' },
                manga: { id: 'manga', title: 'Manga Launcher', icon: 'book-open', width: 920, height: 620, x: 105, y: 50, isOpen: false, isMinimized: false, zIndex: 27, content: 'manga' },
                storage: { id: 'storage', title: 'Storage Inspector', icon: 'database', width: 820, height: 560, x: 130, y: 70, isOpen: false, isMinimized: false, zIndex: 28, content: 'storage' },
                errorconsole: { id: 'errorconsole', title: 'Error Console', icon: 'bug', width: 820, height: 520, x: 150, y: 80, isOpen: false, isMinimized: false, zIndex: 29, content: 'errorconsole' },
                apistatus: { id: 'apistatus', title: 'API Status Board', icon: 'activity', width: 920, height: 600, x: 110, y: 55, isOpen: false, isMinimized: false, zIndex: 30, content: 'apistatus' },
                packetviz: { id: 'packetviz', title: 'Packet Visualizer', icon: 'network', width: 980, height: 640, x: 90, y: 45, isOpen: false, isMinimized: false, zIndex: 31, content: 'packetviz' },
                about: { id: 'about', title: 'System Encyclopedia', icon: 'info', width: 940, height: 640, x: 120, y: 60, isOpen: false, isMinimized: false, zIndex: 35, content: 'about' },
                aetherbridge: { id: 'aetherbridge', title: 'Aether Bridge', icon: 'radio-tower', width: 1080, height: 680, x: 80, y: 40, isOpen: false, isMinimized: false, zIndex: 36, content: 'aetherbridge' },
                aetherlink: { id: 'aetherlink', title: 'Aether Link', icon: 'link-2', width: 1020, height: 680, x: 90, y: 45, isOpen: false, isMinimized: false, zIndex: 37, content: 'aetherlink' }
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
                cursor_oneko_ball: 'on',
                sakura_petals: 'off',
                sakura_intensity: 'normal',
                motion_intensity: 'high',
                performance_mode: 'eco',
                media_tuner_station: 'lastfm', 
                media_tuner_volume: 0.7,
                media_player_mode: 'monitor',
                media_gif_provider: 'mixed',
                radio_gif_enabled: 'on',
                radio_gif_provider: 'nekos',
                radio_tonearm_x: 0,
                radio_tonearm_y: 0,
                radio_tonearm_rot: 0,
                radio_tonearm_edit: 'off',
                wallpaper_mode: 'gif',
                anime_quotes: 'on',
                quote_bg_mode: 'none',
                quote_position: 'top-left',
                quote_gif_api_key: '',
                quote_bg_gif_provider: 'nekos',
                speech_synthesis: 'off',
                speech_voice: 'auto-real',
                speech_rate: 0.92,
                speech_pitch: 0.88,
                speech_volume: 0.85,
                speech_companion: 'on',
                speech_afk_timeout: 90,
                companion_emotion_mode: 'gif',
                screen_awake_enabled: 'off',
                discord_webhook_url: '',
                discord_webhook_username: 'AetherOS Uplink',
                discord_webhook_avatar: ''
            },
            history: [], 
            activeZIndex: 38,
            init() {
                this.load();
                delete this.settings.about;
                if (this.windows.sysmon) { this.windows.sysmon.width = Math.max(this.windows.sysmon.width || 0, 980); this.windows.sysmon.height = Math.max(this.windows.sysmon.height || 0, 650); this.windows.sysmon.x = Math.min(this.windows.sysmon.x || 120, Math.max(20, window.innerWidth - 1040)); this.windows.sysmon.y = Math.min(this.windows.sysmon.y || 50, 80); }
                if (this.windows.presence) { this.windows.presence.width = Math.max(this.windows.presence.width || 0, 760); this.windows.presence.height = Math.max(this.windows.presence.height || 0, 560); }
                if (this.windows.surveillance) { this.windows.surveillance.width = Math.max(this.windows.surveillance.width || 0, 980); this.windows.surveillance.height = Math.max(this.windows.surveillance.height || 0, 620); }
                if(!this.windows.settings) this.windows.settings = { id: 'settings', title: 'System Config', icon: 'sliders', width: 650, height: 500, x: 80, y: 50, isOpen: true, isMinimized: false, zIndex: 1, content: 'settings' };
                if (this.windows.terminal) { this.windows.terminal.width = Math.max(this.windows.terminal.width || 0, 860); this.windows.terminal.height = Math.max(this.windows.terminal.height || 0, 560); }
                if (this.windows.media) { this.windows.media.width = Math.max(this.windows.media.width || 0, 1040); this.windows.media.height = Math.max(this.windows.media.height || 0, 660); }
                if (this.windows.iss) { this.windows.iss.width = Math.max(this.windows.iss.width || 0, 980); this.windows.iss.height = Math.max(this.windows.iss.height || 0, 660); }
                if(!this.windows.sysmon) this.windows.sysmon = { id: 'sysmon', title: 'System Diagnostics', icon: 'cpu', width: 640, height: 500, x: 200, y: 100, isOpen: false, isMinimized: false, zIndex: 4, content: 'sysmon' };
                if(!this.windows.nosleep) this.windows.nosleep = { id: 'nosleep', title: 'NoSleep Screen Lock', icon: 'sun', width: 560, height: 430, x: 180, y: 90, isOpen: false, isMinimized: false, zIndex: 32, content: 'nosleep' };
                if(!this.windows.presence) this.windows.presence = { id: 'presence', title: 'Uplink Presence', icon: 'user', width: 480, height: 360, x: 240, y: 180, isOpen: false, isMinimized: false, zIndex: 5, content: 'presence' };
                if(!this.windows.feed) this.windows.feed = { id: 'feed', title: 'Global Signal Feed', icon: 'rss', width: 440, height: 580, x: 450, y: 80, isOpen: false, isMinimized: false, zIndex: 6, content: 'feed' };
                if(!this.windows.browser) this.windows.browser = { id: 'browser', title: 'Web Proxy Interface', icon: 'globe', width: 800, height: 550, x: 100, y: 60, isOpen: false, isMinimized: false, zIndex: 7, content: 'browser' };
                if(!this.windows.wplace) this.windows.wplace = { id: 'wplace', title: 'Wplace Live Canvas', icon: 'paintbrush', width: 1120, height: 720, x: 60, y: 35, isOpen: false, isMinimized: false, zIndex: 33, content: 'wplace' };
                if(!this.windows.floor796) this.windows.floor796 = { id: 'floor796', title: 'Floor796 Explorer', icon: 'building-2', width: 1180, height: 740, x: 50, y: 32, isOpen: false, isMinimized: false, zIndex: 34, content: 'floor796' };
                if(!this.windows.globe) this.windows.globe = { id: 'globe', title: 'Tactical Airspace Radar', icon: 'plane', width: 850, height: 580, x: 150, y: 50, isOpen: false, isMinimized: false, zIndex: 8, content: 'globe' };
                if(!this.windows.market) this.windows.market = { id: 'market', title: 'Market Matrix', icon: 'trending-up', width: 640, height: 400, x: 300, y: 120, isOpen: false, isMinimized: false, zIndex: 9, content: 'market' };
                if(!this.windows.surveillance) this.windows.surveillance = { id: 'surveillance', title: 'Optics Node', icon: 'camera', width: 450, height: 400, x: 150, y: 200, isOpen: false, isMinimized: false, zIndex: 10, content: 'surveillance' };
                if(!this.windows.notes) this.windows.notes = { id: 'notes', title: 'Memory Scratchpad', icon: 'lock', width: 400, height: 500, x: 450, y: 150, isOpen: false, isMinimized: false, zIndex: 11, content: 'notes' };
                if(!this.windows.radiobrowser) this.windows.radiobrowser = { id: 'radiobrowser', title: 'Global Radio Network', icon: 'radio-tower', width: 640, height: 480, x: 220, y: 130, isOpen: false, isMinimized: false, zIndex: 12, content: 'radiobrowser' };
                if(!this.windows.memes) this.windows.memes = { id: 'memes', title: 'Memetic Intelligence', icon: 'smile', width: 640, height: 600, x: 350, y: 90, isOpen: false, isMinimized: false, zIndex: 13, content: 'memes' };
                if(!this.windows.ytchtv) this.windows.ytchtv = { id: 'ytchtv', title: 'Retro TV (YTCH.TV)', icon: 'tv', width: 850, height: 580, x: 120, y: 80, isOpen: false, isMinimized: false, zIndex: 14, content: 'ytchtv' };
                if(!this.windows.entityscanner) this.windows.entityscanner = { id: 'entityscanner', title: 'Universal Entity Scanner', icon: 'scan', width: 900, height: 620, x: 100, y: 40, isOpen: false, isMinimized: false, zIndex: 15, content: 'entityscanner' };
                if(!this.windows.filemanager) this.windows.filemanager = { id: 'filemanager', title: 'Living Archive', icon: 'folder-tree', width: 1120, height: 690, x: 70, y: 35, isOpen: false, isMinimized: false, zIndex: 17, content: 'filemanager' };
                if(!this.windows.wikiboard) this.windows.wikiboard = { id: 'wikiboard', title: 'WikiBoard Research', icon: 'network', width: 1050, height: 680, x: 80, y: 30, isOpen: false, isMinimized: false, zIndex: 16, content: 'wikiboard' };
                if(!this.windows.weather) this.windows.weather = { id: 'weather', title: 'Weather Station', icon: 'cloud-rain', width: 820, height: 560, x: 100, y: 60, isOpen: false, isMinimized: false, zIndex: 20, content: 'weather' };
                if(!this.windows.nasa) this.windows.nasa = { id: 'nasa', title: 'NASA Deep Space', icon: 'telescope', width: 780, height: 560, x: 120, y: 70, isOpen: false, isMinimized: false, zIndex: 21, content: 'nasa' };
                if(!this.windows.taskmanager) this.windows.taskmanager = { id: 'taskmanager', title: 'Task Manager', icon: 'list-x', width: 680, height: 480, x: 160, y: 80, isOpen: false, isMinimized: false, zIndex: 22, content: 'taskmanager' };
                if(!this.windows.games) this.windows.games = { id: 'games', title: 'Game Vault', icon: 'gamepad-2', width: 980, height: 660, x: 80, y: 40, isOpen: false, isMinimized: false, zIndex: 23, content: 'games' };
                if(!this.windows.iss) this.windows.iss = { id: 'iss', title: 'ISS Tracker', icon: 'satellite', width: 980, height: 660, x: 140, y: 70, isOpen: false, isMinimized: false, zIndex: 24, content: 'iss' };
                if(!this.windows.youtubeambient) this.windows.youtubeambient = { id: 'youtubeambient', title: 'YouTube Ambient', icon: 'youtube', width: 860, height: 560, x: 120, y: 70, isOpen: false, isMinimized: false, zIndex: 25, content: 'youtubeambient' };
                if(!this.windows.anime) this.windows.anime = { id: 'anime', title: 'Anime Discovery', icon: 'sparkles', width: 900, height: 620, x: 95, y: 45, isOpen: false, isMinimized: false, zIndex: 26, content: 'anime' };
                if(!this.windows.manga) this.windows.manga = { id: 'manga', title: 'Manga Launcher', icon: 'book-open', width: 920, height: 620, x: 105, y: 50, isOpen: false, isMinimized: false, zIndex: 27, content: 'manga' };
                if(!this.windows.storage) this.windows.storage = { id: 'storage', title: 'Storage Inspector', icon: 'database', width: 820, height: 560, x: 130, y: 70, isOpen: false, isMinimized: false, zIndex: 28, content: 'storage' };
                if(!this.windows.errorconsole) this.windows.errorconsole = { id: 'errorconsole', title: 'Error Console', icon: 'bug', width: 820, height: 520, x: 150, y: 80, isOpen: false, isMinimized: false, zIndex: 29, content: 'errorconsole' };
                if(!this.windows.apistatus) this.windows.apistatus = { id: 'apistatus', title: 'API Status Board', icon: 'activity', width: 920, height: 600, x: 110, y: 55, isOpen: false, isMinimized: false, zIndex: 30, content: 'apistatus' };
                if(!this.windows.packetviz) this.windows.packetviz = { id: 'packetviz', title: 'Packet Visualizer', icon: 'network', width: 980, height: 640, x: 90, y: 45, isOpen: false, isMinimized: false, zIndex: 31, content: 'packetviz' };
                if(!this.windows.about) this.windows.about = { id: 'about', title: 'System Encyclopedia', icon: 'info', width: 940, height: 640, x: 120, y: 60, isOpen: false, isMinimized: false, zIndex: 35, content: 'about' };
                if(!this.windows.aetherbridge) this.windows.aetherbridge = { id: 'aetherbridge', title: 'Aether Bridge', icon: 'radio-tower', width: 1080, height: 680, x: 80, y: 40, isOpen: false, isMinimized: false, zIndex: 36, content: 'aetherbridge' };
                if(!this.windows.aetherlink) this.windows.aetherlink = { id: 'aetherlink', title: 'Aether Link', icon: 'link-2', width: 1020, height: 680, x: 90, y: 45, isOpen: false, isMinimized: false, zIndex: 37, content: 'aetherlink' };
            },
            load() {
                try {
                    const saved = localStorage.getItem('AetherOS_State');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        this.windows = { ...this.windows, ...parsed.windows };
                        this.settings = { ...this.settings, ...parsed.settings };
                        delete this.settings.about;
                        if (!parsed.settings || parsed.settings.wallpaper_mode === undefined) {
                            this.settings.wallpaper_mode = 'gif';
                        }
                        if (!parsed.settings || parsed.settings.anime_quotes === undefined) {
                            this.settings.anime_quotes = 'on';
                        }
                        if (!parsed.settings || parsed.settings.quote_bg_mode === undefined) {
                            this.settings.quote_bg_mode = 'none';
                        }
                        if (!parsed.settings || parsed.settings.quote_position === undefined) {
                            this.settings.quote_position = 'top-left';
                        }
                        if (!parsed.settings || parsed.settings.quote_gif_api_key === undefined || parsed.settings.quote_gif_api_key === '1Oz2uD6DabK9pVK7zaqkXxLiEwuKje1vQSSrj8mTIiM6tV5qnuSn8b7lEqSPyvGw') {
                            this.settings.quote_gif_api_key = '';
                        }
                        if (!parsed.settings || parsed.settings.quote_bg_gif_provider === undefined) {
                            this.settings.quote_bg_gif_provider = 'nekos';
                        }
                        if (!parsed.settings || parsed.settings.cursor_theme === undefined) {
                            this.settings.cursor_theme = 'aether';
                        }
                        if (!parsed.settings || parsed.settings.cursor_nyan_standard === undefined) {
                            this.settings.cursor_nyan_standard = 'off';
                        }
                        if (!parsed.settings || parsed.settings.lyrics_theme === undefined) {
                            this.settings.lyrics_theme = 'default';
                        }
                        if (!parsed.settings || parsed.settings.cursor_oneko === undefined) {
                            this.settings.cursor_oneko = 'off';
                        }
                        if (!parsed.settings || parsed.settings.cursor_oneko_variant === undefined) {
                            this.settings.cursor_oneko_variant = 'classic';
                        }
                        if (!parsed.settings || parsed.settings.cursor_oneko_kuro === undefined) {
                            this.settings.cursor_oneko_kuro = 'off';
                        }
                        if (!parsed.settings || parsed.settings.cursor_oneko_ball === undefined) {
                            this.settings.cursor_oneko_ball = 'on';
                        }
                        if (!parsed.settings || parsed.settings.sakura_petals === undefined) {
                            this.settings.sakura_petals = 'off';
                        }
                        if (!parsed.settings || parsed.settings.sakura_intensity === undefined) {
                            this.settings.sakura_intensity = 'normal';
                        }
                        if (!parsed.settings || parsed.settings.radio_gif_enabled === undefined) {
                            this.settings.radio_gif_enabled = 'on';
                        }
                        if (!parsed.settings || parsed.settings.radio_gif_provider === undefined) {
                            this.settings.radio_gif_provider = 'nekos';
                        }
                        if (!parsed.settings || parsed.settings.media_gif_provider === undefined) {
                            this.settings.media_gif_provider = 'mixed';
                        }
                        if (!parsed.settings || parsed.settings.radio_tonearm_x === undefined) this.settings.radio_tonearm_x = 0;
                        if (!parsed.settings || parsed.settings.radio_tonearm_y === undefined) this.settings.radio_tonearm_y = 0;
                        if (!parsed.settings || parsed.settings.radio_tonearm_rot === undefined) this.settings.radio_tonearm_rot = 0;
                        if (!parsed.settings || parsed.settings.radio_tonearm_edit === undefined) this.settings.radio_tonearm_edit = 'off';
                        if (!parsed.settings || parsed.settings.speech_synthesis === undefined) {
                            this.settings.speech_synthesis = 'off';
                        }
                        if (!parsed.settings || parsed.settings.speech_voice === undefined) {
                            this.settings.speech_voice = 'auto-real';
                        }
                        if (!parsed.settings || parsed.settings.speech_rate === undefined) {
                            this.settings.speech_rate = 0.92;
                        }
                        if (!parsed.settings || parsed.settings.speech_pitch === undefined) {
                            this.settings.speech_pitch = 0.88;
                        }
                        if (!parsed.settings || parsed.settings.speech_volume === undefined) {
                            this.settings.speech_volume = 0.85;
                        }
                        if (!parsed.settings || parsed.settings.speech_companion === undefined) {
                            this.settings.speech_companion = 'on';
                        }
                        if (!parsed.settings || parsed.settings.speech_afk_timeout === undefined) {
                            this.settings.speech_afk_timeout = 90;
                        }
                        if (!parsed.settings || parsed.settings.companion_emotion_mode === undefined) {
                            this.settings.companion_emotion_mode = 'gif';
                        }
                        if (parsed.history) this.history = parsed.history;
                    }
                } catch(e) { console.error("Save state corrupted", e); }
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

window.addEventListener('pagehide', () => SystemState.saveNow(), {passive: true});

document.addEventListener('visibilitychange', () => { if (document.hidden) SystemState.saveNow(); }, {passive: true});
