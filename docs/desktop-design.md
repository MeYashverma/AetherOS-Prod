# Desktop icon, dock and wallpaper refresh

## Icons and dock

`src/ui/desktop-design.js` assigns stable app hues to both Finder and dock tiles. Fifty app mappings now use the **Color** set from [Microsoft Fluent UI System Icons](https://github.com/microsoft/fluentui-system-icons), pinned to `@fluentui/svg-icons` 1.1.347. These are detailed, full-color gradient SVGs sourced from the official published package, replacing the earlier simplified home-drawn artwork. Neutral dimensional backplates let the source artwork retain its color and detail. All registered apps have a mapping; unknown future apps retain a Lucide fallback. These are Microsoft Fluent icons, not Apple system icons. Pinning, opening, minimizing, previews and context menus retain the existing WindowManager behavior. Dock items support Enter/Space activation and Left/Right keyboard focus movement, including minimized-window thumbnails. Running indicators are visible outside the tile instead of being clipped. Long docks scroll horizontally instead of magnifying beyond the viewport; reduced-motion preference and motion-off disable proximity magnification.

The [React Bits Dock](https://reactbits.dev/components/dock) and [flowing backgrounds](https://reactbits.dev/) informed the visual direction. This implementation is original vanilla JavaScript/CSS and uses AetherOS's existing spring engine, not copied React Bits component code. No React, Motion or WebGL dependency was added.

## 4K collection

Settings → Appearance → Desktop Wallpaper Studio → **4K Collection** exposes four original bundled SVG wallpapers with a 3840×2160 viewport. Vector artwork remains sharp on 4K and higher-density displays. These are abstract wave designs, not photographs. New installations default to daily rotation. Existing saved wallpaper modes (including uploads, URLs, sky and mesh) are preserved.

Rotation uses local calendar days or hours, is deterministic after reload, and checks for a changed selection once a minute. Returning to the page also refreshes the selection. Choosing a thumbnail sets **Keep selected**. Select Daily or Every hour to resume. The four bundled designs rotate; this is not an Internet image-discovery service and does not periodically download new wallpapers. There are no wallpaper-provider API keys, remote tracking requests, or continuous animation loops.

The collection and helper script are included in the shell service-worker precache. Once successfully cached, rotation works offline. As with all service-worker functionality, an initial successful visit and a secure origin are required.

Tests cover local-day/hour stability, pause/selection, custom-wallpaper preservation, keyboard activation/navigation, deterministic icon hues and the 4K asset/cache manifest.


## Online photographs: research and implementation

Reviewed 2026-11-22. The repository is a static web application, so the default provider must not require a private key embedded in client code or an unmaintained public CORS proxy.

| Approach | Finding | Decision |
| --- | --- | --- |
| Wikimedia Commons Action API | Browser cross-origin API access and image dimensions, source-page links, and license metadata are available. Per-file reuse terms still apply. | Implemented; keyless, opt-in, restricted to public-domain/CC0 landscape photographs. |
| Unsplash API | Official guidelines explicitly discuss wallpaper applications under replicating Unsplash; API integration also requires credentials and compliance with attribution/hotlink rules. | Not the default. Would need an approved compliant integration, not random/source URL hacks. |
| Pexels API | Requires authorization and its guidelines prohibit making its content available as a wallpaper app. | Not the default. |
| NASA APOD | Already present in AetherOS, but individual entries can be video, below 4K, or have third-party copyrights. | Keep the existing manual Set Wallpaper flow, not a guaranteed daily 4K feed. |
| Unofficial Bing mirrors or public CORS proxies | Would add a separate availability and image-rights dependency. | Not used. |

Primary references:
- https://www.mediawiki.org/wiki/API:Imageinfo
- https://www.mediawiki.org/wiki/API:Cross-site_requests
- https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
- https://help.unsplash.com/en/articles/2511257-guideline-replicating-unsplash
- https://www.pexels.com/api/documentation/
- https://developer.apple.com/sf-symbols/

**Settings → Appearance → Online 4K Photos** explicitly opts into contacting Wikimedia. Themes are mountains, coasts, or space. Daily/hourly rotation and Keep current are available; Next photograph is limited to once a minute. The Action API is queried at most once per selection bucket in a tab, successful metadata is persisted and revalidated, and failures back off for ten minutes. Only HTTPS images on Wikimedia's upload host and Commons file-description links are accepted. Provider HTML is reduced to inert text; no provider markup is inserted into the live document. Original image dimensions and the loaded rendition must both meet 3840×2160. Portraits, unsupported MIME types and unrecognized/non-public-domain licenses are skipped. At most three image candidates are tried per request.

A creator/license/source credit stays on the desktop with a link to the file's reuse details. The photo is cropped to cover the viewport. The bundled collection stays intact and is used while loading or when no photo has ever loaded successfully. The previous successfully loaded photograph stays visible if a later refresh fails. Switching wallpaper modes cancels pending API requests and invalidates pending image loads, so an old request cannot overwrite a custom wallpaper. Remote photographs are not added to the service-worker cache; offline image reuse depends on the browser HTTP cache, with bundled vectors as the reliable fallback.

Live API availability is not guaranteed: the research probe returned Commons' `cirrussearch-too-busy-error`. The implementation handles provider errors and retains the local fallback rather than claiming a successful online update. Automated provider tests use clearly mocked responses and images.


## Detailed icon source and reproducibility

The official Fluent UI System Icons repository reports an MIT license; the complete copyright and permission notice is included in `assets/app-icons/LICENSE.txt`. `assets/app-icons/SOURCES.json` records the upstream package/version, archive SHA-256, and original filename and SHA-256 for each app's SVG. Files are vendored unchanged (approximately 100 KB for 50 app mappings), so the app does not contact an icon API/CDN at runtime and icons work offline after caching.

Reproduce the subset with `python3 scripts/import-app-icons.py`, or pass the pinned package `.tgz` as an argument. The importer verifies the archive and every SVG before writing files. There is no React dependency or full icon-library bundle. Reuse of individual upstream designs across related apps (for example, books and music tools) is intentional.


## Current wallpaper delivery and liquid glass (debugged revision)

**The default online provider now works on static hosting.** It loads a small pinned collection from `dharmx/walls` via GitHub's CORS-enabled public blob API. No Python server, public CORS proxy, authentication token, or runtime directory search is needed. The local `assets/wallpapers/online-catalog.json` pins revision `e8d8a42e4fbecb2cf9619995edbc7ce19610bbd8`, file paths, blob SHAs and verified decoded dimensions. Only metadata is vendored; remote artwork is not bundled or relicensed. Follow the persistent repository source link for artwork/artist information and usage rights.

Settings → Appearance → Online Wallpapers defaults to **GitHub collection / Allow HD**. Topics are gaming, anime-style scenery, memes/funny cat (currently one cat image, not a meme search feed), AMOLED/monochrome (not guaranteed pure-black), abstract, landscape, coast and illustrated space. Strict 4K is optional and never silently downgrades; HD-only categories explain that Allow HD is needed. Existing server-only provider defaults migrate once to this static-compatible mode. Custom wallpapers, local collection selections, and wallpaper modes are untouched.

GitHub's public API normally allows 60 unauthenticated requests/hour/IP. Each new uncached image needs one blob request; the tab retains up to six decoded object URLs. Responses must match the requested SHA, base64 encoding, size bounds and JPEG/PNG signatures. Loaded image dimensions are independently checked. Requests time out; failures retain the previous image, show the actual error and back off. A provider source is not a redistribution license or an independent content-safety guarantee.

Wallhaven is still an **optional** provider, requiring `npm run dev` / `scripts/serve.py` or an equivalent same-origin API adapter. Static-only hosts should use the GitHub collection instead. Commons remains an optional public-domain photo source. Wallhaven live availability is still unverified in this environment. All providers are opt-in; API routes bypass the shell cache.

### Glass root cause and correction

The previous classifier missed layout-less dark wrappers and gradients at nested depths, and added an alpha background at every matched depth. Those tints accumulated into a nearly opaque result. The corrected classifier clears neutral dark structure and layout gradients; the window frame alone owns the translucent tint and backdrop blur. It observes inserted DOM **and class/style changes**. Text opacity, colored controls, imagery, canvases, the music visualization, and third-party iframe contents remain intact. Iframe applications cannot be made transparent across origins; only their shell is glass. Reduced-transparency preferences and browsers without backdrop-filter retain readable opaque fallbacks.

The service-worker shell version and changed asset queries are bumped to invalidate stale glass and wallpaper code.

### Validation

- Real Chromium loaded the full app on a **plain Python static server**, with no wallpaper backend. CDN runtime libraries were supplied from matching local npm packages because the sandbox blocks those CDN hosts; Tailwind was compiled locally from repository class names.
- Actual, unmocked GitHub image downloads decoded and applied for gaming, anime, cat, monochrome and abstract. The browser showed the source credit and a blob-backed wallpaper; no wallpaper JavaScript errors occurred. Chromium needed the sandbox's certificate workaround (`--ignore-certificate-errors`) for its network environment, not an application setting.
- Computed-style checks on Settings, Terminal, Dev Studio, Weather, Kanban and Synth Studio found active backdrop blur, transparent bodies and no remaining large opaque structural panels. This is sampled integration coverage, not a claim that every third-party embedded app is transparent.
- Regression tests cover nested gradients, layout-less surfaces, delayed style changes, static-hosted wallpaper delivery, 4K enforcement and loading-status persistence during repeated shell refreshes.

## Multi-provider wallpaper update

The provider picker now includes **Auto, NexWall, Pixabay, Unsplash, Pexels, Wallhaven, GitHub and Commons**. Auto races the *ready new server adapters*, returning the first nonempty provider batch rather than waiting for the slowest source. Other in-flight searches can populate their caches. Wallhaven/Commons remain explicitly selectable; they are not silently scraped or routed through unofficial proxies. If a server is missing, Auto can try the public NexWall demo, then the local GitHub catalog for supported categories. An arbitrary custom search does not silently return unrelated catalog art.

Sixteen category searches and an optional 80-character custom search replace the small fixed selection. Availability is still provider-dependent: stock sources may not contain anime/memes, and a category or resolution filter can legitimately return zero results. This integration does not promise every category from every provider.

### Server configuration

The development preview starts with `npm run dev`. In production, provide the same-origin `/api/wallpapers*` routes through `scripts/serve.py` or an equivalent application backend. Python reads **exported environment variables**; it does not load `.env` files automatically. `.env.example` lists the names but contains no credentials. Do not paste keys into chat, browser settings, localStorage or a committed file.

| Provider | Server variable | Availability / caveat |
| --- | --- | --- |
| NexWall | `NEXWALL_API_KEY` (optional) | Without a key, uses the limited public demo (10/minute, 30/day/IP per docs). A key enables the main search feed and higher account quotas; plan restrictions still apply. Static hosting can call the public CORS demo directly. |
| Pixabay | `PIXABAY_API_KEY` | Metadata cached to disk for 24 hours; selected images downloaded to the server cache and served locally, not permanently hotlinked. HD/4K results require `fullHDURL`/`imageURL` access; the normal 1280px URL is not misrepresented as HD. |
| Unsplash | `UNSPLASH_ACCESS_KEY` + `UNSPLASH_WALLPAPER_APPROVED=1` | Disabled until the operator confirms provider approval for this use. Preserve hotlinked image parameters, attribute photographer/Unsplash, and call the approved download-tracking endpoint before applying a selected image. |
| Pexels | `PEXELS_API_KEY` + `PEXELS_WALLPAPER_APPROVED=1` | Disabled until operator-confirmed approval; photographer and provider remain prominently linked. |

The approval flags are deployment safeguards, **not permission from those providers**. Unsplash's wallpaper/core-experience rules distinguish value-add integrations; Pexels explicitly restricts wallpaper-app replication. Confirm the actual AetherOS integration with each provider before enabling. No API keys were supplied during this implementation, so keyed live delivery remains unverified.

### Speed and cache behavior

- Client caches validated multi-provider result batches for 15 minutes (up to 16 queries). Next changes the local result index, not the search query. A 1.5-second click cooldown replaces the former minute-long Next lockout; Retry retains a longer cooldown.
- Server coalesces simultaneous identical searches, caches normalized batches for 30 minutes, and applies per-provider request caps. Next/seed does not bypass the search cache. Pixabay metadata persists for the required 24 hours across server restarts.
- GitHub image binaries persist in a bounded six-image browser Cache Storage cache, avoiding repeat base64 API downloads across reloads. Shell updates no longer delete that separate image cache. Image fetch/decode latency still applies on first use.
- Provider queries have network deadlines. Failures retain the previously displayed wallpaper; readiness/setup errors are visible in Settings. Keys are never returned by the capabilities endpoint. Retry invalidates client batches, not provider quota rules or mandated server caching.
- **Screen-fit** explicitly includes smaller phone-portrait images (short edge ≥720, long edge ≥1280), cropped to cover the desktop. NexWall is primarily portrait content; strict HD/4K landscape filters otherwise exclude much of its feed. Strict 4K still requires an actual loaded 3840×2160+ image. Choosing NexWall recommends Screen-fit unless Strict 4K was deliberately selected.

Provider references checked during implementation:
- https://nexwall.kodnextech.com/openapi.json (v1.0.1; demo and main schemas, image and CDN hosts)
- https://nexwall.kodnextech.com/wallpaper-api/docs
- https://pixabay.com/api/docs/ (24-hour search cache, no permanent image hotlinking)
- https://help.unsplash.com/en/articles/2511257-guideline-replicating-unsplash
- https://www.pexels.com/api/documentation/

The NexWall demo API returned real JSON during research, including `img.kodnextech.com` image URLs and portrait dimensions. New adapter tests use mocked API responses; this sandbox's outbound host allowlist prevents live image delivery checks against these provider CDNs. The full-app Chromium smoke check still loaded the GitHub fallback with no JavaScript errors.

## System-wide liquid-glass material

`styles/system-glass.css` is the final stylesheet in the shell. Shared material tokens control tint, rim, depth, radius, text colors and blur; theme accent variables remain available. This layer redesigns shell chrome rather than replacing app content or adding a UI framework:

- Desktop menu bar, Dock container, utility rail and mobile drawer.
- Finder/search, system and desktop context menus, Dock previews, calendar.
- Control Center tiles, notifications and dynamically created toast sheets.
- App windows, internal navigation, Settings grouped cards/rows/segmented controls.
- Command palette, app switcher, Mission Control cards and lock-screen surface.
- Shared scoped inputs, action buttons, hover/selected states, keyboard focus and scrollbars.

Floating roots own backdrop blur. Nested panels/cards get only a light inset fill, not another blur filter. `AetherWindowSurfaces.startShell()` discovers a fixed allowlist of shell roots and later-added overlays, reuses the structural surface scanner, and disconnects per-panel observers when roots are removed. It does not apply a document-wide blanket background reset or alter media, drawing tools, piano keys, color swatches, `[data-preserve-surface]`, the music visualization, or third-party iframe content.

Accessibility fallbacks include visible keyboard focus, immediate solid surfaces for reduced transparency, reduced motion, forced colors and opaque surfaces without backdrop-filter support. Eco mode uses a smaller material blur. The mobile drawer removes legacy workspace containment that previously trapped its fixed-position layer beneath the dimming backdrop, and reserves space above the Dock.

Validation: real Chromium full-app smoke checks opened Control Center, Finder (33 enabled app entries), Mission Control and the mobile utility drawer. Panel mounting, computed blur, borders and radius were checked; no page JavaScript errors occurred. At 390px viewport width the document remained 390px wide and the drawer was 352px wide. Emulated reduced transparency yielded `backdrop-filter: none` on both the Control Center and Settings window, with solid `rgb(23,34,53)` window fill. Screenshots were reviewed for desktop and mobile. CDN dependencies were supplied locally as in previous smoke checks; this was not an external-CDN availability test. Automated regressions cover static and dynamic shell roots, media exclusions, observer shutdown, stylesheet order, precaching and fallback hooks.
