# Setup Guide

This guide lists the user-operated setup needed for OAuth, MongoDB, Pusher, and Vercel. During local development, place these values in `.env.local` or `.env`. During deployment, add the same values to the Vercel project environment variables.

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
Homepage URL: https://YOUR_L_PROJECT.vercel.app
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

## Vercel Deployment Setup

Required values:

- All environment variables listed above.
- Production Google OAuth callback URL.
- Production GitHub OAuth callback URL.

Steps:

1. Push the repository to GitHub.
2. Go to Vercel: `https://vercel.com/`.
3. Create a new project from the GitHub repository.
4. Keep the framework preset as Next.js once the app exists.
5. Add every environment variable from this guide to the Vercel project.
6. Set `NEXTAUTH_URL` to the production Vercel URL.
7. Deploy the project.
8. Copy the deployed URL.
9. Add the deployed URL and OAuth callback URLs to Google Cloud Console.
10. Add the deployed URL and GitHub callback URL to GitHub OAuth settings.
11. Redeploy after changing OAuth or environment settings.
12. Smoke test:

```text
1. Visit the deployed URL.
2. Sign in with Google.
3. Complete userID registration.
4. Sign out.
5. Sign in with GitHub using a separate test account if available.
6. Create a post.
7. Confirm the post appears in Home > All.
```

## Local Setup After Phase 1

These commands will apply once the Next.js app is initialized:

```bash
npm install
npm run dev
npm test
npm run lint
```

The exact commands must be confirmed in Phase 1 after package scripts are created.
