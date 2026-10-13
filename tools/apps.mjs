// The list of PENUM apps: every top-level folder with an app.json. Used by build-pages.mjs and check-apps.mjs.
// In app.json: name/short/desc/theme/bg → the installed app; ver: where the app's own version name is in its source (a regex);
// save: what the update button runs before reloading; shim: stand in for the Artifact downloads service; ownIcons: the app's own icons/ folder;
// copy: extra files served next to the app {published path: source path}; links: the shared browser-storage keys it writes and reads;
// opens: the apps its header buttons open in their own window. See docs/apps.md.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const root = new URL('..', import.meta.url).pathname;
export const APPS = readdirSync(root, { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(join(root, d.name, 'app.json')))
  .map(d => ({ dir: d.name, ...JSON.parse(readFileSync(join(root, d.name, 'app.json'), 'utf8')) }))
  .sort((a, b) => (a.order || 99) - (b.order || 99));
