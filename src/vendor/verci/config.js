// PUBLIC configuration only. Never put secrets here (this file ships to every visitor).
// Secrets (YouTube API key, Apple Music private key) live in the Cloudflare Worker, see worker/README.md.
export const CONFIG = {
  // URL of your deployed Cloudflare Worker, e.g. 'https://verci-api.yourname.workers.dev'. Empty = not configured.
  workerUrl: '',
  // Jamendo client id (free, public by design). Empty = Jamendo disabled.
  jamendoClientId: '',
  // Apple Music storefront for catalogue search.
  appleStorefront: 'us'
};
export const userSetting = k => { try { return JSON.parse(localStorage.getItem('verci2') || '{}')[k] || ''; } catch { return ''; } };
