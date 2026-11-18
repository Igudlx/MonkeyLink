# MonkeyLink

Control your Unity game from the web. Accounts and projects are stored in Firebase, so nothing gets deleted unless you delete it.

## Stack

- Next.js 14 (App Router) on Vercel
- Firebase Authentication (username + password)
- Firebase Realtime Database (projects, queued events and texts)

## Environment variables (set in Vercel)

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase project settings, your web app config (`apiKey`) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Web app config (`authDomain`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Web app config (`projectId`) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app config (`appId`) |
| `FIREBASE_DATABASE_URL` | Realtime Database page, the URL at the top |
| `FIREBASE_SERVICE_ACCOUNT` | The whole contents of the service account JSON file (this is the secret key) |

Redeploy after changing any of these.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Unity

Press **Download Script** in Quick Actions on the dashboard to get `MonkeyLinkManager.cs` with your project's key and ID already filled in. Add it to a GameObject, drag in your event objects and message text, and press play.

The script calls `/poll`, which holds the request open for up to 6 seconds and answers the instant an event or text is queued.

## Troubleshooting

Open `https://your-site.vercel.app/api/health`. It shows which environment variables are set and whether the database and Firebase Auth connections work.

## API

All Unity-facing requests use `Authorization: Bearer <project api key>`.

- `GET /api/v1/{projectId}/poll?wait=6` (event and text together, used by Unity)
- `GET /api/v1/{projectId}/get/event`
- `GET /api/v1/{projectId}/get/text`
- `POST /api/v1/{projectId}/send/event` with `{ "name": "metor", "time": "5" }`
- `POST /api/v1/{projectId}/send/text` with `{ "message": "Hello" }`
- `POST /api/v1/{projectId}/clear`

Dashboard routes (`/api/projects`, `/api/account/delete`) require a signed-in Firebase ID token.
