# Setup Guide

This guide lists the user-operated setup needed for OAuth, MongoDB, Pusher,
Vercel Blob, and Vercel. During local development, place these values in
`.env.local` or `.env`. During deployment, add the same values to the Vercel
project environment variables.

After setup, see `docs/querying.md` for checking MongoDB Atlas data and local API responses.

## Environment Fields

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

BLOB_READ_WRITE_TOKEN="YOUR_VERCEL_BLOB_READ_WRITE_TOKEN"
```

For production, set `NEXTAUTH_URL` to the deployed Vercel URL, for example:

```bash
NEXTAUTH_URL="https://YOUR_VERCEL_PROJECT.vercel.app"
```

## Generate `NEXTAUTH_SECRET`

1. Open a terminal.
2. Run one of these commands:

```bash
openssl rand -base64 32
```

or:

```bash
npx auth secret
```

3. Copy the generated value.
4. Put it in `.env.local`:

```bash
NEXTAUTH_SECRET="PASTE_GENERATED_SECRET_HERE"
```

5. Add the same value to Vercel production environment variables before deployment.

## Google OAuth Setup

Required values:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Steps:

1. Go to Google Cloud Console: `https://console.cloud.google.com/`.
2. Create a new project or select an existing project for this homework app.
3. Open **APIs & Services** > **OAuth consent screen**.
4. Choose the appropriate user type for the assignment.
5. Fill in the app name, user support email, and developer contact email.
6. Save the consent screen.
7. Open **APIs & Services** > **Credentials**.
8. Click **Create Credentials** > **OAuth client ID**.
9. Choose **Web application**.
10. Add local authorized JavaScript origin:

```text
http://localhost:3000
```

11. Add local authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

12. After Vercel deployment, add production authorized JavaScript origin:

```text
https://YOUR_VERCEL_PROJECT.vercel.app
```

13. After Vercel deployment, add production authorized redirect URI:

```text
https://YOUR_VERCEL_PROJECT.vercel.app/api/auth/callback/google
```

14. Copy the generated client ID into:

```bash
GOOGLE_CLIENT_ID="PASTE_GOOGLE_CLIENT_ID_HERE"
```

15. Copy the generated client secret into:

```bash
GOOGLE_CLIENT_SECRET="PASTE_GOOGLE_CLIENT_SECRET_HERE"
```

## GitHub OAuth Setup

Required values:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

Steps:

1. Go to GitHub Developer Settings: `https://github.com/settings/developers`.
2. Open **OAuth Apps**.
3. Click **New OAuth App**.
4. Fill in the application name, for example `HW5 X-clone Local`.
5. Set local homepage URL:

```text
http://localhost:3000
```

6. Set local authorization callback URL:

```text
http://localhost:3000/api/auth/callback/github
```

7. Register the application.
8. Copy the client ID into:

```bash
GITHUB_CLIENT_ID="PASTE_GITHUB_CLIENT_ID_HERE"
```

9. Generate a new client secret.
10. Copy the client secret into:

```bash
GITHUB_CLIENT_SECRET="PASTE_GITHUB_CLIENT_SECRET_HERE"
```

11. For production, create a second GitHub OAuth app or update the existing one with:

```text
Homepage URL: https://YOUR_VERCEL_PROJECT.vercel.app
Authorization callback URL: https://YOUR_VERCEL_PROJECT.vercel.app/api/auth/callback/github
```

12. Add the production GitHub client ID and secret to Vercel.

## MongoDB Setup

Required values:

- `MONGODB_URI`
- `MONGODB_DB`

Steps:

1. Go to MongoDB Atlas: `https://www.mongodb.com/atlas`.
2. Create an account or sign in.
3. Create a project for this homework app.
4. Create a free or suitable cluster.
5. Create a database user with username/password authentication.
6. Save the username and password securely.
7. Add your current IP address to the network access allowlist for local development.
8. For Vercel production, add the IP access rule required by the chosen Atlas/Vercel setup. For simple homework deployment, Atlas `0.0.0.0/0` is commonly used, but restrict access more tightly if possible.
9. Open **Connect** > **Drivers**.
10. Copy the MongoDB connection string.
11. Replace the username, password, and database placeholders.
12. Put the value in `.env.local`:

