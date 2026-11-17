import { adminDb } from "./firebaseAdmin";

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

function toProject(id: string, value: Record<string, unknown> | null): Project | null {
  if (!value || typeof value.apiKey !== "string") return null;
  return {
    id,
    name: String(value.name ?? "Untitled"),
    apiKey: value.apiKey,
    createdAt: Number(value.createdAt ?? 0),
  };
}

export async function createProject(
  uid: string,
  id: string,
  name: string,
  apiKey: string
): Promise<Project> {
  const createdAt = Date.now();
  await adminDb()
    .ref()
    .update({
      [`projects/${id}/ownerUid`]: uid,
      [`projects/${id}/name`]: name,
      [`projects/${id}/apiKey`]: apiKey,
      [`projects/${id}/createdAt`]: createdAt,
      [`userProjects/${uid}/${id}`]: true,
    });
  return { id, name, apiKey, createdAt };
}

export async function getProjectApiKey(id: string): Promise<string | null> {
  const snap = await adminDb().ref(`projects/${id}/apiKey`).once("value");
  const value = snap.val();
  return typeof value === "string" ? value : null;
}

export async function listProjects(uid: string): Promise<Project[]> {
  const db = adminDb();
  const idsSnap = await db.ref(`userProjects/${uid}`).once("value");
  const ids = Object.keys(idsSnap.val() ?? {});
  const snaps = await Promise.all(ids.map((id) => db.ref(`projects/${id}`).once("value")));
  const projects: Project[] = [];
  snaps.forEach((snap, i) => {
    const project = toProject(ids[i], snap.val());
    if (project) projects.push(project);
  });
  return projects.sort((a, b) => a.createdAt - b.createdAt);
}

export async function deleteProject(uid: string, id: string): Promise<boolean> {
  const db = adminDb();
  const ownerSnap = await db.ref(`projects/${id}/ownerUid`).once("value");
  if (ownerSnap.val() !== uid) return false;
  await db.ref().update({
    [`projects/${id}`]: null,
    [`userProjects/${uid}/${id}`]: null,
  });
  return true;
}

export async function deleteAllUserData(uid: string): Promise<void> {
  const db = adminDb();
  const idsSnap = await db.ref(`userProjects/${uid}`).once("value");
  const ids = Object.keys(idsSnap.val() ?? {});
  const updates: Record<string, null> = { [`userProjects/${uid}`]: null };
  ids.forEach((id) => {
    updates[`projects/${id}`] = null;
  });
  await db.ref().update(updates);
}

export async function setEvent(projectId: string, payload: EventPayload): Promise<void> {
  await adminDb()
    .ref(`projects/${projectId}/event`)
    .set({ name: payload.name, time: payload.time, createdAt: Date.now() });
}

export async function setText(projectId: string, message: string): Promise<void> {
  await adminDb()
    .ref(`projects/${projectId}/text`)
    .set({ message, createdAt: Date.now() });
}

async function consume(path: string): Promise<Record<string, unknown> | null> {
  const ref = adminDb().ref(path);
  const peek = await ref.once("value");
  if (peek.val() === null) return null;

  let taken: Record<string, unknown> | null = null;
  const result = await ref.transaction((current) => {
    taken = current ?? null;
    return null;
  });
  return result.committed ? taken : null;
}

export async function consumeEvent(projectId: string): Promise<EventPayload | null> {
  const value = await consume(`projects/${projectId}/event`);
  if (!value) return null;
  return { name: String(value.name), time: String(value.time) };
}

export async function consumeText(projectId: string): Promise<string | null> {
  const value = await consume(`projects/${projectId}/text`);
  if (!value || typeof value.message !== "string") return null;
  return value.message;
}

export async function clearAll(projectId: string): Promise<void> {
  await adminDb().ref().update({
    [`projects/${projectId}/event`]: null,
    [`projects/${projectId}/text`]: null,
  });
}
