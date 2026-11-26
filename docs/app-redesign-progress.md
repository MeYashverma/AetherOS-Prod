# App-by-app redesign tracker

This tracks the **new functional redesign pass**, not the earlier static audit.
**48 of 48 apps now have coverage in this coordinated pass:** 19 have the dedicated
workbenches documented below; the remaining 29 have fleet workspace/layout work
and targeted functional fixes in Batch 14. These are different levels of work: a
shared workspace treatment is **not** a claim that every embedded service has been
rewritten as a bespoke native application. No external
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

## Batch 9 — Photo Booth

- Dedicated glass workspace with an opaque viewfinder, visual effect swatches,
  keyboard effect buttons, compare grid, responsive controls and a horizontally
  scrollable session gallery. Day/night and clarity modes use system materials.
- Camera access is opt-in, video only; demo, local-image and camera sources have
  explicit labels. Late permissions are invalidated and tracks stopped on close
  or cancellation. Local PNG/JPEG/WebP import is limited to 10 MiB and 16 megapixels;
  the decoded-pixel limit is checked after browser decoding, not a decoder sandbox.
- Single captures and four-pose strips use a real three-second countdown or an
  off setting (800 ms spacing between strip frames), with cancellation. Camera
  frames are rechecked at the shutter rather than silently capturing a demo.
- Mirroring and centre-cropping apply to camera/images. Nine effects are creative
  canvas filters, not thermal, medical X-ray or night-vision measurements.
- Last 12 captures remain in session memory, with manual PNG download, remove and
  awaited Files saving. Only an IndexedDB success is labelled saved; failures or
  session-only persistence leave the download available. No automatic upload.
- Validation: 10 targeted regression tests; Chromium checked real canvas outputs,
  imported PNG, single capture, 980px four-pose strip, elapsed strip pacing,
  countdown cancellation, mocked durable save, day/solid and night/balanced at
  1080px and 580px app widths, with no page errors. This was an isolated app harness,
  not physical-webcam or whole-desktop/mobile certification. Permission denial and
  late streams are simulated in tests. Full suite: 167 JS tests + 9 server tests.

## Batch 10 — SynthPad Studio

- Replaced the opaque rack with a dedicated glass instrument workspace, actual
  time-domain output waveform, colour-coded 16-step drum machine, labelled keyboard,
  and responsive horizontally scrollable drum/key surfaces. System day/night and
  clear/balanced/solid materials apply around preserved waveform/piano surfaces.
- Fresh sessions begin with an empty pattern. Lo-Fi, House and Trap are explicitly
  selected examples, not user work. Five instruments are synthesised oscillator
  patches, drums are oscillator/noise synthesis, and piano notes are one-shots;
  this is not sampled Rhodes/FM hardware or a full DAW.
- Replaced interval-triggered drum hits with a 25 ms look-ahead scheduler using
  Web Audio timestamps and a 100 ms scheduling horizon. Missed background beats
  are not replayed in a burst. Hiding the tab stops playback; browser audio and
  throttling policies still apply. Stop/close cancels timers and tracked sources.
- Added bounded output gain (35% default, 80% cap), compressor, all-sound-off,
  finite/clamped tempo and cutoff controls, click/touch/native-keyboard piano,
  accessible step names/pressed states and no Space double-trigger on buttons.
- Explicit browser pattern save/load reports blocked storage; validated JSON
  import/export preserves patch, octave, cutoff, tempo and 4×16 grid. Imports are
  bounded to 32 KiB, atomic and invalidated on close/newer pattern choices. Export
  is pattern data, not an audio recording. No MIDI or recording claims.
- Validation: 10 targeted tests and full **179 JS + 9 server** pass. Isolated
  Chromium app harness verified running Web Audio with non-silent analyser samples,
  gain, step playback, piano, all-sound-off, pattern save/load, actual JSON download,
  import, night/balanced and day/solid layouts (1090px/580px), and close cleanup;
  no page errors. No physical-device listening, timing/latency or full desktop/
  mobile certification. About portrait tests are included in the suite count.

