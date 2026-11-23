// One public, keyless media picker for Finder and the Music Theater chat.
// Only validated StickersAPI IDs (never raw third-party image URLs) are saved.
import { cleanMedia, mediaURL } from '../vendor/verci/providers/stickersapi.js';
import { openMediaPicker } from '../vendor/verci/viz/stickersapi-picker.js';

const keyFor = kind => kind === 'pfp' ? 'chat_media_avatar' : kind === 'banner' ? 'chat_media_banner' : null;

export function setChatProfile(kind, item) {
  const key = keyFor(kind), state = window.SystemState;
  if (!key || !state?.settings) return false;
  const safe = item == null ? null : cleanMedia(item);
  if (item != null && safe?.kind !== kind) return false;
  state.settings[key] = safe;
  state.save();
  window.AetherMusic?.state?.viz?.applyProfileMedia?.();
  renderLibrary();
  return true;
}

export function openLibraryPicker(options = {}) {
  const { onAvatar, onBanner, ...rest } = options;
  return openMediaPicker({
    ...rest,
    onAvatar: item => { if (setChatProfile('pfp', item)) onAvatar?.(item); },
    onBanner: item => { if (setChatProfile('banner', item)) onBanner?.(item); }
  });
}

export function renderLibrary() {
  const root = document.getElementById('stickers-library-panel');
  if (!root) return;
  root.querySelectorAll('[data-media-open]').forEach(button => {
    button.onclick = () => openLibraryPicker({ initialType: button.dataset.mediaOpen });
  });
  for (const kind of ['pfp', 'banner']) {
    const card = root.querySelector(`[data-media-profile="${kind}"]`);
    if (!card) continue;
    card.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = kind === 'pfp' ? 'Chat profile picture' : 'Chat banner';
    const saved = cleanMedia(window.SystemState?.settings?.[keyFor(kind)]);
    if (saved?.kind === kind && mediaURL(saved)) {
      const image = document.createElement('img');
      image.src = mediaURL(saved); image.alt = saved.name;
      image.referrerPolicy = 'no-referrer'; image.loading = 'lazy';
      image.onerror = () => image.remove();
      const name = document.createElement('span'); name.textContent = saved.name;
      const remove = document.createElement('button'); remove.type = 'button';
      remove.textContent = 'Remove'; remove.setAttribute('aria-label',`Remove chat ${kind === 'pfp' ? 'profile picture' : 'banner'}`);
      remove.onclick = () => setChatProfile(kind, null);
      card.append(heading, image, name, remove);
    } else {
      const placeholder = document.createElement('span');
      placeholder.textContent = kind === 'pfp' ? 'Default song artwork' : 'Default chat header';
      const browse = document.createElement('button'); browse.type = 'button';
      browse.textContent = 'Choose'; browse.onclick = () => openLibraryPicker({ initialType: kind === 'pfp' ? 'pfps' : 'banners' });
      card.append(heading, placeholder, browse);
    }
  }
}

if (typeof window !== 'undefined') window.AetherMedia = { openPicker: openLibraryPicker, setChatProfile, renderLibrary };
