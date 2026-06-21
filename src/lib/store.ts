/**
 * MonkeyLink — simple in-memory store.
 *
 * On Vercel the serverless function is cold-started per request, so for
 * production you should swap this out for Vercel KV (Redis) or any
 * persistent store.  The interface is identical; just replace the Map
 * operations with `await kv.get(key)` / `await kv.set(key, value)`.
 *
 * For a quick demo / local dev this works perfectly.
 */

export interface Project {
  id: string;
  name: string;
  apiKey: string;
  createdAt: number;
}

export interface EventPayload {
  name: string;
  time: string; // seconds as string, e.g. "5"
}

export interface StoredEvent {
  payload: EventPayload;
  createdAt: number;
}

export interface StoredText {
  payload: string;
  createdAt: number;
}

// ---------- in-process store (survives hot-reload in dev) ----------

declare global {
  // eslint-disable-next-line no-var
  var __mlProjects: Map<string, Project> | undefined;
  // eslint-disable-next-line no-var
  var __mlEvents: Map<string, StoredEvent | null> | undefined;
  // eslint-disable-next-line no-var
  var __mlTexts: Map<string, StoredText | null> | undefined;
}

const projects: Map<string, Project> =
  globalThis.__mlProjects ?? (globalThis.__mlProjects = new Map());

const events: Map<string, StoredEvent | null> =
  globalThis.__mlEvents ?? (globalThis.__mlEvents = new Map());

const texts: Map<string, StoredText | null> =
  globalThis.__mlTexts ?? (globalThis.__mlTexts = new Map());

// ---------- project helpers ----------

export function createProject(id: string, name: string, apiKey: string): Project {
  const project: Project = { id, name, apiKey, createdAt: Date.now() };
  projects.set(id, project);
  return project;
}

export function getProject(id: string): Project | undefined {
  return projects.get(id);
}

export function getAllProjects(): Project[] {
  return Array.from(projects.values());
}

export function getProjectByApiKey(apiKey: string): Project | undefined {
  return Array.from(projects.values()).find((p) => p.apiKey === apiKey);
}

export function deleteProject(id: string): boolean {
  if (!projects.has(id)) return false;
  projects.delete(id);
  events.delete(id);
  texts.delete(id);
  return true;
}

// ---------- event helpers ----------

export function setEvent(projectId: string, payload: EventPayload): void {
  events.set(projectId, { payload, createdAt: Date.now() });
}

/**
 * Returns the latest event and clears it (consume-once semantics).
 * The Unity client will see each event exactly once.
 */
export function consumeEvent(projectId: string): EventPayload | null {
  const entry = events.get(projectId);
  if (!entry) return null;
  events.set(projectId, null);
  return entry.payload;
}

export function peekEvent(projectId: string): StoredEvent | null {
  return events.get(projectId) ?? null;
}

// ---------- text helpers ----------

export function setText(projectId: string, payload: string): void {
  texts.set(projectId, { payload, createdAt: Date.now() });
}

/**
 * Returns the latest text message and clears it (consume-once semantics).
 */
export function consumeText(projectId: string): string | null {
  const entry = texts.get(projectId);
  if (!entry) return null;
  texts.set(projectId, null);
  return entry.payload;
}

export function peekText(projectId: string): StoredText | null {
  return texts.get(projectId) ?? null;
}

export function clearAll(projectId: string): void {
  events.set(projectId, null);
  texts.set(projectId, null);
}