## Batch 11 — Photopea Studio & Whiteboard Studio

These are intentionally redesigned **integration workspaces**, not claims of new
native image/diagram engines. Provider editor surfaces remain opaque and intact;
headings, visual canvas presets/editor cards, toolbars and footers use system glass.

- Photopea: no automatic connection on app open. Explicit connect, local-file
  selection (25 MiB) and Files image handoff replace fixed-delay remote fetches.
  Commands/files wait for its exact-origin/source ready message. Canvas presets
  are bounded to 16 megapixels; export is requested explicitly, single-flight,
  checks format headers and size, awaits Files persistence, and retains a Blob
  download if saving fails. PNG/WebP are raster, not layer-preserving PSD. Export
  timeout disables the bridge until reload to avoid accepting unsolicited late
  buffers. Close clears timeouts, pending reads, export state and Blob URL.
- Whiteboard: visual, explicit Excalidraw/diagrams.net/tldraw selection, provider
  notes, external links and confirmation before switching/reloading. No iframe
  load event is labelled proof of editor readiness. Only diagrams.net has a
  verified-message ready state; blank/blocked frames have visible fallback advice.
- diagrams.net: truly empty starting diagram, bounded 2 MiB editable XML import,
  XML backup download and awaited Files saving. No fabricated starter project,
  silent SVG persistence or generic “bidirectional sync” claim. DTD/entities,
  malformed XML and non-diagram roots are rejected. XML is stored as text, not
  rendered locally as untrusted SVG. Opening it in a provider can resolve external
  resources referenced by that document. Autosave means session memory, not disk.
  Saving an older snapshot never marks newer edits saved. Close/switch invalidates
  late imports and timers; in-flight storage transactions cannot be undone.
- Excalidraw/tldraw saving and collaboration remain provider-controlled. No cross-
  provider conversion or unsaved-state transfer to external links is promised.
- Validation: 14 new regression tests; full **193 JS + 9 server** pass. Isolated
  Chromium harness used controlled HTTPS editor responses at the expected origins
  to verify actual cross-frame readiness, buffer export, local file transfer,
  requested downloads, diagram import/save and close cleanup. Night/balanced and
  day/solid (1100px/580px) layouts checked, no page errors; no provider requests
  before deliberate connection. This is fixture-based bridge validation, **not**
  live Photopea/Excalidraw/diagrams.net/tldraw availability or full mobile testing.

### Batch 11 follow-up — canvas-first density correction

User feedback: large top headings/preset cards wasted editor space. Removed both
hero headers and the separate card rows. Photopea presets now live in a compact
New canvas dropdown; Whiteboard engines are inline tabs. Both use a single top
toolbar, edge-to-edge editor area and footer actions/status. Disclosure/onboarding
copy is inside the empty state and disappears when the editor is loaded, rather
than permanently occupying vertical space. Earlier batch-11 card/header notes
above describe the superseded first pass.

Chromium measured each 1100×900 app body: 39px top toolbar and 822px editor area
(91.3% of body height); previous editor tops were roughly 246–269px. Existing
fixture-based bridge, import/export and narrow/day-mode checks still pass with no
page errors. Compact structure has a regression test; full suite 194 JS tests.

## Batch 12 — World Museum Gallery & Space Launches

Both use compact top controls and a small status footer, not oversized permanent
hero headers. Glass surrounds artwork/mission images rather than altering pixels.

- Museum: real Art Institute of Chicago search, 24 results per page (up to page
  100), safe numeric artwork IDs and a pinned museum IIIF origin. No made-up or
  silent substitute artwork on empty/error results. Full-composition thumbnails,
  large selected-work viewer, fit/150%/200% zoom with scroll, attribution and
  provider-reported public-domain status. Do not infer reproduction rights from
  viewing an image.
