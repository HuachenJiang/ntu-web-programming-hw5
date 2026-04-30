# HW5 X-clone

An English X/Twitter-style forum website for NTU Web Programming HW5. The app will support OAuth registration and login, user profiles, posting, comments, reposts, likes, following, recursive post/comment views, realtime interaction updates, and Vercel deployment.

## Planned Stack

- Next.js full-stack application
- TypeScript with the Next.js App Router
- Tailwind CSS for styling
- NextAuth for Google and GitHub OAuth
- MongoDB for persistence
- RESTful APIs for app data operations
- Pusher for realtime likes/comments
- Vitest and React Testing Library for focused tests
- Vercel for deployment

## Current Status

This repository has completed **Phase 3: Main Layout & Profile** and is now
implementing **Phase 4: Posting & Drafts**.

Completed through Phase 3:

- Google and GitHub OAuth through Auth.js/NextAuth
- MongoDB persistence for users, provider accounts, sessions, profiles, and follow state
- First-login onboarding for a unique immutable `userID`
- Returning-session support while the session remains valid
- X-clone-style left navigation, Home placeholder, profile pages, editable own profile, public profiles, and follow/unfollow behavior

Phase 4 adds persisted post creation, modal and inline composers, drafts, and
shared post-content parsing. Full feed lists and interactions remain Phase 5.

## Feature Roadmap

The basic app will be implemented in phases:

1. Next.js foundation
2. OAuth authentication and user identity
3. Main layout and profile pages
4. Posting, drafts, and content parsing
5. Feeds, interactions, following, and recursive comments
6. Pusher realtime updates
7. Vercel deployment

Advanced features are intentionally deferred until the basic requirements are complete.

## Environment Variables

The future app will use a `.env.local` file for local development and Vercel environment variables for production. Planned fields:

```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"

GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

GITHUB_CLIENT_ID="YOUR_GITHUB_CLIENT_ID"
GITHUB_CLIENT_SECRET="YOUR_GITHUB_CLIENT_SECRET"

MONGODB_URI="YOUR_MONGODB_CONNECTION_STRING"
MONGODB_DB="x_clone_hw5"

PUSHER_APP_ID="YOUR_PUSHER_APP_ID"
PUSHER_KEY="YOUR_PUSHER_KEY"
PUSHER_SECRET="YOUR_PUSHER_SECRET"
PUSHER_CLUSTER="YOUR_PUSHER_CLUSTER"
NEXT_PUBLIC_PUSHER_KEY="YOUR_PUSHER_KEY"
NEXT_PUBLIC_PUSHER_CLUSTER="YOUR_PUSHER_CLUSTER"
```

See `docs/setup.md` for detailed setup steps. See `docs/querying.md` for checking MongoDB Atlas data and local API responses.
See `docs/performance-testing.md` for local `.http` requests and lightweight
HTTP benchmark checks.

## Development Commands

After dependencies are installed with Yarn:

```bash
yarn dev
yarn lint
yarn typecheck
yarn test:run
yarn format:check
yarn build
yarn perf:http
```

`yarn dev` starts the local app at `http://localhost:3000`.

Dependency note: the Phase 1 scaffold started from the current `create-next-app`
template. Tailwind/PostCSS and Vitest-related packages are pinned to stable
compatible versions because Yarn classic had registry-resolution issues with
newly published package metadata in this environment.

## Development Rule

Before implementing app code, update the relevant documentation and acceptance criteria. See `AGENTS.md` for repository rules.
