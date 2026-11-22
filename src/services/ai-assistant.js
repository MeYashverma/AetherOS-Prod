// AetherOS — Local AI Assistant, Deterministic OS Command Parser, Lazy WebLLM & Voice PTT
// ===== Aether Local AI Assistant Upgrade =====
(function(){
  const AETHER_MODEL_PRESETS = [
    { key:'auto', label:'Auto · Best local fit', approxSize:'--', approxVRAM:'--', ctx:2048, matcher:/.*/i, preferredIds: [] },
    { key:'llama32_1b', label:'Llama 3.2 1B Instruct', approxSize:'~0.8 GB', approxVRAM:'~2.2 GB', ctx:2048, matcher:/llama[-_ ]?3(?:\.|_)?2.*1b.*instruct/i, preferredIds:['Llama-3.2-1B-Instruct-q4f16_1-MLC','Llama-3.2-1B-Instruct-q4f32_1-MLC'] },
    { key:'phi3_mini', label:'Phi-3 Mini', approxSize:'~2.6-3.6 GB', approxVRAM:'~3.6-4.5 GB', ctx:4096, matcher:/phi[-_ ]?3.*mini.*instruct/i, preferredIds:['Phi-3-mini-4k-instruct-q4f16_1-MLC','Phi-3-mini-4k-instruct-q4f32_1-MLC','Phi-3.5-mini-instruct-q4f16_1-MLC'] },
    { key:'gemma_2b', label:'Gemma 2B', approxSize:'~1.5 GB', approxVRAM:'~3.0 GB', ctx:2048, matcher:/gemma.*2b.*(it|instruct)/i, preferredIds:['gemma-2b-it-q4f16_1-MLC','gemma-2b-it-q4f32_1-MLC','gemma-2-2b-it-q4f16_1-MLC'] },
    { key:'qwen_1_5b', label:'Qwen 2.5 / 2 1.5B', approxSize:'~1.6-1.9 GB', approxVRAM:'~2.0-2.4 GB', ctx:4096, matcher:/qwen(?:2(?:\.5)?)?.*1\.5b.*instruct/i, preferredIds:['Qwen2.5-1.5B-Instruct-q4f16_1-MLC','Qwen2-1.5B-Instruct-q4f16_1-MLC','Qwen2.5-1.5B-Instruct-q4f32_1-MLC'] }
  ];

  const AETHER_THEME_DOCS = {
    midnight: 'Midnight is the default dark AetherOS theme with white accents and the deepest black glass treatment.',
    aurora: 'Aurora applies neon green accents and a cool dark glass palette.',
    synthwave: 'Synthwave applies purple-magenta accents and retro neon glass styling.',
    ember: 'Ember uses warm orange accents with dark amber glass surfaces.',
    ice: 'Ice uses cold blue accents and frosted dark blue glass panels.',
    rose: 'Rose uses pink accents and rosy dark glass surfaces.',
    solar: 'Solar uses incandescent gold accents and warm dark glass panels inspired by the sun.',
    hacker: 'Hacker uses terminal green accents and deep matrix glass styling for a cyberpunk feel.',
    neonvoid: 'Neon Void uses electric indigo and magenta split accents with dark cosmic glass.',
    sakura: 'Sakura uses cherry blossom pink accents and soft petal glass surfaces.',
    carbon: 'Carbon uses slate gray accents and ultra-minimal dark glass surfaces.',
    ocean: 'Ocean Depth uses aqua-cyan accents and deep-water frosted glass panels.'
  };

  const AETHER_MODULE_ALIASES = {
    settings: ['settings','system config','config','preferences','system settings'],
    terminal: ['terminal','data stream','console','command line'],
    media: ['media','music','music player','player','audio','media console','visualizer'],
    radiobrowser: ['radio','radio browser','global radio','tuner','station','radio network','internet radio','fm','am'],
    sysmon: ['sysmon','system monitor','system diagnostics','diagnostics','monitor','performance'],
    presence: ['presence','uplink','discord presence','discord'],
    feed: ['feed','signal feed','news feed','global signal'],
    browser: ['browser','web proxy','proxy'],
    wplace: ['wplace','live canvas'],
    floor796: ['floor796','floor 796','explorer'],
    globe: ['globe','airspace','flight radar'],
    market: ['market','market matrix','stocks','crypto market'],
    memes: ['memes','memetic','memetic intelligence'],
    ytchtv: ['retro tv','ytch','ytch tv','television'],
    entityscanner: ['entity scanner','scanner','universal scanner'],
    filemanager: ['file manager','files','archive','living archive'],
    wikiboard: ['wikiboard','wiki board','research board'],
    weather: ['weather','weather station','forecast'],
    nasa: ['nasa','deep space','apod'],
    taskmanager: ['task manager','tasks'],
    games: ['games','game vault'],
    iss: ['iss','iss tracker','space station'],
    anime: ['anime','anime discovery'],
    manga: ['manga','manga launcher'],
    about: ['about','system encyclopedia','encyclopedia','system info','version'],
    aetherbridge: ['aether bridge','bridge','device bridge','file bridge','remote files','device files','phone files'],
    aetherlink: ['aether link','link','workstation link','peer connect','remote workstation','p2p','collab'],
    worldmuseums: ['museums','world museums','met museum','art institute','art','paintings'],
    spacexhub: ['spacex','orbital launch','rocket launches','starship','falcon'],
    worldfactbook: ['countries','world factbook','currency','exchange rates','nations'],
    gutendex: ['books','gutenberg','library','ereader','classics'],
    shadertoy: ['shadertoy','shader studio','glsl','webgl shaders'],
    stellarium: ['stellarium','planetarium','nasa eyes','solar system','stars'],
    chiptune: ['chiptune','beepbox','blockbench','jspaint','makers'],
    georadar: ['georadar','landmarks','openstreetmap','nearby places']
  };

  function aetherNormalize(v){
    return String(v || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s._/-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function aetherHashToken(str){
    let h = 2166136261;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function aetherCosine(a, b){
    let dot = 0, na = 0, nb = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
  }

  function aetherApproxTokens(text){
    return Math.max(1, Math.round(String(text || '').length / 4));
  }

  function aetherSafeJsonParse(raw){
    try { return JSON.parse(raw); } catch(_) {}
    const text = String(raw || '').trim();
    const block = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (block) {
      try { return JSON.parse(block[1].trim()); } catch(_) {}
    }
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      try { return JSON.parse(text.slice(first, last + 1)); } catch(_) {}
    }
    return null;
  }

  function aetherEllipsize(str, max){
    const text = String(str || '').trim();
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  }

  function aetherChunkText(text, size){
    const chunks = [];
    const raw = String(text || '').trim();
    if (!raw) return chunks;
    let idx = 0;
    while (idx < raw.length) {
      chunks.push(raw.slice(idx, idx + size));
      idx += size;
    }
    return chunks;
  }

  function aetherSoon(fn, ms){
    return setTimeout(fn, ms || 0);
  }

  const assistant = {
    booted: false,
    module: null,
    moduleURL: '',
    worker: null,
    engine: null,
    idb: null,
    docsCache: [],
    conversation: [],
    memories: [],
    stats: { moduleUsage: {}, themeUsage: {}, commandUsage: {} },
    state: {
      status: 'idle',
      progress: 0,
      progressText: 'Local model idle. First use will download and cache the model in your browser.',
      selectedModelKey: 'auto',
      activeModelKey: '',
      activeModelId: '',
      activeModelLabel: '',
      activeEmbedModelId: '',
      activeEmbedModelLabel: '',
      engineMode: 'lazy',
      compactUI: false,
      compactManual: false,
      tps: 0,
      contextTokens: 0,
      cachedModels: {},
      voiceStatus: 'VOICE OFF',
      micLevel: 0,
      lastUsedVoice: false,
      busy: false,
      modelCatalog: []
    },
    voice: {
      recognition: null,
      supported: false,
      continuous: false,
      pushToTalk: false,
      restartGuard: false,
      stream: null,
      audioCtx: null,
      analyser: null,
      meterRAF: null,
      interim: ''
    },

    boot: async function(){
      if (this.booted) return;
      if (!window.os || typeof SystemState === 'undefined') {
        aetherSoon(() => this.boot(), 120);
        return;
      }
      this.booted = true;
      os.aiAssistant = this;
      this.patchChatAPI();
      this.ensureChatMarkup();
      await this.initDB();
      await this.loadPersistentState();
      if (!this.state.compactManual) this.state.compactUI = window.innerHeight < 980;
      this.renderModelSelect();
      this.applyCompactUI();
      this.restoreConversationIntoLog();
      this.renderCommandChips();
      this.initVoice();
      this.renderStatus();
      this.installLifecycleHooks();
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons({ root: document.getElementById('companion-chat-block') || document.body });
    },

    ensureChatMarkup: function(){
      const log = document.getElementById('companion-chat-log');
      if (log && !log.dataset.aetherLocalBoot) {
        log.dataset.aetherLocalBoot = '1';
        if (!this.conversation.length) {
          log.innerHTML = '<div class="text-gray-500 leading-relaxed"><span class="text-os-accent">AETHER:</span> Local AI standby. Ask about AetherOS, open modules, switch themes, search local notes, or use voice / command mode.</div>';
        }
      }
    },

    patchChatAPI: function(){
      const self = this;
      os._legacyCompanionChatReply = os._legacyCompanionChatReply || os.companionChatReply;
      os.companionChatReply = async function(raw){ return self.runTurn(String(raw || ''), { returnReplyObject: true }); };
      os.companionChatSend = function(){
        const input = document.getElementById('companion-chat-input');
        const msg = input ? input.value.trim() : '';
        if (!msg) return;
        input.value = '';
        self.handleUserMessage(msg, { usedVoice: false }).catch(err => self.handleError(err));
      };
      os.companionChatQuick = function(text){
        const input = document.getElementById('companion-chat-input');
        if (input) input.value = text;
        os.companionChatSend();
      };
      os.companionChatClear = function(){
        self.clearConversation();
      };
    },

    installLifecycleHooks: function(){
      const modelSelect = document.getElementById('aether-ai-model-select');
      if (modelSelect && !modelSelect.dataset.bound) {
        modelSelect.dataset.bound = '1';
        modelSelect.addEventListener('change', (e) => this.selectModel(e.target.value));
      }
      window.addEventListener('online', () => this.renderStatus(), { passive: true });
      window.addEventListener('offline', () => this.renderStatus(), { passive: true });
      document.addEventListener('visibilitychange', () => this.renderStatus(), { passive: true });
      window.addEventListener('resize', () => {
        if (!this.state.compactManual) {
          this.state.compactUI = window.innerHeight < 980;
          this.applyCompactUI();
        }
      }, { passive: true });
      setInterval(() => this.renderStatus(), 2400);
    },

    toggleCompactUI: async function(){
      this.state.compactUI = !this.state.compactUI;
      this.state.compactManual = true;
      this.applyCompactUI();
      await this.persistKV('chatCompactUI', this.state.compactUI);
    },

    applyCompactUI: function(){
      const block = document.getElementById('companion-chat-block');
      const toggle = document.getElementById('aether-chat-details-toggle');
      if (block) block.classList.toggle('compact-ui', !!this.state.compactUI);
      if (toggle) {
        toggle.title = this.state.compactUI ? 'Expand Aether Chat details' : 'Compact Aether Chat details';
        const icon = toggle.querySelector('i');
        if (icon) icon.setAttribute('data-lucide', this.state.compactUI ? 'panel-top-open' : 'panel-top');
      }
      if (window.lucide && window.lucide.createIcons && toggle) window.lucide.createIcons({ root: toggle });
    },

    initDB: async function(){
      if (this.idb) return this.idb;
      this.idb = await new Promise((resolve, reject) => {
        const req = indexedDB.open('AetherOS_LocalAI', 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'key' });
          if (!db.objectStoreNames.contains('messages')) db.createObjectStore('messages', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('memories')) db.createObjectStore('memories', { keyPath: 'id' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('IndexedDB unavailable'));
      });
      return this.idb;
    },

    dbGet: async function(storeName, key){
      const db = await this.initDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    },

    dbPut: async function(storeName, value){
      const db = await this.initDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(value);
        tx.oncomplete = () => resolve(value);
        tx.onerror = () => reject(tx.error);
      });
    },

    dbGetAll: async function(storeName){
      const db = await this.initDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    },

    dbClear: async function(storeName){
      const db = await this.initDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    },

    loadPersistentState: async function(){
      try {
        const selected = await this.dbGet('kv', 'selectedModelKey');
        if (selected && selected.value) this.state.selectedModelKey = selected.value;
        const cached = await this.dbGet('kv', 'cachedModels');
        if (cached && cached.value) this.state.cachedModels = cached.value;
        const stats = await this.dbGet('kv', 'stats');
        if (stats && stats.value) this.stats = Object.assign(this.stats, stats.value || {});
        const compact = await this.dbGet('kv', 'chatCompactUI');
        if (compact && typeof compact.value === 'boolean') {
          this.state.compactUI = compact.value;
          this.state.compactManual = true;
        }
        const messages = await this.dbGetAll('messages');
        this.conversation = (messages || []).sort((a,b) => (a.ts || 0) - (b.ts || 0)).slice(-20);
        const memories = await this.dbGetAll('memories');
        this.memories = (memories || []).sort((a,b) => (a.ts || 0) - (b.ts || 0)).slice(-24);
      } catch (e) {
        this.state.progressText = 'IndexedDB not available. Local memory will be session-only.';
      }
    },

    persistKV: async function(key, value){
      try { await this.dbPut('kv', { key, value, ts: Date.now() }); } catch(_) {}
    },

    persistMessage: async function(role, text, tone, meta){
      const msg = { id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7), role, text: String(text || ''), tone: tone || 'normal', meta: meta || null, ts: Date.now() };
      this.conversation.push(msg);
      this.conversation = this.conversation.slice(-80);
      try {
        await this.dbPut('messages', msg);
        const all = await this.dbGetAll('messages');
        const sorted = (all || []).sort((a,b) => (a.ts || 0) - (b.ts || 0));
        while (sorted.length > 120) {
          const old = sorted.shift();
          if (!old) break;
          const db = await this.initDB();
          await new Promise((resolve) => {
            const tx = db.transaction('messages', 'readwrite');
            tx.objectStore('messages').delete(old.id);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(true);
          });
        }
      } catch(_) {}
      return msg;
    },

    rememberNote: async function(text, category){
      const note = { id: 'mem-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), text: String(text || '').trim(), category: category || 'note', ts: Date.now() };
      if (!note.text) return null;
      this.memories.push(note);
      this.memories = this.memories.slice(-40);
      try { await this.dbPut('memories', note); } catch(_) {}
      this.renderStatus();
      return note;
    },

    clearConversation: async function(){
      this.conversation = [];
      try { await this.dbClear('messages'); } catch(_) {}
      const log = document.getElementById('companion-chat-log');
      if (log) log.innerHTML = '<div class="text-gray-500 leading-relaxed"><span class="text-os-accent">AETHER:</span> Conversation archive cleared. Long-term local memory remains intact.</div>';
      this.renderStatus();
    },

    restoreConversationIntoLog: function(){
      const log = document.getElementById('companion-chat-log');
      if (!log) return;
      if (!this.conversation.length) return;
      log.innerHTML = '';
      this.conversation.slice(-10).forEach((msg) => {
        const who = msg.role === 'user' ? 'YOU' : 'AETHER';
        os.companionChatAppend(who, msg.text, msg.tone || (msg.role === 'assistant' ? 'normal' : 'good'));
      });
    },

    tokenize: function(text){
      return aetherNormalize(text).split(/\s+/).filter(Boolean).map(t => t.length > 4 && t.endsWith('s') ? t.slice(0, -1) : t);
    },

    embedText: function(text){
      const dims = 192;
      const vec = new Float32Array(dims);
      const tokens = this.tokenize(text);
      if (!tokens.length) return vec;
      tokens.forEach((token, idx) => {
        const baseWeight = Math.min(2.6, 0.75 + token.length / 8 + (idx < 12 ? 0.18 : 0));
        const h1 = aetherHashToken(token) % dims;
        const h2 = aetherHashToken(token + '#') % dims;
        vec[h1] += baseWeight;
        vec[h2] += baseWeight * 0.45;
        for (let i = 0; i < token.length - 2; i++) {
          const tri = token.slice(i, i + 3);
          vec[aetherHashToken('tri:' + tri) % dims] += 0.18;
        }
      });
      let norm = 0;
      for (let i = 0; i < dims; i++) norm += vec[i] * vec[i];
      norm = Math.sqrt(norm) || 1;
      for (let i = 0; i < dims; i++) vec[i] /= norm;
      return vec;
    },

    resolveModuleTarget: function(raw){
      const q = aetherNormalize(raw);
      if (!q) return '';
      if (SystemState.windows && SystemState.windows[q]) return q;
      let best = '';
      let bestScore = 0;
      Object.keys(AETHER_MODULE_ALIASES).forEach((id) => {
        AETHER_MODULE_ALIASES[id].forEach((alias) => {
          const a = aetherNormalize(alias);
          let score = 0;
          if (q === a || q === id) score = 1;
          else if (q.includes(a) || a.includes(q)) score = 0.72;
          else {
            const qTokens = this.tokenize(q);
            const aTokens = this.tokenize(a);
            const overlap = qTokens.filter(t => aTokens.includes(t)).length;
            if (overlap) score = overlap / Math.max(qTokens.length, aTokens.length);
          }
          if (score > bestScore) { bestScore = score; best = id; }
        });
      });
      return bestScore >= 0.45 ? best : '';
    },

    getThemeMeta: function(name){
      const theme = String(name || '').toLowerCase().trim();
      if (AETHER_THEME_DOCS[theme]) return { name: theme, label: theme.charAt(0).toUpperCase() + theme.slice(1), description: AETHER_THEME_DOCS[theme] };
      return null;
    },

    resolveThemeTarget: function(raw){
      const q = aetherNormalize(raw);
      return Object.keys(AETHER_THEME_DOCS).find(k => q.includes(k)) || '';
    },

    resolveSettingMutation: function(raw, mode){
      const q = aetherNormalize(raw);
      const toggleMode = mode || 'toggle';
      if (/cinematic/.test(q)) return { action:'setPerformanceMode', target: toggleMode === 'disable' ? 'eco' : 'cinematic' };
      if (/eco/.test(q) && /performance|mode/.test(q)) return { action:'setPerformanceMode', target: 'eco' };
      if (/nyan/.test(q) && /cursor/.test(q)) {
        return toggleMode === 'disable'
          ? { action:'setOption', key:'cursor_theme', value:'aether' }
          : { action:'setOption', key:'cursor_theme', value:'nyan' };
      }
      if (/oneko ball|ball/.test(q)) return { action:'setOption', key:'cursor_oneko_ball', value: toggleMode === 'disable' ? 'off' : 'on' };
      if (/oneko/.test(q)) return { action:'setOption', key:'cursor_oneko', value: toggleMode === 'disable' ? 'off' : 'on' };
      if (/sakura|petal/.test(q)) return { action:'setOption', key:'sakura_petals', value: toggleMode === 'disable' ? 'off' : 'on' };
      if (/anime quote/.test(q)) return { action:'setOption', key:'anime_quotes', value: toggleMode === 'disable' ? 'off' : 'on' };
      if (/speech|voice alert|tts/.test(q) && !/companion|listen/.test(q)) return { action:'setOption', key:'speech_synthesis', value: toggleMode === 'disable' ? 'off' : 'on' };
      if (/companion|jarvis/.test(q)) return { action:'setOption', key:'speech_companion', value: toggleMode === 'disable' ? 'off' : 'on' };
      if (/awake|wake lock|nosleep|screen awake/.test(q)) return { action: toggleMode === 'disable' ? 'disableWakeLock' : 'enableWakeLock' };
      return null;
    },

    buildModelCatalog: function(){
      const records = this.getModelRecords();
      const catalog = AETHER_MODEL_PRESETS.map((preset) => {
        if (preset.key === 'auto') return Object.assign({}, preset, { available: true, modelId: '' });
        const record = this.chooseBestRecord(records, preset.matcher, preset.preferredIds || []);
        return Object.assign({}, preset, {
          available: !!record,
          modelId: record ? (record.model_id || record.model) : '',
          record: record || null,
          approxVRAM: record && record.estimated_vram_bytes ? ('~' + (record.estimated_vram_bytes / 1073741824).toFixed(1) + ' GB') : preset.approxVRAM
        });
      });
      this.state.modelCatalog = catalog;
      return catalog;
    },

    getModelRecords: function(){
      return ((this.module && this.module.prebuiltAppConfig && (this.module.prebuiltAppConfig.model_list || this.module.prebuiltAppConfig.models)) || []).slice();
    },

    chooseBestRecord: function(records, matcher, preferredIds){
      const exact = (preferredIds || []).map((id) => (records || []).find((rec) => String(rec.model_id || rec.model || '') === id)).find(Boolean);
      if (exact) return exact;
      const candidates = (records || []).filter((rec) => matcher.test(String(rec.model_id || rec.model || '')));
      if (!candidates.length) return null;
      const scoreOf = (rec) => {
        const id = String(rec.model_id || rec.model || '');
        let score = 0;
        if (/q4f16_1/i.test(id)) score += 60;
        if (/q4f32_1/i.test(id)) score += 42;
        if (/q0f16/i.test(id)) score += 22;
        if (/q0f32/i.test(id)) score += 12;
        if (/-1k$/i.test(id)) score -= 8;
        if (/vision|coder|math|jpn/i.test(id)) score -= 18;
        const vram = Number(rec.estimated_vram_bytes || 0);
        if (vram) score -= Math.round(vram / 500000000);
        return score;
      };
      return candidates.sort((a, b) => scoreOf(b) - scoreOf(a))[0] || null;
    },

    findEmbeddingModelId: function(){
      const records = this.getModelRecords();
      const preferred = ['snowflake-arctic-embed-m-q0f32-MLC-b4','snowflake-arctic-embed-s-q0f32-MLC-b4','snowflake-arctic-embed-m-q0f32-MLC-b32'];
      const match = preferred.map((id) => records.find((rec) => String(rec.model_id || rec.model || '') === id)).find(Boolean)
        || records.find((rec) => /snowflake-arctic-embed-m.*b4/i.test(String(rec.model_id || rec.model || '')))
        || records.find((rec) => /snowflake-arctic-embed-s.*b4/i.test(String(rec.model_id || rec.model || '')))
        || records.find((rec) => /snowflake-arctic-embed-m.*b32/i.test(String(rec.model_id || rec.model || '')))
        || records.find((rec) => /snowflake-arctic-embed-s.*b32/i.test(String(rec.model_id || rec.model || '')));
      return match ? (match.model_id || match.model) : '';
    },

    formatEmbeddingQuery: function(text){
      return `[CLS] Represent this sentence for searching relevant passages: ${String(text || '').trim()} [SEP]`;
    },

    formatEmbeddingDoc: function(text){
      return `[CLS] ${String(text || '').trim()} [SEP]`;
    },

    getSelectedModelEntry: function(){
      const catalog = this.state.modelCatalog && this.state.modelCatalog.length ? this.state.modelCatalog : (this.module ? this.buildModelCatalog() : AETHER_MODEL_PRESETS.map(p => Object.assign({}, p, { available: true, modelId: '' })));
      let selected = catalog.find((entry) => entry.key === this.state.selectedModelKey) || catalog[0];
      if (!selected) return null;
      if (selected.key === 'auto') {
        selected = catalog.find((entry) => entry.key !== 'auto' && entry.available) || selected;
      }
      if (!selected.available && selected.key !== 'auto') {
        selected = catalog.find((entry) => entry.key !== 'auto' && entry.available) || catalog.find((entry) => entry.key === 'auto') || selected;
      }
      return selected;
    },

    renderModelSelect: function(){
      const select = document.getElementById('aether-ai-model-select');
      if (!select) return;
      const catalog = this.state.modelCatalog && this.state.modelCatalog.length ? this.state.modelCatalog : AETHER_MODEL_PRESETS.map(p => Object.assign({}, p, { available: true }));
      select.innerHTML = catalog.map((entry) => {
        const suffix = entry.key !== 'auto' && entry.available === false ? ' · unavailable' : '';
        const disabled = entry.key !== 'auto' && entry.available === false ? ' disabled' : '';
        const selected = entry.key === this.state.selectedModelKey ? ' selected' : '';
        return `<option value="${entry.key}"${selected}${disabled}>${entry.label}${suffix}</option>`;
      }).join('');
    },

    selectModel: async function(key){
      this.state.selectedModelKey = key || 'auto';
      this.renderModelSelect();
      await this.persistKV('selectedModelKey', this.state.selectedModelKey);
      const entry = this.getSelectedModelEntry();
      this.state.progressText = entry && entry.key !== 'auto'
        ? `${entry.label} selected. Model will load lazily on first request.`
        : 'Auto model selected. Aether will pick the best available local model.';
      this.renderStatus();
      if (this.engine && !this.state.busy) {
        try { await this.ensureEngine(true); } catch(e) { this.handleError(e); }
      }
    },

    loadWebLLMModule: async function(){
      if (this.module) return this.module;
      if (window.__AETHER_WEBLLM) {
        this.module = window.__AETHER_WEBLLM;
        this.moduleURL = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm/+esm';
        this.buildModelCatalog();
        this.renderModelSelect();
        return this.module;
      }
      const urls = [
        'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm/+esm',
        'https://esm.run/@mlc-ai/web-llm',
        'https://esm.sh/@mlc-ai/web-llm'
      ];
      let lastErr = null;
      for (const url of urls) {
        try {
          this.state.status = 'priming';
          this.state.progress = 0.03;
          this.state.progressText = 'Loading WebLLM runtime into the browser...';
          this.renderStatus();
          this.moduleURL = url;
          this.module = await import(url);
          this.buildModelCatalog();
          this.renderModelSelect();
          return this.module;
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr || new Error('Unable to load WebLLM runtime');
    },

    getEngineConfig: function(webllm){
      return {
        appConfig: Object.assign({}, webllm.prebuiltAppConfig || {}, { cacheBackend: 'indexeddb' }),
        logLevel: 'WARN',
        initProgressCallback: (report) => this.handleInitProgress(report)
      };
    },

    handleInitProgress: function(report){
      const progress = Math.max(0, Math.min(1, Number(report && report.progress) || 0));
      this.state.status = 'loading';
      this.state.progress = progress;
      this.state.progressText = String((report && report.text) || 'Loading local model...');
      this.renderStatus();
    },

    ensureEngine: async function(forceReload){
      if (!navigator.gpu) throw new Error('WebGPU is unavailable in this browser. Use current Chrome or Edge with hardware acceleration enabled for local model loading.');
      const webllm = await this.loadWebLLMModule();
      const entry = this.getSelectedModelEntry();
      if (!entry || (!entry.modelId && entry.key !== 'auto')) {
        throw new Error('No compatible local model record was found in the current WebLLM build.');
      }
      const desired = entry.modelId || (this.getSelectedModelEntry() && this.getSelectedModelEntry().modelId) || '';
      if (!desired) throw new Error('No local model available to load.');
      const needsReload = forceReload || !this.engine || this.state.activeModelId !== desired;
      if (needsReload) {
        this.state.status = 'loading';
        this.state.progress = 0.05;
        this.state.progressText = `Preparing ${entry.label} for local download...`;
        this.renderStatus();
        if (!this.engine) {
          this.state.engineMode = 'main';
          this.engine = await webllm.CreateMLCEngine(desired, this.getEngineConfig(webllm));
        } else {
          await this.engine.reload(desired);
        }
        this.state.activeModelId = desired;
        this.state.activeEmbedModelId = '';
        this.state.activeEmbedModelLabel = 'Deterministic local vectors';
        this.state.activeModelKey = entry.key;
        this.state.activeModelLabel = entry.label;
        this.state.status = 'ready';
        this.state.progress = 1;
        this.state.progressText = `${entry.label} ready. Inference is running locally in this browser.`;
        this.state.cachedModels[desired] = { label: entry.label, ts: Date.now(), engineMode: 'main' };
        await this.persistKV('cachedModels', this.state.cachedModels);
      }
      this.renderStatus();
      return this.engine;
    },

    buildSystemContext: function(){
      const windows = Object.values(SystemState.windows || {});
      const openWindows = windows.filter(w => w.isOpen).sort((a,b) => (b.zIndex || 0) - (a.zIndex || 0));
      const activeWindow = openWindows.find(w => !w.isMinimized) || openWindows[0] || null;
      const runningServices = [];
      if (os.audioStream && !os.audioStream.paused && os.audioStream.src) runningServices.push('audio-stream');
      if (os._rbNowPlaying) runningServices.push('radio-browser');
      if (os.wakeLock && os.wakeLock.enabled) runningServices.push('screen-awake');
      if (os.wikiboard && os.wikiboard.engine) runningServices.push('wikiboard-engine');
      if (window.cursorEngine) runningServices.push('cursor-engine');
      if (os.sakuraInstance) runningServices.push('sakura-petals');
      if (SystemState.settings.speech_companion === 'on') runningServices.push('companion-voice');
      const mediaInfo = {
        station: SystemState.settings.media_tuner_station || 'lastfm',
        radio: os._rbNowPlaying ? {
          name: os._rbNowPlaying.name || '',
          tags: os._rbNowPlaying.tags || '',
          bitrate: os._rbNowPlaying.bitrate || ''
        } : null,
        ambientVideo: os._ytAmbientCurrent || '',
        topBarWeather: {
          temperature: document.getElementById('topbar-weather-temp') ? document.getElementById('topbar-weather-temp').innerText : '--°C',
          description: document.getElementById('topbar-weather-desc') ? document.getElementById('topbar-weather-desc').innerText : 'unknown'
        }
      };
      const preferences = {
        theme: SystemState.settings.active_theme || 'midnight',
        accent: SystemState.settings.theme_accent || '#ffffff',
        performanceMode: SystemState.settings.performance_mode || 'eco',
        cursorTheme: SystemState.settings.cursor_theme || 'aether',
        speechSynthesis: SystemState.settings.speech_synthesis || 'off',
        companionSpeech: SystemState.settings.speech_companion || 'off',
        wallpaperMode: SystemState.settings.wallpaper_mode || 'default',
        animeQuotes: SystemState.settings.anime_quotes || 'off'
      };
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
      const now = new Date();
      return {
        theme: preferences.theme,
        openWindows: openWindows.map(w => ({ id: w.id, title: w.title, minimized: !!w.isMinimized })),
        activeWindow: activeWindow ? { id: activeWindow.id, title: activeWindow.title } : null,
        activeModules: openWindows.map(w => w.id),
        totalWindowsOpen: openWindows.length,
        performanceMode: preferences.performanceMode,
        runningServices,
        mediaInfo,
        userPreferences: preferences,
        network: {
          online: navigator.onLine,
          type: conn ? (conn.effectiveType || conn.type || 'unknown') : 'unknown',
          downlink: conn ? conn.downlink : null,
          rtt: conn ? conn.rtt : null,
        },
        battery: {
          level: document.getElementById('top-battery-val') ? document.getElementById('top-battery-val').innerText : '--%',
          charging: false
        },
        screenAwake: os.wakeLock ? os.wakeLock.enabled : false,
        awakeMode: os.wakeLock ? os.wakeLock.mode : 'STANDBY',
        weather: {
          temperature: document.getElementById('topbar-weather-temp') ? document.getElementById('topbar-weather-temp').innerText : '--',
          description: document.getElementById('topbar-weather-desc') ? document.getElementById('topbar-weather-desc').innerText : '--',
          icon: document.getElementById('topbar-weather-icon') ? document.getElementById('topbar-weather-icon').innerText : ''
        },
        currentTime: now.toLocaleTimeString('en-US', { hour12: false }),
        currentDate: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        screenResolution: window.innerWidth + 'x' + window.innerHeight,
        fileManager: {
          currentPath: os.filemanager && os.filemanager.currentPath || '/Archive',
          activeFileId: os.filemanager && os.filemanager.activeFileId || ''
        },
        wikiBoard: {
          cards: os.wikiboard && os.wikiboard.engine && os.wikiboard.engine.cards ? os.wikiboard.engine.cards.size : 0
        },
        presence: {
          name: document.getElementById('sidebar-discord-name') ? document.getElementById('sidebar-discord-name').innerText : 'Offline',
          activity: document.getElementById('sidebar-discord-activity') ? document.getElementById('sidebar-discord-activity').innerText : 'Standby'
        }
      };
    },

    collectKnowledgeDocuments: function(){
      const docs = [];
      const moduleDescriptions = {
        media: 'Media Console manages music playback, Last.fm activity, volume, lyric styling, and visual audio presentation.',
        radiobrowser: 'Global Radio Network streams internet radio, displays station art, tags, bitrate, GIF mood layers, and a live audio visualizer.',
        wikiboard: 'WikiBoard is an infinite research canvas with draggable cards, connections, zoom, saved state, and Wikipedia fetching.',
        filemanager: 'Living Archive is the file manager with folders, breadcrumbs, metadata, relationships, previews, and live Wikipedia folders.',
        weather: 'Weather Station shows forecast and weather telemetry.',
        globe: 'Tactical Airspace Radar tracks live aircraft transponders on a geospatial map.',
        presence: 'Uplink Presence shows Discord / Lanyard presence telemetry.',
        settings: 'System Config is where appearance, performance profile, cursor themes, speech, and API settings are configured.',
        sysmon: 'System Diagnostics monitors performance, FPS, latency, memory, and network speed.',
        worldmuseums: 'World Museums Vault searches HD open-access artworks from the Art Institute of Chicago and The Met.',
        spacexhub: 'Orbital Launch Control tracks live global rocket launch countdowns and SpaceX fleet hardware.',
        worldfactbook: 'World Factbook explores 250+ nations and converts currencies via ECB Frankfurter rates.',
        gutendex: 'Gutenberg Library reads 70,000+ public-domain books via Gutendex.',
        shadertoy: 'GLSL Shader Studio compiles 60fps WebGL fragment shaders and embeds Shadertoy.',
        stellarium: 'NASA Eyes & Planetarium flies 3D Solar System, Asteroids, Earth satellites, and Stellarium night sky.',
        chiptune: 'Retro & 3D Makers hosts BeepBox chiptune DAW, Blockbench 3D studio, and JSPaint.',
        georadar: 'GeoRadar Explorer pairs OpenStreetMap with Wikipedia GeoSearch 10km landmark discovery.'
      };
      (os.finderModules || []).forEach((mod) => {
        docs.push({
          id: 'module:' + mod.id,
          kind: 'module',
          title: mod.label,
          text: `${mod.label} (${mod.id}) is an AetherOS ${mod.category} module. ${moduleDescriptions[mod.id] || ''}`,
          target: mod.id
        });
      });
      Object.keys(AETHER_THEME_DOCS).forEach((theme) => {
        docs.push({ id: 'theme:' + theme, kind: 'theme', title: theme, text: `${theme} theme. ${AETHER_THEME_DOCS[theme]}`, target: theme });
      });
      docs.push({ id:'doc:cinematic', kind:'setting', title:'Cinematic performance mode', text:'Cinematic mode is enabled through System Config in the Appearance tab by setting performance_mode to cinematic. It increases visual effects compared with eco mode.', target:'performance_mode' });
      docs.push({ id:'doc:cursor-nyan', kind:'setting', title:'Nyan cursor', text:'Nyan cursor is enabled by setting cursor_theme to nyan. Optional standard overlay uses cursor_nyan_standard.', target:'cursor_theme' });
      docs.push({ id:'doc:weather-settings', kind:'setting', title:'Weather Station', text:'Open the Weather Station module to inspect weather settings and live forecast telemetry.', target:'weather' });
      docs.push({ id:'doc:voice', kind:'setting', title:'Voice settings', text:'Speech synthesis and companion chatter are controlled from System Config. speech_synthesis toggles TTS and speech_companion toggles companion chatter.', target:'speech' });
      try {
        const flat = os.fmFlatten ? os.fmFlatten() : [];
        flat.slice(0, 260).forEach((item) => {
          docs.push({
            id: 'archive:' + item.id,
            kind: item.kind || 'file',
            title: item.name || item.id,
            text: `${item.name || item.id} at ${item.path || ''}. ${(item.content || '')} ${(item.tags || []).join(' ')} ${(item.refs || []).join(' ')}`,
            target: item.id,
            path: item.path || ''
          });
        });
      } catch(_) {}
      try {
        const wb = JSON.parse(localStorage.getItem('AetherOS_WikiBoard') || 'null');
        if (wb && Array.isArray(wb.cards)) {
          wb.cards.slice(0, 160).forEach((card) => {
            const body = card && card.data ? JSON.stringify(card.data) : '';
            docs.push({ id: 'wb:' + card.id, kind: 'wikiboard', title: card.title || ('Card ' + card.id), text: `${card.title || ''} ${body}`, target: card.id });
          });
        }
      } catch(_) {}
      this.memories.slice(-12).forEach((note) => {
        docs.push({ id: note.id, kind: 'memory', title: note.category || 'memory', text: note.text, target: note.id });
      });
      this.docsCache = docs;
      return docs;
    },

    searchKnowledge: function(query, topK){
      const docs = this.collectKnowledgeDocuments();
      const qVec = this.embedText(query);
      const qTokens = this.tokenize(query);
      return docs.map((doc) => {
        if (!doc._vec) doc._vec = this.embedText(doc.text + ' ' + doc.title);
        const similarity = aetherCosine(qVec, doc._vec);
        const dTokens = this.tokenize(doc.text + ' ' + doc.title);
        const overlap = qTokens.filter(t => dTokens.includes(t)).length;
        const score = similarity + overlap * 0.08 + (/^(module|theme|setting)$/.test(doc.kind) ? 0.02 : 0);
        return Object.assign({ score }, doc);
      }).sort((a,b) => b.score - a.score).slice(0, topK || 5);
    },

    resolveKnowledgeTarget: function(name){
      const hits = this.searchKnowledge(name, 3);
      return hits.find(hit => hit.score > 0.34) || null;
    },

    buildMemorySummary: function(){
      const favModules = Object.entries(this.stats.moduleUsage || {}).sort((a,b) => b[1] - a[1]).slice(0, 4).map(([k,v]) => `${k}:${v}`);
      const favThemes = Object.entries(this.stats.themeUsage || {}).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([k,v]) => `${k}:${v}`);
      const notes = this.memories.slice(-5).map((n) => n.text);
      return [
        favModules.length ? `Frequently used modules: ${favModules.join(', ')}` : '',
        favThemes.length ? `Favorite themes: ${favThemes.join(', ')}` : '',
        notes.length ? `Recent remembered notes: ${notes.map(n => aetherEllipsize(n, 100)).join(' | ')}` : ''
      ].filter(Boolean).join('\n');
    },

    buildRetrievedContext: function(query){
      const hits = this.searchKnowledge(query, 5).filter(hit => hit.score > 0.22);
      const lines = hits.map((hit, idx) => `#${idx + 1} [${hit.kind}] ${hit.title}: ${aetherEllipsize(hit.text, 340)}`);
      return { hits, text: lines.join('\n') };
    },

    rerankKnowledgeWithEmbeddings: async function(engine, query, shortlist){
      if (!engine || !this.state.activeEmbedModelId || !shortlist || !shortlist.length || !engine.embeddings || !engine.embeddings.create) return shortlist;
      try {
        const inputs = [this.formatEmbeddingQuery(query)].concat(shortlist.map((hit) => this.formatEmbeddingDoc(`${hit.title}. ${hit.text}`)));
        const reply = await engine.embeddings.create({ input: inputs, model: this.state.activeEmbedModelId });
        if (!reply || !reply.data || reply.data.length !== inputs.length) return shortlist;
        const qVec = reply.data[0].embedding;
        const reranked = shortlist.map((hit, idx) => {
          const score = aetherCosine(qVec, reply.data[idx + 1].embedding) + (hit.score || 0) * 0.35;
          return Object.assign({}, hit, { score });
        }).sort((a,b) => b.score - a.score);
        return reranked;
      } catch (_) {
        return shortlist;
      }
    },

    buildRetrievedContextAsync: async function(query, engine){
      const base = this.buildRetrievedContext(query);
      const reranked = await this.rerankKnowledgeWithEmbeddings(engine, query, this.searchKnowledge(query, 12));
      const hits = (reranked && reranked.length ? reranked : base.hits).slice(0, 5).filter(hit => (hit.score || 0) > 0.18);
      return {
        hits,
        text: hits.map((hit, idx) => `#${idx + 1} [${hit.kind}] ${hit.title}: ${aetherEllipsize(hit.text, 340)}`).join('\n')
      };
    },

    buildHistoryForModel: function(currentUserText){
      const history = this.conversation.filter((msg) => (msg.role === 'user' || msg.role === 'assistant')).slice(-10);
      const deduped = history.length && history[history.length - 1].role === 'user' && history[history.length - 1].text === currentUserText
        ? history.slice(0, -1)
        : history;
      return deduped.map((msg) => ({ role: msg.role, content: aetherEllipsize(msg.text, 1200) }));
    },

    buildPlannerPrompt: function(context, retrieved, userText){
      return [
        'You are the local action planner for AetherOS.',
        'If the user is asking to control the OS, return either tool calls or strict JSON only.',
        'Allowed actions: openModule, closeWindow, minimizeWindow, restoreWindow, setTheme, setPerformanceMode, setOption, playAmbientSearch, openArchivePath, openArchiveItem, searchWikiBoard, rememberNote, enableWakeLock, disableWakeLock.',
        'Use existing module ids only. Never invent modules.',
        'If no action is needed, return JSON like {"mode":"reply","reply":"..."}.',
        'If actions are needed, return JSON like {"mode":"actions","reply":"...","actions":[{"action":"openModule","target":"media"}]}.',
        `System context: ${JSON.stringify(context)}`,
        retrieved ? `Local knowledge: ${retrieved}` : '',
        `User request: ${userText}`
      ].filter(Boolean).join('\n');
    },

    buildToolSchema: function(){
      return [
        { type:'function', function:{ name:'openModule', description:'Open an existing AetherOS module window', parameters:{ type:'object', properties:{ target:{ type:'string', description:'Existing module id or name' } }, required:['target'] } } },
        { type:'function', function:{ name:'closeWindow', description:'Close an open AetherOS window', parameters:{ type:'object', properties:{ target:{ type:'string' } }, required:['target'] } } },
        { type:'function', function:{ name:'minimizeWindow', description:'Minimize an open AetherOS window', parameters:{ type:'object', properties:{ target:{ type:'string' } }, required:['target'] } } },
        { type:'function', function:{ name:'restoreWindow', description:'Restore a minimized AetherOS window', parameters:{ type:'object', properties:{ target:{ type:'string' } }, required:['target'] } } },
        { type:'function', function:{ name:'setTheme', description:'Apply an existing AetherOS theme', parameters:{ type:'object', properties:{ target:{ type:'string' } }, required:['target'] } } },
        { type:'function', function:{ name:'setPerformanceMode', description:'Set performance mode to eco or cinematic', parameters:{ type:'object', properties:{ target:{ type:'string' } }, required:['target'] } } },
        { type:'function', function:{ name:'setOption', description:'Set a known settings option to a value', parameters:{ type:'object', properties:{ key:{ type:'string' }, value:{ type:'string' } }, required:['key','value'] } } },
        { type:'function', function:{ name:'playAmbientSearch', description:'Open YouTube Ambient and search for a mood or track', parameters:{ type:'object', properties:{ target:{ type:'string' } }, required:['target'] } } },
        { type:'function', function:{ name:'searchWikiBoard', description:'Open WikiBoard and search a query', parameters:{ type:'object', properties:{ target:{ type:'string' } }, required:['target'] } } },
        { type:'function', function:{ name:'openArchivePath', description:'Open the Living Archive file manager at a folder path', parameters:{ type:'object', properties:{ target:{ type:'string' } }, required:['target'] } } },
        { type:'function', function:{ name:'openArchiveItem', description:'Open an item from the Living Archive by id or title', parameters:{ type:'object', properties:{ target:{ type:'string' } }, required:['target'] } } },
        { type:'function', function:{ name:'rememberNote', description:'Store a persistent local memory note', parameters:{ type:'object', properties:{ text:{ type:'string' }, category:{ type:'string' } }, required:['text'] } } },
        { type:'function', function:{ name:'enableWakeLock', description:'Enable screen awake mode', parameters:{ type:'object', properties:{} } } },
        { type:'function', function:{ name:'disableWakeLock', description:'Disable screen awake mode', parameters:{ type:'object', properties:{} } } }
      ];
    },

    callPlanner: async function(engine, context, retrieved, userText){
      const messages = [
        { role:'system', content: this.buildPlannerPrompt(context, retrieved, userText) },
        { role:'user', content: userText }
      ];
      try {
        const result = await engine.chat.completions.create({
          messages,
          tools: this.buildToolSchema(),
          tool_choice: 'auto',
          temperature: 0.05,
          max_tokens: 180
        });
        const msg = result && result.choices && result.choices[0] ? (result.choices[0].message || {}) : {};
        if (msg.tool_calls && msg.tool_calls.length) {
          return {
            reply: msg.content || '',
            actions: msg.tool_calls.map((call) => {
              let args = {};
              try { args = JSON.parse(call.function && call.function.arguments || '{}'); } catch(_) {}
              return Object.assign({ action: call.function && call.function.name || '' }, args);
            })
          };
        }
        const parsed = aetherSafeJsonParse(msg.content || '');
        if (parsed) return parsed;
        return { reply: msg.content || '', actions: [] };
      } catch(_) {
        const fallback = await engine.chat.completions.create({
          messages,
          temperature: 0.05,
          max_tokens: 180
        });
        const content = fallback && fallback.choices && fallback.choices[0] && fallback.choices[0].message ? fallback.choices[0].message.content : '';
        return aetherSafeJsonParse(content) || { reply: content || '', actions: [] };
      }
    },

    shouldUsePlanner: function(text){
      const q = aetherNormalize(text);
      if (!q) return false;
      if (/^(how|what|where|why|when)\b/.test(q)) return false;
      if (/\?$/.test(String(text || '').trim())) return false;
      return /^(open|launch|show|close|minimize|restore|switch|set|change|enable|disable|toggle|play|search|find|remember)\b/.test(q)
        || /\b(open|close|minimize|restore|switch theme|set theme|enable|disable|toggle)\b/.test(q);
    },

    maybeDirectCommand: async function(text){
      const raw = String(text || '').trim();
      const q = aetherNormalize(raw);
      if (!q) return null;
      const structured = aetherSafeJsonParse(raw);
      if (structured && structured.action) {
        return { reply:'Executing structured local action.', actions:[structured] };
      }
      const rememberMatch = raw.match(/^(?:remember|note|memorize)\s+(?:that\s+)?(.+)/i);
      if (rememberMatch && rememberMatch[1]) {
        return { reply:'Storing that in local memory.', actions:[{ action:'rememberNote', text: rememberMatch[1], category:'user-note' }] };
      }
      let m = raw.match(/^(open|launch|show)\s+(.+)/i);
      if (m) {
        const target = this.resolveModuleTarget(m[2]);
        if (target) return { reply:`Opening ${SystemState.windows[target].title}.`, actions:[{ action:'openModule', target }] };
        const hit = this.resolveKnowledgeTarget(m[2]);
        if (hit && hit.path) return { reply:`Opening ${hit.title} in Living Archive.`, actions:[{ action:'openArchiveItem', target: hit.target || hit.title }] };
      }
      m = raw.match(/^(close|quit|hide)\s+(.+)/i);
      if (m) {
        const target = this.resolveModuleTarget(m[2]);
        if (target) return { reply:`Closing ${SystemState.windows[target].title}.`, actions:[{ action:'closeWindow', target }] };
      }
      m = raw.match(/^(minimize)\s+(.+)/i);
      if (m) {
        const target = this.resolveModuleTarget(m[2]);
        if (target) return { reply:`Minimizing ${SystemState.windows[target].title}.`, actions:[{ action:'minimizeWindow', target }] };
      }
      m = raw.match(/^(restore|maximize)\s+(.+)/i);
      if (m) {
        const target = this.resolveModuleTarget(m[2]);
        if (target) return { reply:`Restoring ${SystemState.windows[target].title}.`, actions:[{ action:'restoreWindow', target }] };
      }
      m = raw.match(/^(?:switch|set|change)\s+(?:to\s+)?(.+?)\s+theme$/i) || raw.match(/^(?:theme)\s+(.+)/i);
      if (m) {
        const theme = this.resolveThemeTarget(m[1]);
        if (theme) return { reply:`Switching to ${theme} theme.`, actions:[{ action:'setTheme', target: theme }] };
      }
      m = raw.match(/^(enable|disable|toggle)\s+(.+)/i);
      if (m) {
        const setting = this.resolveSettingMutation(m[2], m[1].toLowerCase());
        if (setting) return { reply:`Applying ${m[1].toLowerCase()} command.`, actions:[setting] };
      }
      m = raw.match(/^(?:play|search|find)\s+(.+)/i);
      if (m && /lofi|ambient|sleep|jazz|chill|rain|focus|study|music/i.test(m[1])) {
        return { reply:`Opening YouTube Ambient for ${m[1]}.`, actions:[{ action:'playAmbientSearch', target:m[1] }] };
      }
      m = raw.match(/^(?:wiki|search wiki|launch wiki board|open wiki board)\s+(.+)/i);
      if (m) {
        return { reply:`Launching WikiBoard search for ${m[1]}.`, actions:[{ action:'searchWikiBoard', target:m[1] }] };
      }
      if (/^status$/i.test(raw) || /^system status$/i.test(raw)) {
        const ctx = this.buildSystemContext();
        const parts = [
          `${ctx.openWindows.length} windows open.`,
          `Theme: ${ctx.theme}.`,
          `Perf: ${ctx.performanceMode}.`,
          `Net: ${ctx.network.online ? ctx.network.type : 'OFFLINE'}${ctx.network.downlink ? ' ' + ctx.network.downlink + 'Mbps' : ''}.`,
          `Weather: ${ctx.weather.temperature} ${ctx.weather.description}.`,
          ctx.screenAwake ? 'Screen: AWAKE.' : '',
          ctx.battery.level !== '--%' ? `Battery: ${ctx.battery.level}.` : '',
          `Time: ${ctx.currentTime}.`
        ].filter(Boolean);
        return { reply: parts.join(' '), actions:[] };
      }
      if (/\bweather\b/i.test(raw) && q.length <= 24) {
        const temp = document.getElementById('topbar-weather-temp') ? document.getElementById('topbar-weather-temp').innerText : '--';
        const desc = document.getElementById('topbar-weather-desc') ? document.getElementById('topbar-weather-desc').innerText : 'unknown';
        return { reply:`Weather reads ${temp}, ${desc}.`, actions:[{ action:'openModule', target:'weather' }] };
      }
      if (/\btime\b/i.test(raw) && q.length <= 18) {
        return { reply:`Current local time is ${new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })}.`, actions:[] };
      }
      if (/\bdate|today\b/i.test(raw) && q.length <= 18) {
        return { reply:`Today is ${new Date().toLocaleDateString([], { weekday:'long', year:'numeric', month:'long', day:'numeric' })}.`, actions:[] };
      }
      if (/^(help|commands)$/i.test(raw)) {
        return { reply:'Commands: open [module], close/minimize/restore [module], switch to [theme] theme, enable/disable [setting], play [mood], wiki [topic], remember [note], status, weather, time, date, battery, network, awake.', actions:[] };
      }
      if (/\bbattery\b/i.test(raw) && q.length <= 18) {
        const val = document.getElementById('top-battery-val') ? document.getElementById('top-battery-val').innerText : '--%';
        return { reply:`Battery level: ${val}.`, actions:[] };
      }
      if (/\bnetwork\b/i.test(raw) && q.length <= 20) {
        const conn = navigator.connection || null;
        const online = navigator.onLine;
        if (!online) return { reply:'Network is offline.', actions:[] };
        const parts = ['Connected.'];
        if (conn) { parts.push(`Type: ${conn.effectiveType || 'unknown'}.`); if (conn.downlink) parts.push(`Speed: ${conn.downlink} Mbps.`); if (conn.rtt) parts.push(`RTT: ${conn.rtt}ms.`); }
        return { reply: parts.join(' '), actions:[] };
      }
      if (/\bawake\b/i.test(raw) && q.length <= 18) {
        const isAwake = os.wakeLock && os.wakeLock.enabled;
        return { reply:`Screen awake is ${isAwake ? 'ON (' + (os.wakeLock?.mode || '') + ')' : 'OFF'}.`, actions:[] };
      }
      return null;
    },

    executeAction: async function(action){
      const a = Object.assign({}, action || {});
      const kind = String(a.action || '').trim();
      let ok = false;
      let label = '';
      if (kind === 'openModule') {
        const target = this.resolveModuleTarget(a.target);
        if (target && SystemState.windows[target]) {
          os.openWindow(target);
          this.bumpModuleUsage(target);
          ok = true; label = `openModule(${target})`;
        }
      } else if (kind === 'closeWindow') {
        const target = this.resolveModuleTarget(a.target);
        if (target && window.winManager) { window.winManager.closeWindow(target); ok = true; label = `closeWindow(${target})`; }
      } else if (kind === 'minimizeWindow') {
        const target = this.resolveModuleTarget(a.target);
        if (target && window.winManager) { window.winManager.minimizeWindow(target); ok = true; label = `minimizeWindow(${target})`; }
      } else if (kind === 'restoreWindow') {
        const target = this.resolveModuleTarget(a.target);
        if (target && window.winManager) { window.winManager.restoreWindow(target); ok = true; label = `restoreWindow(${target})`; }
      } else if (kind === 'setTheme') {
        const theme = this.resolveThemeTarget(a.target);
        if (theme) { os.applyTheme(theme); this.bumpThemeUsage(theme); ok = true; label = `setTheme(${theme})`; }
      } else if (kind === 'setPerformanceMode') {
        const mode = /cin/i.test(String(a.target || '')) ? 'cinematic' : 'eco';
        os.setOption('performance_mode', mode); ok = true; label = `setPerformanceMode(${mode})`;
      } else if (kind === 'setOption') {
        const allowed = new Set(['cursor_theme','cursor_oneko','cursor_oneko_ball','cursor_nyan_standard','sakura_petals','anime_quotes','speech_synthesis','speech_companion']);
        if (allowed.has(a.key)) { os.setOption(a.key, String(a.value || '')); ok = true; label = `setOption(${a.key}=${a.value})`; }
      } else if (kind === 'playAmbientSearch') {
        os.openWindow('winamp');
        ok = true; label = 'openWindow(winamp)';
      } else if (kind === 'searchWikiBoard') {
        const query = String(a.target || '').trim();
        os.openWindow('wikiboard');
        aetherSoon(() => {
          if (os.wikiboard && os.wikiboard.engine && os.wikiboard.engine.searchAndSpawn) {
            os.wikiboard.engine.searchAndSpawn(query);
          }
        }, 750);
        ok = !!query; label = `searchWikiBoard(${query})`;
      } else if (kind === 'openArchivePath') {
        const path = String(a.target || '').trim();
        os.openWindow('filemanager');
        aetherSoon(() => { if (os.fmOpenPath) os.fmOpenPath(path); }, 650);
        ok = !!path; label = `openArchivePath(${path})`;
      } else if (kind === 'openArchiveItem') {
        const target = String(a.target || '').trim();
        const hit = os.fmFindById && os.fmFindById(target) || this.resolveKnowledgeTarget(target);
        os.openWindow('filemanager');
        aetherSoon(() => {
          if (hit && hit.path && os.fmOpenPath) {
            const node = os.fmFindById && os.fmFindById(hit.target || hit.id) || null;
            if (node && node.kind === 'folder' && os.fmOpenPath) os.fmOpenPath(node.path);
            else if (node && os.fmOpenFile) os.fmOpenFile(node.id);
            else if (os.fmOpenPath) os.fmOpenPath(hit.path.split('/').slice(0, -1).join('/') || '/Archive');
          }
        }, 650);
        ok = true; label = `openArchiveItem(${target})`;
      } else if (kind === 'rememberNote') {
        const note = await this.rememberNote(a.text || a.target || '', a.category || 'user-note');
        ok = !!note; label = 'rememberNote(local)';
      } else if (kind === 'enableWakeLock') {
        if (os.toggleWakeLock && !os.wakeLock?.enabled) os.toggleWakeLock();
        ok = true; label = 'enableWakeLock()';
      } else if (kind === 'disableWakeLock') {
        if (os.disableWakeLock && os.wakeLock?.enabled) await os.disableWakeLock();
        ok = true; label = 'disableWakeLock()';
      }
      return { ok, label, action: kind };
    },

    bumpModuleUsage: function(id){
      this.stats.moduleUsage[id] = (this.stats.moduleUsage[id] || 0) + 1;
      this.persistKV('stats', this.stats);
    },

    bumpThemeUsage: function(theme){
      this.stats.themeUsage[theme] = (this.stats.themeUsage[theme] || 0) + 1;
      this.persistKV('stats', this.stats);
    },

    renderExecutionSummary: function(results){
      if (!results || !results.length) return;
      const text = 'Execution results: ' + results.map(r => r.ok ? r.label : ('rejected:' + r.label)).join(' • ');
      os.companionChatAppend('AETHER', text, results.every(r => r.ok) ? 'good' : 'warn');
    },

    createStreamingRow: function(){
      const log = document.getElementById('companion-chat-log');
      if (!log) return null;
      const row = document.createElement('div');
      row.className = 'leading-relaxed break-words text-gray-300';
      const who = document.createElement('span');
      who.className = 'text-os-accent';
      who.textContent = 'AETHER:';
      const spacer = document.createTextNode(' ');
      const text = document.createElement('span');
      text.className = 'aether-chat-stream-text';
      const caret = document.createElement('span');
      caret.className = 'aether-chat-caret';
      caret.textContent = '▌';
      row.appendChild(who);
      row.appendChild(spacer);
      row.appendChild(text);
      row.appendChild(caret);
      log.appendChild(row);
      log.scrollTop = log.scrollHeight;
      return {
        row,
        text,
        caret,
        set(value){ text.textContent = value; log.scrollTop = log.scrollHeight; },
        finish(){ caret.remove(); while (log.children.length > 26) log.firstChild && log.firstChild.remove(); log.scrollTop = log.scrollHeight; }
      };
    },

    buildAssistantPrompt: function(context, retrievedText, userText, actionResults){
      const memory = this.buildMemorySummary();
      return [
        'You are Aether, the onboard intelligence of AetherOS.',
        'Inference is running locally in the browser via WebLLM. Never claim cloud-only processing or hidden server access.',
        'Use the supplied system context and retrieved local knowledge when relevant.',
        'Be concise, cinematic, and practical. If something is uncertain, say so plainly.',
        'When actions were executed, acknowledge them naturally and mention the actual result.',
        `System context: ${JSON.stringify(context)}`,
        retrievedText ? `Retrieved local knowledge:\n${retrievedText}` : '',
        memory ? `Persistent local memory:\n${memory}` : '',
        actionResults && actionResults.length ? `Action results: ${actionResults.map(r => `${r.ok ? 'ok' : 'rejected'}:${r.label}`).join(', ')}` : '',
        `Current user request: ${userText}`
      ].filter(Boolean).join('\n\n');
    },

    maybeSpeakResponse: function(text){
      if (this.state.lastUsedVoice) {
        os.speak(text, { force: true, interrupt: true, rate: 0.92, pitch: 0.86, volume: 0.88 });
        return;
      }
      if (SystemState.settings.speech_synthesis === 'on') {
        os.speak(text, { interrupt: true, rate: 0.92, pitch: 0.86, volume: 0.88 });
      }
    },

    renderStatus: function(){
      const entry = this.getSelectedModelEntry() || AETHER_MODEL_PRESETS[0];
      const modelLabel = document.getElementById('aether-ai-model-label');
      const speedLabel = document.getElementById('aether-ai-speed-label');
      const sizeLabel = document.getElementById('aether-ai-size-label');
      const vramLabel = document.getElementById('aether-ai-vram-label');
      const statusText = document.getElementById('aether-ai-status-text');
      const progressBar = document.getElementById('aether-ai-progress-bar');
      const localBadge = document.getElementById('aether-ai-local-badge');
      const cacheBadge = document.getElementById('aether-ai-cache-badge');
      const memBadge = document.getElementById('aether-ai-memory-badge');
      const ctxBadge = document.getElementById('aether-ai-context-badge');
      const voiceLabel = document.getElementById('aether-ai-voice-status-label');
      const voiceWrap = document.getElementById('aether-ai-voice-status');
      const listenBtn = document.getElementById('aether-chat-voice-toggle');
      const pttBtn = document.getElementById('aether-chat-ptt');
      const detailsBtn = document.getElementById('aether-chat-details-toggle');
      if (modelLabel) modelLabel.textContent = this.state.activeModelLabel || entry.label || 'Lazy / not loaded';
      if (speedLabel) speedLabel.textContent = this.state.tps ? `${this.state.tps.toFixed(1)} tok/s` : '-- tok/s';
      if (sizeLabel) sizeLabel.textContent = entry.approxSize || '--';
      if (vramLabel) vramLabel.textContent = entry.approxVRAM || '--';
      if (statusText) statusText.textContent = this.state.progressText;
      if (progressBar) {
        progressBar.style.width = `${Math.max(2, Math.round((this.state.progress || 0) * 100))}%`;
        progressBar.style.opacity = this.state.status === 'idle' ? '0.25' : '1';
      }
      if (localBadge) localBadge.textContent = this.engine ? 'LOCAL WEBLLM' : 'LAZY LOCAL AI';
      if (cacheBadge) {
        const cached = this.state.activeModelId && this.state.cachedModels[this.state.activeModelId];
        cacheBadge.textContent = navigator.onLine === false ? 'OFFLINE MODE' : (cached ? 'OFFLINE READY' : 'FIRST DOWNLOAD');
      }
      if (memBadge) memBadge.textContent = `LOCAL MEMORY • ${this.memories.length} NOTES`;
      if (ctxBadge) ctxBadge.textContent = `CTX ~${this.state.contextTokens || 0}`;
      const displayVoiceStatus = (window.speechSynthesis && window.speechSynthesis.speaking && !/listening|ptt/i.test(this.state.voiceStatus)) ? 'SPEAKING' : this.state.voiceStatus;
      if (voiceLabel) voiceLabel.textContent = displayVoiceStatus;
      if (voiceWrap) voiceWrap.classList.toggle('active', /listening|ptt|speaking/i.test(displayVoiceStatus));
      if (listenBtn) listenBtn.classList.toggle('active', !!this.voice.continuous);
      if (pttBtn) pttBtn.classList.toggle('active', !!this.voice.pushToTalk);
      if (detailsBtn) detailsBtn.classList.toggle('active', !this.state.compactUI);
      this.paintMicMeter(this.state.micLevel || 0);
    },

    paintMicMeter: function(level){
      const meter = document.getElementById('aether-ai-mic-meter');
      if (!meter) return;
      const bars = Array.from(meter.querySelectorAll('span'));
      bars.forEach((bar, idx) => {
        const threshold = (idx + 1) / bars.length;
        bar.classList.toggle('active', level >= threshold * 0.8);
      });
    },

    runChip: function(idx){
      const cmd = this._chipCommands && this._chipCommands[idx];
      if (cmd) os.companionChatQuick(cmd);
    },

    renderCommandChips: function(){
      const row = document.getElementById('aether-chat-chip-row');
      if (!row) return;
      const favModules = Object.entries(this.stats.moduleUsage || {}).sort((a,b) => b[1] - a[1]).map(([k]) => k).slice(0, 3);
      const favThemes = Object.entries(this.stats.themeUsage || {}).sort((a,b) => b[1] - a[1]).map(([k]) => k).slice(0, 1);
      const chips = [
        favModules[0] ? `open ${favModules[0]}` : 'open music',
        favModules[1] ? `open ${favModules[1]}` : 'open radio',
        favModules[2] ? `open ${favModules[2]}` : 'open sysmon',
        favThemes[0] ? `switch to ${favThemes[0]} theme` : 'switch to synthwave theme',
        'status',
        'weather',
        'play lofi',
        'open terminal'
      ];
      this._chipCommands = chips;
      row.innerHTML = chips.map((chip, idx) => `<button onclick="os.aiAssistant.runChip(${idx})" class="aether-chat-chip hover-target">${os._html ? os._html(chip) : chip}</button>`).join('');
    },
    handleUserMessage: async function(text, opts){
      if (this.state.busy) {
        os.companionChatAppend('AETHER', 'Local engine already generating. Please wait for the current response to finish.', 'warn');
        return;
      }
      const raw = String(text || '').trim();
      if (!raw) return;
      this.state.lastUsedVoice = !!(opts && opts.usedVoice);
      this.state.tps = 0;
      os.companionChatAppend('YOU', raw);
      await this.persistMessage('user', raw, 'good');
      os.companionSetThinking(true);
      this.state.busy = true;
      this.state.progressText = 'Building live system context and local retrieval set...';
      this.renderStatus();
      try {
        const direct = await this.maybeDirectCommand(raw);
        if (direct) {
          const results = [];
          if (direct.actions && direct.actions.length) {
            for (const action of direct.actions) results.push(await this.executeAction(action));
            this.renderExecutionSummary(results);
          }
          if (direct.reply) {
            os.companionChatAppend('AETHER', direct.reply, results.length ? (results.every(r => r.ok) ? 'good' : 'warn') : 'good');
            await this.persistMessage('assistant', direct.reply, results.length ? (results.every(r => r.ok) ? 'good' : 'warn') : 'good', { actions: results });
            this.maybeSpeakResponse(direct.reply);
          }
          this.state.progressText = results.length ? 'Direct command executed through local control layer.' : 'Resolved from local context without model download.';
          this.renderCommandChips();
          return;
        }

        let engine = null;
        try {
          engine = await this.ensureEngine(false);
        } catch (engineErr) {
          // Graceful deterministic local fallback when WebGPU / WebLLM is unavailable
          let fallbackReply = '';
          if (typeof os._legacyCompanionChatReply === 'function') {
            const legacy = await Promise.resolve(os._legacyCompanionChatReply(raw));
            fallbackReply = typeof legacy === 'string' ? legacy : (legacy && legacy.text ? legacy.text : '');
          }
          if (!fallbackReply) {
            const retrieved = this.buildRetrievedContext(raw);
            fallbackReply = retrieved.hits.length
              ? `${retrieved.hits[0].title}: ${aetherEllipsize(retrieved.hits[0].text, 220)}`
              : `Local WebGPU model unavailable (${engineErr && engineErr.message ? engineErr.message : 'no WebGPU'}). Direct OS commands (e.g. "open weather", "switch to synthwave theme", "status") remain fully active.`;
          }
          os.companionChatAppend('AETHER', fallbackReply, 'normal');
          await this.persistMessage('assistant', fallbackReply, 'normal', { fallback: true });
          this.maybeSpeakResponse(fallbackReply);
          this.state.progressText = 'Responded via built-in deterministic local engine (WebGPU idle/unavailable).';
          this.renderCommandChips();
          return;
        }
        const context = this.buildSystemContext();
        const retrieved = await this.buildRetrievedContextAsync(raw, engine);
        const history = this.buildHistoryForModel(raw);
        let actionResults = [];
        let planner = null;

        if (this.shouldUsePlanner(raw)) {
          this.state.progressText = 'Planning possible OS actions locally...';
          this.renderStatus();
          planner = await this.callPlanner(engine, context, retrieved.text, raw);
          if (planner && Array.isArray(planner.actions) && planner.actions.length) {
            for (const action of planner.actions) actionResults.push(await this.executeAction(action));
            this.renderExecutionSummary(actionResults);
          }
        }

        const systemPrompt = this.buildAssistantPrompt(context, retrieved.text, raw, actionResults);
        const modelMessages = [{ role:'system', content: systemPrompt }].concat(history, [{ role:'user', content: raw }]);
        this.state.contextTokens = aetherApproxTokens(systemPrompt + '\n' + JSON.stringify(modelMessages));
        this.state.progressText = 'Generating local response...';
        this.renderStatus();

        const streamRow = this.createStreamingRow();
        const started = performance.now();
        let finalText = '';
        const stream = await engine.chat.completions.create({
          messages: modelMessages,
          stream: true,
          temperature: 0.45,
          max_tokens: 320
        });

        for await (const chunk of stream) {
          const delta = chunk && chunk.choices && chunk.choices[0] && chunk.choices[0].delta ? (chunk.choices[0].delta.content || '') : '';
          if (!delta) continue;
          finalText += delta;
          if (streamRow) streamRow.set(finalText);
          const elapsed = Math.max(0.35, (performance.now() - started) / 1000);
          this.state.tps = aetherApproxTokens(finalText) / elapsed;
          this.state.progressText = 'Streaming locally...';
          this.renderStatus();
        }

        finalText = String(finalText || planner && planner.reply || '').trim();
        if (streamRow) streamRow.finish();
        if (!finalText) {
          finalText = planner && planner.reply ? planner.reply : 'Local model completed, but returned an empty answer.';
          if (streamRow) streamRow.text.textContent = finalText;
        }
        if (planner && planner.reply && finalText.length < 8) {
          finalText = planner.reply;
          if (streamRow) streamRow.text.textContent = finalText;
        }

        await this.persistMessage('assistant', finalText, actionResults.length ? 'good' : 'normal', { actions: actionResults, retrieved: retrieved.hits.map(h => h.id) });
        if (os.companion && os.companion.getEmotionFromText && os.companion.triggerAvatarEmotion) {
          os.companion.triggerAvatarEmotion(os.companion.getEmotionFromText(finalText));
        }
        this.maybeSpeakResponse(finalText);
        this.state.progressText = `${this.state.activeModelLabel} responded locally.`;
        this.renderCommandChips();
      } finally {
        this.state.status = 'ready';
        this.state.progress = 1;
        this.state.busy = false;
        os.companionSetThinking(false);
        this.renderStatus();
      }
    },

    runTurn: async function(raw, opts){
      const text = String(raw || '').trim();
      if (!text) return { text:'', tone:'normal' };
      try {
        const direct = await this.maybeDirectCommand(text);
        if (direct) {
          const results = [];
          if (direct.actions && direct.actions.length) {
            for (const action of direct.actions) results.push(await this.executeAction(action));
          }
          return { text: direct.reply || 'Done.', tone: results.length ? (results.every(r => r.ok) ? 'good' : 'warn') : 'good' };
        }
        const engine = await this.ensureEngine(false);
        const context = this.buildSystemContext();
        const retrieved = await this.buildRetrievedContextAsync(text, engine);
        const response = await engine.chat.completions.create({
          messages: [
            { role:'system', content: this.buildAssistantPrompt(context, retrieved.text, text, []) },
            { role:'user', content: text }
          ],
          temperature: 0.45,
          max_tokens: 240
        });
        const msg = response && response.choices && response.choices[0] && response.choices[0].message ? response.choices[0].message.content : '';
        return { text: msg || 'Local model returned no text.', tone:'normal' };
      } catch (e) {
        if (typeof os._legacyCompanionChatReply === 'function') {
          try {
            const legacy = await Promise.resolve(os._legacyCompanionChatReply(text));
            if (legacy) return typeof legacy === 'string' ? { text: legacy, tone: 'normal' } : legacy;
          } catch (_) {}
        }
        return { text: e.message || 'Local AI failed.', tone:'warn' };
      }
    },

    handleError: function(err){
      const message = err && err.message ? err.message : String(err || 'Unknown local AI error');
      this.state.status = 'error';
      this.state.progressText = message;
      this.state.busy = false;
      os.companionSetThinking(false);
      os.companionChatAppend('AETHER', message, 'warn');
      this.renderStatus();
    },

    initVoice: function(){
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.voice.supported = !!SR;
      this.state.voiceStatus = SR ? 'VOICE READY' : 'VOICE UNSUPPORTED';
      if (!SR) { this.renderStatus(); return; }
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      try { if ('processLocally' in recognition) recognition.processLocally = true; } catch(_) {}
      recognition.onstart = () => {
        this.state.voiceStatus = this.voice.pushToTalk ? 'PTT LISTENING' : (this.voice.continuous ? 'CONTINUOUS LISTEN' : 'LISTENING');
        this.renderStatus();
      };
      recognition.onerror = () => {
        this.state.voiceStatus = 'VOICE ERROR';
        this.renderStatus();
      };
      recognition.onend = () => {
        if (this.voice.pushToTalk) {
          this.voice.pushToTalk = false;
          this.stopMicMeter();
        }
        if (this.voice.continuous && !this.voice.restartGuard) {
          this.voice.restartGuard = true;
          aetherSoon(() => {
            this.voice.restartGuard = false;
            try { this.startRecognition(false); } catch(_) {}
          }, 320);
        } else if (!this.voice.continuous) {
          this.state.voiceStatus = 'VOICE READY';
          this.stopMicMeter();
          this.renderStatus();
        }
      };
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event
.results[i][0] && event.results[i][0].transcript ? event.results[i][0].transcript : '';
          if (event.results[i].isFinal) finalTranscript += transcript;
          else interim += transcript;
        }
        this.voice.interim = interim.trim();
        const input = document.getElementById('companion-chat-input');
        if (input && this.voice.interim && !finalTranscript) input.value = this.voice.interim;
        if (finalTranscript.trim()) {
          if (input) input.value = finalTranscript.trim();
          this.state.lastUsedVoice = true;
          if (this.voice.continuous || this.voice.pushToTalk) {
            const text = finalTranscript.trim();
            aetherSoon(() => {
              if (input) input.value = '';
              this.handleUserMessage(text, { usedVoice: true }).catch(err => this.handleError(err));
            }, 40);
          }
        }
      };
      this.voice.recognition = recognition;
      this.renderStatus();
    },

    toggleContinuousListening: function(){
      if (!this.voice.supported || !this.voice.recognition) return;
      if (this.voice.continuous) {
        this.voice.continuous = false;
        try { this.voice.recognition.stop(); } catch(_) {}
        this.stopMicMeter();
        this.state.voiceStatus = 'VOICE READY';
        this.renderStatus();
        return;
      }
      this.voice.continuous = true;
      this.startRecognition(false);
    },

    startPushToTalk: function(evt){
      if (evt && evt.preventDefault) evt.preventDefault();
      if (!this.voice.supported || !this.voice.recognition) return;
      this.voice.pushToTalk = true;
      this.voice.continuous = false;
      this.startRecognition(true);
    },

    stopPushToTalk: function(evt){
      if (evt && evt.preventDefault) evt.preventDefault();
      if (!this.voice.supported || !this.voice.recognition) return;
      try { this.voice.recognition.stop(); } catch(_) {}
      this.voice.pushToTalk = false;
      this.stopMicMeter();
      this.state.voiceStatus = 'VOICE READY';
      this.renderStatus();
    },

    startRecognition: async function(isPTT){
      if (!this.voice.recognition) return;
      try {
        const input = document.getElementById('companion-chat-input');
        if (input && !isPTT) input.value = '';
        this.startMicMeter();
        this.voice.recognition.continuous = !isPTT && !!this.voice.continuous;
        this.voice.recognition.interimResults = true;
        this.voice.recognition.start();
      } catch(_) {}
    },

    startMicMeter: async function(){
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
        if (!this.voice.stream) {
          this.voice.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        }
        if (!this.voice.audioCtx) this.voice.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = this.voice.audioCtx.createMediaStreamSource(this.voice.stream);
        this.voice.analyser = this.voice.audioCtx.createAnalyser();
        this.voice.analyser.fftSize = 128;
        source.connect(this.voice.analyser);
        const data = new Uint8Array(this.voice.analyser.frequencyBinCount);
        const tick = () => {
          if (!this.voice.analyser) return;
          this.voice.analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const norm = (data[i] - 128) / 128;
            sum += norm * norm;
          }
          const rms = Math.sqrt(sum / data.length);
          this.state.micLevel = Math.min(1, rms * 5.5);
          this.paintMicMeter(this.state.micLevel);
          this.voice.meterRAF = requestAnimationFrame(tick);
        };
        if (this.voice.meterRAF) cancelAnimationFrame(this.voice.meterRAF);
        this.voice.meterRAF = requestAnimationFrame(tick);
      } catch(_) {}
    },

    stopMicMeter: function(){
      if (this.voice.meterRAF) cancelAnimationFrame(this.voice.meterRAF);
      this.voice.meterRAF = null;
      this.state.micLevel = 0;
      this.paintMicMeter(0);
    }
  };

  function bootWhenReady(){
    if (!window.os || typeof SystemState === 'undefined') {
      return aetherSoon(bootWhenReady, 120);
    }
    assistant.boot().catch((err) => assistant.handleError(err));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootWhenReady, { once: true });
  } else {
    bootWhenReady();
  }
})();
