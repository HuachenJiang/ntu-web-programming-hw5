# Local Performance Testing

This project keeps Phase 3 performance checks local and dependency-free. Start
the app first:

```bash
yarn dev
```

The local target defaults to:

```text
http://localhost:3000
```

## Manual `.http` Requests

Open `requests/performance.http` in a REST Client-compatible editor such as VS
Code REST Client or JetBrains HTTP Client.

The file includes safe GET requests for:

- `/`
- `/api/auth/session`
- `/api/users/{{userID}}`
- `/api/users/me`

Authenticated requests require a browser session cookie. Sign in locally, copy
the cookie header from DevTools, and paste it into the `@cookie` variable in the
`.http` file. Never commit real cookies or session tokens.

The file also includes a clearly labeled `PATCH /api/users/me/profile` example
for checking profile update latency. That request mutates the current profile,
so run it only with local test data.

## HTTP Benchmark Script

Run the local benchmark with:

```bash
yarn perf:http
```

The script only sends GET requests and prints per-endpoint request count,
success rate, average latency, min/max latency, and p95 latency.

Optional environment variables:

```bash
BASE_URL="http://localhost:3000" yarn perf:http
PERF_USER_ID="ric2k1" yarn perf:http
PERF_COOKIE="next-auth.session-token=..." yarn perf:http
PERF_ITERATIONS="20" yarn perf:http
```

- `BASE_URL` changes the target origin.
- `PERF_USER_ID` enables public profile checks at `/api/users/:userID`.
- `PERF_COOKIE` enables authenticated current-user API checks.
- `PERF_ITERATIONS` changes how many times each endpoint is requested.

For this Phase 3 stabilization pass, the benchmark is intended for local
regression checks rather than production load testing.

## Profile Render Checks

Authenticated profile pages should not perform database maintenance work on the
critical render path. Index creation is reserved for write paths that require a
unique constraint, such as onboarding `userID` assignment and follow creation.
Read-only profile fetches should rely on the existing MongoDB indexes and return
the profile data directly.

If `/profile` logs show large `application-code` time, compare:

- `/api/auth/session` for session lookup latency.
- `/api/users/me` with a local session cookie for current-user profile latency.
- `/profile` with the same cookie for the full page render latency.

Large delays isolated to authenticated profile reads usually point to MongoDB
connection, Atlas cold-start, network allowlist, or query/index work rather than
client-side rendering.