- A 50-reference collection is explicitly saved in browser storage, with a saved
  view and JSON link export. Storage failures are reported session-only. Files
  saves are awaited **text references**, not mislabelled remotely linked JPEGs.
  The old wallpaper/save-image shortcuts were replaced with clearly labelled
  museum and larger-image links; no offline-image or wallpaper-success claim.
- Launches: removed the fabricated future Falcon 9 mission and generic fallback
  crew. Shows the first 20 upcoming launches/in-space crew records from Launch
  Library 2, or honest empty/error states. Failed refresh retains only previously
  fetched real records with a prominent stale banner and last-success timestamp.
- Selected mission imagery (or a decorative orbit motif, not fake telemetry),
  provider status/rocket/orbit/pad, local or UTC display and a NET-estimate countdown.
  Past or missing times never say “liftoff/in flight”. Atlas handoff requires valid
  provider coordinates, preserves latitude/longitude zero and invents no pad.
- Static ICS export uses the provider timestamp, escaped fields and folded UTF-8
  lines. It is an estimated calendar event, not a live subscription. Verify actual
  launch time and status with the provider. Crew counts describe records shown,
  not the total number of people in space.
- Both APIs: explicit HTTP/rate/timeout errors, 12-second cancellation, 3 MiB
  streamed JSON limit where streaming is available, stale-request and close guards,
  safe text rendering and HTTPS external links. No unattended polling of providers;
  only the local selected-mission countdown ticks each second.
- Validation: 14 new tests; full **208 JS + 9 server** pass. Controlled Chromium
  fixtures verified museum zoom, collection save/export/reference save, gallery
  wheel scroll 600px, launch-list wheel scroll 600px, detail scroll 586px, ICS
  download, stale refresh and crew records. Night/balanced and day/solid layout
  checks at 1100px/580px, no page errors. Fixed compressed gallery rows found in
  browser QA so artwork captions remain visible and the gallery actually scrolls.
  These are **fixture-based checks, not live museum/Launch Library availability**,
  copyright clearance, event accuracy or full mobile certification.

### Museum follow-up — image-loading report

User reported missing pictures. Initial screenshot checks had used controlled
image responses, not live museum image delivery. The live search endpoint was
subsequently fetched and returned real artwork/image IDs plus the museum's inline
`thumbnail.lqip`; the selected artwork's IIIF info endpoint also responded. Full
JPEG retrieval could not be verified from this environment. Do not treat these
metadata checks as proof that full images work on the user's network.

Changed thumbnail and in-app viewer requests to the documented 843px form, added
one same-artwork confined-size retry and a 15-second image timeout. If both image
requests fail, use only that artwork's museum-supplied inline bitmap preview,
explicitly labelled low-resolution; otherwise show visible retry/museum-record
advice. Added Retry images and ensured image errors are visible in the footer.
Images opt out of the global content-visibility optimisation. No unrelated art
or fake successful image load is substituted. Close clears image retry timers.

Two new regression tests and a Chromium controlled-503-first-request check verify
same-artwork image recovery and visible failure states. Full suite: 210 JS tests.
Live full-resolution image availability remains unverified.

### Museum follow-up — screenshot confirmed catalogue fetch failure

The user's screenshot showed **Museum unavailable: Failed to fetch**, not an
image failure. The earlier image retry patch did not solve catalogue connectivity.
No claim is made that this network/CORS/provider failure has been repaired.

Museum now opens immediately on an explicitly labelled **Included collection**:
three real, attributed public-domain reproductions stored in `assets/museum`,
with locally verified image dimensions and source/license notes. These are not
synthetic artwork or supposed results for an online query. Online search remains
an explicit action. If its request fails, the local works are shown with the
message “NOT search results”; a successful empty search still stays empty.
Included art and saved-view return work without a network call. The browsing-size
copies do not pretend to be live/high-resolution museum images. The API metadata
for these actual works was checked, including corrected Hokusai image ID.

