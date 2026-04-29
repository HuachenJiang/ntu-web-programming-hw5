# AGENTS.md

## Project Rules

This repository is an English X/Twitter-style forum application for NTU Web Programming HW5. Future work must follow these rules before changing application code.

1. Update the relevant documentation before changing code.
   - If a feature, API, schema, environment variable, or deployment step changes, update `docs/` first or in the same commit.
   - `docs/dev-phase.md` is the source of truth for the active development phase and acceptance criteria.
   - `docs/architecture.md` is the source of truth for system boundaries and data ownership.
   - `docs/setup.md` is the source of truth for user-operated service setup.

2. Keep the project modular and maintainable.
   - Separate UI components, domain logic, API handlers, database access, authentication, and realtime code.
   - Prefer small modules with clear ownership over large mixed-purpose files.
   - Keep reusable validation and parsing logic in shared utilities with tests.

3. Prefer a single source of truth.
   - Use MongoDB as the planned persistence layer for users, profiles, posts, comments, drafts, follows, likes, and reposts.
   - Avoid duplicate state, hidden fallback behavior, and compatibility branches unless a documented product requirement needs them.
   - Environment variable names must match `docs/setup.md`.

4. Use the required stack.
   - Next.js full-stack framework.
   - NextAuth for Google and GitHub OAuth.
   - MongoDB for persistence.
   - RESTful APIs for application data operations.
   - Pusher for realtime interaction updates.
   - Vercel for deployment.

5. Testing is required.
   - Add focused tests for validation, parsing, API behavior, and high-risk UI flows.
   - Character counting, URL parsing, hashtag/mention parsing, authorization checks, and recursive comments must have tests when implemented.
   - Do not mark a phase complete until its acceptance criteria and relevant tests pass.

6. Keep the initial scope focused.
   - Basic requirements come first.
   - Advanced features are deferred until the basic app works and is deployed.
   - Long posts, media uploads, Explore, Notifications, hashtag pages, and mobile-specific enhancements are not part of the initial implementation unless a later phase explicitly adds them.

7. Keep Git history clean.
   - Do not commit dependency folders, build output, logs, local editor files, or secrets.
   - Keep `.env.example` tracked when it is created, but never commit real `.env` files.
   - Use `.gitignore` and `.gitattributes` as the repository source of truth for Git hygiene.

## Collaboration Notes

- Do not initialize or rewrite unrelated tooling without updating the phase plan.
- Do not delete user work or generated files unless the task explicitly asks for it.
- When a future agent starts work, read `spec.md`, this file, and the docs in `docs/` before implementation.