```bash
MONGODB_URI="mongodb+srv://USERNAME:PASSWORD@CLUSTER_HOST/x_clone_hw5?retryWrites=true&w=majority"
MONGODB_DB="x_clone_hw5"
```

13. Add the same values to Vercel environment variables.

## Pusher Setup

Required values:

- `PUSHER_APP_ID`
- `PUSHER_KEY`
- `PUSHER_SECRET`
- `PUSHER_CLUSTER`
- `NEXT_PUBLIC_PUSHER_KEY`
- `NEXT_PUBLIC_PUSHER_CLUSTER`

Steps:

1. Go to Pusher: `https://pusher.com/`.
2. Create an account or sign in.
3. Create a Channels app.
4. Choose the closest cluster available.
5. Open the app's **App Keys** page.
6. Copy the App ID into:

```bash
PUSHER_APP_ID="PASTE_PUSHER_APP_ID_HERE"
```

7. Copy the Key into both server and public client fields:

```bash
PUSHER_KEY="PASTE_PUSHER_KEY_HERE"
NEXT_PUBLIC_PUSHER_KEY="PASTE_PUSHER_KEY_HERE"
```

8. Copy the Secret into:

```bash
PUSHER_SECRET="PASTE_PUSHER_SECRET_HERE"
```

9. Copy the Cluster into both server and public client fields:

```bash
PUSHER_CLUSTER="PASTE_PUSHER_CLUSTER_HERE"
NEXT_PUBLIC_PUSHER_CLUSTER="PASTE_PUSHER_CLUSTER_HERE"
```

10. Add all Pusher values to Vercel environment variables before production testing.

## Phase 3 Profile Image Setup

Phase 3 profile editing uses plain image URL fields for avatar and banner
images. No storage bucket, CDN, upload token, or additional environment
variable is required in this phase.

Use publicly reachable `http://` or `https://` image URLs when testing profile
edits. Local file uploads and hosted media storage are deferred until a later
media phase.

## Vercel Blob Setup

Phase 8 image media support uses Vercel Blob for uploaded post/comment images.
Cloudinary is not used in Phase 8. Uploaded images are stored in Vercel Blob and
delivered through Vercel's global network. App-rendered images should use
Next.js/Vercel image optimization where appropriate.

Reference docs:

- Vercel Blob: `https://vercel.com/docs/vercel-blob`
- Vercel Image Optimization: `https://vercel.com/docs/image-optimization`
- Vercel CDN: `https://vercel.com/docs/cdn`

Required value:

- `BLOB_READ_WRITE_TOKEN`

Steps:

1. Open the Vercel dashboard: `https://vercel.com/dashboard`.
2. Open the project for this homework app. If the Vercel project does not exist
   yet, create the project first from the **Vercel Deployment Setup** section,
   then return to this section before Phase 8 production testing.
3. Open the project's **Storage** tab.
4. Choose **Blob**.
5. Create a new Blob store or connect an existing Blob store to this project.
6. Open the Blob store connection details or environment variables view.
7. Copy the generated read/write token.
8. Add the value to local development:

```bash
BLOB_READ_WRITE_TOKEN="PASTE_VERCEL_BLOB_READ_WRITE_TOKEN_HERE"
```

9. Add the same key and value to Vercel project environment variables for
   **Production**:

| Key | Value |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token generated for the connected Blob store. |

10. Redeploy after adding or changing `BLOB_READ_WRITE_TOKEN` in Vercel.

Phase 8 image upload scope:

- Only post/comment images are supported.
- Videos are not supported.
- A single post/comment can attach at most 2 images.
- Each uploaded image can be at most 5 MB.
- MongoDB stores image metadata and Vercel Blob URLs only. Do not store binary
  image content in MongoDB.

## Vercel Deployment Setup

Required values:

- All environment variables listed above.
- Production Google OAuth callback URL.
- Production GitHub OAuth callback URL.

Phase 7 is mostly a deployment and service-configuration phase. It should not
need application code changes unless the production smoke test exposes a real
bug.

### Before Creating the Vercel Project

1. Make sure the latest local work is pushed to GitHub.
2. Make sure MongoDB Atlas has a production-accessible cluster and database
   user.
