# MonkeyLink Website

## Deploy to Vercel

1. Upload this project to a GitHub repository.
2. Import the repository into Vercel.
3. Add an environment variable:
   - `MASTER_API_KEY` = your secret API key.
4. Deploy.

## Unity Setup

In your `HandleEvents` component:

- API Key = same value as `MASTER_API_KEY`
- Project ID = any unique ID (for example `myproject`)

## API Endpoints

- `GET /api/v1/{projectId}/get/event`
- `GET /api/v1/{projectId}/get/text`
- `POST /api/v1/{projectId}/set/event`
- `POST /api/v1/{projectId}/set/text`

All requests require:

Authorization: `Bearer YOUR_API_KEY`

## Notes

This starter stores data in memory only. On Vercel, data may reset when the server restarts.
For permanent storage, replace the in-memory store with Vercel KV, Redis, or a database.
