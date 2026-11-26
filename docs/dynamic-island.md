# Companion island and control shelf

An original Apple Dynamic Island–inspired shell treatment, not an implementation
or claim of official iOS 27 features.

## What changed

- The three center performance graphs are replaced by one right-side diagnostics
  button. It samples actual RAF rate and browser-exposed JS heap. Unsupported
  memory is N/A; the tooltip explains that these are page measurements, not
  device CPU or RAM. Sampling pauses in hidden tabs. No fabricated history.
- The top-center island owns the existing assistant DOM and its command handler,
  local-model selector, chat history and voice controls. There is only one chat
  input. Expanding it never automatically downloads a model or requests a mic.
- Actual assistant working/listening state, speech synthesis, running Focus time,
  and active HTML audio playback drive compact status. Live Activity can pause
  a running Focus timer or active audio. Unsupported speech-recognition controls
  are disabled and explain why.
- Notifications.push records in Notification Center as before, but its cancelable
  local event routes presentation into the island instead of duplicating toasts.
  Browser online/offline events have explicitly scoped availability messages.
  Alerts do not automatically expand the island or steal typing focus.
- Up to 30 events remain only in this tab's memory. Latest-alert display expires
  after eight seconds; history can be cleared manually. Locking synchronously
  collapses/clears the island, and locked notifications are not kept in its log.
- Sidebar becomes a control shelf: actual Focus, open-windows, settings and activity
  shortcuts plus the existing media/radio summaries. Removed the old Network IO
  chart, its background updater and disconnected Discord card. Removed the
  non-actionable Bluetooth capability indicator from the menu bar.
- Small-screen sizing, explicit buttons/focus outlines, Escape/outside dismissal,
  polite alert announcements and reduced-motion handling are included.

## Validation

- 260 JavaScript and 9 server tests passed, including 13 island and 6 assistant-responsiveness regressions.
- Syntax checks and git diff --check passed.
- Actual headless Chromium ran the full shell with locally supplied runtime CDN
  libraries and external requests blocked. Typed `open terminal` into the island:
  existing assistant control layer opened Terminal. Exercised Notifications.push,
  live-event clear/dismiss, Focus pause and a 390px viewport. No page errors.
- Desktop and mobile screenshots inspected. External model inference, microphone
  permission/recognition and physical device battery APIs were not certified by
  this check. Existing local commands work without model inference; free-form AI
  still depends on the configured model/runtime and its download requirements.

Preview: `npm run dev` binds the application server to `0.0.0.0:4174`.


## Follow-up — quieter UI, faster cold path and fluid glass

- Removed the duplicate chat title/avatar, persistent model badges/specifications,
  debug meters and command-chip carousel from the default view. Model selection,
  explicit Load and download status are available only behind **Model**. The default
  panel is approximately 340px tall on a wide screen, with bounded chat scrolling.
- Collapsed face blinks, glances and breathes through local CSS animations; thinking,
  loading, listening and speaking have distinct state-driven motion. Hidden-document
  animations pause, reduced-motion requests are honored, and legacy hidden GIF
  reactions no longer issue media requests for the island avatar.
- The existing pill morphs its actual bounds into a translucent Day/Night glass
  surface, with cancellable Web Animations and delayed content fade-in. Model/view
  changes reuse the morph. Reduced motion skips it; rapid toggle stale completions
  cannot hide a reopened panel. Clear/Balanced/Solid and reduced transparency apply.
- Apps launched by assistant commands consume a short-lived, single-use launch
  rectangle. The actual app window animates out from the island rather than making
  cloned genie strips. Other app-opening/minimize behavior is unchanged.
- Greetings/direct actions no longer wait for IndexedDB before responding. Successful
  direct commands produce one reply rather than an extra technical execution row.
  No hidden WebLLM import/model download is attempted for ordinary cold-engine chat:
  greetings and local help respond locally, with explicit disclosure for free-form
  requests. A model download now requires **Model → Load local model**.
