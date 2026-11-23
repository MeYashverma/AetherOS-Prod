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
