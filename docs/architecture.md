# Architecture

## Overview

The project is a Next.js full-stack application that resembles the core X/Twitter forum experience. The UI is English-language and focused on the main center column and left navigation. The right sidebar can be omitted.

The planned architecture uses:

- Next.js App Router for pages, layouts, server components, and API routes.
- NextAuth for Google/GitHub OAuth and session handling.
- MongoDB as the single persistence source.
- RESTful APIs for application data operations.
- Pusher for realtime updates to likes and comments.
- Vercel for hosting and environment management.

## Application Boundaries

The implementation should keep these areas separate:

- `auth`: OAuth providers, session callbacks, onboarding status, and current-user helpers.
- `users`: user profile, immutable `userID`, display name, avatar URL, bio, banner URL, and follow state.
- `posts`: posts, comments, reposts, drafts, likes, parsing, sorting, and recursive detail views.
- `realtime`: Pusher server triggers and client subscriptions.
- `ui`: navigation, feed, post cards, composer, modal, profile, and shared controls.
- `db`: MongoDB client, collection access, indexes, and persistence helpers.

Phase 1 uses a `src/` based Next.js App Router structure:

- `src/app`: route segments, layouts, global styles, and future route handlers under `src/app/api`.
- `src/components`: reusable UI components shared across features.
- `src/features`: domain feature modules such as auth, users, posts, and realtime UI/domain logic.
- `src/lib`: shared utilities such as environment validation, parsing, and formatting helpers.
- `src/server`: server-only integrations for database, auth, and realtime providers.

Feature work should keep these folders as ownership boundaries instead of mixing API, persistence, UI, and domain logic in a single file.

## Data Ownership

MongoDB is the planned single source of truth.

Planned data groups:

- Users: Auth.js user records plus immutable app identity fields (`userID`, normalized `userIDLower`), editable display name, avatar image URL, bio, banner image URL, created time, updated time.
- Sessions/accounts: handled through Auth.js/NextAuth MongoDB adapter persistence. Accounts are provider-specific, and Phase 2 intentionally keeps Google and GitHub identities separate even when the provider email matches.
- Posts: author, content, parsed links/mentions/hashtags, timestamps, counts, parent comment target, repost source, deleted state.
- Drafts: owner, content, created time, updated time.
- Follows: follower and following user references stored in a dedicated `follows` collection with a unique `(followerId, followingId)` pair.
- Likes: user and post/comment target references.
- Reposts: user and source post references.

Phase 2 creates a unique index on `users.userIDLower` for registered users. The application writes both `userID` and `userIDLower` during first-login onboarding and never updates either field afterward. Phase 3 adds the unique follow-pair index.

Derived values such as counts may be denormalized for feed performance, but mutation APIs must keep them consistent with the source records.

## Authentication Flow

1. User signs in with Google or GitHub through NextAuth.
2. Auth.js persists the provider account, user, and session in MongoDB.
3. If the OAuth account has no registered `userID`, route the user to onboarding.
4. Onboarding requires a unique immutable `userID`.
5. After onboarding, the session exposes the app user id, nullable `userID`, and onboarding status.
6. If the session has not expired, later visits restore the logged-in state without repeating onboarding.
7. A signed-out returning user may enter their `userID`; the app looks up the
   registered account, stores a short-lived signed login intent for the bound
   OAuth provider account, and then redirects the browser to that provider.
   During the OAuth callback, the selected provider account must match the
   stored intent. The `userID` lookup is a convenience entry point, not an
   authentication factor.

Different OAuth providers for the same person are treated as separate app users unless explicitly linked by a later requirement.

## REST API Plan

Auth/session routes are handled by NextAuth. Application APIs should be RESTful and grouped by resource:

- User/profile APIs: onboarding, current profile, public profile, edit profile, follow/unfollow.
- Feed APIs: all posts, following posts, profile posts, own liked posts.
- Post APIs: create post, get post/comment detail, delete own post, create comment, like/unlike, repost/unrepost.
- Draft APIs: create/update draft, list drafts, publish draft, discard draft.
- Realtime APIs or server actions: trigger Pusher events after successful mutations.

All mutation endpoints must check the authenticated session. Public read endpoints may return public profile and public post data only.

Phase 4 implements the first concrete post and draft resources:

- `POST /api/posts` creates an original post for the authenticated onboarded
  user and may publish an owned draft by deleting it after successful creation.
- `GET /api/drafts`, `POST /api/drafts`, `PATCH /api/drafts/[draftId]`, and
  `DELETE /api/drafts/[draftId]` manage only the authenticated user's drafts.
- Post content parsing and counted-length validation live in `src/features/posts`
  so the modal composer, inline composer, API routes, and tests use one source
  of truth.
- MongoDB stores posts and drafts in separate collections. Posts include parsed
  entities, counted length, timestamps, deleted state, and zeroed interaction
  counts for later feed work. Drafts include owner, content, parsed entities,
  counted length, and timestamps.
- Phase 4 intentionally does not implement the persisted Home feed list,
  comments, likes, reposts, recursive detail routes, or Pusher updates.

## UI Layout

The main layout should resemble X without copying its branding:

- Left navigation with a custom logo/icon, Home, Profile, Post, and current-user account area.
- Bright primary Post button.
- Hover-highlight navigation items.
- Center column for Home feed, profile, and recursive post/comment routes.
- No required right sidebar.

Profile behavior:

- Own profile supports editing name, avatar, banner, and bio.
- Avatar and banner editing use HTTP/HTTPS image URL fields in the initial scope. File uploads and CDN-backed media are deferred until a later media phase.
- `userID` cannot be changed after registration.
- Other users' profiles are read-only and show Follow/Following instead of Edit Profile.
- Other users' liked posts are private and must not be shown.

## Realtime Flow

Pusher is used for realtime likes and comments:

1. A user performs a mutation through a REST API.
2. The server validates the session and updates MongoDB.
3. The server triggers a Pusher event for affected post/comment channels.
4. Subscribed clients update visible interaction counts without requiring refresh.
5. New content should not interrupt a reader's current position; feed-level notices can be added later.

## Advanced Features

Advanced features are deferred until the basic app is complete:

- Explore
- Notifications
- New post notice
- Full hashtag pages
- Long posts
- Media uploads/CDN
- Mobile-specific enhancements