- Loaded-model replies reuse the engine, use the deterministic retrieval pass instead
  of a second embedding rerank on each turn, throttle status repaints, and use a
  shorter 192-token response budget. Hardware-dependent inference/download time is
  not claimed to be eliminated. Optional complex action planning still has a cost.
- Real Chromium follow-up verified greeting-handler completion in about 5–8ms in
  this environment (not a hardware-independent guarantee), hidden model controls,
  actual CSS face animations, single-use window launch origin, rapid toggles,
  notification handling, Focus pause and 390px Day-mode layout; no page errors.
  External runtimes were supplied locally and provider requests were blocked.

## Action deck and motion refinement

- Side droplets open the Focus/actions deck without adding persistent diagnostics. Alt+A opens the assistant; Alt+. toggles actions. Locked workspaces reject these controls.
- Focus dial, start/pause/resume, and five-minute break use the existing Focus engine. Replacing an active/partial session requires confirmation. No duplicate countdown is created.
- Audio deck appears only with an actual loaded source, controls real playback/volume, and reports rejected playback through live alerts.
- Files, window overview, launcher and new-chat shortcuts use existing actions; app launches retain a single-use island animation origin.
- Compact alerts preview actual incoming messages. Shell geometry animates during arrival/dismissal and expansion, with interrupted animation cancellation. Closing clips/fades the existing inert content instead of abruptly removing it.
- Added optical rim, one-shot sheen, pointer-following eyes, staggered action entry, live Focus ring and playback equalizer. Reduced-motion/transparency, day theme and narrow layouts have explicit overrides.
- Cache bumped to shell-v92 with island-3 assets.

Validation: 266 JavaScript tests and 9 server tests pass. Controlled Chromium check covered real Focus start/pause/resume/countdown, cancelled/accepted break replacement, Files launch, actual notification preview, keyboard actions and 390px layout with zero page errors. External CDN scripts were supplied locally in the harness; this does not certify external stream uptime, model inference or device permissions. Local deterministic greeting measured ~4ms in that run, not model inference latency.

## Companion usefulness correction (v4)

- Removed the redundant Focus side button; one SVG actions shortcut remains. Assistant view keeps companion identity rather than replacing its title with a radio station.
- Bundled Manrope variable Latin font locally with its OFL license. SVG controls, readable chat typography and user message bubbles replace the terminal-like presentation.
- Enlarged expressive portrait and state captions: curious, thinking, listening, talking, patient, focused, grooving, happy and concerned. These are UI expressions tied to events, not claims of sentience. Honors reduced motion.
- Basic binary arithmetic is parsed as numbers/operators without eval. Vague clarification requests no longer retrieve arbitrary documentation; local references require an explicit workspace-related query and higher relevance threshold.
- Verified published npm @mlc-ai/web-llm 0.2.89 catalog and pinned runtime imports. Added exact catalog records for Qwen3.5-0.8B, Qwen3-0.6B, SmolLM2-360M and 135M. Options are enabled only when the loaded runtime includes them; download remains opt-in and WebGPU required. Auto favors Qwen3.5-0.8B when available. No assertion that these are universally smartest, latest across all providers, or that tiny models match larger ones. Model weights/inference were not downloaded or benchmarked here.
- Workspace agents are bounded app-opening workflows (Writing: Notes + Focus; Research: Browser + WikiBoard + Notes). They require a step-list confirmation, check lock/app availability per step, stop on errors, and report progress. They do not autonomously browse, modify files or start timers. Existing LLM tool planner remains separately allowlisted through the assistant executor.
- Validation: 271 JS tests + 9 server tests pass; controlled Chromium passed arithmetic, Focus countdown/pause/resume, break confirmation, Files launch, alerts, keyboard shortcuts, one side shortcut, portrait/chat and 390px layout with zero page errors. Screenshot inspected at /tmp/island-v4-companion.png. Cache shell-v93/island-4.

## Voice, reactions and soundtrack (v5)