Verified in Chromium with **all HTTPS requests blocked** and no image fixtures:
all three real app-served WebP assets loaded (960×639, 500×614, 1200×830), as did
the selected viewer. Startup made zero external requests. A deliberately failed
online search preserved explicit included-mode labelling; selecting Hokusai and
wheel-scrolling the zoomed image worked. No page errors. Source files and JS are
service-worker versioned/pre-cached. Full suite: **211 JS tests pass**.

## Batch 13 — Shader Studio

- Compact glass controls, large preserved WebGL output, scrollable source editor,
  expandable help and bounded compiler-log panel. No hero header. Responsive
  side-by-side or stacked layout; system day/night/clarity supported.
- Four built-in scenes run without network access. They are creative visuals,
  not black-hole/aurora scientific simulations. Corrected an undefined reversed-
  edge smoothstep in the neon preset. No fixed-frame-rate claims.
- Explicit GLSL ES 1.00 mainImage compile with iResolution, iTime, iMouse, iFrame
  and iTimeDelta. Full compiler logs (up to 8 Ki characters) retain line numbers;
  failed compiles preserve the last valid program/output. Recompile/close frees
  shaders, replaced programs, vertex buffers, RAF and resize observers.
- Pause/play, reset, 0–120 second scrubbing and half-scale render setting. Render
  buffers capped at 921,600 pixels and 2048px per dimension. Reduced-motion users
  get a static compiled built-in; backgrounding pauses animation. Context loss
  blocks captures; restoration requires explicit recompile.
- Browser draft save reports failures; source import is 64 KiB, bounded and
  explicit-run, with stale-read protection. Export is plain GLSL. Restored/imported
  user source is never automatically executed. Dirty replacement is confirmed.
- Preview PNG download and awaited Files save replace the old implicit wallpaper
  action. PNGs use actual preview dimensions and do not contain editable source.
  Files failures/session-only copies leave PNG download available.
- Optional external Shadertoy mode pauses local rendering, loads nothing until an
  explicit valid official ID/URL request and unloads the iframe on return/close.
  Provider readiness/framing and full Shadertoy compatibility are not claimed.
- **Trusted GLSL only**: single fragment pass, no texture/buffer/audio channels.
  Expensive or looping GPU shaders can freeze a tab; Pause and the pixel cap are
  not GPU isolation, a watchdog or protection against arbitrary untrusted code.
- Validation: 14 new tests; full **225 JS + 9 server** pass. Real headless Chromium
  WebGL compiled all four scenes, checked unchanged paused frames and changed
  time-scrubbed output, preserved the last program after invalid GLSL, downloaded
  PNG/GLSL, imported source, saved a frame, switched render scale and exercised
  actual WEBGL_lose_context loss/restoration/recompile. A gradient shader read back
  real centre pixels [128,128,128,255]. Zero external requests/page errors.
  Night/balanced and day/solid at 1100px/580px checked; not a physical-GPU or full
  desktop/mobile certification. Imported source and Files saves were controlled.


## Batch 14 — coordinated remaining-app fleet pass

Scope: Settings, About, WikiBoard, Media, Stickers, Radio Browser, System Monitor,
Chiptune, Earth Monitor, Stellarium, GeoRadar, World Factbook, Archive & DOS Vault,
Winamp, AetherBridge, AetherLink, Presence, ISS, NASA, Globe, Markets, Games,
YouTube TV, Memes, Anime, Manga, Entity Scanner, Floor796 and Wplace.

### Interiors and controls

- Compact 30–34px workspace strip, contextual data/privacy notes and app details;
  no new hero/title cards. Each app has an explicit workspace profile.
- Material-token interiors inherit Day/Night/Auto and Clear/Balanced/Solid from
  the shell, with light-mode accent-ink corrections and keyboard focus treatment.
  Media, iframe internals and canvases retain their own actual content surfaces.
