# 🐒 MonkeyLink — Web Dashboard

Control your Unity game from the web. Send events and text messages that your Unity project picks up in real time via polling.

---

## Stack

- **Next.js 14** (App Router) — frontend + API routes
- **TypeScript**
- **No external database** (in-memory store — see note below)
- Deploy to **Vercel** in one click

---

## Quick Start (local)

```bash
npm install
cp .env.example .env.local   # fill in your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Default admin password is `monkeylink-admin` if you don't set `ADMIN_PASSWORD`.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo in [vercel.com/new](https://vercel.com/new).
3. Add these environment variables in the Vercel dashboard:

| Variable | Description |
|---|---|
| `ADMIN_PASSWORD` | Password to log in to the dashboard |
| `ML_SECRET` | Optional secret for signing (reserved for future use) |

4. Click **Deploy**.

> ⚠️ **Important:** Vercel serverless functions are stateless — the in-memory store resets on each cold start. For production use you should swap `src/lib/store.ts` for [Vercel KV](https://vercel.com/storage/kv) (Redis). The interface is identical; just replace `Map` operations with `await kv.get(key)` / `await kv.set(key, value)`.

---

## Unity Setup

1. Import the `MonkeyLink.unitypackage` into your Unity project.
2. Drag the **MonkeyLink** prefab into your scene.
3. In the Inspector, fill in:
   - `apiKey` — from the dashboard
   - `projectId` — from the dashboard
   - `pollInterval` — how often (seconds) Unity checks for updates (default: 2)
   - `eventObjects` — drag in GameObjects to activate on events
   - `globalMessageText` — drag in a TextMeshPro component for text messages
4. Play the scene. Unity will now poll your deployed site.

---

## API Reference

All requests require:
```
Authorization: Bearer <your_api_key>
```

### Get pending event (Unity polls this)
```
GET /api/v1/{projectId}/get/event
```

### Get pending text message (Unity polls this)
```
GET /api/v1/{projectId}/get/text
```

### Send an event (from dashboard or external service)
```
POST /api/v1/{projectId}/send/event
Body: { "name": "metor", "time": "5" }
```
- `name` must match a **GameObject name** in the `eventObjects` list in Unity.
- `time` is the activation duration in seconds (as a string).

### Send a text message
```
POST /api/v1/{projectId}/send/text
Body: { "message": "Hello from the web!" }
```

### Clear the queue
```
POST /api/v1/{projectId}/clear
```

---

## How it works

```
Web Dashboard ──POST──▶ MonkeyLink API ◀──GET (poll)── Unity (HandleEvents.cs)
```

1. You send an event or text from the dashboard (or any HTTP client).
2. The API stores it in memory for that project.
3. Unity polls every `pollInterval` seconds.
4. On the next poll, Unity receives the payload and acts on it (activates a GameObject for the specified duration, or displays the text).
5. The payload is consumed — Unity sees each event/message exactly once.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── admin/login/route.ts       # Admin auth
│   │   ├── projects/route.ts          # Create & list projects
│   │   └── v1/[projectId]/
│   │       ├── get/event/route.ts     # Unity polls for events
│   │       ├── get/text/route.ts      # Unity polls for text
│   │       ├── send/event/route.ts    # Send event to Unity
│   │       ├── send/text/route.ts     # Send text to Unity
│   │       └── clear/route.ts         # Clear queue
│   ├── dashboard/                     # Control panel UI
│   ├── login/                         # Admin login
│   └── globals.css
└── lib/
    ├── store.ts                        # In-memory data store
    └── auth.ts                         # API key & admin auth helpers
```
