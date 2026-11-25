# App-by-app redesign tracker

This tracks the **new functional redesign pass**, not the earlier static audit.
**12 of 48** apps have received dedicated batch work; **36 remain pending**.
Shared glass/icon changes do not count as a completed app redesign. No external
provider uptime is certified. Existing user boards/documents/tasks are preserved.

## Batch 1 — productivity studios

Focus, Dev Studio and Kanban have new app-specific layouts, responsive controls,
clearer empty states, visible storage failure states, and regression tests.

- Focus: wall-clock deadline instead of decrementing once per interval; no fabricated
  starter objective; two-tone sound labelled accurately (not a binaural treatment).
  Timer is tab-session only; audio can continue while app window is closed.
- Dev Studio: worker-isolated regex with 750 ms termination and bounded matches;
  JWT claims explicitly unverified; secure UUID v4; stale SHA result protection;
  storage status and session-only VFS save feedback. Limited Markdown renderer,
  not a complete CommonMark implementation. A welcome document is instructional,
  not evidence of completed user work.
- Kanban: no invented shipped tasks on fresh installs; inline title editing;
  one-level undo after delete; validated move destinations; keyboard-accessible move
  controls, useful empty/filter states and explicit session-only save failures.

Validation: 90 JavaScript tests passed. Chromium exercised Focus layout, real regex
worker output, catastrophic-pattern timeout and Kanban card creation with no uncaught
JavaScript errors. CDN runtime libraries were supplied locally; no external APIs were
live-tested by these checks. Deep mobile/device/audio permission checks remain.

## Batch 2 — Browser, Files, Terminal

- Browser: new reader-oriented heading/layout; working per-tab back/forward stacks,
  explicit new-tab action, visible tab overflow instead of silently dropping tabs,
  and loading the surviving tab when closing the current tab. Rejects non-HTTP(S)
  and credential-bearing URLs; malformed stored history no longer crashes startup.
  Stale async reader responses cannot replace a newer page. Public reader relays
  require explicit per-URL consent and reject local/IP destinations. Site embeds
  are sandboxed and may still be refused by the provider. This is not a full browser.
- Files: await saves before claiming success; keep edits on thrown failures;
  disclose session-only copies; validate names/collisions and count UTF-8 bytes.
  Nested VFS folder mounting replaces the old two-folder-only implementation.
  Custom empty folders persist as metadata. Deletion asks for confirmation;
  built-in or nonempty folder deletion is explicitly unsupported rather than a
  misleading recursive action. No unrelated preview when no file is selected.
- Terminal: relabelled as Browser Console rather than a fictional Unix shell.
  HTTP timing probe has timeout, omits credentials and never fabricates ICMP
  packets, byte counts or verified reachability for opaque responses. Clipboard
  denial is handled. Output spacing/contrast and command affordances refined.

Validation: **98 JavaScript tests + 9 Python server tests passed**. Chromium checked
reader relay opt-in state, scripted back/forward navigation, Files heading and a
real local HTTP probe returning HTTP 200; no uncaught JavaScript errors. Third-party
provider availability was not certified. Mobile resizing of an already-open desktop
window still needs shell-level clamping work; full mobile visual acceptance is pending.

## Inventory / remaining work

