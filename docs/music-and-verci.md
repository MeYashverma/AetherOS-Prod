# Music & Podcasts / Verci integration

## Architecture and audit decisions

The supplied `Verci-2.zip` was reviewed before integration. Its renderer, lyric parsing, recording matching and provider modules live under `src/vendor/verci/`. Native Design Map uses the local procedural city module (`viz/mapworld.js`) and scene controller (`viz/map.js`), projection (`viz/mapcamera.js`) and canvas artwork (`viz/mapart.js`); the artist-hometown lookup and its external map services have been removed. The desktop adapter is `src/modules/music-theater.js`; styles are `styles/music-theater.css` and `styles/verci-stage.css`.

Important changes rather than a blind standalone-app copy:

- All 17 original renderers are available, plus Classic Scroll. Their CSS selectors are prefixed with `.verci-stage`, animation identifiers are namespaced, and viewport breakpoints use container queries. Native scenes retain their keyboard, notification, and payment interactions; the updated map is described below.
- A single adapter-owned RAF drives scene frames from the real playback clock. Closing, minimizing, hiding the document, changing styles, and replacing the dashboard destroy the renderer. Reduced-motion CSS disables decorative transitions and animation.
- Untimed plain lyrics receive duration-weighted, explicitly **estimated** line timing. Line-only LRC has estimated words; enhanced LRC supplies real word timing. Missing lyrics never become invented text. LRC/text import, timing adjustment, fullscreen, and Classic Scroll are available.
- Official YouTube IFrame playback replaces the former hidden Invidious iframe and simulated timer. Play/pause, seek, volume, duration, and current time come from the active engine. YouTube remains visibly embedded, not disguised as an audio stream.
- Full-song resolution uses recording/version, artist, title, duration, and embed eligibility. A failed candidate advances only to another confident matching recording. iTunes is metadata-only: its 30-second previews are never played. Manual YouTube links work independently of public search availability.
- The bundled provider registry supports keyless Audius and community YouTube discovery. Jamendo needs a public client ID; Apple Music needs a separately deployed token service, authentication, and subscription. These are disabled without configuration. There is no promise that arbitrary copyrighted songs are always available.
- Last.fm recent/live track identity, artwork, and loved status are imported through the user's configured API key and username. Recent/history rows and Last.fm track links in analytics start local full-song resolution. Following is opt-in; selecting a podcast disables it.
- Last.fm **does not provide another app's playback position or audio**. Following starts a matching recording locally from zero; lyrics follow the local player's genuine clock. This is not remote-control integration or authenticated write/scrobble support.
- Podcast search requests full podcast episodes from the iTunes directory and plays their supplied HTTPS episode URLs through the audio engine. No preview fallback and no third-party RSS proxy. Availability and cross-origin restrictions remain publisher-dependent.

## Verification

```sh
npm ci
npm test
```

The tests cover LRC and enhanced word timing, estimated plain lyrics, recording ranking, embed blocking, community provider failover/cooldown, cross-provider deduplication, geographic routing, native typing, canonical app names/title, all 17 renderer mount/frame/seek/destroy lifecycles, and desktop adapter controls. Media/network behavior is mocked for deterministic offline verification. Live third-party playback, actual audio output, browser autoplay, and visual appearance still require browser testing with accessible services.

Serve the repository using a static HTTP server (ES modules require HTTP, not `file://`). Configure Last.fm in the app's **Source & connection** section or existing Settings → APIs. Public service failures are surfaced in the status area; use a direct YouTube link when discovery hosts are unavailable.

### Native Design Map: a city made for the song

The map is a **fictional, locally generated city**, not an artist's hometown. It makes no MusicBrainz, Nominatim, Overpass or tile requests and labels its street names, distances and turns as fictional visualization rather than real-world directions. A stable hash of the song identity seeds the layout; a few lyric keywords may name streets, but lyrics are not transmitted. Remounting or seeking the same song reproduces the same city. The refresh button creates another deterministic variation without changing playback.

