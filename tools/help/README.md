# PENUM PM manual and per-page help

Source of the Thai user manual and of `pm/help/`, which the app's "คู่มือ ?" button opens.

- `build.py` + `style.css` → `manual.html` (needs the screenshots in `img/*.jpg` next to it; they live in the project files, not in the repo).
- `help.py <out> [videos]` splits `manual.html` into one page per sidebar tab (`co.sales.html`, `pj.cost.html`, …) with an anchor per page key, writes `index.json` for the button, the full manual as `index.html`, and WebP screenshots. `TABS` in `help.py` maps manual sections to page keys; `help-keys.json` lists every key the app can ask for.
- A key without its own section falls back to its tab, then to `index` (handled in pm/index.html).