| App | This pass | Next verification |
| --- | --- | --- |
| System Settings (`settings`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| About AetherOS (`about`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Terminal (`terminal`) | Batch 2 implemented + tested | Provider/device paths, browser reload and mobile resize acceptance |
| Files (`filemanager`) | Batch 2 implemented + tested | Provider/device paths, browser reload and mobile resize acceptance |
| WikiBoard (`wikiboard`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Web Browser (`browser`) | Batch 2 implemented + tested | Provider/device paths, browser reload and mobile resize acceptance |
| Music & Podcasts (`media`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Stickers & Profiles (`stickers`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| World Radio (`radiobrowser`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Weather (`weather`) | Batch 5 implemented + tested | Live provider access, device permission and mobile acceptance |
| News & RSS (`feed`) | Batch 7 implemented + tested | Live provider access and mobile/device acceptance |
| Activity & Speed (`sysmon`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Task Manager (`taskmanager`) | Batch 6 implemented + tested | Real-device/mobile and unsupported-API acceptance |
| Focus & Soundscapes (`focus`) | Batch 1 implemented + tested | Deep mobile/device and denied-storage paths |
| Dev Studio (`devpad`) | Batch 1 implemented + tested | Deep mobile/device and denied-storage paths |
| Kanban Board (`kanban`) | Batch 1 implemented + tested | Deep mobile/device and denied-storage paths |
| Photo Booth (`photobooth`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| SynthPad Studio (`synthstudio`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Photopea Studio (`photopea`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Whiteboard Studio (`whiteboard`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Retro & 3D Makers (`chiptune`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| World Museum Gallery (`worldmuseums`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Open Bookshelf (`gutendex`) | Batch 8 implemented + tested | Live catalog/Gutenberg CORS and mobile/device acceptance |
| Earth Monitor (`earthpulse`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Space Launches (`spacexhub`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| 3D Solar System & Sky (`stellarium`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Atlas & Landmarks (`georadar`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| World Factbook & FX (`worldfactbook`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Archive & DOS Vault (`wayback`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Winamp + SomaFM (`winamp`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| GitHub Explorer (`ossradar`) | Batch 4 implemented + tested | Device/mobile acceptance and provider limits |
| Shader Studio (`shadertoy`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Code Sandbox (`codeplay`) | Batch 3 implemented + tested | Real-device keyboard, draft reload and long-running code limits |
| Device Sync (`aetherbridge`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| AetherLink P2P (`aetherlink`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Discord Presence (`presence`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| ISS 3D Tracker (`iss`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| NASA Space (`nasa`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Flight Radar (`globe`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Crypto Markets (`market`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Arcade (`games`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Retro TV (`ytchtv`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Reddit Gallery (`memes`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Anime (`anime`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Manga Reader (`manga`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Character Dex (`entityscanner`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Floor796 Panorama (`floor796`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |
| Wplace World Canvas (`wplace`) | Pending dedicated redesign | Layout, data source, empty/error states, inputs, persistence and cleanup |

### Shared system appearance — November 22, 2026
- Added persistent Day / Night / Auto under Settings → Appearance. Auto subscribes to device color-scheme changes and refreshes on focus/visibility and after saved settings load.
- Added Clear / Balanced / Solid material settings, with device reduced-transparency taking priority. Solid removes blur and uses an opaque mode-specific background. Forced-color and no-backdrop-filter fallbacks included.
- Native app structures, including neutral light backgrounds, share the window glass rather than stacking opaque panels. Neutral UI typography adapts in Day mode; media, canvases, iframe contents, theme previews and explicitly preserved surfaces remain untouched. Accent themes remain separate from appearance.
- Improved window resize handling with animation-frame scheduling, visualViewport events and viewport bounds. Mobile header/accessibility QA is still pending; this is not a full mobile certification.
- Verification: 101 JS tests and 9 server tests pass; diff check clean. Chromium verified Day/Night text and background material, opaque Solid, initial Auto selection; no page errors. Live color-scheme *emulation* changed matchMedia.matches but did not deliver a listener update in this headless harness; event handling is unit-tested, real-device live switching still needs verification.
- Dedicated functional app redesign remains **6/48**. Shared material coverage is not a claim that the remaining 42 apps have been functionally reviewed. Third-party embedded content cannot be restyled across origins; individual app art/editor contrast still needs the remaining per-app pass.


## Batch 3 — Code Sandbox

- Added app-specific glass workspace with window-width-responsive stacking, legible Day/Night editor, accessible tab selection, and explicit preview safety disclosure. Preview content preserves the user’s chosen styles rather than being recolored as shell UI.
- No animated starter or imported JavaScript runs on opening. Manual Run is default; Auto-run is opt-in, and disabling it cancels a queued execution. Stop and window-close cleanup discard the preview document and pending debounce.
- Added named-in-UI browser draft save/restore, versioned editable JSON import/export with size/type validation, confirmation before replacing source, Ctrl/Command+Enter Run, two-space Tab insertion, Escape to leave editor, and selectable preview widths.
- Preview keeps an opaque-origin allow-scripts-only sandbox plus CSP limiting resource/network access, forms and nested frames. Exported HTML intentionally has no preview CSP or parent console bridge. This is not a CPU-isolated runner: endless synchronous code can hang the tab; Stop is not a guaranteed interrupt. Only execute trusted code. Explicit self-navigation may replace the preview; CSP is not a network firewall.
- File saves await results, prevent duplicate clicks, preserve source on failure and distinguish session-only storage. Exports revoke object URLs. Console accepts only current preview-frame messages, renders text safely and caps rows at 200.
- Seven focused regression tests cover initialization, execution policy/export separation, debounce cancellation, draft/denied storage, import validation, async save outcomes and console limits.
- Chromium: actual preview DOM and captured console output verified; fetch blocked; Stop replaced the document; mobile viewport 390px clamped window to x=6..384 and stacked editor/preview; no uncaught page errors. External runtime CDNs were supplied locally, not live-certified.
- Full verification after this batch: **108 JavaScript tests + 9 Python server tests passed**; syntax and diff checks clean. Dedicated functional review is now **7/48**, with **41 remaining**.

### Interior glass correction — all-app material pass

User clarified that individual backgrounds must visibly show glass, not merely the outer frame. The shared surface pass now explicitly clears every native app root (including colored roots), tinted structural layout panels, forms/lists/tables, and structural inline `!important` fills. Nested structural backdrop filters are removed so repeated blur sheets cannot flatten the wallpaper. Small colored status indicators, media, artwork, explicit content surfaces, and user-authored preview documents remain preserved.

Balanced material opacity reduced to 32% Night / 48% Day; Clear to 16% Night / 32% Day. Balanced blur is 22px, Clear 14px. Solid / reduced-transparency remain intentionally opaque. Reinforced glass edge highlights without reducing text opacity. Updated cache keys and service-worker shell-v70.

Chromium template audit mounted **48 app templates × 2 modes = 96 checks**, with zero missing glass frames, nontransparent bodies, nested structural backdrop filters, or large (>60,000 px²) opaque native-layout blockers; no page errors. This is template material coverage, not certification of every fetched/dynamic view. Decorative overlays and embedded/canvas/media content are excluded intentionally. External iframe pages cannot be made transparent by parent CSS.

**109 JavaScript tests passed**; syntax/diff checks clean. Code Sandbox execution, blocked fetch and Stop rechecked without page errors. The repeat mobile resize harness intermittently left the window at its desktop bounds; mobile resize is not considered resolved. Dedicated functional redesign count remains **7/48**, not 48/48.


## Batch 4 — GitHub Explorer

- New read-oriented, window-responsive discovery/tree/source layout, including glass on dynamically generated result and source panels in Day and Night modes.
- Removed fabricated fallback repositories and star/fork counts entirely. Empty responses remain empty; failed searches show errors instead of pretending a static list is live. Renamed discovery periods to accurately describe creation-date filtering, sorted by stars (not GitHub Trending).
- Added branch/tag/commit ref browsing, refresh, source copying with clipboard rejection reporting, parent-directory navigation, and real GitHub links. Source is rendered as plain text and never executed.
- Unified Contents API reads with encoded refs/paths, bounded 256 KiB UTF-8 text preview, binary rejection and explicit unsupported-file messaging. Removed direct trust in API-provided download URLs and inline event-handler interpolation of filenames.
- Added 12-second request timeout, cancellation on navigation/close, stale-search/source guards, HTTP/missing-ref errors and rate-limit retry information when GitHub supplies it. No credentials or tokens requested/stored.
- Seven regression tests cover empty/rate-limit states, stale searches, DOM injection resistance, ref/path encoding and UTF-8 decoding, binary/size/missing-ref failures, cancellation, and clipboard denial.
- Live API verification: repository Contents and Search endpoints returned HTTP 200. Chromium clicked the actual README entry, decoded 29,210 UTF-8 bytes, performed repository search, verified transparent loaded root/tree backgrounds and reported no uncaught page errors. Search metadata came from GitHub, not fixtures. External runtime CDNs were substituted locally. This does not certify future GitHub availability or every repository/ref; no write operations, private repos or rendered Markdown preview are offered.
- Full batch verification: **116 JavaScript tests + 9 Python server tests passed**; syntax/diff checks clean. Functional redesign count is now **8/48**; **40 remain**.

### Screenshot correction — GitHub Explorer explicit material / revision 02

User image-28 showed the old Explorer template with black panes and no new tools. Found a real entrypoint mismatch: `index.html` still requested the module unversioned while SW precached a different versioned URL. Versioned the actual entrypoint and synchronized cache assets (shell-v72); this does not prove the cause of the user's screenshot or deploy local work to production.

Removed opaque classes from the Explorer template itself and added a dedicated late-loaded `github-workspace.css`. Its frame, body, list, directory and source surfaces explicitly define transparent glass materials without relying on runtime background classification. Reworked visual hierarchy into inset rounded panes and a source toolbar; Day/Night/Clear/Solid and reduced-transparency fallbacks supported. Added visible `GLASS WORKSPACE / 02` marker to distinguish current UI from old screenshots.

Added functional literal source search with safe highlighted matches/count (capped at 1,000 highlights), wrap toggle, focus reading mode, and source download with URL cleanup. Tests validate search text safety, state toggles and matching entrypoint/cache asset versions.

Chromium loaded live GitHub results, clicked README, verified transparent loaded root/tree and captured Night screenshot `/tmp/aether-oss-glass-v2.png`; no uncaught page errors. Screenshot shows wallpaper visible across all three native panes. 118 JS tests pass; syntax/diff checks clean. Fresh current-branch preview launched on port 4175. No production deployment or push performed. Functional app count remains 8/48.

### Selected source scrolling fix

Constrained Explorer's nested grid rows to `minmax(0,1fr)` and its flex source reader to a zero minimum height/bounded pane. Previously a content-sized track could grow behind the clipped window rather than letting the selected source scroll. Made the source region keyboard focusable, retained horizontal scrolling for unwrapped code, and confined scroll chaining to the pane. Narrow-window stacked layout keeps its outer scroll path. Versioned module/CSS together as `glass-scroll-3`, SW shell-v73.

Chromium selected the live repository README and verified real wheel scrolling: source clientHeight=235, scrollHeight=11,890; vertical wheel changed scrollTop 0→650 and horizontal wheel changed scrollLeft 0→600 (scrollWidth=5,302). Ctrl+End subsequently reached the bottom, and Wrap/Focus retained a bounded source pane. No page errors. 119 JS tests pass, including focusable-region/layout regression; syntax/diff checks clean.


## Batch 5 — Weather

- Rebuilt the native weather interior with explicit glass materials (no opaque gradient or unrelated anime GIF covering the background), bounded vertical forecast scrolling, horizontal hourly cards, responsive metric cards and daily rows. Day/Night/Clear/Solid and accessibility fallback styling included.
- Removed silent IP-location requests and the New Delhi fallback presented as local weather. Initial state asks for a city or explicit device location permission. City search returns up to six selectable matches rather than silently picking the first. Selected coordinates/preferences are stored in this browser when possible and sent to Open-Meteo for forecasts; device-location denial leaves search usable.
- Missing/nonfinite weather values remain dashes, never coerced from null into zero; unknown codes are not called clear. US AQI labels now distinguish all six categories. Fahrenheit conversion preserves unavailable readings. Location coordinates at zero are supported.
- Hourly cards start at/after the provider's current timestamp, not midnight. Requested Unix timestamps are formatted in the forecast location's timezone, including sunrise/sunset and daily dates. Shows model attribution, valid time, fetch time and selected-location source.
- Added guarded storage, ten-second per-request timeouts, cancellation on close/navigation, stale-result guards and explicit cached-data warnings after refresh failures. A failed new-location request never substitutes another city's cached forecast. Air-quality failure does not invent an AQI value or discard a valid weather response.
- Nine regression tests cover denied storage, no automatic network/location lookup, city-result safety/selection, missing readings, hourly selection, AQI thresholds, zero coordinates/races, stale caching, geolocation denial, close cancellation and conversion behavior.
- Chromium with **explicit synthetic provider fixtures**, not live weather: city search and selection, 24°C→75°F toggle, vertical scrollTop 0→500, hourly scrollLeft 0→500, 24 hourly cards, transparent forecast background, Day/Night switching, no page errors. Open-Meteo hosts are outside this sandbox's permitted outbound hosts; real provider uptime/data correctness and device permission flow are not certified.
- Full verification: **128 JS tests + 9 Python server tests passed**; syntax and diff checks clean. SW shell-v74; weather assets versioned consistently. Dedicated functional work now **9/48**, **39 pending**.

### Weather visual-design correction

User correctly called the first weather redesign too plain. Added an atmospheric condition hero with layered sun/moon/cloud/rain/snow/fog/storm illustration selected from WMO code (and provider `is_day`, not the system appearance mode); unknown conditions keep a neutral thermometer scene. Animations respect reduced motion and do not make external media requests.

Added an SVG hourly temperature line and a separate 0–100% rain-probability bar band, actual forecast-time labels, unit-aware temperature axis and exact-value native chart tooltips. Missing temperatures break the line, missing rain values have no bar, no valid temperatures show an unavailable label rather than fabricated readings. Keyboard/touch-accessible hour range input exposes exact time, temperature and rain probability via visible/live text and highlights the matching hourly card. Chart is described for screen readers; text cards retain the full data alternative.

Daily forecast rows now include Lucide condition icons and min/max comparison bars scaled against that forecast's finite range, omitted where either endpoint is unavailable. Refined hero typography, material borders, metric accents and responsive breakpoints while preserving wallpaper transparency. Versioned module/style `weather-visual-3`, SW shell-v75.

Four extra regression tests cover WMO/day-night scenes, chart points/gaps/probability scale, inspector/unit conversion and missing daily ranges. **132 JS tests + 9 server tests pass**, syntax/diff checks clean. Chromium fixture-only QA verified 24 forecast points, keyboard arrow interaction on hour slider, Celsius/Fahrenheit and Day/Night rendering with no uncaught page errors. Screenshot `/tmp/aether-weather-visual-night.png` explicitly shows QA Fixture City/Test, not live weather. Provider uptime remains unverified. Dedicated functional count remains 9/48.


## Batch 6 — Task Manager

- New explicit Day/Night glass workspace with open-window count ring, page heap/DOM overview, readable window cards and real runtime-history charts. Visuals are measured, not seeded/random data; unsupported heap API is unavailable rather than zero.
- Runtime history samples page heap (when supported), DOM counts and lateness of the app's two-second sampling callback. Retains at most 60 actual samples in this tab; hidden/paused periods are skipped. This is NOT per-app CPU/RAM, OS process telemetry, network ping or a system-kill API. Browser privacy precision/availability limits are stated.
- Added sampling pause/resume, manual refresh, JSON report download with object URL cleanup, keyboard-accessible charts/scroll region and unit/scope labels. Reports contain open window titles and session samples, not credentials.
- Single-window and close-others actions confirm unsaved-work risk; Task Manager excludes itself from bulk close. Uses normal window cleanup and labels the action as closing a window, not killing a device process. Available apps are labelled not-open, not misleadingly Idle. Dynamic window titles use DOM text/event listeners, not inline interpolated handlers.
- Stable window-list DOM preserves focused action/scroll across unchanged periodic refreshes; filtering retains its value across reopening and is explicitly disabled in Runtime History. Existing window-manager minimize/close paths dispose the sampler; initialization is idempotent.
- Seven focused regression tests cover honest snapshots, unavailable heap, filter/focus stability, confirmed closes, safe titles, bounded history, pause/dispose idempotence and chart/accessibility labels.
- Chromium used real browser measurements: collected heap/DOM/timer-delay samples, rendered all three supported graphs, confirmed pause leaves sample count unchanged, downloaded runtime JSON, filtered Code Sandbox, cancelled close (window remained open), confirmed close (window closed), and scrolled window-list content to scrollTop=500; transparent content background and no page errors. Screenshot `/tmp/aether-task-runtime.png` shows actual measurements. No device-process/per-app usage inference or mobile certification.
- **139 JavaScript tests + 9 server tests pass**; syntax/diff checks clean. Assets versioned `tasks-2`, SW shell-v76. Dedicated app pass now **10/48**, **38 pending**.


## Batch 7 — News & RSS reading room

- Explicit Day/Night glass editorial workspace, per-source availability/count cards, keyboard-accessible story cards, source identity marks, readable article hierarchy, independent bounded list/reader scrolling and narrow-window stacking. No opaque content backplates.
- Added tab-session read/unread filtering, saved-link JSON export and reader text-size control. Saved links (not offline article bodies) are validated, capped at 100 in memory and browser storage, and session-only storage failures are clearly reported. Existing compatible bookmark records are retained; malformed/non-array storage no longer crashes the app.
- Async clip saves await results, disable duplicate clicks, preserve visible content on failure and report session-only persistence. Clipping explicitly means visible text, which can be a summary while details are loading; original source URL remains metadata.
- Public-provider requests have nine-second timeouts, in-flight abort on close and stale-result guards for source refreshes and selected-reader details. Source failures preserve only that provider's earlier stories, labelled cached; successful empty responses clear previous items. All-source view actually interleaves sources. GitHub discovery date now rolls back 30 days instead of using a fixed 2026 cutoff. No fabricated fallback stories, statistics or read times.
- No automatic article selection/enrichment requests on opening. DEV article bodies are plain Markdown text, capped at 60,000 characters with disclosure, not a full Markdown renderer. Hacker News shows at most six public top-level discussion comments, not the linked article; other sources show summaries and safe original links. Remote text is displayed safely, credential/non-HTTP URLs rejected, and inline URL event handlers removed.
- Product scope is now explicit: this app remains a curated public-API digest, **not** a general custom RSS subscription client. Source APIs may block CORS or rate-limit. Existing shared shell digest refresh/companion buffer remains; closing aborts current requests, but does not disable the shell's future background digest schedule.
- Eight regression tests cover saved-data validation/limits/storage errors, safe text/URLs, keyboard cards, read/source state, stale reader results, source-level cached/empty behavior, async clipping and abort cleanup.
- Chromium **controlled fixtures only**: three updated source cards and one unavailable source, DEV detail load, reader wheel scrollTop 0→700→1300, independent list scrollTop 0→400, bookmarking/Saved view, 19px text-size change, JSON download and transparent reader background; no uncaught page errors. First short-wait scroll read was 0; repeating with enough event-delivery wait verified real wheel movement. Fixture screenshot `/tmp/aether-news-studio.png` explicitly labels QA content, not real news. No live-provider uptime certification.
- Full verification: **147 JS tests + 9 server tests pass**; syntax/diff checks clean. Assets versioned `news-2`, SW shell-v77. Dedicated app pass **11/48**, **37 pending**.


## Batch 8 — Open Bookshelf

- Explicit glass library with Gutenberg-sourced cover images when available, jacket fallbacks, editorial typography, bounded independent catalog/text scrolling and responsive stacked shelves. Added guarded pagination that constructs Gutendex page requests rather than following arbitrary API next URLs. Empty search browses catalog popularity; no book automatically opens/downloads after search.
- Fixed download counts labelled as reads, invented author/read metadata and network errors disguised as no matches. Current catalog and selected-text requests have separate cancellation/stale guards and 12-second timeouts; close aborts pending requests.
- Direct text requests only to HTTPS Gutenberg domains, with no silent AllOrigins/public relay fallback. Text reader rejects empty/HTML responses and has a disclosed 2 MiB streamed byte limit; oversized streams are cancelled, never silently truncated. Text is rendered as text, not executable HTML. Covers use safe domain checks and no-referrer; their failure leaves a readable jacket fallback.
- Added local .txt import (2 MiB limit, no upload), loaded-text download, 14–28px typography with position-preserving resize, System glass/Warm sepia/Night ink reading palettes, percentage progress and saved fractional reading positions (up to 100 book IDs) when storage is available. Local documents/text contents remain session-only, not backups. Copyright/availability jurisdiction caveat stated.
- Chromium controlled catalog/text fixtures verified reader wheel scrollTop=700 and catalog=400, 18px font, sepia contrast, reading-position storage and restoration (741 before close →742 after reopen at slightly different pane size), local file input and download, transparent default reader and no page errors. Initial animation-frame-dependent restoration stalled in the harness; switched to a cancellable post-layout timer and verified restoration plus regression test. No live Gutenberg/Gutendex availability or CORS certification.
- Ten regression tests cover catalog/no automatic text loading, honest counts, pagination, stale queries/selections, safe URL domains, no relays, bounded stream cancellation, plain text/font/theme safety, fractional position/storage denial, local import, close cleanup and post-layout restoration.
- **157 JS tests + 9 server tests pass**, syntax/diff checks clean. Assets `books-2`, SW shell-v78. Dedicated app pass **12/48**, **36 pending**.