3. Make sure Pusher Channels has an app created.
4. Prepare these values before filling the Vercel form:

```bash
NEXTAUTH_SECRET="GENERATED_SECRET"
GOOGLE_CLIENT_ID="GOOGLE_OAUTH_CLIENT_ID"
GOOGLE_CLIENT_SECRET="GOOGLE_OAUTH_CLIENT_SECRET"
GITHUB_CLIENT_ID="GITHUB_OAUTH_CLIENT_ID"
GITHUB_CLIENT_SECRET="GITHUB_OAUTH_CLIENT_SECRET"
MONGODB_URI="mongodb+srv://USERNAME:PASSWORD@CLUSTER_HOST/x_clone_hw5?retryWrites=true&w=majority"
MONGODB_DB="x_clone_hw5"
PUSHER_APP_ID="PUSHER_APP_ID"
PUSHER_KEY="PUSHER_KEY"
PUSHER_SECRET="PUSHER_SECRET"
PUSHER_CLUSTER="PUSHER_CLUSTER"
NEXT_PUBLIC_PUSHER_KEY="SAME_VALUE_AS_PUSHER_KEY"
NEXT_PUBLIC_PUSHER_CLUSTER="SAME_VALUE_AS_PUSHER_CLUSTER"
```

Do not paste quote characters into the Vercel value fields unless Vercel shows
that it is importing a whole `.env` file. For example, the Vercel key is
`MONGODB_DB` and the value is `x_clone_hw5`, not `"x_clone_hw5"`.

### Vercel New Project Form

Use these values for the fields shown during **New Project** import:

| Vercel field | What to select or enter |
| --- | --- |
| Vercel Team | Your personal Hobby team is fine for this homework app. |
| Project Name | Keep `ntu-web-programming-hw5` or choose another lowercase, URL-safe name. This name usually becomes `https://PROJECT_NAME.vercel.app`. |
| Application Preset | `Next.js` |
| Root Directory | `./` because the Next.js app lives at the repository root. |
| Build Command | Leave the detected default. If you manually enable the edit field, use `yarn build`. |
| Output Directory | Leave the detected `Next.js default`. Do not enter `.next`. |
| Install Command | Leave the detected default. If you manually enable the edit field, use `yarn install --frozen-lockfile`. |

The project has `yarn.lock`, so Vercel should install dependencies with Yarn
automatically.

### Vercel Environment Variables

In the **Environment Variables** section, add one row per variable. For Phase 7
deployment and Phase 8 image uploads, set the environment selector to
**Production**. If the form only shows **Production and Preview**, that is
acceptable for the first homework deploy, but remember that OAuth preview
deployments may not work unless their callback URLs are also registered.

Add these rows:

| Key | Value |
| --- | --- |
| `NEXTAUTH_URL` | `https://YOUR_VERCEL_PROJECT.vercel.app` |
| `NEXTAUTH_SECRET` | The generated secret from the `Generate NEXTAUTH_SECRET` section. |
| `GOOGLE_CLIENT_ID` | Google OAuth web client ID. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth web client secret. |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID. |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret. |
| `MONGODB_URI` | MongoDB Atlas connection string with the real username, password, cluster host, and database name. |
| `MONGODB_DB` | `x_clone_hw5` |
| `PUSHER_APP_ID` | Pusher Channels app ID. |
| `PUSHER_KEY` | Pusher Channels key. |
| `PUSHER_SECRET` | Pusher Channels secret. |
| `PUSHER_CLUSTER` | Pusher Channels cluster, for example `ap3`, `us2`, or the cluster shown in Pusher. |
| `NEXT_PUBLIC_PUSHER_KEY` | Same value as `PUSHER_KEY`. |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Same value as `PUSHER_CLUSTER`. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token for Phase 8 image uploads. |

If you know the project name will be `ntu-web-programming-hw5`, start with:

```text
NEXTAUTH_URL=https://ntu-web-programming-hw5.vercel.app
```

If Vercel gives the project a different production domain after deployment,
update `NEXTAUTH_URL` in **Project Settings** > **Environment Variables** and
redeploy.

### After Vercel Deploys Successfully

