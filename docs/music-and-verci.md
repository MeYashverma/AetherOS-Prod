# Music & Podcasts / Verci integration

## Architecture and audit decisions

The supplied `Verci-2.zip` was reviewed before integration. Its renderer, lyric parsing, recording matching, provider, and geographic map modules are retained under `src/vendor/verci/`, with the original module boundaries. The desktop adapter is `src/modules/music-theater.js`; styles are `styles/music-theater.css` and `styles/verci-stage.css`.

Important changes rather than a blind standalone-app copy:

- All 17 original renderers are available, plus Classic Scroll. Their CSS selectors are prefixed with `.verci-stage`, animation identifiers are namespaced, and viewport breakpoints use container queries. Native scenes keep their original keyboard, notification, payment, and map behavior.
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

Meme-style reaction stickers are generated locally from system emoji and fixed captions such as “MAIN CHARACTER ENERGY” and “IN MY FEELINGS,” with cutout outlines and mood palettes. They are popular-format inspired, not a live trending feed or copyrighted sticker-pack downloads. They remain static for accessibility, work offline and have a separate saved off switch.

GIF discovery uses allowlisted reaction-category endpoints on nekos.best, with waifu.pics SFW fallback for hug/cry/dance/happy moods. Both are anime-reaction services, not trending feeds. Failed providers cool down for 30 seconds; successful variants cache for five minutes and in-scene requests are deduplicated during TTML reconstruction. Only HTTPS GIF URLs on the expected media hosts are accepted. No lyrics are transmitted. GIFs are suppressed when the browser reports Save-Data or a 2G connection, as well as reduced motion. Actual provider uptime/content and visual rendering require live browser checks.


### Expanded Gen-Z / multilingual dictionary

`reaction-dictionary.js` is the editable local data source: 46 mood/context categories, 843 unique lyric cues, 93 distinct Unicode emoji choices and 154 sticker captions. Coverage includes English internet slang, romanized Hindi/Hinglish and Punjabi, plus selected Devanagari phrases—not full translation or general multilingual understanding. Unsupported scripts/phrases produce no reaction. Examples distinguish “I am dead” (humor), “dead inside” (sadness), “left on read” (ghosting), “caught in 4K” (awkwardness), “dil toot gaya” (heartbreak) and “yaari” (friendship).

Longest-phrase-first matching avoids scoring each component of the same phrase repeatedly. Matcher expressions are cached and only compiled when their literal phrase occurs, avoiding hundreds of unnecessary regular expression compilations during the first song. Smart-quote variants normalize consistently. Sticker captions rotate deterministically from each mood's caption set without rerolling on seeks; spacing, privacy and off switches are unchanged. Settings shows dictionary counts. Phrase coverage and sticker choices are curated, not evidence of live trend popularity.

### Short lines, text reactions and replies

Short lyrics now use ordinary bubble typography, background and timestamps; the former oversized two-word typography exception has been removed. GIFs no longer insert visible provider-credit labels into chat (provider information remains documented here and in source settings).

Occasional text/emoticon reaction pills are context-selected decorations, with accessible labels identifying them as not part of the lyrics. Quoted replies reference the exact text of a recent earlier lyric on the other chat side; they never generate new singer dialogue. Quotes occur no more than once per four lines, look back at most three lines/30 seconds, and do not reference simultaneous lines. Click a quote to seek to its lyric, respecting the timing offset. Untagged lyrics show “Earlier line,” not a claimed singer name. Both features have independent saved switches under Source & connection and remain deterministic across seeks.

### Interactive message reactions and reply threads

Native Design now converts automatic emoji suggestions into small pills attached beneath a lyric bubble, rather than appending those emojis to its lyric text. The message arrow, right-click, long-press (450 ms, canceled by movement), or an existing reaction pill opens a dialog with six WhatsApp-style quick choices and a `+` grid of 24 emojis. Selecting an already selected emoji removes it; Remove reaction also suppresses a suggested reaction for that message.

Reply opens a quoted-lyric composer and a dedicated local thread. Sending adds a note labeled **You · local reply**, updates the original message's reply count, and keeps the text out of lyric tokens and singer metadata. Counts reopen the thread. Enter sends, Shift+Enter inserts a newline; blank replies are ignored, notes are limited to 280 characters, and each message has a 50-reply limit. User text is rendered with textContent. Dialogs support Escape, focus trapping, close buttons and focus restoration.

Selections and notes use a WeakMap keyed by the parsed lyrics object: they survive seeks, TTML bubble reconstruction and scene remounts that use that same lyrics object. They do not survive page reload, lyrics re-import or track reload that replaces the timeline. No replies/reactions are sent to WhatsApp, artists, other listeners or any server. This is a local interactive lyric visualization, not a messaging service. The interactive picker remains available even if automatic suggestions are disabled. Live browser appearance and touch behavior remain manual verification items.

