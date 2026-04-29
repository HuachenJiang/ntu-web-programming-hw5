# Development Phases

## Phase 0: Project Docs & Rules

Goal: establish the project requirements, architecture direction, setup instructions, and future development phases before writing application code.

Work:

- Create `AGENTS.md`.
- Create `README.md`.
- Create `docs/architecture.md`.
- Create `docs/dev-phase.md`.
- Create `docs/setup.md`.
- Choose MongoDB as the planned database.
- Defer advanced features until the basic requirements are complete.

Acceptance criteria:

- All Phase 0 documents exist.
- The docs identify required stack choices and environment variables.
- User-operated setup steps are documented in detail.
- Future phases are actionable and include acceptance criteria.
- No Next.js app code is implemented in Phase 0.

## Phase 1: Next.js Foundation

Goal: create the application scaffold and baseline engineering workflow.

Work:

- Initialize a Next.js App Router app with TypeScript, Yarn, and the `src/` directory.
- Configure Tailwind CSS for the styling approach.
- Add ESLint, Prettier, TypeScript checking, and Vitest + React Testing Library commands.
- Add the base application layout and folder structure for UI, API routes, auth, database, domain logic, and realtime code.
- Add environment validation while keeping `.env.example` aligned with `docs/setup.md`.
- Add a placeholder Home route that confirms the app boots without implementing Phase 2+ features.

Acceptance criteria:

- The app runs locally.
- Lint, format check, typecheck, test, and build commands are available.
- `.env.example` lists every required variable from `docs/setup.md`.
- The project structure separates UI, API, auth, database, and domain logic.
- The Home route renders a clear Phase 1 boot confirmation.
- Focused tests cover the placeholder Home route and environment validation.

## Phase 2: Auth & User Identity

Status: complete

Goal: implement registration and login with OAuth and app-specific identity.

Work:

- Configure NextAuth with Google and GitHub providers.
- Persist sessions and OAuth account identity.
- Add first-login onboarding for `userID`.
- Validate `userID` format and uniqueness.
- Keep `userID` immutable after registration.
- Add a returning-login shortcut that accepts `userID`, finds the registered
  OAuth provider for that handle, and redirects to that provider for identity
  verification. Store this as a short-lived login intent and reject the OAuth
  callback if the selected provider account does not match the registered
  `userID`.
- Support returning login when the session has not expired.

Acceptance criteria:

- A user can sign in with Google.
- A user can sign in with GitHub.
- A first-time OAuth user must register a unique `userID`.
- A returning user can enter their `userID` to continue through the bound
  Google or GitHub OAuth provider; `userID` alone never authenticates a user,
  and choosing a different account at the provider must be rejected.
- The same person using a different OAuth provider creates a separate `userID`.
- A logged-in user with a valid session can return without signing in again.
- `userID` values are immutable after registration and must be 3-20 lowercase letters, numbers, or underscores after trimming and lowercasing.
- Phase 2 does not include the Phase 3 navigation, editable profile, posting, feed, or realtime behavior.

## Phase 3: Main Layout & Profile

Status: active

Goal: implement the core navigation and profile experience.

Work:

- Build the left navigation with custom logo/icon, Home, Profile, Post, and account area.
- Add logout popup from the current-user account area.
- Implement the own-profile page with editable name, avatar image URL, banner image URL, and bio.
- Show post count and immutable `@userID`.
- Implement read-only public profile view for other users.
- Add Follow/Following state on other users' profiles.
- Hide the Likes tab on other users' profiles.
- Keep the Phase 3 Post button as a non-persistent composer modal shell; post creation, drafts, and feed data remain Phase 4+ work.
- Use URL fields for avatar and banner editing. File uploads and CDN-backed media remain deferred advanced work.

Acceptance criteria:

- Home navigation routes to the feed.
- Profile navigation routes to the current user's editable profile.
- The Post button opens the post composer modal.
- Own profile shows Edit Profile and Likes.
- Other users' profiles show Follow/Following and do not expose Likes.
- Profile edits persist display name, avatar URL, banner URL, and bio without allowing `userID` changes.
- Follow/unfollow persists between the current user and other public profiles, and self-follow is rejected.

## Phase 4: Posting & Drafts

Goal: implement post creation from the modal and inline composer.

Work:

- Build the Post modal from the left navigation.
- Add discard confirmation when closing a non-empty modal draft.
- Save abandoned modal content as a draft when the user selects Save.
- Discard abandoned modal content permanently when the user selects Discard.
- Add Drafts list access from the modal.
- Build inline post composer in the Home feed.
- Enforce initial post length rules:
  - Maximum counted length is 280.
  - URLs count as 23 characters each.
  - `#hashtags` and `@mentions` do not count toward the limit.
  - Long posts and media are not supported yet.
- Render detected URLs, mentions, and hashtags as links.

Acceptance criteria:

- A modal post can be created.
- Inline composer posts can be created without drafts or close controls.
- Closing a non-empty modal asks whether to save or discard.
- Saved drafts can be listed and reused.
- The composer blocks input or submission beyond the 280-character counted limit.
- URLs, mentions, and hashtags are parsed consistently.

## Phase 5: Feed, Interactions & Recursive Comments

Goal: implement the main forum reading and interaction behavior.

Work:

- Add Home feed with `All` and `Following` tabs.
- Sort all feed lists from newest to oldest.
- Show author avatar, display name, `@userID`, relative time, full content, comment count, repost count, and like count.
- Route mention clicks to the mentioned user's profile.
- Support comments, reposts, likes, and unlikes.
- Support deleting own original posts from a post menu.
- Prevent deleting repost entries as if they were original posts.
- Implement recursive post/comment detail routes with a back arrow and title `Post`.
- Add profile tabs for public posts/reposts and private own likes.

Acceptance criteria:

- `All` shows all public posts and reposts from newest to oldest.
- `Following` shows posts and reposts from followed users only.
- Comments can be nested recursively.
- Clicking a post/comment opens its detail route and shows its replies.
- Interactions update counts after mutation.
- Only the author can delete an original post.
- At least two users can interact through follow, like, repost, and comment flows.

## Phase 6: Realtime Pusher

Goal: add realtime interaction updates.

Work:

- Configure Pusher server and client.
- Trigger events after successful like and comment mutations.
- Subscribe visible feed/detail components to relevant post/comment channels.
- Update interaction counts without page refresh.
- Avoid interrupting the reader's current scroll position.

Acceptance criteria:

- Two accounts can log in separately.
- When one account likes a visible post, the other account sees the like count update without refresh.
- When one account comments on a visible post/detail route, the other account sees the comment count or comment list update without refresh.
- Realtime updates do not unexpectedly navigate the user or reset the feed.

## Phase 7: Deployment

Goal: deploy the finished basic app to Vercel.

Work:

- Configure Vercel project and production environment variables.
- Configure Google and GitHub OAuth production callback URLs.
- Verify MongoDB production connectivity.
- Verify Pusher production connectivity.
- Run final smoke tests on the deployed URL.

Acceptance criteria:

- The app is deployed on Vercel.
- A new user can register and log in through OAuth.
- A returning user can log in with a valid session.
- Core feed, profile, posting, and interaction flows work in production.

## Later Optional Advanced Phase

Advanced features are not part of the basic roadmap. Candidate features:

- Explore
- Notifications
- New post notice
- Full hashtag pages
- Long posts
- Media upload/CDN support
- Mobile-specific layout improvements
