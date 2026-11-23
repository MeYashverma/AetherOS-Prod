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