### Sticker.ly image source

Source & connection now has **Sticker.ly + local fallback** and **Local only** choices. The initial remote set contains the nine static PNGs publicly featured on [Sticker.ly's homepage](https://sticker.ly/) in the **Hearts❤️💛🖤💚💙** pack by **Killthislove**. Their source and creator are recorded in `providers/stickerly.js`; assets are linked from Sticker.ly's CDN, not copied into the repository. The images are used only for love-tagged sticker slots. This is not a full Sticker.ly catalogue, trending feed, pack importer or an official API integration.

Users may add up to 50 direct Sticker.ly image URLs, each assigned to one of the lyric moods, and remove them from their saved library. Pack/share pages are not direct image URLs and are not scraped. Only HTTPS PNG/WebP/GIF image URLs under `stickerly.pstatic.net/sticker_pack/` are allowed; credentials, query strings, hashes, unrelated hosts and other file formats are rejected. Use only images you have permission to use. Saving a custom sticker for a mood gives it preference over the featured set.

Local emoji/caption stickers remain visible until the remote image loads and are restored if it fails. Uncovered moods keep local stickers; no unrelated remote image is substituted. Save-Data/2G suppress remote stickers, and reduced motion permits only static PNG selections (WebP is conservatively treated as potentially animated). Image requests use no-referrer and transmit no lyric queries, but the CDN receives normal network metadata. Availability/hotlink policy can change; offline tests verify validation and simulated load/failure handling, not actual CDN image delivery.


### Discord public sticker API

Automatic sticker source now tries the official anonymous `https://discord.com/api/v10/sticker-packs` catalogue, then the existing Sticker.ly/local fallbacks. Discord-only and offline/local-only modes are also available. Existing explicit Sticker.ly preferences are preserved. Names and comma-separated mood tags are matched locally; lyric text is never submitted. This is public-pack media, not access to private guilds, chat accounts, WhatsApp, or Telegram.

Supports PNG/APNG/GIF and Discord's Lottie JSON using locally vendored lottie-web 5.13.0 light SVG renderer (MIT license alongside runtime). No bot token, third-party proxy, or runtime script CDN. Animation payloads with external assets/fonts are rejected. Catalogue fetches deduplicate, cache for one hour in memory, time out after ten seconds and cool down after failure. Individual media failures retain the local tile. Reduced motion selects static PNGs only; save-data/2G skips remote automatic media. Removed chat tiles and destroyed renderers abort their animation jobs.

Source & connection → **Test Discord sticker API** checks the browser's catalogue connection and renders/destroys a sample media asset. Research confirmed the public catalogue and a Lottie CDN payload were accessible; this does not establish CORS/network availability for every user's browser. The connection test reports that locally. Public availability does not grant blanket redistribution rights; media is loaded from Discord, not copied into this repository.


### Singer labels and simplified chat controls

TTML names embedded in agent metadata are displayed as singer labels. Stable agent references are now retained for editable singer labels under **Source & connection → TTML singer names**. Assignments are saved locally per track artist/title and agent reference; clearing an assignment restores the TTML name. Unnamed TTML agents do not reliably identify a vocalist, so the app does not assign the first listed artist to `v1` by guesswork. Enter the correct name when the file omits it.

Automatic quoted-lyric reply decorations and their setting have been removed. Manual replies/counts/threads remain; the reply thread no longer repeats a quoted lyric. The reaction dropdown arrow is removed. Open the reaction/reply menu with right-click, a 450ms hold (cancelled on drag), or keyboard Context Menu / Shift+F10 on a focused message. Existing attached reaction pills remain tappable.


### Credit-assisted singer labels and fictional listeners

Generic TTML labels now use a complete matching artist-credit list (including a featured artist in the title) when simple `v1`, `v2`, etc. references can be mapped by numeric order. Names are **inferred from credits**, visibly marked as inferred, not verified vocal attribution. Explicit agent names and locally saved overrides take priority. Recognized lyric singer tags can provide a name as well. Ambiguous credit counts and joint references remain unmapped. Participant-name edits invalidate the turn-plan cache, fixing stale Voice labels after an override.

**Fictional listener replies** is enabled by default and can be disabled under Source & connection. During at least three consecutive lines from one participant, sparse deterministic mood/context replies appear on the opposite side. Replies use ordinary chat bubble styling and timestamps without visible labels. The setting and accessible name identify them as generated listener replies; no real singer is assigned these words. They are generated locally from curated responses, never added to the timed lyric tokens, never quoted as song lyrics, and are rebuilt consistently when seeking. No lyric text is sent to an AI service.
