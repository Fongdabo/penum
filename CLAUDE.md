# PENUM: notes for Claude sessions

Apps: `pm/` PENUM PM, `mep/` PENUM MEP, `bim/` PENUM BIM, `sales/` ORIEN ฝ่ายขาย. Each has an `app.json`; parts every app
shares live in `shared/`. GitHub Pages serves fongdabo.github.io/penum from `main`, built by `tools/build-pages.mjs`.
The full guide (layout, link keys between apps, commands) is `docs/apps.md` (Thai).

## PENUM PM source is split into files

- The page is every file in `pm/src/` (`NNN-what.html|css|js`) joined in name order. There is no `pm/index.html`; never
  recreate or commit one (it is in .gitignore and the build ignores it).
- Find code with `grep -rn "name" pm/src`. `230-skills-data.js`, `400-thai-address-data.js`, `430-skill-items-data.js` and
  `640-i18n-en.js` are single huge data lines: do not read them whole.
- Order matters: later files often wrap functions from earlier ones (`{const f=render;render=()=>…}`).
  A new feature goes in a new file numbered 911–989, before `990-start.js`, so parallel work does not collide.
- Every `pm/src/*.js` file must parse on its own, and each file's first line must not also appear in the file before it.
- PM's version is `ver:'…'` in `pm/src/992-feedback.html`.
- A browser error at `index.html:N` on the site: `node tools/src.mjs where pm N`. Whole page: `node tools/src.mjs join pm -o /tmp/pm.html`.
- A branch that still edits `pm/index.html`: port it with `tools/src.mjs split` as described in docs/apps.md.

MEP and BIM are still single files (`mep/index.html`, `bim/index.html`).

## Before a pull request

- `node tools/check-apps.mjs` (scripts parse, version, link keys, own-window buttons, feedback box, PM file rules) and
  `node tools/build-pages.mjs site` (or `site pm` for one app). CI runs both on every PR and before every deploy.
- Test in Chromium: copy `site/` to `<dir>/penum`, serve `<dir>` (`python3 -m http.server -d <dir>`), open `/penum/pm/`.
- Feedback box: edit `shared/feedback.js`, then run `node tools/sync-feedback.mjs`.
- Never rename the shared storage keys (`penum.mep.link`, `penum.handoff`, `saoek.v2`, `penum.licences`), the `/penum/<app>/`
  paths or the manifest ids: installed apps and customers' saved data depend on them.

## Licence codes

- One code per customer company; payload `ap` lists the apps it opens (no `ap` = PENUM PM only). ORIEN issues codes in
  `sales/`. PM checks them in `pm/src/810-licence.js`; MEP and BIM in `shared/licence.js`, which the build puts in their
  `<head>` because their `app.json` has a `licence` field. The public key must match in all three (`check-apps` checks).
- Renewals reach customers by themselves: ORIEN ฝ่ายขาย sends the encrypted new code to ORIEN's Supabase (`tools/licence-setup.sql`,
  rpc `penum_lic_put` / `penum_lic_get`); `pm/files/licences.json` is still read too.
- Never commit or publish the private signing key. Test with a throwaway key pair swapped into the built pages.
