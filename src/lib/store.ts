/**
 * MonkeyLink — Vercel KV (Redis) store.
 *
 * Setup:
 *   1. In your Vercel dashboard → Storage → Create KV database
 *   2. Connect it to your project (auto-adds env vars)
 *   3. Redeploy
 *
 * Locally: copy the KV env vars from Vercel into your .env.local
 * (Vercel dashboard → your KV store → .env.local tab → copy all)
 */

import { kv } from "@vercel/kv";

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

export interface StoredEvent {
  payload: EventPayload;
  createdAt: number;
}

export interface StoredText {
  payload: string;
  createdAt: number;
}

// ---------- keys ----------

const PROJECT_KEY = (id: string) => `ml:project:${id}`;
const ALL_PROJECTS_KEY = "ml:projects"; // a Redis Set of project IDs
const EVENT_KEY = (id: string) => `ml:event:${id}`;
const TEXT_KEY = (id: string) => `ml:text:${id}`;

// ---------- project helpers ----------

export async function createProject(
  id: string,
  name: string,
  apiKey: string
): Promise<Project> {
  const project: Project = { id, name, apiKey, createdAt: Date.now() };
  await kv.set(PROJECT_KEY(id), project);
  await kv.sadd(ALL_PROJECTS_KEY, id);
  return project;
}

export async function getProject(id: string): Promise<Project | null> {
  return await kv.get<Project>(PROJECT_KEY(id));
}

export async function getAllProjects(): Promise<Project[]> {
  const ids = await kv.smembers(ALL_PROJECTS_KEY);
  if (!ids || ids.length === 0) return [];
  const projects = await Promise.all(
    ids.map((id) => kv.get<Project>(PROJECT_KEY(id)))
  );
  return projects.filter((p): p is Project => p !== null);
}

export async function getProjectByApiKey(
  apiKey: string
): Promise<Project | null> {
  const projects = await getAllProjects();
  return projects.find((p) => p.apiKey === apiKey) ?? null;
}

export async function deleteProject(id: string): Promise<boolean> {
  const exists = await kv.get(PROJECT_KEY(id));
  if (!exists) return false;
  await kv.del(PROJECT_KEY(id));
  await kv.srem(ALL_PROJECTS_KEY, id);
  await kv.del(EVENT_KEY(id));
  await kv.del(TEXT_KEY(id));
  return true;
}

// ---------- event helpers ----------

export async function setEvent(
  projectId: string,
  payload: EventPayload
): Promise<void> {
  await kv.set(EVENT_KEY(projectId), { payload, createdAt: Date.now() });
}

export async function consumeEvent(
  projectId: string
): Promise<EventPayload | null> {
  const entry = await kv.get<StoredEvent>(EVENT_KEY(projectId));
  if (!entry) return null;
  await kv.del(EVENT_KEY(projectId));
  return entry.payload;
}

export async function peekEvent(
  projectId: string
): Promise<StoredEvent | null> {
  return await kv.get<StoredEvent>(EVENT_KEY(projectId));
}

// ---------- text helpers ----------

export async function setText(
  projectId: string,
  payload: string
): Promise<void> {
  await kv.set(TEXT_KEY(projectId), { payload, createdAt: Date.now() });
}

export async function consumeText(
  projectId: string
): Promise<string | null> {
  const entry = await kv.get<StoredText>(TEXT_KEY(projectId));
  if (!entry) return null;
  await kv.del(TEXT_KEY(projectId));
  return entry.payload;
}

export async function peekText(
  projectId: string
): Promise<StoredText | null> {
  return await kv.get<StoredText>(TEXT_KEY(projectId));
}

export async function clearAll(projectId: string): Promise<void> {
  await kv.del(EVENT_KEY(projectId));
  await kv.del(TEXT_KEY(projectId));
}