When the deployment status becomes **Ready** and the environment is
**Production**, the app is deployed. Vercel may show several working domains for
the same app:

```text
Production domain:
https://YOUR_VERCEL_PROJECT.vercel.app

Deployment URL:
https://YOUR_VERCEL_PROJECT-RANDOM_ID.vercel.app

Branch URL:
https://YOUR_VERCEL_PROJECT-git-main-YOUR_TEAM.vercel.app
```

Use the stable **Production domain** for app configuration, OAuth settings, and
homework submission. Do not use the deployment URL with the random suffix for
OAuth callbacks because it can change after redeploying.

For this project, the intended production domain is:

```text
https://ntu-web-programming-hw5.vercel.app
```

After the first successful deployment, update or confirm these settings:

1. Vercel **Project Settings** > **Environment Variables**:

```text
NEXTAUTH_URL=https://ntu-web-programming-hw5.vercel.app
```

2. Google Cloud Console OAuth client:

```text
Authorized JavaScript origins:
https://ntu-web-programming-hw5.vercel.app

Authorized redirect URIs:
https://ntu-web-programming-hw5.vercel.app/api/auth/callback/google
```

3. GitHub OAuth app:

```text
Homepage URL:
https://ntu-web-programming-hw5.vercel.app

Authorization callback URL:
https://ntu-web-programming-hw5.vercel.app/api/auth/callback/github
```

4. MongoDB Atlas **Network Access**:

```text
0.0.0.0/0
```

MongoDB does not have an OAuth-style callback URL. The Atlas change only allows
Vercel's serverless functions to connect to the database. For a stricter
production deployment, replace `0.0.0.0/0` with a tighter access strategy.

5. Redeploy the latest Vercel deployment after changing Vercel environment
   variables. OAuth console changes do not require redeploying by themselves,
   but redeploying is harmless if you changed both Vercel and OAuth settings.

### OAuth Production Callback URLs

After the Vercel project exists, configure OAuth with the exact production URL.
Assume the production URL is:

```text
https://YOUR_VERCEL_PROJECT.vercel.app
```

Google Cloud Console:

```text
Authorized JavaScript origins:
https://YOUR_VERCEL_PROJECT.vercel.app

Authorized redirect URIs:
https://YOUR_VERCEL_PROJECT.vercel.app/api/auth/callback/google
```

GitHub Developer Settings:

```text
Homepage URL:
https://YOUR_VERCEL_PROJECT.vercel.app

Authorization callback URL:
https://YOUR_VERCEL_PROJECT.vercel.app/api/auth/callback/github
```

For GitHub, using a separate OAuth app for production is usually clearer than
replacing the local app. For Google, one OAuth web client can contain both local
and production origins/callbacks.

### Deploy and Redeploy Order

1. Fill the Vercel project form.
2. Add all environment variables.
3. Click **Deploy**.
4. Copy the production URL from the completed deployment.
5. Add the production OAuth origin and callback URLs in Google and GitHub.
6. If the final production URL differs from the value in `NEXTAUTH_URL`, update
   `NEXTAUTH_URL` in Vercel.
7. Click **Redeploy** from the latest deployment after changing environment
   variables or OAuth settings.

### MongoDB Production Connectivity

Before smoke testing, confirm Atlas allows Vercel to connect:

1. Open MongoDB Atlas.
2. Go to **Network Access**.
3. For a simple homework deployment, add `0.0.0.0/0` so Vercel serverless
   functions can connect from changing IPs.
4. Keep the database user limited to the app database where possible.
5. Confirm `MONGODB_URI` includes the real password. If the password contains
   special characters such as `@`, `/`, `:`, or `#`, URL-encode them in the
   connection string.

### Pusher Production Connectivity

Pusher does not need a callback URL for this app. The important part is that
the server and browser use matching app credentials:

1. `PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_KEY` must be identical.
2. `PUSHER_CLUSTER` and `NEXT_PUBLIC_PUSHER_CLUSTER` must be identical.
3. `PUSHER_SECRET` must only be stored in Vercel environment variables and must
   not be exposed in client-side code.
4. If realtime updates fail in production, first compare the cluster value in
   Vercel with the cluster shown in Pusher's **App Keys** page.

