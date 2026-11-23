import { resolveSingerNames } from '../vendor/verci/singer-names.js';
// AetherOS adapter for the audited Verci-2 renderers and real playback engines.
import { discordCatalogue, renderDiscordSticker } from '../vendor/verci/providers/discord-stickers.js';
import { listMedia } from '../vendor/verci/providers/stickersapi.js';
import { STICKER_MOODS, customStickers, cleanSticker } from '../vendor/verci/providers/stickerly.js';
import { REACTION_DICTIONARY_STATS } from '../vendor/verci/viz/reaction-dictionary.js';
import { STYLES } from '../vendor/verci/viz/index.js?v=stickersapi-26';
import { frameState, esc } from '../vendor/verci/viz/core.js';
import { parseTTML } from '../vendor/verci/ttml.js';
import { findCommunityTTML } from '../vendor/verci/providers/ttml-community.js';
import { parseLRC, estimatePlain } from '../vendor/verci/lrc.js?v=chat-asides-23';
import { PlaybackManager } from '../vendor/verci/playback.js';
import { isConfident } from '../vendor/verci/rank.js';
import { searchAll, resolveFull } from '../vendor/verci/providers/registry.js';
import { lrclibFind, youtubeId } from '../vendor/verci/services.js';

const os = window.os;
// SystemState.load replaces the settings object during boot/restore. Never retain that stale object.
const settings = new Proxy({}, { get: (_, k) => window.SystemState.settings[k], set: (_, k, v) => { window.SystemState.settings[k] = v; return true; } });
const state = { song: null, lyrics: null, source: '', status: 'Search your music, follow Last.fm, or open a full podcast episode.', style: settings.verci_style || 'ship', offset: 0, generation: 0, results: [], recent: [], candidates: [], candidate: 0, view: 'music', follow: false, raf: 0, viz: null, abort: null };
const $ = id => document.getElementById(id);
const fmt = n => `${Math.floor((n || 0) / 60)}:${String(Math.floor((n || 0) % 60)).padStart(2, '0')}`;
const host = document.createElement('div');
host.id = 'music-video-dock'; host.hidden = true;
host.setAttribute('aria-label', 'YouTube player');
host.innerHTML = '<div id="music-youtube"></div>';
document.body.append(host);
const player = new PlaybackManager('music-youtube');
window.AetherMusic = { state, player, styles: STYLES };
// Keep the iframe mounted across renders (moving it reloads YouTube playback).
// Align its persistent host with a reserved, scroll-aware slot inside the app.
function syncVideoDock() {
  const slot = $('music-video-slot');
  const show = player.mode === 'yt' && visible() && state.view !== 'stats' && slot;
  if (slot) slot.hidden = player.mode !== 'yt';
  if (!show) { host.hidden = true; return; }
  const r = slot.getBoundingClientRect();
  const clip = slot.closest('aside').getBoundingClientRect();
  host.hidden = !r.width || !r.height || r.top < clip.top || r.bottom > clip.bottom;
  Object.assign(host.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
}
const videoResize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncVideoDock) : null;
window.addEventListener('resize', syncVideoDock);
document.addEventListener('scroll', syncVideoDock, true);
function status(text) { state.status = text; if ($('music-status')) $('music-status').textContent = text; }
function stopStage() { cancelAnimationFrame(state.raf); state.raf = 0; state.viz?.destroy(); state.viz = null; }
function visible() { const w = window.SystemState.windows.media; return w?.isOpen && !w.isMinimized && !document.hidden; }
function mountStage() {
  stopStage();
  const root = $('music-stage');
  if (!root || !visible()) return;
  root.replaceChildren();
  const L = state.lyrics;
  if (!L?.lines?.length) { root.innerHTML = `<div class="music-empty"><span>♫</span><h2>${esc(state.song?.title || 'Every song, a new scene.')}</h2><p>${state.song ? 'No lyrics available. Import an LRC file, or keep listening.' : '17 lyric worlds. Real playback. Your listening life.'}</p></div>`; return; }
  if (L.format === 'TTML' && L.speakers?.length) {
    L.originalSpeakers ||= [...L.speakers];
    const saved = settings.chat_singer_names?.[JSON.stringify([state.song?.artist || '', state.song?.title || ''])] || {};
    const resolved = resolveSingerNames(L, state.song, saved);
    L.speakers = resolved.names; L.inferredSpeakers = resolved.inferred;
  }
  if (state.style === 'scroll') {
    const scroll = document.createElement('div'); scroll.className = 'music-scroll'; root.append(scroll);
    L.lines.forEach((l, i) => { const row = document.createElement('button'); row.type = 'button'; row.textContent = l.text || '•••'; row.onclick = () => player.seek(Math.max(0, l.t - state.offset)); row.dataset.line = i; scroll.append(row); });
  } else {
    const style = STYLES.find(s => s.id === state.style) || STYLES[0];
    try { state.viz = new style.make(root, { song: state.song, lyrics: L, theme: { hi: '#fff', sec: '#ffffff57', scale: 1 }, duration: () => player.duration, seek: t => player.seek(Math.max(0,t-state.offset)), opts: { hometown: () => true, emojis: () => settings.chat_emojis !== false, gifs: () => settings.chat_gifs !== false, stickers: () => settings.chat_stickers !== false, stickerSource: () => settings.chat_sticker_source || 'auto', customStickers: () => settings.chat_stickerly_custom || [], avatar: () => settings.chat_media_avatar, banner: () => settings.chat_media_banner, density: () => settings.chat_reaction_density || 'balanced', listenerReplies: () => settings.chat_listener_replies !== false, textReactions: () => settings.chat_text_reactions !== false } }).mount(); }
    catch (e) { status(`Scene unavailable: ${e.message}. Try Classic Scroll.`); return; }
  }
  let previous = performance.now(), active = -2;
  const tick = now => {
    state.raf = 0;
    if (!visible() || !root.isConnected) { stopStage(); return; }
    const t = player.time + state.offset, S = frameState(L, t);
    try {
      state.viz?.frame(S, Math.min(0.05, (now - previous) / 1000));
      if (state.style === 'scroll' && active !== S.idx) {
        root.querySelectorAll('[data-line]').forEach(r => r.classList.toggle('active', +r.dataset.line === S.idx));
        const row = root.querySelector(`[data-line="${S.idx}"]`);
        row?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); active = S.idx;
      }
    } catch (e) { stopStage(); status(`Scene stopped safely: ${e.message}. Select another style.`); return; }
    previous = now; updateClock(); state.raf = requestAnimationFrame(tick);
  };
  state.raf = requestAnimationFrame(tick);
}
function updateClock() {
  syncVideoDock();
  const d = player.duration, t = player.time;
  if ($('music-clock')) $('music-clock').textContent = `${fmt(t)} / ${fmt(d)}`;
  if ($('music-seek') && !$('music-seek').matches(':active')) { $('music-seek').max = d || 1; $('music-seek').value = t; $('music-seek').disabled = !d; }
  if ($('music-play')) $('music-play').textContent = player.playing ? 'Pause' : 'Play';
  os.mediaPlaybackPosition = t; os.mediaPlaybackDuration = d;
}
function rows(list, action) {
  return list.map((t, i) => `<button type="button" class="music-result" data-${action}="${i}"><b>${esc(t.title || t.name)}</b><small>${esc(t.artist || '')}${t.label ? ' · ' + esc(t.label) : ''}</small></button>`).join('');
}
function render() {
  const root = $('media-console-panel'); if (!root) return;
  stopStage();
  videoResize?.disconnect();
  const s = state.song;
  root.onclick = e => {
    if (state.view !== 'stats') return;
    const link = e.target.closest('a[href]');
    if (!link) return;
    try {
      const url = new URL(link.href);
      const m = url.pathname.match(/^\/music\/([^/]+)\/_\/([^/]+)/);
      if (!/(^|\.)last\.fm$/.test(url.hostname) || !m) return;
      e.preventDefault(); state.follow = false; state.view = 'music';
      playSong({ title: decodeURIComponent(m[2].replace(/\+/g, ' ')), artist: decodeURIComponent(m[1].replace(/\+/g, ' ')) });
    } catch {}
  };
  root.innerHTML = `<div class="music-app">
    <header><div><small>AETHER / LISTEN</small><h1>Music & Podcasts</h1></div><nav><button data-view="music" aria-pressed="${state.view === 'music'}">Music</button><button data-view="podcasts" aria-pressed="${state.view === 'podcasts'}">Podcasts</button><button data-view="stats" aria-pressed="${state.view === 'stats'}">Last.fm Stats</button></nav></header>
    <div class="music-toolbar"><form id="music-search-form"><input id="music-query" aria-label="Search music or podcasts" placeholder="${state.view === 'podcasts' ? 'Search podcast episodes…' : 'Song, artist, or YouTube link…'}" required><button>Search</button></form><button id="music-follow" aria-pressed="${state.follow}">${state.follow ? 'Following Last.fm' : 'Follow Last.fm'}</button></div>
    <p id="music-status" role="status">${esc(state.status)}</p>
    ${state.view === 'stats' ? '<div id="music-stats"></div>' : `<div class="music-body"><aside><div id="music-video-slot" class="music-video-slot" hidden></div><div class="music-now"><small>NOW PLAYING ${s?.isLoved ? '♥' : ''}</small><h2>${esc(s?.title || 'Find your next song')}</h2><p>${esc(s?.artist || 'Full tracks, never preview clips.')}</p></div><div id="music-results">${rows(state.results, 'result')}</div><h3>Recent listening</h3><div id="music-recent">${rows([...state.recent, ...window.SystemState.history].slice(0, 30), 'recent')}</div></aside>
    <main><div class="music-scene-tools"><select id="music-style" aria-label="Lyrics style"><option value="scroll">Classic Scroll</option>${STYLES.map(v => `<option value="${v.id}">${esc(v.name)}</option>`).join('')}</select><span id="music-sync">${state.lyrics ? state.lyrics.estimated ? 'Estimated lines & words' : state.lyrics.format === 'TTML' ? `TTML · ${state.lyrics.speakers.length ? state.lyrics.speakers.length + ' voices' : 'no singer tags'} · ${state.lyrics.source || 'imported'} · ${state.lyrics.wordLevel ? 'word sync' : 'estimated words'}` : state.lyrics.wordLevel ? 'Word-synced LRC' : 'Line-synced · estimated words' : 'No lyrics'}</span><button type="button" id="music-media-picker" title="Browse StickersAPI media" aria-label="Browse stickers, emotes and profiles">✦ Media</button><button id="music-fullscreen" title="Fullscreen lyrics">⛶</button></div><div id="music-stage" class="verci-stage"></div><div class="music-lyrics-tools"><button id="music-earlier">−0.5s</button><span id="music-offset">${state.offset.toFixed(1)}s</span><button id="music-later">+0.5s</button><label>Import lyrics<input id="music-lrc" type="file" accept=".lrc,.txt,.ttml,.xml" hidden></label></div></main></div>`}
    <footer><button id="music-play">${player.playing ? 'Pause' : 'Play'}</button><span id="music-clock">${fmt(player.time)} / ${fmt(player.duration)}</span><input id="music-seek" type="range" min="0" max="${player.duration || 1}" value="${player.time}" step="0.1" aria-label="Playback position"><label>Volume <input id="music-volume" type="range" min="0" max="1" step="0.01" value="${player.volume}" aria-label="Volume"></label></footer>
    <details><summary>Source & connection</summary><div id="music-singer-names"></div><div class="music-chat-options"><label><input id="music-chat-emojis" type="checkbox" ${settings.chat_emojis !== false ? 'checked' : ''}> Automatic message reactions (device emoji style)</label><label><input id="music-chat-gifs" type="checkbox" ${settings.chat_gifs !== false ? 'checked' : ''}> Contextual emotes / GIFs · automatic fallback</label><label><input id="music-chat-stickers" type="checkbox" ${settings.chat_stickers !== false ? 'checked' : ''}> Meme-style reaction stickers</label><label><input id="music-chat-text" type="checkbox" ${settings.chat_text_reactions !== false ? 'checked' : ''}> Text / emoticon reactions</label><label><input id="music-chat-listener" type="checkbox" ${settings.chat_listener_replies !== false ? 'checked' : ''}> Fictional listener replies · not lyrics</label><label>Sticker source <select id="music-sticker-source" aria-label="Sticker source"><option value="auto">Automatic · StickersAPI → Discord → Sticker.ly → local</option><option value="stickerapi">StickersAPI + existing fallbacks</option><option value="discord">Discord API + local fallback</option><option value="stickerly">Sticker.ly + local fallback</option><option value="local">Local stickers (GIF toggle separate)</option></select></label><label>Reaction level <select id="music-chat-density" aria-label="Chat reaction level"><option value="subtle">Subtle</option><option value="balanced">Balanced</option><option value="expressive">Expressive</option></select></label><small class="music-reaction-stats">${REACTION_DICTIONARY_STATS.moods} moods · ${REACTION_DICTIONARY_STATS.phrases} lyric cues · ${REACTION_DICTIONARY_STATS.emoji} emoji · ${REACTION_DICTIONARY_STATS.stickerCaptions} sticker captions · on-device matching</small></div><div class="music-stickerly-library"><button type="button" id="music-stickersapi-test">Test StickersAPI</button><span id="music-stickersapi-status" role="status" aria-live="polite"></span><button type="button" id="music-sticker-api-test">Test Discord sticker API</button><span id="music-sticker-api-status" role="status" aria-live="polite"></span><p>Automatic mode tries StickersAPI mood-matched stickers and emotes, then Discord, Sticker.ly and the built-in local reactions. GIF reactions retain their previous fallback. Only mood labels—not lyrics, song titles or private replies—are searched. No API key is needed. Choose a public Telegram set, profile picture or banner in the media library below.</p><button type="button" id="music-open-media-library">Browse stickers, emotes, Telegram sets &amp; profile media</button><p>Sticker.ly: featured Hearts pack by Killthislove. In Sticker.ly-only mode, other moods use local stickers unless you add matching images. <a href="https://sticker.ly/" target="_blank" rel="noopener noreferrer">Browse Sticker.ly ↗</a></p><form id="music-stickerly-add"><input id="music-stickerly-url" type="url" placeholder="https://stickerly.pstatic.net/sticker_pack/…/image.png" aria-label="Direct Sticker.ly image URL" required><input id="music-stickerly-name" placeholder="Sticker name / creator" aria-label="Sticker name or creator" maxlength="80"><select id="music-stickerly-mood" aria-label="Sticker lyric mood">${STICKER_MOODS.map(m=>`<option value="${m}">${m}</option>`).join('')}</select><button>Add sticker</button></form><p>Use a direct image URL, not a pack/share page. Add only content you have permission to use. Images load from Sticker.ly's CDN; lyrics are not sent.</p><div id="music-stickerly-saved">${customStickers(settings.chat_stickerly_custom).map((s,i)=>`<div><span>${esc(s.name)} · ${esc(s.mood)}</span><button type="button" data-remove-sticker="${i}" aria-label="Remove sticker ${esc(s.name)}">Remove</button></div>`).join('')}</div></div><p>Playback: ${esc(state.source || 'none')}. Public search services and embeds may be unavailable or blocked. No preview is substituted.</p><form id="music-override"><input id="music-link" placeholder="Paste a YouTube URL / video ID" aria-label="YouTube playback override" required><button>Play full video</button></form><form id="music-lastfm"><input id="music-lfm-user" placeholder="Last.fm username" aria-label="Last.fm username" value="${esc(settings.api_lastfm_user || '')}" required><input id="music-lfm-key" type="password" placeholder="Last.fm API key (Settings → APIs)" aria-label="Last.fm API key"><button>Save Last.fm</button></form><p>Last.fm supplies track identity, not audio or an external playback clock. Following starts the matching recording from its beginning; lyric timing follows this local player. Browser autoplay may require pressing Play.</p></details>
  </div>`;
  root.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { state.view = b.dataset.view; if (state.view === 'podcasts') state.follow = false; state.results = []; ++searchGeneration; render(); });
  for (const [id, key] of [['music-chat-emojis', 'chat_emojis'], ['music-chat-gifs', 'chat_gifs'], ['music-chat-stickers', 'chat_stickers'], ['music-chat-text', 'chat_text_reactions'], ['music-chat-listener', 'chat_listener_replies']]) {
    $(id).onchange = e => { settings[key] = e.target.checked; window.SystemState.save(); mountStage(); };
  }
  const singerFields = $('music-singer-names');
  if (state.lyrics?.format === 'TTML' && state.lyrics.speakers?.length) {
    const hint = document.createElement('p'); hint.textContent = 'TTML singer names · use the metadata name or enter the correct singer for each voice. Auto-filled names use track credits when all voices match. Credit order is not verified vocal attribution; correct any name here.'; singerFields.append(hint);
    const key = JSON.stringify([state.song?.artist || '', state.song?.title || '']);
    (state.lyrics.originalSpeakers || state.lyrics.speakers).forEach((name,i) => {
      const id = state.lyrics.speakerIds?.[i] || String(i);
      const label = document.createElement('label'); label.textContent = `${name} (${id}) `;
      const input = document.createElement('input'); input.type = 'text'; input.maxLength = 100;
      input.placeholder = name; input.setAttribute('aria-label', `Singer name for ${name} (${id})`);
      input.value = settings.chat_singer_names?.[key]?.[id] || '';
      input.onchange = () => {
        settings.chat_singer_names ||= {}; settings.chat_singer_names[key] ||= {};
        const value = input.value.trim().slice(0,100);
        if (value) settings.chat_singer_names[key][id] = value; else delete settings.chat_singer_names[key][id];
        window.SystemState.save(); mountStage();
      };
      label.append(input); singerFields.append(label);
    });
  }
  $('music-stickersapi-test').onclick = async () => {
    const button = $('music-stickersapi-test'), output = $('music-stickersapi-status');
    button.disabled = true; output.textContent = ' Checking StickersAPI…';
    try {
      const result = await listMedia('stickers', { query: 'happy' });
      if (output.isConnected) output.textContent = ` Connected · ${result.items.length} stickers found. Previews may depend on the media CDN.`;
    } catch (error) {
      if (output.isConnected) output.textContent = ` Unavailable: ${error.message}. Discord, Sticker.ly and local reactions remain available.`;
    } finally { button.disabled = false; }
  };
  $('music-open-media-library').onclick = () => window.AetherMedia?.openPicker();
  $('music-sticker-api-test').onclick = async () => {
    const b = $('music-sticker-api-test'), output = $('music-sticker-api-status');
    b.disabled = true; output.textContent = ' Checking Discord…';
    try {
      const list = await discordCatalogue();
      if (!output.isConnected) return;
      output.textContent = ` Catalogue connected · ${list.length} stickers. Testing media…`;
      const sample = list.find(s => s.format === 3) || list[0];
      const preview = document.createElement('div'); preview.style.cssText = 'width:80px;height:80px;overflow:hidden'; output.append(preview);
      const abort = new AbortController();
      const ok = await renderDiscordSticker(preview, sample, abort.signal, true);
      abort.abort(); preview.remove();
      if (output.isConnected) output.textContent = ok ? ` Connected · ${list.length} stickers · sample media rendered successfully` : ' Catalogue connected, but sample media could not render. Local fallback remains available.';
    }
    catch (e) { if (output.isConnected) output.textContent = ` Unavailable: ${e.message}. Local fallback remains available.`; }
    finally { b.disabled = false; }
  };
  $('music-sticker-source').value = settings.chat_sticker_source || 'auto';
  $('music-sticker-source').onchange = e => { settings.chat_sticker_source = e.target.value; window.SystemState.save(); mountStage(); };
  $('music-stickerly-add').onsubmit = e => {
    e.preventDefault();
    const item = cleanSticker({ url: $('music-stickerly-url').value.trim(), name: $('music-stickerly-name').value.trim(), mood: $('music-stickerly-mood').value });
    if (!item) return status('Use a direct HTTPS image URL on stickerly.pstatic.net/sticker_pack/ ending in .png, .webp or .gif.');
    const saved = customStickers(settings.chat_stickerly_custom);
    if (saved.some(s => s.url === item.url && s.mood === item.mood)) return status('That sticker is already saved for this mood.');
    if (saved.length >= 50) return status('Sticker library is full (50). Remove an image first.');
    settings.chat_stickerly_custom = [...saved, item]; window.SystemState.save(); status('Sticker saved for ' + item.mood + '.'); render();
  };
  root.querySelectorAll('[data-remove-sticker]').forEach(b => b.onclick = () => {
    const saved = customStickers(settings.chat_stickerly_custom); saved.splice(+b.dataset.removeSticker, 1);
    settings.chat_stickerly_custom = saved; window.SystemState.save(); render();
  });
  $('music-chat-density').value = settings.chat_reaction_density || 'balanced';
  $('music-chat-density').onchange = e => { settings.chat_reaction_density = e.target.value; window.SystemState.save(); mountStage(); };
  $('music-search-form').onsubmit = e => { e.preventDefault(); search($('music-query').value.trim()); };
  $('music-follow').onclick = () => { state.follow = !state.follow; if (state.follow) lastLive = ''; render(); if (state.follow) pollLastFm(); };
  $('music-play').onclick = () => { player.toggle(); updateClock(); };
  $('music-seek').oninput = e => { player.seek(+e.target.value); updateClock(); };
  $('music-volume').oninput = e => os.adjustVolume(+e.target.value);
  $('music-override').onsubmit = e => { e.preventDefault(); const id = youtubeId($('music-link').value.trim()); if (!id) return status('Enter a valid YouTube URL or 11-character video ID.'); playSong(state.song || { title: 'YouTube video', artist: '' }, { engine: 'youtube', videoId: id, label: 'Manual YouTube selection' }); };
  $('music-lastfm').onsubmit = e => { e.preventDefault(); settings.api_lastfm_user = $('music-lfm-user').value.trim(); if ($('music-lfm-key').value.trim()) settings.api_lastfm = $('music-lfm-key').value.trim(); window.SystemState.save(); pollLastFm(); };
  videoResize?.observe(root);
  if ($('music-video-slot')) videoResize?.observe($('music-video-slot'));
  syncVideoDock();
  if (state.view === 'stats') { $('music-stats').innerHTML = os.getLastFmMetricsLayout(); os.initLastFmMetricsSubView(); return; }
  $('music-style').value = state.style;
  $('music-style').onchange = e => { state.style = e.target.value; settings.verci_style = state.style; window.SystemState.save(); mountStage(); };
  $('music-media-picker').onclick = () => window.AetherMedia?.openPicker();
  $('music-fullscreen').onclick = () => { const p = $('music-stage'); if (document.fullscreenElement) document.exitFullscreen?.(); else p.requestFullscreen?.().catch(e => status(e.message)); };
  for (const [id, delta] of [['music-earlier', -0.5], ['music-later', 0.5]]) $(id).onclick = () => { state.offset += delta; $('music-offset').textContent = `${state.offset.toFixed(1)}s`; };
  $('music-lrc').onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    const gen = state.generation;
    try {
      if (file.size > 3 * 1024 * 1024) throw Error('Lyrics file is too large (maximum 3 MB).');
      const text = await file.text(); if (gen !== state.generation) return;
      const isTTML = /\.(ttml|xml)$/i.test(file.name) || /^\s*(<\?xml[^>]*>\s*)?<([\w-]+:)?tt[\s>]/.test(text);
      const L = isTTML ? parseTTML(text) : parseLRC(text);
      if (isTTML && !L.lines.length) throw Error('No timed lyric lines found in TTML.');
      state.lyricsImported = true; state.plain = null;
      state.lyrics = L.lines.length ? L : estimatePlain(text, player.duration || state.song?.durationMs / 1000 || 180);
      render();
    } catch (err) { status(`Lyrics import: ${err.message}`); }
  };
  bindResults(); mountStage();
}
function bindResults() {
  const root = $('media-console-panel');
  root?.querySelectorAll('[data-result]').forEach(b => b.onclick = () => { const t = state.results[+b.dataset.result]; playSong(t, t.episodeUrl ? { engine: 'audio', url: t.episodeUrl, label: 'Full podcast episode' } : null); });
  const recent = [...state.recent, ...window.SystemState.history].slice(0, 30);
  root?.querySelectorAll('[data-recent]').forEach(b => b.onclick = () => { state.follow = false; playSong(recent[+b.dataset.recent]); });
}
let searchGeneration = 0;
async function search(q) {
  if (!q) return;
  const gen = ++searchGeneration, view = state.view;
  status('Searching…');
  try {
    const id = youtubeId(q);
    if (id && view !== 'podcasts') { await playSong({ title: state.song?.title || 'YouTube video', artist: state.song?.artist || '' }, { engine: 'youtube', videoId: id, label: 'Manual YouTube selection' }); return; }
    if (view === 'podcasts') {
      // iTunes exposes playable, full-length episode enclosure URLs directly: no RSS CORS proxy needed.
      const r = await fetch(`https://itunes.apple.com/search?media=podcast&entity=podcastEpisode&limit=30&term=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error(`Podcast directory HTTP ${r.status}`);
      const d = await r.json(); if (gen !== searchGeneration || state.view !== view) return;
      state.results = (d.results || []).filter(t => /^https:\/\//.test(t.episodeUrl || '')).map(t => ({ title: t.trackName, artist: t.collectionName, artwork: t.artworkUrl600, durationMs: t.trackTimeMillis, episodeUrl: t.episodeUrl, label: 'Full episode' }));
    } else {
      const r = await searchAll(q); if (gen !== searchGeneration || state.view !== view) return;
      state.results = r.groups.map(g => ({ ...g.identity, known: g.tracks }));
      if (!state.results.length && Object.keys(r.errors).length) throw new Error('Search providers are unavailable. Try a YouTube link under Source & connection.');
    }
    status(`${state.results.length} results · select one to play`); render();
  } catch (e) { if (gen === searchGeneration) status(e.message); }
}
async function loadCandidate(gen) {
  if (gen !== state.generation) return;
  const c = state.candidates[state.candidate++];
  if (!c) { status('No more matching sources. Paste a YouTube link under Source & connection.'); return; }
  const p = c.track?.playback || c;
  state.source = p.label || p.engine; host.hidden = p.engine !== 'youtube';
  try { await player.load(p); if (gen !== state.generation) return; status(`${state.source} · press Play if autoplay is blocked`); render(); }
  catch (e) { if (gen === state.generation) { status(e.message); loadCandidate(gen); } }
}
async function playSong(song, explicit = null) {
  const gen = ++state.generation;
  state.candidates = []; state.candidate = 0; player.stop(); state.abort?.abort();
  if (os.audioStream) os.audioStream.pause(); os.stopRadioBrowser?.();
  state.song = { ...song, title: song.title || song.name, artwork: song.artwork || song.coverUrl || '' };
  state.lyrics = null; state.lyricsImported = false; state.plain = null; state.estimatedDuration = 0; state.offset = 0;
  status('Resolving a matching full-length recording…'); render();
  const miniTitle = $('mini-track-title'), miniArtist = $('mini-artist-name');
  if (miniTitle) miniTitle.textContent = state.song.title;
  if (miniArtist) miniArtist.textContent = state.song.artist;
  const miniArt = $('mini-cover-art');
  if (miniArt) { miniArt.src = state.song.artwork; miniArt.classList.toggle('hidden', !state.song.artwork); }
  if (!song.episodeUrl) loadLyrics(gen);
  try {
    if (explicit) state.candidates = [explicit];
    else {
      const r = await resolveFull(state.song, song.known || []); if (gen !== state.generation) return;
      if (!r.confident) { status('No confident full-song match. Choose the correct recording with a YouTube link.'); return; }
      state.candidates = r.ranked.filter(c => c.embed !== false && c.score >= r.best.score - 1.5 && isConfident(state.song, c));
    }
    if (gen !== state.generation) return;
    await loadCandidate(gen);
    if (gen !== state.generation) return;
    const history = window.SystemState.history; history.unshift({ ...state.song, known: undefined }); history.splice(50); window.SystemState.save();
  } catch (e) { if (gen === state.generation) status(`Full-song resolution unavailable: ${e.message}. Try a YouTube link.`); }
}
async function loadLyrics(gen) {
  // Race independently: LRCLIB stays fast; richer TTML may upgrade it later.
  findCommunityTTML(state.song).then(L => {
    if (!L || gen !== state.generation || state.lyricsImported) return;
    state.plain = null; state.lyrics = L; render();
  }).catch(() => {}); // Community catalogue/rate limits must never stop playback or LRCLIB.
  try {
    const song = state.song;
    const found = await lrclibFind({ ...song, durationSec: song.durationMs / 1000 || 0 });
    if (gen !== state.generation || state.lyricsImported || state.lyrics?.format === 'TTML') return;
    if (found?.syncedLyrics) state.lyrics = parseLRC(found.syncedLyrics);
    else if (found?.plainLyrics) {
      state.plain = found.plainLyrics; state.estimatedDuration = player.duration || song.durationMs / 1000 || found.duration || 180;
      state.lyrics = estimatePlain(state.plain, state.estimatedDuration);
    }
    else state.lyrics = null;
    if (found?.instrumental) status('Instrumental recording · no lyrics.');
    render();
  } catch { if (gen === state.generation && !state.lyricsImported && !state.lyrics) { status('Lyrics service unavailable. Playback can continue; import an LRC file.'); render(); } }
}
let polling = false, lastLive = '';
async function pollLastFm() {
  if (polling || !settings.api_lastfm_user || !settings.api_lastfm) { if (state.follow && !settings.api_lastfm) status('Add your Last.fm username and API key under Source & connection.'); return; }
  polling = true;
  try {
    const d = await os._lfmApi('user.getrecenttracks', { limit: 20, extended: 1 });
    const tracks = d.recenttracks?.track || [];
    state.recent = tracks.map(t => ({ title: t.name, artist: t.artist?.name || t.artist?.['#text'] || '', album: t.album?.['#text'] || '', artwork: t.image?.at(-1)?.['#text'] || '', isLoved: t.loved === '1' }));
    const live = tracks[0]?.['@attr']?.nowplaying === 'true', latest = state.recent[0];
    if (state.follow && state.view !== 'podcasts' && live && latest) {
      const id = `${latest.artist}\0${latest.title}`;
      if (id !== lastLive) { lastLive = id; await playSong(latest); }
    }
    if ($('music-recent')) { $('music-recent').innerHTML = rows([...state.recent, ...window.SystemState.history].slice(0, 30), 'recent'); bindResults(); }
  } catch (e) { status(`Last.fm: ${e.message}`); }
  finally { polling = false; }
}
player.addEventListener('state', () => {
  if (state.plain && player.duration && Math.abs(player.duration - state.estimatedDuration) > 1) {
    state.estimatedDuration = player.duration; state.lyrics = estimatePlain(state.plain, player.duration); mountStage();
  }
  updateClock(); os.updatePlayStateVisuals?.(player.playing); });
player.addEventListener('error', e => {
  status(e.detail || 'Playback error.');
  if (state.candidate < state.candidates.length) loadCandidate(state.generation);
});
player.addEventListener('ended', () => { status('Playback finished.'); updateClock(); });
// Public compatibility hooks: no hidden iframe and no simulated playback timer.
os.renderMediaDashboard = render;
os.playMusicTrack = song => { state.follow = false; state.view = 'music'; return playSong(song); };
os.fetchLastFmData = pollLastFm;
os.pauseVerciVisualStage = stopStage;
os.toggleAudioPlayback = () => { player.toggle(); updateClock(); };
const oldVolume = os.adjustVolume;
os.adjustVolume = v => { const n = Math.max(0, Math.min(1, Number(v))); if (!Number.isFinite(n)) return; player.setVolume(n); oldVolume?.(n); };
os.stopFullTrackPlayback = () => { state.follow = false; ++state.generation; state.candidates = []; player.stop(); host.hidden = true; };
os.startPlaybackTimer = () => updateClock();
os.attemptFullTrackPlayback = () => state.song && playSong(state.song);
os.seekMedia = e => { const r = e.currentTarget.getBoundingClientRect(); player.seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * player.duration); };
os.setMediaView = v => { state.view = v === 'metrics' ? 'stats' : 'music'; render(); };
// Observe visibility/state changes rather than keeping expensive canvases running offscreen.
let wasVisible = false;
setInterval(() => { const v = visible(); if (v !== wasVisible) { wasVisible = v; if (v) mountStage(); else stopStage(); } if (v) updateClock(); syncVideoDock(); }, 500);
setInterval(() => { if (state.follow || visible()) pollLastFm(); }, 15000);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopStage(); else mountStage(); });
player.setVolume(settings.media_tuner_volume ?? 0.7);
if (window.SystemState.windows.media.isOpen) render();

window.addEventListener('load', () => { state.style = settings.verci_style || 'ship'; player.setVolume(settings.media_tuner_volume ?? 0.7); if (window.SystemState.windows.media.isOpen) render(); }, { once: true });