Jittered, smoothly warped sites form Voronoi blocks and a connected, non-grid street graph. Low-frequency fields create winding parkways and avenues; varied district density yields downtown, residential, commercial and industrial areas. Purpose-built bridges connect dry junctions across the river; ordinary streets and lyric routes never disappear beneath its water. Parks, walkways, rail, stations, trees and building footprints occupy their own blocks. Only graph edges are used for the blue lyric route; the route avoids repeated links when possible. The daylight, tilted 2.5D canvas draws extruded buildings, soft shadows, pale streets, green parkland and blue water; labels stay in screen space rather than shrinking with map zoom. The 2D/3D button switches projection without changing playback. An opening bridge crossing brings the river into the lyric route. Discover mode visits a locally drawn observation wheel and riverside citadel on reserved dry parcels, with landmark bottom sheets and a return-to-lyrics button. These are fictional landmarks, not real-world models or map assets. The camera eases to heading-up while following the lyric; tapping the compass switches to north-up. Reduced-motion preference disables decorative pulses and rotation.

Song time drives the car and upcoming lyric stops; the bottom panel reports **song** time remaining, the local song-end clock and lines ahead—not a travel ETA. The UI explicitly says **generated for this song** and **not real-world directions**. No location permission, artist-place cache or network connection is needed for the map.

`mapgrid.test.mjs` checks seed stability and variation, irregular geometry, district detail, seams, dry landmark parcels, query-order independence, early bridge crossings and graph-only route continuity. `mapcamera.test.mjs` checks projection/inverse round trips, tilt and visible bounds. `map-render.test.mjs` checks the mounted phone, seek/playback synchronization, compass, reroll, 2D/3D and landmark controls, no network calls and cleanup. Navigation, wheel and citadel views were inspected in headless Chromium at 320×640, 375×812 and 390×844 with no horizontal overflow, page errors or external map requests; an earlier local rendering check averaged a few milliseconds per frame. Browser and device performance will vary.

## Source provenance

Renderer and provider source derives from the user-supplied `Verci-2.zip`, with AetherOS-specific integration changes. No external media assets or generated audio files are bundled. The original archive remains unchanged.


## TTML multi-singer chat

The Native Design / WhatsApp scene now reads TTML `ttm:agent` references. Named agents become named participants; unnamed agents are displayed as **Voice 1**, **Voice 2**, etc. Artist credits are not evidence of who sings a particular line. Joint agent references remain joint participants, and unattributed lines are labeled **Unspecified voice**. Simultaneous lines are reconstructed together, including after backward seeking.

