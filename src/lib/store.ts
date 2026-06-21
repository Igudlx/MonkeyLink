/**
 * MonkeyLink — Upstash Redis store.
 * Uses @upstash/redis directly with the env vars Upstash adds automatically.
 */

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

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
const ALL_PROJECTS_KEY = "ml:projects";
const EVENT_KEY = (id: string) => `ml:event:${id}`;
const TEXT_KEY = (id: string) => `ml:text:${id}`;

// ---------- project helpers ----------

export async function createProject(
  id: string,
  name: string,
  apiKey: string
): Promise<Project> {
  const project: Project = { id, name, apiKey, createdAt: Date.now() };
  await redis.set(PROJECT_KEY(id), JSON.stringify(project));
  await redis.sadd(ALL_PROJECTS_KEY, id);
  return project;
}

export async function getProject(id: string): Promise<Project | null> {
  const raw = await redis.get<string>(PROJECT_KEY(id));
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return raw as unknown as Project;
  }
}

export async function getAllProjects(): Promise<Project[]> {
  const ids = await redis.smembers(ALL_PROJECTS_KEY);
  if (!ids || ids.length === 0) return [];
  const projects = await Promise.all(ids.map((id) => getProject(String(id))));
  return projects.filter((p): p is Project => p !== null);
}

export async function getProjectByApiKey(
  apiKey: string
): Promise<Project | null> {
  const projects = await getAllProjects();
  return projects.find((p) => p.apiKey === apiKey) ?? null;
}

export async function deleteProject(id: string): Promise<boolean> {
  const exists = await redis.get(PROJECT_KEY(id));
  if (!exists) return false;
  await redis.del(PROJECT_KEY(id));
  await redis.srem(ALL_PROJECTS_KEY, id);
  await redis.del(EVENT_KEY(id));
  await redis.del(TEXT_KEY(id));
  return true;
}

// ---------- event helpers ----------

export async function setEvent(
  projectId: string,
  payload: EventPayload
): Promise<void> {
  const data: StoredEvent = { payload, createdAt: Date.now() };
  await redis.set(EVENT_KEY(projectId), JSON.stringify(data));
}

export async function consumeEvent(
  projectId: string
): Promise<EventPayload | null> {
  const raw = await redis.get<string>(EVENT_KEY(projectId));
  if (!raw) return null;
  await redis.del(EVENT_KEY(projectId));
  try {
    const entry: StoredEvent = typeof raw === "string" ? JSON.parse(raw) : raw;
    return entry.payload;
  } catch {
    return null;
  }
}

// ---------- text helpers ----------

export async function setText(
  projectId: string,
  payload: string
): Promise<void> {
  const data: StoredText = { payload, createdAt: Date.now() };
  await redis.set(TEXT_KEY(projectId), JSON.stringify(data));
}

export async function consumeText(
  projectId: string
): Promise<string | null> {
  const raw = await redis.get<string>(TEXT_KEY(projectId));
  if (!raw) return null;
  await redis.del(TEXT_KEY(projectId));
  try {
    const entry: StoredText = typeof raw === "string" ? JSON.parse(raw) : raw;
    return entry.payload;
  } catch {
    return null;
  }
}

export async function clearAll(projectId: string): Promise<void> {
  await redis.del(EVENT_KEY(projectId));
  await redis.del(TEXT_KEY(projectId));
}