### Production Smoke Test

```text
1. Visit the deployed URL.
2. Sign in with Google.
3. Complete userID registration.
4. Sign out.
5. Enter the registered userID and confirm the app redirects to the bound
   OAuth provider before signing in again.
6. Repeat the userID login and intentionally choose a different Google or
   GitHub account at the provider; the app should reject that callback and show
   a mismatch message.
7. Sign in with GitHub using a separate test account if available.
8. Create a post.
9. Confirm the post appears in Home > All.
10. Edit your profile display name, bio, avatar URL, or banner URL.
11. Open a second browser or incognito window with another registered account.
12. Like or comment on a visible post from one account.
13. Confirm the other account sees the like/comment count update without a page
    refresh.
14. Confirm Home > Following works after following another account.
15. Confirm your own profile shows Posts and Likes, while another user's profile
    does not show the Likes tab.
```

### Production Login Troubleshooting

If the deployed app redirects to this URL:

```text
/api/auth/error?error=Configuration
```

and shows:

```text
Server error
There is a problem with the server configuration.
Check the server logs for more information.
```

then the browser is only showing a generic Auth.js/NextAuth error. The real
cause is in Vercel's runtime logs.

To inspect the error:

1. Open the Vercel project.
2. Open **Deployments**.
3. Select the latest **Production** deployment marked **Current**.
4. Open **Runtime Logs**. If Runtime Logs are not visible on that page, open the
   project-level **Logs** or **Observability** page.
5. Reproduce the login failure in another browser tab.
6. Return to Runtime Logs and filter by the latest timestamp or by one of these
   paths:

```text
/api/auth/signin
/api/auth/callback/google
/api/auth/callback/github
/api/auth/session
```

Common production login causes:

| Log clue | What to check |
| --- | --- |
| `Missing required environment variable` | The named key is absent or empty in Vercel environment variables. |
| `MissingSecret` or secret-related Auth.js error | `NEXTAUTH_SECRET` is missing, empty, or was imported with the wrong key name. |
| Provider/client configuration error | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, or `GITHUB_CLIENT_SECRET` is missing or still contains a placeholder value. |
| OAuth redirect URI mismatch | Google or GitHub callback URL does not exactly match the production domain. |
| `MongoServerSelectionError`, authentication failure, or connection timeout | Check `MONGODB_URI`, `MONGODB_DB`, database username/password, and MongoDB Atlas Network Access. |

When checking Vercel environment variables, make sure the keys are exact. For
example, the key must be `NEXTAUTH_URL`, not `NEXTAUTH_URL ` with a trailing
space. Values copied from a `.env` file should not include surrounding quote
characters unless Vercel imported and displayed them correctly.

### Vercel Install Troubleshooting

If Vercel fails before the Next.js build starts with a Yarn integrity error like
this:

```text
error https://registry.npmjs.org/tweetnacl/-/tweetnacl-1.0.3.tgz:
Integrity check failed for "tweetnacl"
```

then the deployment did not reach application code or environment variable
validation. Confirm that `yarn.lock` has the complete `tweetnacl@1.0.3`
integrity string and push the updated lockfile before redeploying.

Expected lockfile entry:

```text
tweetnacl@^1.0.0, tweetnacl@^1.0.3:
  version "1.0.3"
  resolved "https://registry.npmjs.org/tweetnacl/-/tweetnacl-1.0.3.tgz"
  integrity "sha512-6rt+RN7aOi1nGMyC4Xa5DdYiukl2UWCbcJft7YhxReBGQD7OAM8Pbxw6YMo4r2diNEA8FEmu32YOn9rhaiE5yw== sha1-rAr3FoBFjYpjeNDQ0FCrFAfTVZY="
```

If the same install step fails again for a different package while Vercel is
fetching dependencies, click **Redeploy** and disable the build cache. That kind
of failure is usually a package registry or cache fetch problem, not an OAuth,
MongoDB, or Pusher configuration problem.

## Local Setup After Phase 1

This project uses Yarn v1 because it has a `yarn.lock` file:

```bash
yarn install
yarn dev
yarn test:run
yarn lint
yarn typecheck
yarn build
```
