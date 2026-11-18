import { databaseBaseUrl, getCredential } from "./firebaseAdmin";

let cachedToken: { value: string; expiresAt: number } | null = null;
let pendingToken: Promise<string> | null = null;

async function accessToken(forceRefresh: boolean): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedToken && cachedToken.expiresAt - 120_000 > now) {
    return cachedToken.value;
  }
  if (!pendingToken) {
    pendingToken = getCredential()
      .getAccessToken()
      .then((token) => {
        cachedToken = {
          value: token.access_token,
          expiresAt: Date.now() + token.expires_in * 1000,
        };
        return token.access_token;
      })
      .finally(() => {
        pendingToken = null;
      });
  }
  return pendingToken;
}

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  query?: string;
}

async function send(
  method: string,
  path: string,
  options: RequestOptions,
  forceRefresh: boolean
): Promise<Response> {
  const token = await accessToken(forceRefresh);
  const query = options.query ? `&${options.query}` : "";
  const url = `${databaseBaseUrl()}/${path}.json?access_token=${encodeURIComponent(token)}${query}`;
  return fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
}

async function rtdbFetch(
  method: string,
  path: string,
  options: RequestOptions = {}
): Promise<Response> {
  let res: Response;
  try {
    res = await send(method, path, options, false);
  } catch {
    res = await send(method, path, options, false);
  }
  if (res.status === 401) {
    res = await send(method, path, options, true);
  }
  return res;
}

async function failure(method: string, path: string, res: Response): Promise<Error> {
  let detail = "";
  try {
    detail = (await res.text()).slice(0, 200);
  } catch {
    detail = "";
  }
  return new Error(`Database ${method} ${path} failed (${res.status}) ${detail}`.trim());
}

export async function rtdbGet(path: string, query?: string): Promise<unknown> {
  const res = await rtdbFetch("GET", path, { query });
  if (!res.ok) throw await failure("GET", path, res);
  return res.json();
}

export async function rtdbPut(path: string, value: unknown): Promise<void> {
  const res = await rtdbFetch("PUT", path, { body: value });
  if (!res.ok) throw await failure("PUT", path, res);
}

export async function rtdbDelete(path: string): Promise<void> {
  const res = await rtdbFetch("DELETE", path);
  if (!res.ok) throw await failure("DELETE", path, res);
}

export async function rtdbConsume(path: string): Promise<unknown | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const getRes = await rtdbFetch("GET", path, { headers: { "X-Firebase-ETag": "true" } });
    if (!getRes.ok) throw await failure("GET", path, getRes);

    const etag = getRes.headers.get("etag");
    const value = await getRes.json();
    if (value === null || value === undefined) return null;

    const delRes = await rtdbFetch("DELETE", path, {
      headers: etag ? { "if-match": etag } : {},
    });
    if (delRes.status === 412) continue;
    if (!delRes.ok) throw await failure("DELETE", path, delRes);
    return value;
  }
  return null;
}