The companion has visible, session-scoped opt-in Voice on/off, Read reply, Stop and native voice selection. Speech uses the browser SpeechSynthesis API (no microphone needed); unsupported/error states are visible. Lock, hidden page, mute and page exit cancel companion speech. Replies are routed through this control so disabling it suppresses companion reply speech. No unsolicited spoken reactions interrupt music.

Music card uses existing player metadata and identity-matched lyric lines. A finite audio clock plus synced lyric source enables timed lines; embedded playback without that clock is explicitly manual browsing. Station-only radio metadata never invents song identity or lyrics. Palette is deterministic from track identity; ambient motion is decorative, not a claimed beat/spectrum analysis. Playback-state motion pauses with the source; reduced motion disables it. Existing media lyric requests now reject superseded track results to avoid displaying stale lyrics under another track.

Quiet, rate-limited captions react to soundtrack changes, Focus starts/completion, saved/completed alerts and offline events. Calculation follow-up retains the immediate calculation context, and a later unrelated turn clears it. Local music questions describe actual metadata limitations.

Validation: full suite 279 JS + 9 server tests passed before the final music-intent regression; focused suite rechecked afterwards. Controlled Chromium passed Focus, actual notifications, shortcuts, app launch, arithmetic follow-up, music-card fixture/manual lyric navigation and 390px layout, with zero page errors. Chromium distribution lacks SpeechSynthesis, so its honest disabled state was browser-tested; supported speech behavior, mute/replay/stop, lock and errors were tested with mocks. No audible voice/device certification or live lyric-service uptime claim. Music screenshots used explicitly labelled test fixture data, not a claim of real audio playback. Cache shell-v94/island-5; new companion module companion-1.

## Single face and speech articulation (v6)

- One physical face element is reparented between the collapsed toggle and expanded assistant portrait. Actions/activity views return it to the toggle; it is never duplicated.
- Microsoft Maisie Online is preferred on initial and delayed browser voice discovery. Explicit voice selection is stored locally and respected on subsequent discovery/reloads. If unavailable, the selector discloses the system fallback; the app cannot install a Microsoft voice on unsupported devices.
- Explicit mouth geometry uses native utterance start/end/error/pause/resume and word-boundary callbacks. Word initials select approximate round/wide/closed shapes; a speech-only animation covers voices without boundary events. This is stylized word-level articulation, not an audio-derived phoneme/viseme model. Stop/mute/lock/hide reset immediately; stale callbacks are ignored. Reduced motion uses a static speaking shape.
- Live spoken caption highlights boundary words when supplied. Calculation, music and workspace replies get corresponding portrait badges; thinking, listening, Focus and playback have separate visual cues. No claim that decorative bars measure synthesized audio.
- Validation: 284 JS + 9 server tests pass. Browser harness with mocked native speech verified one face, Maisie preference, speech caption, word callback, Stop reset and mobile visuals, with zero page errors. Actual Maisie audible playback remains device-dependent and was not tested in the sandbox. Inspected /tmp/island-v6-speaking-mobile.png. Cache shell-v95/island-6 and companion-2.

## Vector character redesign (v7)

Replaced the two glowing CSS bars/glass tile with one inline SVG character: softly rounded ceramic shell, inset graphite visor, shaded oval eyes with pupils/catchlights, expressive brows, curved smile, separate speech mouth and subtle status light. Retains the single reparented face and existing speech/voice behavior. Gaze, blink, curious/happy/concerned/focused/listening/thinking expressions and restrained hover/music motion are separate from utterance-driven mouth articulation. SVG contains no remote assets or added runtime dependency. Reduced-motion and hidden-page rules cover the character. Cache shell-v96/island-7.

Validation: 285 JavaScript tests pass; browser regression harness passed with zero page errors (mocked speech), including one face, Maisie preference, speech lifecycle and narrow layout. Inspected /tmp/island-v7-speaking-mobile.png. No server code changed in this cosmetic pass.
