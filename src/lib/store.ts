import { rtdbConsume, rtdbDelete, rtdbGet, rtdbPut } from "./rtdb";

export interface Project {
  id: string;
  name: string;
  apiKey: string;
  createdAt: number;
}

export interface EventPayload {
  name: string;
  time: string;
}

export interface PendingItems {
  event: EventPayload | null;
  text: string | null;
}

const API_KEY_CACHE_MS = 15_000;
const apiKeyCache = new Map<string, { key: string; expiresAt: number }>();

function toProject(id: string, value: unknown): Project | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.apiKey !== "string") return null;
  return {
    id,
    name: String(record.name ?? "Untitled"),
    apiKey: record.apiKey,
    createdAt: Number(record.createdAt ?? 0),
  };
}

export async function createProject(
  uid: string,
  id: string,
  name: string,
  apiKey: string
): Promise<Project> {
  const createdAt = Date.now();
  await rtdbPut(`projects/${id}`, { ownerUid: uid, name, apiKey, createdAt });
  await rtdbPut(`userProjects/${uid}/${id}`, true);
  return { id, name, apiKey, createdAt };
}

export async function getProjectApiKey(id: string): Promise<string | null> {
  const cached = apiKeyCache.get(id);
  if (cached && cached.expiresAt > Date.now()) return cached.key;

  const value = await rtdbGet(`projects/${id}/apiKey`);
  if (typeof value !== "string") {
    apiKeyCache.delete(id);
    return null;
  }
  apiKeyCache.set(id, { key: value, expiresAt: Date.now() + API_KEY_CACHE_MS });
  return value;
}

export async function listProjects(uid: string): Promise<Project[]> {
  const index = (await rtdbGet(`userProjects/${uid}`, "shallow=true")) as Record<string, unknown> | null;
  const ids = Object.keys(index ?? {});
  const values = await Promise.all(ids.map((id) => rtdbGet(`projects/${id}`)));
  const projects: Project[] = [];
  values.forEach((value, i) => {
    const project = toProject(ids[i], value);
    if (project) projects.push(project);
  });
  return projects.sort((a, b) => a.createdAt - b.createdAt);
}

export async function deleteProject(uid: string, id: string): Promise<boolean> {
  const owner = await rtdbGet(`projects/${id}/ownerUid`);
  if (owner !== uid) return false;
  await rtdbDelete(`userProjects/${uid}/${id}`);
  await rtdbDelete(`projects/${id}`);
  apiKeyCache.delete(id);
  return true;
}

export async function deleteAllUserData(uid: string): Promise<void> {
  const index = (await rtdbGet(`userProjects/${uid}`, "shallow=true")) as Record<string, unknown> | null;
  const ids = Object.keys(index ?? {});
  await Promise.all(ids.map((id) => rtdbDelete(`projects/${id}`)));
  ids.forEach((id) => apiKeyCache.delete(id));
  await rtdbDelete(`userProjects/${uid}`);
}

export async function setEvent(projectId: string, payload: EventPayload): Promise<void> {
  await rtdbPut(`projects/${projectId}/pending/event`, {
    name: payload.name,
    time: payload.time,
    createdAt: Date.now(),
  });
}

export async function setText(projectId: string, message: string): Promise<void> {
  await rtdbPut(`projects/${projectId}/pending/text`, { message, createdAt: Date.now() });
}

function readEvent(value: unknown): EventPayload | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.name === undefined || record.time === undefined) return null;
  return { name: String(record.name), time: String(record.time) };
}

function readText(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const message = (value as Record<string, unknown>).message;
  return typeof message === "string" && message.length > 0 ? message : null;
}

export async function consumePending(projectId: string): Promise<PendingItems> {
  const value = await rtdbConsume(`projects/${projectId}/pending`);
  if (!value || typeof value !== "object") return { event: null, text: null };
  const record = value as Record<string, unknown>;
  return { event: readEvent(record.event), text: readText(record.text) };
}

export async function consumeEvent(projectId: string): Promise<EventPayload | null> {
  return readEvent(await rtdbConsume(`projects/${projectId}/pending/event`));
}

export async function consumeText(projectId: string): Promise<string | null> {
  return readText(await rtdbConsume(`projects/${projectId}/pending/text`));
}

export async function clearAll(projectId: string): Promise<void> {
  await rtdbDelete(`projects/${projectId}/pending`);
}