- Dense reference-library splits, image-led Anime/Manga cards, shorter Stickers
  introduction, bounded Earth Monitor map/list tracks, audio deck grid sizing,
  smaller network-tool headings and edge-to-edge external viewers.
- Container-based narrow-window layout, not viewport-only mobile rules. Earth
  map/list stacks at narrow widths. The outer layout stays bounded for nested
  scrolling. Browser wheel testing found continuous map repaint blocked input in
  the software renderer: map painting is now capped at about 15fps with bounded,
  element-sized buffers. Map pointer selection uses those same dimensions.
- Editable WikiBoard JSON export; observation, country/FX, radio favorites,
  directory, browser-report, market-candle, character and reading-list exports
  contain actual loaded/browser data, never sample records. Private connection
  keys, chat messages, presence/webhook credentials and device-transfer data are
  not included in workspace exports. Exports themselves can contain personal
  notes/favorites; keep them private as appropriate.
- External viewer Source/Reload/Stop/Resume controls. Stop blanks remote frames;
  Resume restores the selected URL. Iframe load is never called proof of readiness.
  Sources can open outside the frame if a provider refuses embedding.

### Correctness fixes

- Earth Monitor: removed fabricated earthquake/disaster failure lists and made-up
  category magnitudes. Real timestamps/zero coordinates; latest-feed protection;
  visible unavailable/no-observation states. USGS tsunami flag no longer presented
  as an official tsunami watch. Day/night map and selected-event source controls.
- Factbook: HTTP checks, no unlabelled static India fallback, all countries remain
  filterable rather than silently truncating at 120, clear empty/error messages,
  dated FX and latest-selection-wins GDP chart with a real grid-column declaration.
- Wayback: validate site and provider archive host, use confirmed closest snapshot
  and actual date, clear old navigation when lookup fails/no capture. Close
  invalidates pending lookup. Archive search no longer assumes public-domain rights.
- ISS: deleted synthetic trajectory generator; failed provider path clears lines.
  Position/trajectory states are visible, previous coordinates are marked stale on
  feed failure, broad region names labelled approximate. Procedural globe retained.
- Radio/Winamp: no invented fallback listeners/songs or votes-as-listeners. Unknown
  bitrate stays unknown, muted volume survives template rendering, favorites save
  failures reported, search/tab races guarded and stream protocols validated.
  Missing analyser output is flat rather than fake dancing frequency bars.
- Markets: symbol/interval request guards, old candles cleared before loading,
  stale WebSocket callbacks ignored, real history labelled history rather than
  live merely because an HTTP request succeeded. Removed unused hard-coded prices.
- Anime/Manga: latest-query and detail guards, no forced opening of the first new
  result over the user's selected detail. NASA tab renders have equivalent guards
  and category-specific retry actions. If APOD falls back to NASA archive imagery,
  that substitution is explicitly labelled as not the requested day’s APOD.
- WikiBoard: URL/image card additions require HTTP(S), YouTube IDs validated, and
  storage failure is visible instead of silently implying a saved board.

### Validation and boundaries

- 16 new automated regression tests (241 JavaScript + 9 server tests passing); covers request races, no-fake failure states,
  confirmed snapshots, export shapes, viewer lifecycle and cache alignment.
- Headless Chromium mounted all 29 templates at 1100px night/balanced and 550px
  day/solid: **58 layout checks**, one bounded tools strip per app, no page errors.
  Exercised real Earth map canvas, real wheel scrolling (700px) and JSON download.
  Provider observations were explicitly labelled controlled layout fixtures, not
  live data. Day/solid and night/clear screenshots inspected.
- This is a coordinated fleet pass, not 29 new independent native applications.
  Third-party studios/games/maps still run in their own frames. Peer transfer was
  not certified across two physical devices. No live API uptime, account access,
  WebGL hardware compatibility or remote service availability is certified by the
  local tests. Existing app-specific limitations remain in `assets/app-audit.json`.
