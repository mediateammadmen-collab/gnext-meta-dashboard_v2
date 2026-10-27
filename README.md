# GNext Meta Ads Dashboard

An internal, read-only dashboard that pulls live spend, reach, and ad
creative data from the Meta Marketing API (Graph API), filterable by date
range and country.

## Setup

### 1. Environment variables

Next.js only auto-loads env files named `.env`, `.env.local`,
`.env.development`, etc. — a plain `local.env` is **not** picked up
automatically, so credentials must live in `.env.local` at the project root:

```bash
META_ACCESS_TOKEN=your-long-lived-access-token
META_AD_ACCOUNT_ID=act_XXXXXXXXXXXX
META_API_VERSION=v26.0
```

These are read only inside Route Handlers and Server Components
([src/lib/meta.js](src/lib/meta.js), guarded with `import "server-only"`) and
are never prefixed with `NEXT_PUBLIC_`, so they're never bundled into
client-side JavaScript or sent to the browser.

`.env.local` is covered by the `.env*` rule in [.gitignore](.gitignore) —
confirm with `git check-ignore -v .env.local` before committing anything.

### 2. Generating a long-lived access token

1. Create/select an app at [developers.facebook.com/apps](https://developers.facebook.com/apps)
   with the **Marketing API** product added.
2. In [Graph API Explorer](https://developers.facebook.com/tools/explorer/),
   select the app, request the `ads_read` (and `ads_management` if you'll
   later need write access) permission, and generate a **User Access
   Token**.
3. Exchange it for a long-lived token (~60 days):
   ```bash
   curl -i -X GET "https://graph.facebook.com/v26.0/oauth/access_token?grant_type=fb_exchange_token&client_id=<APP_ID>&client_secret=<APP_SECRET>&fb_exchange_token=<SHORT_LIVED_TOKEN>"
   ```
4. For a token that doesn't expire, convert it to a **System User** access
   token instead via Business Settings → System Users (recommended for
   server-side tools like this one).
5. Find your ad account ID (prefixed `act_`) in Ads Manager → Account
   Overview, or via `GET /me/adaccounts`.

### 3. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Filters are stored in
the URL (`?range=14d&country=bangladesh`), so any filtered view is
shareable and survives a refresh.

## How it's built

- **Data fetching**: all Graph API calls happen server-side in
  [src/lib/meta.js](src/lib/meta.js) — pagination via `paging.next` and
  retry/backoff on 429s and transient 5xx are handled there. It's used both
  directly by the dashboard page (server component) and by the two API
  routes below.
- **Country filtering**: rather than relying on campaign naming
  conventions, insights are requested with `breakdowns=country` at both the
  account level (for summary metrics) and the ad level (to know which ads
  delivered in which country, and with what performance, for a given
  selection).
- **API routes**:
  - `GET /api/insights?range=&country=` — summary metrics.
  - `GET /api/creatives?range=&country=` — ad-level creatives with computed
    cost-per-engagement.
  Both cache their Graph API calls for 5 minutes (`revalidate: 300`) to
  avoid hammering the API on every filter change.
- **Media**: ad images/videos are rendered with plain `<img>`/`<video>`
  tags instead of `next/image`, since Meta's CDN asset URLs are signed and
  expire — Next's image optimizer would refetch and cache a URL that may no
  longer be valid.
- **Ad + video lookups**: creatives are resolved only for ads that appear in
  the date-ranged insights response (via the Graph API batch endpoint, 50
  nodes per request), not by paging through the account's entire ad
  history. Meta deprecated the root `?ids=` multi-node lookup in v26.0, so
  batch requests are used instead.

## Deploying to Netlify

This is a server-rendered app (Route Handlers, Server Actions, per-request
data) — not a static export — so it needs Netlify's official Next.js
Runtime, which [netlify.toml](netlify.toml) already wires up.

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
   Build command and the `@netlify/plugin-nextjs` plugin are picked up from
   `netlify.toml` automatically — no manual config needed.
3. **Site configuration → Environment variables**, add the same three
   server-only vars from `.env.local`: `META_ACCESS_TOKEN`,
   `META_AD_ACCOUNT_ID`, `META_API_VERSION`. Never prefix them with
   `NEXT_PUBLIC_` — Netlify only exposes those to the browser bundle, and
   these must stay server-side only.
4. Deploy. Route Handlers and Server Actions (`refreshDashboard`) run as
   Netlify Functions automatically; the 5-minute `revalidate` caching on
   Graph API calls works the same as it does locally.

Alternatively, from the CLI once you're logged in (`npm install -g
netlify-cli && netlify login`): `netlify init` to link/create the site, then
`netlify deploy --prod`. Set the same three env vars via `netlify env:set`
or the dashboard before the first prod deploy.

## Known limitation: Development Access rate limits

If the connected app is still on Meta's **Development Access** tier, its
per-app rate limit is low and shared across every call made while testing.
Under load (e.g. an account with many ads/videos, or rapid filter changes)
you may see individual video thumbnails/sources fail to resolve — the UI
degrades gracefully (falls back to the creative's thumbnail, or a "No
preview" state) rather than erroring the whole page. This clears up once
the app's rate-limit window resets, and won't be a practical constraint
once the app is on **Standard Access** (via App Review) or using a System
User token on an approved Business app.

## Out of scope

No auth (internal tool) and read-only — nothing here writes back to the ad
account.
