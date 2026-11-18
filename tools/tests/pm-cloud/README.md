# PENUM PM: several devices on PENUM's cloud at once

Checks that work saved on several devices of one company at the same moment is never lost (PM 4.99.39,
`pm/src/989-sync-safe-save.js`). Each Playwright browser context is one device. They all work on `sbmock.mjs`, an
in-memory stand-in for ORIEN's Supabase written from `tools/*-setup.sql`, so no real company data is touched and the
real cloud is never called. The pages get a throwaway licence key pair that exists only in memory while the test runs.

```
node tools/build-pages.mjs site pm
node tools/tests/pm-cloud/run.mjs              # all four, about 12 minutes
node tools/tests/pm-cloud/run.mjs race         # or view, delete, soak
node tools/tests/pm-cloud/run.mjs all --norev  # a cloud that has not run the 4.99.39 part of pm-cloud-setup.sql
node tools/tests/pm-cloud/run.mjs soak --minutes=3 --devices=4
```

Needs Node 18+ and Playwright with Chromium (`npm i -D playwright && npx playwright install chromium` where they are not
installed). CI does not run it: run it before changing how PM saves to the cloud (`folderSync`, `merge3`, `fRead`/`fWrite`,
`830-cloud.js`, `tools/pm-cloud-setup.sql`).

| Test | What happens | Passes when |
|---|---|---|
| `race` | Two devices add a customer 0.2 s apart | Both customers are on both devices and in the cloud |
| `view` | Both devices open every page and tab they may see, then one device adds a customer | No upload while only looking; the edit makes one upload and the other device gets it |
| `delete` | One device deletes a customer; then one deletes while the other adds, 0.2 s apart | Deletions reach everyone and are not brought back; the addition stays |
| `soak` | 4 devices each add a customer every 4 to 12 s for 2 minutes | No customer is missing and every device equals the cloud |

Results on 18 Nov 2026 (4 devices adding every 4 to 12 s): PM 4.99.27 lost 11 of 65 records in 2 minutes. PM 4.99.39
passed all four in 3 minutes: 94 of 94 kept with the SQL, 93 of 93 without it. Without the SQL, `delete` accepts that a
customer deleted at the same moment as another device's save can come back, as it did before 4.99.39; the SQL stops that.