- Automatic community source: [AMLL TTML Database](https://github.com/amll-dev/amll-ttml-db), via its public `metadata/raw-lyrics-index.jsonl` and `raw-lyrics/` files through the GitHub API. The catalogue is fetched once per page session. Exact normalized title, matching credited artist and version markers are required; known durations reject files extending beyond the recording. Coverage is community-dependent and API rate limits apply.
- LRCLIB runs independently so failed/slow TTML lookup does not block ordinary lyrics. TTML upgrades the result when found. Manual imports take priority over pending network responses and track switches discard stale responses.
- **Import lyrics** accepts `.ttml` / `.xml` as well as LRC/text. Supports absolute clock timestamps, unit timestamps, frame-clock timestamps, per-word spans, line durations, and agent names. Translation/romanization and background-vocal role spans are excluded from lead chat text. This is a lyric-focused TTML subset, not a general TTML layout or relative-time-container renderer.
- Better Lyrics' current unified provider uses authentication/Turnstile. We do not impersonate the extension, bypass those checks, or advertise its backend as an anonymous public API. TTML files obtained legitimately from other sources can be imported locally.
- Word timestamps in TTML are preserved; missing word timestamps are estimated. TTML is a data format, not a guarantee of singer annotations or complete word timing. Without singer metadata, the existing decorative chat turns remain a visualization, not an attributed duet transcript.

The `ttml.test.mjs` suite covers timing, named/unnamed agents, overlapping duet chat, seeking, safe parsing, and conservative catalogue matching. Live provider coverage and rendering in a real browser still need manual verification.

## Optional contextual chat reactions

Native Design can append decorative Unicode emojis without modifying the lyric tokens, speaker attribution or timing. It recognizes a small set of English and romanized Hindi/Punjabi mood words (plus selected Devanagari words); this is a lightweight heuristic, not full language understanding. Unrecognized lines get no reaction. Emoji glyphs use the installed system font, preferring Apple Color Emoji where available; a specific iOS release's artwork is not bundled or guaranteed.

Occasional GIF slots are deterministically randomized by song/line so seeks stay consistent, with at most one eligible line in each eight-line block. Supported moods request an anime reaction from `nekos.best`; only the allowlisted category is transmitted, never the lyrics, song title or artist. Third-party requests reveal normal connection metadata such as IP address. GIF media is restricted to HTTPS on the provider host, failures are silent, and requests abort when the scene is destroyed. Reduced-motion preference suppresses GIF loading and display. Emoji and GIF toggles are in **Source & connection** and are saved in desktop settings. The third-party service requires internet; actual GIF availability is not covered by offline tests.


### Context-aware reactions upgrade

The current planner supersedes the original first-keyword/eight-line-slot behavior. `reaction-intelligence.js` performs Unicode-aware whole-word and phrase scoring, local negation filtering, explicit rejected-love handling, mixed-mood detection, and a small previous-line bonus when speaker identity matches. This is explainable on-device heuristics, not a general-purpose language model; ambiguous/unsupported lyrics may still be misclassified or receive no decoration.

A deterministic song-level plan separates emoji cadence from media cadence, avoids adjacent repeated glyphs, and enforces both a line gap and playback-time gap for media. **Subtle / Balanced / Expressive** choose minimum emoji gaps of 4 / 2 / 1 lines and media gaps of 12 / 8 / 5 lines (35 / 24 / 16 seconds). Media slots interleave GIFs and stickers rather than attaching both at once. Rebuilding or seeking does not reroll the plan.

Local reaction-sticker fallbacks use outlined system emoji only, with no caption or provider name beneath the sticker. They are popular-format inspired, not a live trending feed or copyrighted sticker-pack downloads. They remain static for accessibility, work offline and have a separate saved off switch.

With the default **Automatic** source, eligible sticker slots try StickersAPI first, followed by Discord, Sticker.ly and the built-in local fallback. GIF slots never request StickersAPI emotes: they use the original allowlisted `nekos.best` reaction-category endpoint and `waifu.pics` SFW fallback for hug/cry/dance/happy moods. These are not trending feeds. Failed GIF providers cool down for 30 seconds; successful variants cache for five minutes and in-scene requests are deduplicated during TTML reconstruction. Only HTTPS GIF URLs on expected media hosts are accepted. No lyrics are transmitted. GIFs are suppressed when the browser reports Save-Data or a 2G connection, as well as reduced motion. Actual provider uptime/content and visual rendering require live browser checks.


### Expanded Gen-Z / multilingual dictionary

`reaction-dictionary.js` is the editable local data source: 46 mood/context categories, 843 unique lyric cues, 93 distinct Unicode emoji choices and 154 sticker captions. Coverage includes English internet slang, romanized Hindi/Hinglish and Punjabi, plus selected Devanagari phrases—not full translation or general multilingual understanding. Unsupported scripts/phrases produce no reaction. Examples distinguish “I am dead” (humor), “dead inside” (sadness), “left on read” (ghosting), “caught in 4K” (awkwardness), “dil toot gaya” (heartbreak) and “yaari” (friendship).

Longest-phrase-first matching avoids scoring each component of the same phrase repeatedly. Matcher expressions are cached and only compiled when their literal phrase occurs, avoiding hundreds of unnecessary regular expression compilations during the first song. Smart-quote variants normalize consistently. Sticker mood and slot spacing remain deterministic across seeks; the dictionary's legacy caption phrases are not shown in lyric chat. Privacy and off switches are unchanged. Settings shows dictionary counts. Phrase coverage and sticker choices are curated, not evidence of live trend popularity.

### Short lines, text reactions and replies

Short lyrics now use ordinary bubble typography, background and timestamps; the former oversized two-word typography exception has been removed. GIFs no longer insert visible provider-credit labels into chat (provider information remains documented here and in source settings).

Occasional text/emoticon reaction pills are context-selected decorations, with accessible labels identifying them as not part of the lyrics. Quoted replies reference the exact text of a recent earlier lyric on the other chat side; they never generate new singer dialogue. Quotes occur no more than once per four lines, look back at most three lines/30 seconds, and do not reference simultaneous lines. Click a quote to seek to its lyric, respecting the timing offset. Untagged lyrics show “Earlier line,” not a claimed singer name. Both features have independent saved switches under Source & connection and remain deterministic across seeks.

### Interactive message reactions and reply threads

Native Design now converts automatic emoji suggestions into small pills attached beneath a lyric bubble, rather than appending those emojis to its lyric text. The message arrow, right-click, long-press (450 ms, canceled by movement), or an existing reaction pill opens a dialog with six WhatsApp-style quick choices and a `+` grid of 24 emojis. Selecting an already selected emoji removes it; Remove reaction also suppresses a suggested reaction for that message.

Reply opens a quoted-lyric composer and a dedicated local thread. Sending adds a note labeled **You · local reply**, updates the original message's reply count, and keeps the text out of lyric tokens and singer metadata. Counts reopen the thread. Enter sends, Shift+Enter inserts a newline; blank replies are ignored, notes are limited to 280 characters, and each message has a 50-reply limit. User text is rendered with textContent. Dialogs support Escape, focus trapping, close buttons and focus restoration.

Selections, notes and manually selected sticker/emote/Telegram images use a WeakMap keyed by the parsed lyrics object: they survive seeks, TTML bubble reconstruction and scene remounts that use that same lyrics object. They do not survive page reload, lyrics re-import or track reload that replaces the timeline. No replies/reactions are sent to WhatsApp, artists, other listeners or any server. This is a local interactive lyric visualization, not a messaging service. The interactive emoji/media pickers remain available even if automatic suggestions are disabled. Live browser appearance and touch behavior remain manual verification items.

### Sticker.ly image source

Source & connection now has **Sticker.ly + local fallback** and **Local only** choices. The initial remote set contains the nine static PNGs publicly featured on [Sticker.ly's homepage](https://sticker.ly/) in the **Hearts❤️💛🖤💚💙** pack by **Killthislove**. Their source and creator are recorded in `providers/stickerly.js`; assets are linked from Sticker.ly's CDN, not copied into the repository. The images are used only for love-tagged sticker slots. This is not a full Sticker.ly catalogue, trending feed, pack importer or an official API integration.

Users may add up to 50 direct Sticker.ly image URLs, each assigned to one of the lyric moods, and remove them from their saved library. Pack/share pages are not direct image URLs and are not scraped. Only HTTPS PNG/WebP/GIF image URLs under `stickerly.pstatic.net/sticker_pack/` are allowed; credentials, query strings, hashes, unrelated hosts and other file formats are rejected. Use only images you have permission to use. Saving a custom sticker for a mood gives it preference over the featured set.

Local emoji-only stickers remain visible until the remote image loads and are restored if it fails. Uncovered moods keep local stickers; no unrelated remote image is substituted. Save-Data/2G suppress remote stickers, and reduced motion permits only static PNG selections (WebP is conservatively treated as potentially animated). Image requests use no-referrer and transmit no lyric queries, but the CDN receives normal network metadata. Availability/hotlink policy can change; offline tests verify validation and simulated load/failure handling, not actual CDN image delivery.


### Discord public sticker API

The default automatic source first tries StickersAPI, then the official anonymous `https://discord.com/api/v10/sticker-packs` catalogue, then the existing Sticker.ly/local fallbacks. Discord-only and local-sticker modes are also available; the GIF toggle is separate, so turn GIFs off as well for a fully offline visualization. Existing explicit Sticker.ly preferences are preserved. Names and comma-separated mood tags are matched locally; lyric text is never submitted. This is public-pack media, not access to private guilds, chat accounts, WhatsApp, or Telegram.

Supports PNG/APNG/GIF and Discord's Lottie JSON using locally vendored lottie-web 5.13.0 light SVG renderer (MIT license alongside runtime). No bot token, third-party proxy, or runtime script CDN. Animation payloads with external assets/fonts are rejected. Catalogue fetches deduplicate, cache for one hour in memory, time out after ten seconds and cool down after failure. Individual media failures retain the local tile. Reduced motion selects static PNGs only; save-data/2G skips remote automatic media. Removed chat tiles and destroyed renderers abort their animation jobs.

Source & connection → **Test Discord sticker API** checks the browser's catalogue connection and renders/destroys a sample media asset. Research confirmed the public catalogue and a Lottie CDN payload were accessible; this does not establish CORS/network availability for every user's browser. The connection test reports that locally. Public availability does not grant blanket redistribution rights; media is loaded from Discord, not copied into this repository.

### StickersAPI automatic media and app-wide library

The **StickersAPI lyrics** switch beside the lyric-style selector is on by default. It controls *automatic stickers only* in all 18 lyric styles, including Classic Scroll; it does not disable manual emote browsing or selection in the Finder/library or the **✦ Media** picker. Non-chat styles show one small, non-interactive sticker in the lyric stage on sparse mood cues, without altering lyric text. In **WhatsApp-style lyric chat**, the sticker sits inside the **original lyric bubble, above its timestamp**—not in a second message. The first qualifying cue in a short song can show a sticker; chat sticker/GIF switches and selected source still apply there. If an image fails, its emoji fallback remains. No caption or provider credit appears below the sticker, including in an already-mounted older renderer.

StickersAPI (`https://stickerapi.sbs/api`) supplies mood-matched stickers from `/search`. Its `/emotes` catalogue (7TV/BTTV/FFZ) is used for manual browsing/selection and the connection test only; automatic lyrics never request or display emotes. Turning the lyric switch off stops automatic StickersAPI requests; the WhatsApp view keeps its Discord → Sticker.ly → built-in local sticker fallback and its existing GIF providers. Explicit Discord, Sticker.ly and local-only chat choices still work. Only fixed *mood labels* leave the browser automatically; neither lyric text nor song titles, replies, artist names nor profile data are sent. Manual searches send the terms you enter.

While the lyric stage is visible, the current and next **two** sparse sticker cues warm their metadata and preview images off-DOM (at most two concurrent jobs and four retained images), rather than fetching the entire song. The browser can reuse its image cache when a cue appears. Seeking drops obsolete queued previews; turning the switch off, hiding the stage or changing songs cancels image jobs. Concurrent mood searches deduplicate, successful responses cache for ten minutes and failed requests cool down for one minute. Save-Data/2G skips automatic remote media; reduced-motion excludes known animated stickers and automatic GIFs. **Test StickersAPI stickers & emotes** checks *both* catalogues and loads a sample of each in your browser, including the manual-only emote catalogue; a successful sample does not guarantee every preview will load.

Finder → **Stickers & Profiles**, the Music Theater **✦ Media** button, the chat composer **+**, and a lyric bubble’s reaction/reply menu all launch the same keyless library. Its five tabs browse stickers, 7TV/BTTV/FFZ emotes, public Telegram sets by set name, and tagged PFPs/banners (with pagination). For each item the desktop picker exposes a preview, copyable URL and download action; selected profile images/banners can be applied to the compact lyric chat header and removed to restore the default song artwork/header. Only validated media IDs and names are stored in local settings; the chat header never uses an arbitrary third-party URL. Telegram uses the service’s server-side token, **not** any client credential; a disabled/unavailable route reports an error instead of asking for a token. All remote searches/previews reveal ordinary network metadata such as IP address to the service; no copyrighted files are copied into this repository.

Selecting a sticker, emote or Telegram sticker from the chat picker appends a **You · local media** bubble after that lyric, not a singer line. It stays in the chat through playback and seeking, and is local to the current lyrics object like manual replies; opening another song does not inherit it. The menu can remove the last selected media for that lyric. PFP/banner choices change the header instead of sending media as a lyric. Offline/broken previews leave the lyric and local fallback intact. Browser integration tests use mocked API/images; actual provider availability and content rights depend on the third party.

### Singer labels and simplified chat controls

TTML names embedded in agent metadata are displayed as singer labels. Stable agent references are now retained for editable singer labels under **Source & connection → TTML singer names**. Assignments are saved locally per track artist/title and agent reference; clearing an assignment restores the TTML name. Unnamed TTML agents do not reliably identify a vocalist, so the app does not assign the first listed artist to `v1` by guesswork. Enter the correct name when the file omits it.

Automatic quoted-lyric reply decorations and their setting have been removed. Manual replies/counts/threads remain; the reply thread no longer repeats a quoted lyric. The reaction dropdown arrow is removed. Open the reaction/reply menu with right-click, a 450ms hold (cancelled on drag), or keyboard Context Menu / Shift+F10 on a focused message. Existing attached reaction pills remain tappable.


### Credit-assisted singer labels and fictional listeners

Generic TTML labels now use a complete matching artist-credit list (including a featured artist in the title) when simple `v1`, `v2`, etc. references can be mapped by numeric order. Names are **inferred from credits**, visibly marked as inferred, not verified vocal attribution. Explicit agent names and locally saved overrides take priority. Recognized lyric singer tags can provide a name as well. Ambiguous credit counts and joint references remain unmapped. Participant-name edits invalidate the turn-plan cache, fixing stale Voice labels after an override.

**Fictional listener replies** is enabled by default and can be disabled under Source & connection. During at least three consecutive lines from one participant, sparse deterministic mood/context replies appear on the opposite side. Replies use ordinary chat bubble styling and timestamps without visible labels. The setting and accessible name identify them as generated listener replies; no real singer is assigned these words. They are generated locally from curated responses, never added to the timed lyric tokens, never quoted as song lyrics, and are rebuilt consistently when seeking. No lyric text is sent to an AI service.


### Listener pacing and reply style

Singer names no longer carry visible inference badges or chat-header credit notes. Credit matching remains a best-effort convenience, with corrections and attribution caveats in Source & connection.

Listener replies now wait 550ms after the triggering lyric, then spend 0.9–3.4 seconds typing on the playback clock. Outgoing replies use the existing composer, keyboard, key highlights and typing plan; incoming replies show typing dots. Sent replies animate into the thread (reduced motion disables the arrival animation). Pausing freezes progress; seeking reconstructs state without timeout-driven delayed sends. Lyrics retain their original timing.

Local reply selection weighs the current lyric most strongly, with two recent lines as context, negation-aware mood matching, phrase-specific overthinking/ghosting/time-pressure cues, and a serious-distress override. Expanded banks include cheeky, cute, sarcastic, exaggerated and emoji-only messages; repeated same-mood choruses rotate through the bank instead of repeating the same line. This is a deterministic curated engine, not a claim of AI-level understanding or unlimited unique responses. No lyric text is uploaded.


### iOS-style chat and local timestamps

The chat scene now follows the dark iOS reference: black thread (no doodle wallpaper), gray incoming and teal outgoing messages, blue header/composer controls, a status-bar cutout and signal/battery icons, and a gray keyboard with a suggestion strip and home indicator. Reaction/reply controls use a bottom-sheet presentation; manual reply threads still do not duplicate quoted lyrics.

Header time uses the device's local 24-hour clock. Lyric, listener and manual reply timestamps now show local send/display time instead of song position. A per-lyrics-object timestamp map preserves existing times across TTML rebuilds, seeks and scene remounts. Listener time is recorded when it becomes sent, not while typing. Lyric timing, seeking and the playback engine remain unchanged.

Added bottom-sheet entrance, reaction pop, new message/reply arrival, and remote media fade/scale animations. The keyboard and typing continue to follow playback. Chat-scoped `prefers-reduced-motion` rules disable decorative animations and transitions. The animated keyboard suggestions use the local word-completion engine described below.


### Local keyboard predictions

The animated keyboard prediction strip now updates as each lyric/listener word is typed, rather than showing fixed placeholder words. A per-song offline vocabulary and word-pair model ranks up to three prefix completions or next-word suggestions. It learns vocabulary from the current lyric file plus a small conversational baseline; it does not upload text or train a remote model.

Manual reply composers expose a matching tappable prediction strip. Selecting a suggestion completes the word before the caret (or inserts a next word), preserves text after the selection, restores focus/caret, updates suggestions, and respects the reply length limit. The animated playback strip remains display-only so tapping it cannot rewrite lyrics or disrupt synchronization. This is lightweight completion, not OS-level autocorrect or a generative language model.

### Full-history chat performance

The lyric chat keeps every elapsed message in order, including TTML duets, replies, reactions, and media; seeking still rebuilds the appropriate history. Chromium profiling found that measuring the entire scroll height and resetting `scrollTop` on *every unchanged playback frame* forced long-thread layout. Follow-to-bottom now runs when rows, replies, or typing state change, while a resize observer follows keyboard/composer resizing and images loading later (including when playback is paused). Manually browsing old messages still pauses auto-follow. The CSS-only chat also skips an unnecessary per-frame stage measurement; browsers without resize observers retain legacy frame following. Listener-reply rotation caches prior moods per lyric timeline rather than rescanning the full history for each reply, without changing the chosen text.

### Native Design Money: Lyric Wallet

The light wallet scene uses an original dark virtual card, simulated word-value balance, song-linked account summary and scrolling lyric transactions. Card details can be revealed/hidden; Freeze toggles the demo card appearance without pausing lyrics; Card info and Activity explain their local-only behavior. No bank, wallet API, payment request or real transfer is involved. The visible disclaimer remains outside the scrolling activity. Balance and highlighting follow playback, including backwards seeks and TTML word timing. `money.test.mjs` covers the demo controls, seeking, pre-roll reset and TTML row timelines. Chromium checks at 320×640 and 390×844 found no page errors or horizontal overflow.

### Lyric City: architecture and attractions

The procedural daylight map now includes five explorable destinations: the observation wheel, riverside citadel, vaulted glass conservatory, sculpture-court art museum and domed observatory with a reflecting pool. All are original local geometry, not downloaded models or real-world places. Reserved parcels and surrounding parkland are seeded and independent of viewport-query order. Discover's next/previous controls cycle through all five destinations.

Buildings now vary between glass and warm-stone towers, stepped crowns and antennas, pitched house roofs, solar-panel roofs and planted terraces. Near facades have bounded window grids; distant buildings simplify their detail. Offscreen and hidden-panel building geometry is culled, and back faces are omitted. Labels avoid the destination architecture. Chromium checks covered navigation and all five attractions at 320×640 and 390×844, with no horizontal page overflow or page errors. Performance varies by device; this remains a lightweight canvas 2.5D scene rather than a full 3D engine.
