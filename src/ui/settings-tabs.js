// AetherOS — System Settings Tab Templates
const SettingsTabs = window.SettingsTabs = {
            api: `
                <h2 class="font-display text-xl uppercase tracking-widest mb-5 border-b border-white/10 pb-2 text-white flex items-center gap-2"><i data-lucide="key" class="w-4 h-4 text-gray-400"></i> API Integration</h2>
                <div class="space-y-4">
                    <div class="p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-[10px] font-mono text-blue-300/70">
                        ⓘ API keys are stored locally in your browser. They are never transmitted to third parties.
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2 col-span-2">
                            <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Last.FM Username</label>
                            <input type="text" id="set-lastfm-user" class="w-full p-2.5 glass-input rounded-md hover-target cursor-none font-mono text-sm" placeholder="Enter Last.fm username...">
                        </div>
                        <div class="space-y-2 col-span-2">
                            <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Last.FM API Key <span class="text-gray-600 normal-case">(optional)</span></label>
                            <input type="password" id="set-lastfm-key" class="w-full p-2.5 glass-input rounded-md hover-target cursor-none font-mono text-sm" placeholder="Default public mode if blank...">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Discord / Lanyard ID</label>
                            <input type="text" id="set-discord" class="w-full p-2.5 glass-input rounded-md hover-target cursor-none font-mono text-sm" placeholder="18-digit User ID...">
                        </div>
                        <div class="space-y-2">
                            <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">GitHub Username</label>
                            <input type="text" id="set-github" class="w-full p-2.5 glass-input rounded-md hover-target cursor-none font-mono text-sm" placeholder="Username for activity...">
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Custom RSS Feed URL</label>
                        <input type="text" id="set-rss" class="w-full p-2.5 glass-input rounded-md hover-target cursor-none font-mono text-sm" placeholder="https://techcrunch.com/feed/">
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Custom Subreddits <span class="text-gray-600 normal-case">(comma separated)</span></label>
                        <input type="text" id="set-subreddits" class="w-full p-2.5 glass-input rounded-md hover-target cursor-none font-mono text-sm" placeholder="funny, me_irl, programmerhumor...">
                    </div>
                    <div class="pt-1">
                        <button onclick="os.saveSettings()" class="px-5 py-2 bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider rounded hover:bg-gray-100 transition hover-target cursor-none shadow-os-btn">Save Configuration</button>
                    </div>
                </div>
            `,
            appearance: `
                <h2 class="font-display text-xl uppercase tracking-widest mb-5 border-b border-white/10 pb-2 text-white flex items-center gap-2"><i data-lucide="palette" class="w-4 h-4 text-gray-400"></i> Appearance</h2>
                <div class="space-y-5">
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Wallpaper Engine</label>
                        <div class="flex gap-2">
                            <button onclick="os.setOption('wallpaper_mode', 'default')" id="opt-wall-default" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Tactical Dark</button>
                            <button onclick="os.setOption('wallpaper_mode', 'gif')" id="opt-wall-gif" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Dynamic GIF</button>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Desktop Anime Quotes</label>
                        <div class="flex gap-2">
                            <button onclick="os.setOption('anime_quotes', 'on')" id="opt-quote-on" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Display Quotes</button>
                            <button onclick="os.setOption('anime_quotes', 'off')" id="opt-quote-off" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Disable Quotes</button>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Quote Background</label>
                        <div class="flex gap-2">
                            <button onclick="os.setOption('quote_bg_mode', 'none')" id="opt-quote-bg-none" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">None</button>
                            <button onclick="os.setOption('quote_bg_mode', 'static')" id="opt-quote-bg-static" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Static</button>
                            <button onclick="os.setOption('quote_bg_mode', 'gif')" id="opt-quote-bg-gif" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">GIF</button>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Quote Position</label>
                        <div class="flex gap-2 flex-wrap">
                            <button onclick="os.setOption('quote_position', 'top-left')" id="opt-quote-pos-tl" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none min-w-[5rem]">Top Left</button>
                            <button onclick="os.setOption('quote_position', 'top-right')" id="opt-quote-pos-tr" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none min-w-[5rem]">Top Right</button>
                            <button onclick="os.setOption('quote_position', 'bottom-left')" id="opt-quote-pos-bl" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none min-w-[5rem]">Bottom Left</button>
                            <button onclick="os.setOption('quote_position', 'bottom-right')" id="opt-quote-pos-br" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none min-w-[5rem]">Bottom Right</button>
                            <button onclick="os.setOption('quote_position', 'center')" id="opt-quote-pos-c" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none min-w-[5rem]">Center</button>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Klipy GIF API Key <span class="text-gray-600 normal-case">(character-specific GIFs)</span></label>
                        <input type="password" id="set-quote-gif-key" class="w-full p-2.5 glass-input rounded-md hover-target cursor-none font-mono text-sm" placeholder="Paste klipy.com API key..." value="${SystemState.settings.quote_gif_api_key || ''}">
                        <p class="text-[9px] text-gray-600 font-mono">Get a key at <a href="https://partner.klipy.com/" target="_blank" class="text-os-accent underline">partner.klipy.com</a>. Without a key, generic anime GIFs are used.</p>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Speech Synthesis Alerts</label>
                        <div class="flex gap-2">
                            <button onclick="os.setOption('speech_synthesis', 'on')" id="opt-speech-on" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Voice Alerts</button>
                            <button onclick="os.setOption('speech_synthesis', 'off')" id="opt-speech-off" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Silent Mode</button>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div class="space-y-1 col-span-2">
                                <div class="flex items-center justify-between text-[9px] text-gray-500 font-mono">
                                    <span>Real Voice Pack</span>
                                    <span id="speech-voice-quality" class="text-os-accent">AUTO BEST</span>
                                </div>
                                <select id="speech-voice-select" onchange="os.setSpeechVoice(this.value)" class="hidden">
                                    <option value="auto-real">Auto-select most natural local voice</option>
                                </select>
                                <div class="voice-pack-browser" id="voice-pack-browser">
                                    <div class="voice-pack-searchbar">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                        <input type="text" id="voice-pack-search" placeholder="Search voices..." oninput="os.filterVoicePackGrid(this.value)" class="voice-pack-search-input">
                                        <div class="voice-pack-filter-tags" id="voice-pack-filters">
                                            <button onclick="os.filterVoicePackTag('all')" class="voice-pack-tag active" data-tag="all">All</button>
                                            <button onclick="os.filterVoicePackTag('neural')" class="voice-pack-tag" data-tag="neural">Neural</button>
                                            <button onclick="os.filterVoicePackTag('english')" class="voice-pack-tag" data-tag="english">English</button>
                                            <button onclick="os.filterVoicePackTag('local')" class="voice-pack-tag" data-tag="local">Local</button>
                                        </div>
                                    </div>
                                    <div class="voice-pack-grid" id="voice-pack-grid">
                                        <div class="voice-pack-card voice-pack-auto" data-voice-name="auto-real" onclick="os.handleVoiceCardClick(event, this.dataset.voiceName)">
                                            <div class="voice-pack-play" onclick="event.stopPropagation();os.previewVoicePack(this.dataset.voiceName, this)" data-voice-name="auto-real">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                            </div>
                                            <div class="voice-pack-info">
                                                <div class="voice-pack-name">Auto Best</div>
                                                <div class="voice-pack-meta">Let AetherOS choose the most natural voice available</div>
                                            </div>
                                            <div class="voice-pack-badge" style="background:rgba(16,185,129,0.15);color:#34d399">RECOMMENDED</div>
                                            <div class="voice-pack-check">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <div class="flex justify-between text-[8px] text-gray-500 uppercase"><span>Rate</span><span id="speech-rate-readout">0.92×</span></div>
                                <input type="range" min="0.75" max="1.12" step="0.01" id="speech-rate-range" value="0.92" oninput="os.setSpeechTuning('speech_rate', this.value)" class="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-none hover-target">
                            </div>
                            <div class="space-y-1">
                                <div class="flex justify-between text-[8px] text-gray-500 uppercase"><span>Pitch</span><span id="speech-pitch-readout">0.88</span></div>
                                <input type="range" min="0.72" max="1.18" step="0.01" id="speech-pitch-range" value="0.88" oninput="os.setSpeechTuning('speech_pitch', this.value)" class="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-none hover-target">
                            </div>
                        </div>
                        <div class="flex items-center justify-between text-[9px] text-gray-500 font-mono">
                            <span>Browser API: <span id="speech-api-support" class="text-white">--</span></span>
                            <div class="flex gap-3">
                                <button onclick="os.previewSpeechVoice()" class="text-os-accent hover:text-white hover-target cursor-none uppercase">Preview</button>
                                <button onclick="os.speak('AetherOS real voice pack online. Voice synthesis is now routed through the most natural free browser voice available on this device.', {force:true, interrupt:true})" class="text-os-accent hover:text-white hover-target cursor-none uppercase">Test Voice</button>
                            </div>
                        </div>
                        <div class="text-[8px] text-gray-600 font-mono leading-relaxed">Uses free built-in browser/OS voices. On Chrome/Edge/Windows/macOS, AetherOS auto-prioritizes neural/natural voices like Microsoft Aria/Jenny/Guy, Google English, Samantha, Karen, Serena, or Daniel when available.</div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Aether Companion Chatter</label>
                        <div class="flex gap-2">
                            <button onclick="os.setOption('speech_companion', 'on')" id="opt-companion-on" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Jarvis Mode</button>
                            <button onclick="os.setOption('speech_companion', 'off')" id="opt-companion-off" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Quiet</button>
                        </div>
                        <div class="text-[8px] text-gray-600 font-mono leading-relaxed">Greets you on boot, welcomes you back after being away, and occasionally drops short dry-humor status lines while AFK. Uses the Speech toggle above; if voice alerts are silent, it stays as subtle toast/log chatter.</div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Aether Avatar Emotion Mode</label>
                        <div class="flex gap-2">
                            <button onclick="os.setOption('companion_emotion_mode', 'gif')" id="opt-emo-gif" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">GIF Reaction</button>
                            <button onclick="os.setOption('companion_emotion_mode', 'emo')" id="opt-emo-oled" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Emo OLED Face</button>
                        </div>
                        <div class="text-[8px] text-gray-600 font-mono leading-relaxed">GIF Reaction fetches anime reaction GIFs from online APIs. Emo OLED Face uses a built-in pixel-art animated face with expressions (angry, happy, sad, excited, dizzy, sleep, wink, neutral) inspired by CodersCafeTech/Emo.</div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Performance Engine</label>
                        <div class="flex gap-2">
                            <button onclick="os.setOption('performance_mode', 'eco')" id="opt-perf-eco" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Eco (Super Fast)</button>
                            <button onclick="os.setOption('performance_mode', 'cinematic')" id="opt-perf-cinematic" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Cinematic (Max FX)</button>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Motion Acceleration</label>
                        <div class="flex gap-2">
                            <button onclick="os.setOption('motion_intensity', 'high')" id="opt-motion-high" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Dynamic GSAP</button>
                            <button onclick="os.setOption('motion_intensity', 'low')" id="opt-motion-low" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Low Motion</button>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Mouse / Cursor Theme</label>
                        <p class="text-[9px] text-gray-600 font-mono leading-relaxed">Choose from native Aether cursor styles, Cursorly-inspired particles, and the actual adryd325 oneko.js cat-follow-cursor effect embedded locally for single-file use.</p>
                        <div class="grid grid-cols-2 gap-2" id="cursor-theme-grid">
                            <button onclick="os.setOption('cursor_theme','aether')" id="opt-cursor-aether" class="p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Aether Ring</button>
                            <button onclick="os.setOption('cursor_theme','minimal')" id="opt-cursor-minimal" class="p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Minimal</button>
                            <button onclick="os.setOption('cursor_theme','neon')" id="opt-cursor-neon" class="p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Neon Trail</button>
                            <button onclick="os.setOption('cursor_theme','comet')" id="opt-cursor-comet" class="p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Comet Dust</button>
                            <button onclick="os.setOption('cursor_theme','cursorly')" id="opt-cursor-cursorly" class="p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Cursorly Bubbles</button>
                            <button onclick="os.setOption('cursor_theme','ripple')" id="opt-cursor-ripple" class="p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Click Ripple</button>
                            <button onclick="os.setOption('cursor_theme','sparkle')" id="opt-cursor-sparkle" class="p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Sparkle</button>
                            <button onclick="os.setOption('cursor_theme','binary')" id="opt-cursor-binary" class="p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Binary Rain</button>
                            <button onclick="os.setOption('cursor_theme','crosshair')" id="opt-cursor-crosshair" class="p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Crosshair</button>
                            <button onclick="os.setOption('cursor_theme','gold')" id="opt-cursor-gold" class="p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Gold Pulse</button>
                            <button onclick="os.setOption('cursor_theme','void')" id="opt-cursor-void" class="p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Void Lens</button>
                            <button onclick="os.setOption('cursor_theme','nyan')" id="opt-cursor-nyan" class="p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Nyan Rainbow Cat</button>
                        </div>
                        <div class="space-y-1.5 mt-2.5">
                            <label class="block text-[10px] font-mono text-gray-500 uppercase tracking-wider">Nyan Cat Standard Cursor Overlay</label>
                            <div class="flex gap-2">
                                <button onclick="os.setOption('cursor_nyan_standard','on')" id="opt-nyan-standard-on" class="flex-1 p-1.5 bg-white/5 border border-white/10 text-[10px] font-mono uppercase rounded transition hover-target cursor-none">Show Standard</button>
                                <button onclick="os.setOption('cursor_nyan_standard','off')" id="opt-nyan-standard-off" class="flex-1 p-1.5 bg-white/5 border border-white/10 text-[10px] font-mono uppercase rounded transition hover-target cursor-none">Hide Standard</button>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Oneko Cat Companion</label>
                        <p class="text-[9px] text-gray-600 font-mono leading-relaxed">Toggle the actual oneko.js cat independently. It can run together with any cursor theme above.</p>
                        <div class="flex gap-2">
                            <button onclick="os.setOption('cursor_oneko','on')" id="opt-oneko-on" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Cat On</button>
                            <button onclick="os.setOption('cursor_oneko','off')" id="opt-oneko-off" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Cat Off</button>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="os.setOption('cursor_oneko_ball','on')" id="opt-oneko-ball-on" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Ball On</button>
                            <button onclick="os.setOption('cursor_oneko_ball','off')" id="opt-oneko-ball-off" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Ball Off</button>
                        </div>
                        <div class="grid grid-cols-5 gap-2 pt-1" id="oneko-variant-grid">
                            <button onclick="os.setOption('cursor_oneko_variant','classic')" id="opt-oneko-variant-classic" class="p-2 bg-white/5 border border-white/10 text-[10px] font-mono uppercase rounded transition hover-target cursor-none">Classic</button>
                            <button onclick="os.setOption('cursor_oneko_variant','dog')" id="opt-oneko-variant-dog" class="p-2 bg-white/5 border border-white/10 text-[10px] font-mono uppercase rounded transition hover-target cursor-none">Dog</button>
                            <button onclick="os.setOption('cursor_oneko_variant','tora')" id="opt-oneko-variant-tora" class="p-2 bg-white/5 border border-white/10 text-[10px] font-mono uppercase rounded transition hover-target cursor-none">Tora</button>
                            <button onclick="os.setOption('cursor_oneko_variant','maia')" id="opt-oneko-variant-maia" class="p-2 bg-white/5 border border-white/10 text-[10px] font-mono uppercase rounded transition hover-target cursor-none">Maia</button>
                            <button onclick="os.setOption('cursor_oneko_variant','vaporwave')" id="opt-oneko-variant-vaporwave" class="p-2 bg-white/5 border border-white/10 text-[10px] font-mono uppercase rounded transition hover-target cursor-none">Vapor</button>
                        </div>
                        <select id="oneko-variant-select" onchange="os.setOption('cursor_oneko_variant', this.value)" class="w-full p-2 bg-black/50 border border-white/10 rounded text-xs text-white font-mono outline-none cursor-none hover-target"><option value="classic">Classic</option><option value="dog">Dog</option><option value="tora">Tora</option><option value="maia">Maia</option><option value="vaporwave">Vaporwave</option><option value="web-white">Web White</option><option value="web-black">Web Black</option><option value="web-gray">Web Gray</option><option value="web-calico">Web Calico</option><option value="web-robot">Web Robot</option><option value="web-peach">Web Peach</option><option value="web-colourful">Web Colourful</option><option value="web-earth">Web Earth</option><option value="web-air">Web Air</option><option value="web-water">Web Water</option><option value="web-fire">Web Fire</option><option value="web-spirit">Web Spirit</option><option value="web-rainbow">Web Rainbow</option><option value="web-ghost">Web Ghost</option><option value="web-neon">Web Neon</option><option value="web-pink">Web Pink</option><option value="web-orange">Web Orange</option><option value="web-blue">Web Blue</option><option value="bom-neko">Bom Neko</option><option value="bom-tabby">Bom Tabby</option><option value="bom-dog">Bom Dog</option><option value="bom-ace">Bom Ace</option><option value="bom-black2">Bom Black2</option><option value="bom-blue-tabby">Bom Blue-Tabby</option><option value="bom-boo-boo-kitty">Bom Boo-Boo-Kitty</option><option value="bom-clorpoin">Bom Clorpoin</option><option value="bom-dave">Bom Dave</option><option value="bom-dee-dee">Bom Dee-Dee</option><option value="bom-fancy">Bom Fancy</option><option value="bom-ghetto">Bom Ghetto</option><option value="bom-holiday">Bom Holiday</option><option value="bom-jess">Bom Jess</option><option value="bom-kina">Bom Kina</option><option value="bom-kitty">Bom Kitty</option><option value="bom-kuramecha">Bom Kuramecha</option><option value="bom-lucky">Bom Lucky</option><option value="bom-lucy">Bom Lucy</option><option value="bom-marmalade">Bom Marmalade</option><option value="bom-mermaid">Bom Mermaid</option><option value="bom-mike">Bom Mike</option><option value="bom-multi">Bom Multi</option><option value="bom-neko-cool">Bom Neko-Cool</option><option value="bom-silver">Bom Silver</option><option value="bom-silversky">Bom Silversky</option><option value="bom-socks">Bom Socks</option><option value="bom-spooky">Bom Spooky</option><option value="bom-usa">Bom USA</option><option value="bom-valentine">Bom Valentine</option><option value="bom-browndog">Bom Brown Dog</option><option value="bom-bug">Bom Bug</option><option value="bom-caz">Bom Caz</option><option value="bom-chocobo">Bom Chocobo</option><option value="bom-dalmy">Bom Dalmy</option><option value="bom-face">Bom Face</option><option value="bom-fox">Bom Fox</option><option value="bom-lucydog">Bom Lucy Dog</option><option value="bom-alien">Bom Alien</option><option value="bom-bluemarine">Bom Blue Marine</option><option value="bom-doom">Bom Doom</option><option value="bom-metroid">Bom Metroid</option><option value="bom-mini">Bom Mini</option><option value="bom-moon">Bom Moon</option><option value="bom-white-pink-nose">Bom Pink Nose</option><option value="bom-moka">Bom Moka</option><option value="bom-royal">Bom Royal</option><option value="bom-air">Bom Air</option><option value="bom-black">Bom Black</option><option value="bom-blue">Bom Blue</option><option value="bom-calico">Bom Calico</option><option value="bom-colourful">Bom Colourful</option><option value="bom-earth">Bom Earth</option><option value="bom-fire">Bom Fire</option><option value="bom-ghost">Bom Ghost</option><option value="bom-gray">Bom Gray</option><option value="bom-neon">Bom Neon</option><option value="bom-orange">Bom Orange</option><option value="bom-peach">Bom Peach</option><option value="bom-pink">Bom Pink</option><option value="bom-rainbow">Bom Rainbow</option><option value="bom-robot">Bom Robot</option><option value="bom-rose">Bom Rose</option><option value="bom-spirit">Bom Spirit</option><option value="bom-water">Bom Water</option><option value="bom-brownbsddaemon">Bom Brown BSD Daemon</option><option value="bom-captaingoodnight">Bom Captain Goodnight</option><option value="bom-cokebottle">Bom Coke Bottle</option><option value="bom-greenghost">Bom Green Ghost</option><option value="bom-monstertruck">Bom MonsterTruck</option></select>
                        <div class="flex items-center justify-between text-[9px] text-gray-500 font-mono">
                            <span>Drag cat/ball · throw ball · dog fetches · idle autoplay after 30s · type <b class="text-os-accent">oneko</b> picker</span>
                            <button onclick="window.cursorEngine && window.cursorEngine.showOnekoPicker()" class="text-os-accent hover:text-white hover-target cursor-none uppercase">Picker</button>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Sakura Petal Overlay</label>
                        <p class="text-[9px] text-gray-600 font-mono leading-relaxed">Vanilla Sakura.js-style falling blossom petals adapted from jhammann/sakura. Runs below OS windows and always below the cursor.</p>
                        <div class="flex gap-2">
                            <button onclick="os.setOption('sakura_petals','on')" id="opt-sakura-on" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Petals On</button>
                            <button onclick="os.setOption('sakura_petals','off')" id="opt-sakura-off" class="flex-1 p-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded transition hover-target cursor-none">Petals Off</button>
                        </div>
                        <div class="grid grid-cols-3 gap-2" id="sakura-intensity-grid">
                            <button onclick="os.setOption('sakura_intensity','light')" id="opt-sakura-light" class="p-2 bg-white/5 border border-white/10 text-[10px] font-mono uppercase rounded transition hover-target cursor-none">Light</button>
                            <button onclick="os.setOption('sakura_intensity','normal')" id="opt-sakura-normal" class="p-2 bg-white/5 border border-white/10 text-[10px] font-mono uppercase rounded transition hover-target cursor-none">Normal</button>
                            <button onclick="os.setOption('sakura_intensity','storm')" id="opt-sakura-storm" class="p-2 bg-white/5 border border-white/10 text-[10px] font-mono uppercase rounded transition hover-target cursor-none">Storm</button>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Accent Highlight Color</label>
                        <div class="flex items-center gap-3">
                            <input type="color" id="opt-color-accent" class="w-10 h-10 bg-transparent border-none cursor-none hover-target rounded" value="#ffffff" onchange="os.setOption('theme_accent', this.value)">
                            <span class="font-mono text-xs text-gray-500">Custom system highlight color</span>
                        </div>
                    </div>
                </div>
            `,
            themes: `
                <h2 class="font-display text-xl uppercase tracking-widest mb-5 border-b border-white/10 pb-2 text-white flex items-center gap-2"><i data-lucide="layers" class="w-4 h-4 text-gray-400"></i> UI Themes</h2>
                <style>
                    .theme-btn {
                        position: relative; overflow: hidden; border-radius: 16px; height: 88px;
                        display: flex; flex-direction: column; justify-content: flex-end; padding: 12px 14px;
                        transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease, border-color 0.22s ease;
                        cursor: none; text-align: left; border-width: 0.5px;
                    }
                    .theme-btn:hover { transform: translateY(-3px) scale(1.025); }
                    .theme-btn .theme-glow { position: absolute; border-radius: 50%; filter: blur(22px); pointer-events: none; transition: opacity 0.3s ease; opacity: 0.55; }
                    .theme-btn:hover .theme-glow { opacity: 0.85; }
                    .theme-btn .theme-orbs { position: absolute; inset: 0; pointer-events: none; overflow: hidden; border-radius: inherit; }
                    .theme-btn .theme-label { font: 700 10px/1.2 'Inter', sans-serif; letter-spacing: 0.12em; text-transform: uppercase; }
                    .theme-btn .theme-desc { font: 400 8px/1.4 'JetBrains Mono', monospace; margin-top: 2px; opacity: 0.55; }
                    .theme-btn .theme-accent-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; margin-right: 4px; flex-shrink: 0; box-shadow: 0 0 8px currentColor; }
                    .theme-btn .theme-active-badge {
                        position: absolute; top: 8px; right: 8px; font: 600 7px 'JetBrains Mono', monospace;
                        letter-spacing: 0.12em; text-transform: uppercase; padding: 2px 6px; border-radius: 4px;
                        background: rgba(255,255,255,0.14); border: 0.5px solid rgba(255,255,255,0.28); color: rgba(255,255,255,0.9);
                        opacity: 0; transition: opacity 0.2s; pointer-events: none;
                    }
                    .theme-btn.theme-active .theme-active-badge { opacity: 1; }
                    .theme-btn .theme-rim { position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent); pointer-events: none; }
                    #theme-grid { grid-template-columns: repeat(3, 1fr); }
                </style>
                <div class="space-y-4">
                    <p class="text-[10px] text-gray-500 font-mono">Select a complete visual theme for AetherOS. Themes affect accent colors, glass intensity, wallpaper, and all panel styling.</p>
                    <div class="grid gap-3" id="theme-grid">

                        <button onclick="os.applyTheme('midnight')" id="theme-btn-midnight" class="theme-btn" style="background:linear-gradient(145deg,#060608 0%,#0e0e14 60%,#161620 100%);border-color:rgba(255,255,255,0.13);box-shadow:0 2px 12px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.08)">
                            <div class="theme-rim"></div>
                            <div class="theme-orbs">
                                <div class="theme-glow" style="width:80px;height:80px;background:#6366f1;top:-20px;right:-10px;"></div>
                                <div class="theme-glow" style="width:60px;height:60px;background:#ec4899;top:10px;left:10px;opacity:0.3;filter:blur(18px)"></div>
                            </div>
                            <div class="theme-active-badge">ACTIVE</div>
                            <div class="flex items-center gap-1.5">
                                <span class="theme-accent-dot" style="background:#ffffff;color:#ffffff"></span>
                                <span class="theme-label" style="color:#ffffff">Midnight</span>
                            </div>
                            <div class="theme-desc" style="color:rgba(255,255,255,0.5)">Deep black · Pure white glass</div>
                        </button>

                        <button onclick="os.applyTheme('aurora')" id="theme-btn-aurora" class="theme-btn" style="background:linear-gradient(145deg,#021008 0%,#042018 60%,#062e22 100%);border-color:rgba(20,255,180,0.20);box-shadow:0 2px 12px rgba(0,0,0,0.5),inset 0 1px 0 rgba(20,255,180,0.12)">
                            <div class="theme-rim" style="background:linear-gradient(90deg,transparent,rgba(20,255,180,0.55),transparent)"></div>
                            <div class="theme-orbs">
                                <div class="theme-glow" style="width:90px;height:90px;background:#14ffb4;top:-30px;right:-15px;"></div>
                                <div class="theme-glow" style="width:50px;height:50px;background:#00ffd5;bottom:-10px;left:5px;opacity:0.25;filter:blur(16px)"></div>
                            </div>
                            <div class="theme-active-badge">ACTIVE</div>
                            <div class="flex items-center gap-1.5">
                                <span class="theme-accent-dot" style="background:#14ffb4;color:#14ffb4"></span>
                                <span class="theme-label" style="color:#14ffb4">Aurora</span>
                            </div>
                            <div class="theme-desc" style="color:rgba(20,255,180,0.5)">Bioluminescent · Teal glass</div>
                        </button>

                        <button onclick="os.applyTheme('synthwave')" id="theme-btn-synthwave" class="theme-btn" style="background:linear-gradient(145deg,#0a0412 0%,#160838 60%,#1e0e48 100%);border-color:rgba(168,85,247,0.22);box-shadow:0 2px 12px rgba(0,0,0,0.5),inset 0 1px 0 rgba(192,132,252,0.12)">
                            <div class="theme-rim" style="background:linear-gradient(90deg,transparent,rgba(192,132,252,0.6),transparent)"></div>
                            <div class="theme-orbs">
                                <div class="theme-glow" style="width:90px;height:90px;background:#c084fc;top:-25px;right:-10px;"></div>
                                <div class="theme-glow" style="width:55px;height:55px;background:#a855f7;bottom:-5px;left:10px;opacity:0.35;filter:blur(18px)"></div>
                            </div>
                            <div class="theme-active-badge">ACTIVE</div>
                            <div class="flex items-center gap-1.5">
                                <span class="theme-accent-dot" style="background:#c084fc;color:#c084fc"></span>
                                <span class="theme-label" style="color:#c084fc">Synthwave</span>
                            </div>
                            <div class="theme-desc" style="color:rgba(192,132,252,0.5)">Neon purple · Retro-futurist</div>
                        </button>

                        <button onclick="os.applyTheme('ember')" id="theme-btn-ember" class="theme-btn" style="background:linear-gradient(145deg,#0c0603 0%,#1a0a02 60%,#261408 100%);border-color:rgba(251,146,60,0.22);box-shadow:0 2px 12px rgba(0,0,0,0.5),inset 0 1px 0 rgba(251,146,60,0.12)">
                            <div class="theme-rim" style="background:linear-gradient(90deg,transparent,rgba(251,146,60,0.6),transparent)"></div>
                            <div class="theme-orbs">
                                <div class="theme-glow" style="width:85px;height:85px;background:#fb923c;top:-25px;right:-10px;"></div>
                                <div class="theme-glow" style="width:50px;height:50px;background:#f97316;bottom:-5px;left:5px;opacity:0.3;filter:blur(16px)"></div>
                            </div>
                            <div class="theme-active-badge">ACTIVE</div>
                            <div class="flex items-center gap-1.5">
                                <span class="theme-accent-dot" style="background:#fb923c;color:#fb923c"></span>
                                <span class="theme-label" style="color:#fb923c">Ember</span>
                            </div>
                            <div class="theme-desc" style="color:rgba(251,146,60,0.5)">Warm amber · High contrast</div>
                        </button>

                        <button onclick="os.applyTheme('ice')" id="theme-btn-ice" class="theme-btn" style="background:linear-gradient(145deg,#020810 0%,#071428 60%,#0d1e3a 100%);border-color:rgba(96,165,250,0.22);box-shadow:0 2px 12px rgba(0,0,0,0.5),inset 0 1px 0 rgba(147,197,253,0.12)">
                            <div class="theme-rim" style="background:linear-gradient(90deg,transparent,rgba(147,197,253,0.6),transparent)"></div>
                            <div class="theme-orbs">
                                <div class="theme-glow" style="width:90px;height:90px;background:#60a5fa;top:-28px;right:-12px;"></div>
                                <div class="theme-glow" style="width:55px;height:55px;background:#93c5fd;bottom:-5px;left:5px;opacity:0.28;filter:blur(18px)"></div>
                            </div>
                            <div class="theme-active-badge">ACTIVE</div>
                            <div class="flex items-center gap-1.5">
                                <span class="theme-accent-dot" style="background:#60a5fa;color:#60a5fa"></span>
                                <span class="theme-label" style="color:#60a5fa">Arctic Ice</span>
                            </div>
                            <div class="theme-desc" style="color:rgba(96,165,250,0.5)">Cool blue · Crisp precision</div>
                        </button>

                        <button onclick="os.applyTheme('rose')" id="theme-btn-rose" class="theme-btn" style="background:linear-gradient(145deg,#0c0208 0%,#200510 60%,#2e0818 100%);border-color:rgba(244,114,182,0.22);box-shadow:0 2px 12px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,150,200,0.12)">
                            <div class="theme-rim" style="background:linear-gradient(90deg,transparent,rgba(255,150,200,0.6),transparent)"></div>
                            <div class="theme-orbs">
                                <div class="theme-glow" style="width:88px;height:88px;background:#f472b6;top:-25px;right:-10px;"></div>
                                <div class="theme-glow" style="width:52px;height:52px;background:#ec4899;bottom:-5px;left:8px;opacity:0.3;filter:blur(16px)"></div>
                            </div>
                            <div class="theme-active-badge">ACTIVE</div>
                            <div class="flex items-center gap-1.5">
                                <span class="theme-accent-dot" style="background:#f472b6;color:#f472b6"></span>
                                <span class="theme-label" style="color:#f472b6">Rosé</span>
                            </div>
                            <div class="theme-desc" style="color:rgba(244,114,182,0.5)">Soft pink · Elegant dark</div>
                        </button>

                        <button onclick="os.applyTheme('solar')" id="theme-btn-solar" class="theme-btn" style="background:linear-gradient(145deg,#0d0800 0%,#1e1200 60%,#2e1e00 100%);border-color:rgba(250,204,21,0.22);box-shadow:0 2px 12px rgba(0,0,0,0.5),inset 0 1px 0 rgba(250,204,21,0.12)">
                            <div class="theme-rim" style="background:linear-gradient(90deg,transparent,rgba(250,204,21,0.7),transparent)"></div>
                            <div class="theme-orbs">
                                <div class="theme-glow" style="width:95px;height:95px;background:#facc15;top:-30px;right:-15px;"></div>
                                <div class="theme-glow" style="width:55px;height:55px;background:#f59e0b;bottom:-5px;left:5px;opacity:0.28;filter:blur(18px)"></div>
                            </div>
                            <div class="theme-active-badge">ACTIVE</div>
                            <div class="flex items-center gap-1.5">
                                <span class="theme-accent-dot" style="background:#facc15;color:#facc15"></span>
                                <span class="theme-label" style="color:#facc15">Solar</span>
                            </div>
                            <div class="theme-desc" style="color:rgba(250,204,21,0.5)">Incandescent gold · Cosmic</div>
                        </button>

                        <button onclick="os.applyTheme('hacker')" id="theme-btn-hacker" class="theme-btn" style="background:linear-gradient(145deg,#000a00 0%,#001400 60%,#001e00 100%);border-color:rgba(74,222,128,0.22);box-shadow:0 2px 12px rgba(0,0,0,0.5),inset 0 1px 0 rgba(74,222,128,0.12)">
                            <div class="theme-rim" style="background:linear-gradient(90deg,transparent,rgba(74,222,128,0.6),transparent)"></div>
                            <div class="theme-orbs">
                                <div class="theme-glow" style="width:88px;height:88px;background:#4ade80;top:-25px;right:-10px;"></div>
                                <div class="theme-glow" style="width:52px;height:52px;background:#22c55e;bottom:-5px;left:8px;opacity:0.28;filter:blur(16px)"></div>
                            </div>
                            <div class="theme-active-badge">ACTIVE</div>
                            <div class="flex items-center gap-1.5">
                                <span class="theme-accent-dot" style="background:#4ade80;color:#4ade80"></span>
                                <span class="theme-label" style="color:#4ade80">Hacker</span>
                            </div>
                            <div class="theme-desc" style="color:rgba(74,222,128,0.5)">Terminal green · Matrix glass</div>
                        </button>

                        <button onclick="os.applyTheme('neonvoid')" id="theme-btn-neonvoid" class="theme-btn" style="background:linear-gradient(145deg,#000008 0%,#060014 60%,#0a0020 100%);border-color:rgba(99,102,241,0.22);box-shadow:0 2px 12px rgba(0,0,0,0.5),inset 0 1px 0 rgba(165,180,252,0.12)">
                            <div class="theme-rim" style="background:linear-gradient(90deg,transparent,rgba(165,180,252,0.6),rgba(244,114,182,0.4),transparent)"></div>
                            <div class="theme-orbs">
                                <div class="theme-glow" style="width:90px;height:90px;background:#6366f1;top:-28px;right:-12px;"></div>
                                <div class="theme-glow" style="width:60px;height:60px;background:#f472b6;bottom:-10px;left:-5px;opacity:0.35;filter:blur(18px)"></div>
                            </div>
                            <div class="theme-active-badge">ACTIVE</div>
                            <div class="flex items-center gap-1.5">
                                <span class="theme-accent-dot" style="background:linear-gradient(90deg,#818cf8,#f472b6);color:#818cf8"></span>
                                <span class="theme-label" style="background:linear-gradient(90deg,#818cf8,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Neon Void</span>
                            </div>
                            <div class="theme-desc" style="color:rgba(129,140,248,0.5)">Electric indigo · Magenta split</div>
                        </button>

                        <button onclick="os.applyTheme('sakura')" id="theme-btn-sakura" class="theme-btn" style="background:linear-gradient(145deg,#0e0508 0%,#1e0a10 60%,#280e15 100%);border-color:rgba(251,182,206,0.22);box-shadow:0 2px 12px rgba(0,0,0,0.5),inset 0 1px 0 rgba(251,182,206,0.12)">
                            <div class="theme-rim" style="background:linear-gradient(90deg,transparent,rgba(251,182,206,0.6),transparent)"></div>
                            <div class="theme-orbs">
                                <div class="theme-glow" style="width:88px;height:88px;background:#fbb6ce;top:-28px;right:-12px;"></div>
                                <div class="theme-glow" style="width:55px;height:55px;background:#f9a8d4;bottom:-5px;left:5px;opacity:0.28;filter:blur(16px)"></div>
                            </div>
                            <div class="theme-active-badge">ACTIVE</div>
                            <div class="flex items-center gap-1.5">
                                <span class="theme-accent-dot" style="background:#fbb6ce;color:#fbb6ce"></span>
                                <span class="theme-label" style="color:#fbb6ce">Sakura</span>
                            </div>
                            <div class="theme-desc" style="color:rgba(251,182,206,0.5)">Cherry blossom · Petal glass</div>
                        </button>

                        <button onclick="os.applyTheme('carbon')" id="theme-btn-carbon" class="theme-btn" style="background:linear-gradient(145deg,#0a0a0a 0%,#141414 60%,#1c1c1c 100%);border-color:rgba(148,163,184,0.18);box-shadow:0 2px 12px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.06)">
                            <div class="theme-rim" style="background:linear-gradient(90deg,transparent,rgba(148,163,184,0.4),transparent)"></div>
                            <div class="theme-orbs">
                                <div class="theme-glow" style="width:85px;height:85px;background:#64748b;top:-25px;right:-10px;"></div>
                                <div class="theme-glow" style="width:50px;height:50px;background:#94a3b8;bottom:-5px;left:8px;opacity:0.22;filter:blur(16px)"></div>
                            </div>
                            <div class="theme-active-badge">ACTIVE</div>
                            <div class="flex items-center gap-1.5">
                                <span class="theme-accent-dot" style="background:#94a3b8;color:#94a3b8"></span>
                                <span class="theme-label" style="color:#94a3b8">Carbon</span>
                            </div>
                            <div class="theme-desc" style="color:rgba(148,163,184,0.5)">Slate gray · Ultra minimal</div>
                        </button>

                        <button onclick="os.applyTheme('ocean')" id="theme-btn-ocean" class="theme-btn" style="background:linear-gradient(145deg,#00050f 0%,#001030 60%,#001840 100%);border-color:rgba(56,189,248,0.22);box-shadow:0 2px 12px rgba(0,0,0,0.5),inset 0 1px 0 rgba(56,189,248,0.12)">
                            <div class="theme-rim" style="background:linear-gradient(90deg,transparent,rgba(56,189,248,0.6),rgba(34,211,238,0.3),transparent)"></div>
                            <div class="theme-orbs">
                                <div class="theme-glow" style="width:90px;height:90px;background:#38bdf8;top:-28px;right:-12px;"></div>
                                <div class="theme-glow" style="width:60px;height:60px;background:#22d3ee;bottom:-8px;left:5px;opacity:0.3;filter:blur(18px)"></div>
                            </div>
                            <div class="theme-active-badge">ACTIVE</div>
                            <div class="flex items-center gap-1.5">
                                <span class="theme-accent-dot" style="background:#38bdf8;color:#38bdf8"></span>
                                <span class="theme-label" style="color:#38bdf8">Ocean Depth</span>
                            </div>
                            <div class="theme-desc" style="color:rgba(56,189,248,0.5)">Deep ocean · Aqua current</div>
                        </button>

                    </div>
                    <div class="mt-3 p-3 rounded-xl text-[9px] font-mono text-gray-500 flex items-center justify-between" style="background:rgba(255,255,255,0.04);border:0.5px solid rgba(255,255,255,0.08)">
                        <span>Active theme: <span id="active-theme-name" class="text-white font-bold">Midnight</span></span>
                        <span>Accent: <span id="active-theme-accent" class="font-bold" style="color:var(--os-accent-custom)">#ffffff</span></span>
                    </div>
                </div>
            `,
            system: `
                <h2 class="font-display text-xl uppercase tracking-widest mb-5 border-b border-white/10 pb-2 text-white flex items-center gap-2"><i data-lucide="cpu" class="w-4 h-4 text-gray-400"></i> System Diagnostics</h2>
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-3 font-mono text-xs">
                        <div class="p-3 bg-black/40 border border-white/5 rounded-lg space-y-2">
                            <div class="text-[9px] text-os-accent uppercase tracking-widest mb-2">Runtime</div>
                            <div class="flex justify-between"><span class="text-gray-500">Storage</span><span class="text-white">localStorage</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Open Windows</span><span class="text-green-400" id="settings-open-wins">--</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Saved State</span><span class="text-white" id="settings-state-size">--</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Performance</span><span class="text-green-400" id="sys-diagnostic-power">ECO</span></div>
                        </div>
                        <div class="p-3 bg-black/40 border border-white/5 rounded-lg space-y-2">
                            <div class="text-[9px] text-os-accent uppercase tracking-widest mb-2">Hardware</div>
                            <div class="flex justify-between"><span class="text-gray-500">CPU Cores</span><span class="text-white">${navigator.hardwareConcurrency || '--'}</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Device RAM</span><span class="text-white">${navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '--'}</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Pixel Ratio</span><span class="text-white">${window.devicePixelRatio || '--'}</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Online</span><span class="${navigator.onLine ? 'text-green-400' : 'text-red-400'}">${navigator.onLine ? 'YES' : 'NO'}</span></div>
                        </div>
                        <div class="p-3 bg-black/40 border border-white/5 rounded-lg space-y-2 col-span-2">
                            <div class="text-[9px] text-os-accent uppercase tracking-widest mb-2">Memory Snapshot</div>
                            <div id="settings-mem-snapshot" class="text-gray-400">Querying JS heap...</div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-mono text-gray-400 uppercase tracking-wider">Hard Factory Format</label>
                        <p class="text-[10px] text-gray-500 font-mono mb-2">Wipes all saved keys, API configs, and window layouts. Reloads from fresh state.</p>
                        <button onclick="SystemState.reset()" class="px-4 py-2 bg-red-950 border border-red-500/20 text-red-400 font-semibold text-xs font-mono uppercase tracking-wider rounded hover:bg-red-900/80 transition hover-target cursor-none">Hard Format System</button>
                        <button onclick="os.sysmonCopyReport && os.sysmonCopyReport()" class="ml-2 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 font-semibold text-xs font-mono uppercase tracking-wider rounded hover:bg-white/10 transition hover-target cursor-none">Copy Diag Report</button>
                    </div>
                </div>
            `
        };
