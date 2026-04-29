# Querying Data and API Results

This guide explains how to inspect the Phase 2 authentication data in MongoDB Atlas and how to check local API responses while developing.

References:

- MongoDB Atlas mongosh connection guide: `https://www.mongodb.com/docs/atlas/mongo-shell-connection/index.html`
- MongoDB Compass connection guide: `https://www.mongodb.com/docs/compass/master/connect/`

## What Gets Stored

The app uses the MongoDB database named by `MONGODB_DB`, usually:

```bash
MONGODB_DB="x_clone_hw5"
```

Phase 2 writes these collections:

- `users`: Auth.js user records plus app identity fields such as `userID` and `userIDLower`.
- `accounts`: OAuth provider account records for Google and GitHub.
- `sessions`: database-backed Auth.js sessions.
- `verification_tokens`: Auth.js adapter collection, mostly unused by current OAuth flow.

Google and GitHub accounts are intentionally separate app users, even when the provider email is the same.

Never paste real connection strings, OAuth secrets, session tokens, or database passwords into committed files.

## Query in MongoDB Atlas Web UI

Use this when you want the simplest visual check.

1. Open MongoDB Atlas: `https://cloud.mongodb.com/`.
2. Select the organization and project for this homework app.
3. Open **Database** or **Clusters**.
4. Open the cluster connected to your `MONGODB_URI`.
5. Click **Browse Collections**.
6. Choose the database from `MONGODB_DB`, for example `x_clone_hw5`.
7. Open `users`, `accounts`, or `sessions`.
8. Use the filter box to query documents.

Useful filters:

```json
{ "userID": "ric2k1" }
```

```json
{ "userIDLower": "ric2k1" }
```

```json
{ "email": "YOUR_EMAIL@example.com" }
```

```json
{ "provider": "google" }
```

```json
{ "provider": "github" }
```

After a successful OAuth login and onboarding, check:

- `users` has a document with `userID` and `userIDLower`.
- `accounts` has a provider record whose `userId` points to that user.
- `sessions` has a session record after browser sign-in.

## Query with mongosh

Use this when you want repeatable terminal checks.

1. Install `mongosh` if needed.
2. In Atlas, open the cluster.
3. Click **Connect**.
4. Choose **Shell** or **mongosh**.
5. Make sure your current IP is allowed in Atlas Network Access.
6. Copy the connection command from Atlas.
7. Run it in your terminal and enter the database user password when prompted.

You can also use the same connection string shape as `MONGODB_URI`:

```bash
mongosh "mongodb+srv://USERNAME:PASSWORD@CLUSTER_HOST/x_clone_hw5?retryWrites=true&w=majority"
```

Once connected:

```javascript
use x_clone_hw5
show collections
```

Find registered users:

```javascript
db.users
  .find(
    {},
    {
      name: 1,
      email: 1,
      image: 1,
      userID: 1,
      userIDLower: 1,
      createdAt: 1,
      updatedAt: 1,
    },
  )
  .sort({ createdAt: -1 });
```

Find one handle:

```javascript
db.users.findOne({ userIDLower: "ric2k1" });
```

Check OAuth provider records:

```javascript
db.accounts
  .find({}, { provider: 1, providerAccountId: 1, userId: 1 })
  .sort({ provider: 1 });
```

Check active sessions:

```javascript
db.sessions.find({}, { userId: 1, expires: 1 }).sort({ expires: -1 });
```

Check the unique `userIDLower` index:

```javascript
db.users.getIndexes();
```

Delete local test data only when you are sure you do not need it:

```javascript
db.sessions.deleteMany({});
db.accounts.deleteMany({ providerAccountId: "TEST_PROVIDER_ACCOUNT_ID" });
db.users.deleteOne({ userIDLower: "test_user" });
```

Do not run broad delete commands such as `db.users.deleteMany({})` unless you intentionally want to clear all test users.

## Query with MongoDB Compass

Use this when you prefer a desktop GUI.

1. Install MongoDB Compass.
2. In Atlas, open the cluster.
3. Click **Connect**.
4. Choose **Compass**.
5. Copy the connection string.
6. Open Compass and paste the connection string.
7. Replace placeholders with the database username and password if needed.
8. Connect, then open the database from `MONGODB_DB`.
9. Browse the `users`, `accounts`, and `sessions` collections.

Compass filters use the same JSON query syntax as Atlas:

```json
{ "userIDLower": "ric2k1" }
```

## Query Local API Results

Start the local server:

```bash
yarn dev
```

Open the app:

```text
http://localhost:3000
```

### Check the Current Session

After signing in through the browser, open this URL in the same browser:

```text
http://localhost:3000/api/auth/session
```

Expected signed-out response:

```json
null
```

Expected signed-in and onboarded shape:

```json
{
  "user": {
    "name": "Example User",
    "email": "user@example.com",
    "image": "https://...",
    "id": "MongoUserObjectId",
    "userID": "ric2k1",
    "onboarded": true
  },
  "expires": "..."
}
```

Before onboarding, `userID` is `null` and `onboarded` is `false`.

### Check Onboarding API with Browser DevTools

The onboarding API requires a signed-in browser session cookie, so the easiest way to test it is from the browser DevTools console after OAuth sign-in.

Open `http://localhost:3000`, sign in, then run:

```javascript
await fetch("/api/onboarding", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userID: "ric2k1" }),
}).then((response) => response.json());
```

Successful response:

```json
{ "status": "ok", "userID": "ric2k1" }
```

Invalid format response:

```json
{
  "status": "invalid_user_id",
  "message": "Choose a userID with 3-20 lowercase letters, numbers, or underscores."
}
```

Duplicate handle response:

```json
{
  "status": "duplicate_user_id",
  "message": "That userID is already taken."
}
```

Already onboarded response:

```json
{
  "status": "already_registered",
  "message": "Your userID is already registered and cannot be changed."
}
```

### Check API Status with curl

`curl` is useful for public or unauthenticated checks:

```bash
curl -i http://localhost:3000/api/auth/session
```

For `/api/onboarding`, plain curl normally returns `401` because it does not include the browser's Auth.js session cookie:

```bash
curl -i \
  -X POST http://localhost:3000/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{"userID":"ric2k1"}'
```

Expected unauthenticated response:

```json
{
  "status": "unauthenticated",
  "message": "You must be signed in to choose a userID."
}
```

## Common Checks

If OAuth succeeds but no `userID` appears in MongoDB:

1. Confirm you completed the onboarding form after OAuth sign-in.
2. Check `users` for the OAuth user document.
3. Check browser DevTools Network for `/api/onboarding`.
4. Confirm `MONGODB_URI` points to the Atlas cluster you are browsing.
5. Confirm `MONGODB_DB` matches the database you selected in Atlas.

If the app cannot connect to MongoDB:

1. Confirm the Atlas database user and password in `MONGODB_URI`.
2. Confirm your current IP address is allowed in Atlas Network Access.
3. Confirm the database user has read/write access to `MONGODB_DB`.
4. Try connecting with `mongosh` or Compass using the same URI.

If the same email signs in through Google and GitHub:

- Expect two `users` documents.
- Expect one `accounts` document for `google` and one for `github`.
- Each provider account must choose its own unique `userID`.
