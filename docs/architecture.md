# Architecture

## Overview

The project will be a Next.js full-stack application that resembles the core X/Twitter forum experience. The UI is English-language and focused on the main center column and left navigation. The right sidebar can be omitted.

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
- `users`: user profile, immutable `userID`, display name, avatar, bio, banner, and follow state.
- `posts`: posts, comments, reposts, drafts, likes, parsing, sorting, and recursive detail views.
- `realtime`: Pusher server triggers and client subscriptions.
- `ui`: navigation, feed, post cards, composer, modal, profile, and shared controls.
- `db`: MongoDB client, collection access, indexes, and persistence helpers.

Exact file paths will be chosen during Phase 1 according to the initialized Next.js structure.

## Data Ownership

MongoDB is the planned single source of truth.

Planned data groups:

- Users: OAuth provider account identity, immutable `userID`, name, avatar, bio, banner, created time, updated time.
- Sessions/accounts: handled through NextAuth-compatible persistence.
- Posts: author, content, parsed links/mentions/hashtags, timestamps, counts, parent comment target, repost source, deleted state.
- Drafts: owner, content, created time, updated time.
- Follows: follower and following user references.
- Likes: user and post/comment target references.
- Reposts: user and source post references.

Derived values such as counts may be denormalized for feed performance, but mutation APIs must keep them consistent with the source records.

## Authentication Flow

1. User signs in with Google or GitHub through NextAuth.
2. If the OAuth account has no registered app profile, route the user to onboarding.
3. Onboarding requires a unique immutable `userID`.
4. After onboarding, the user receives a session.
5. If the session has not expired, later visits restore the logged-in state without repeating onboarding.

Different OAuth providers for the same person are treated as separate app users unless explicitly linked by a later requirement.

## REST API Plan

Auth/session routes are handled by NextAuth. Application APIs should be RESTful and grouped by resource:

- User/profile APIs: onboarding, current profile, public profile, edit profile, follow/unfollow.
- Feed APIs: all posts, following posts, profile posts, own liked posts.
- Post APIs: create post, get post/comment detail, delete own post, create comment, like/unlike, repost/unrepost.
- Draft APIs: create/update draft, list drafts, publish draft, discard draft.
- Realtime APIs or server actions: trigger Pusher events after successful mutations.

All mutation endpoints must check the authenticated session. Public read endpoints may return public profile and public post data only.

## UI Layout

The main layout should resemble X without copying its branding:

- Left navigation with a custom logo/icon, Home, Profile, Post, and current-user account area.
- Bright primary Post button.
- Hover-highlight navigation items.
- Center column for Home feed, profile, and recursive post/comment routes.
- No required right sidebar.

Profile behavior:

- Own profile supports editing name, avatar, banner, and bio.
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
