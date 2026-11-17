"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import { useAuth } from "@/lib/useAuth";
import { authedFetch, signOutAccount, usernameFromUser } from "@/lib/accounts";

interface Project {
  id: string;
  name: string;
  apiKey: string;
  createdAt: number;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

let toastId = 0;

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  // Event sender
  const [eventName, setEventName] = useState("");
  const [eventTime, setEventTime] = useState("5");
  const [sendingEvent, setSendingEvent] = useState(false);

  // Text sender
  const [textMessage, setTextMessage] = useState("");
  const [sendingText, setSendingText] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeTab, setActiveTab] = useState<"control" | "docs">("control");
  const [copyLabel, setCopyLabel] = useState<Record<string, string>>({});

  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const res = await authedFetch("/api/projects");
      const data = await res.json();
      if (!data.success) {
        if (res.status === 401) {
          await signOutAccount();
          router.replace("/login");
        } else {
          showToast(data.error || "Failed to load projects", "error");
        }
        return;
      }
      setProjects(data.projects);
      setSelectedProject((current) => current ?? data.projects[0] ?? null);
    } catch {
      showToast("Failed to load projects", "error");
    }
  }, [router, showToast]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    loadProjects();
  }, [authLoading, user, router, loadProjects]);

  async function logout() {
    await signOutAccount();
    router.replace("/login");
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!deletePassword) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await authedFetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setDeleteError(data.error || "Could not delete account");
        setDeleting(false);
        return;
      }
      await signOutAccount();
      router.replace("/login");
    } catch {
      setDeleteError("Network error");
      setDeleting(false);
    }
  }

  function closeDeleteModal() {
    setShowDelete(false);
    setDeletePassword("");
    setDeleteError("");
  }

  async function deleteSelectedProject() {
    if (!selectedProject) return;
    if (!window.confirm(`Delete project "${selectedProject.name}"? This cannot be undone.`)) return;

    try {
      const res = await authedFetch(`/api/projects?id=${encodeURIComponent(selectedProject.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || "Failed to delete project", "error");
        return;
      }
      const remaining = projects.filter((p) => p.id !== selectedProject.id);
      setProjects(remaining);
      setSelectedProject(remaining[0] ?? null);
      showToast("Project deleted");
    } catch {
      showToast("Network error", "error");
    }
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreatingProject(true);

    try {
      const res = await authedFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || "Failed to create project", "error");
        return;
      }
      setProjects((p) => [...p, data.project]);
      setSelectedProject(data.project);
      setNewProjectName("");
      showToast(`Project "${data.project.name}" created!`);
    } catch {
      showToast("Network error", "error");
    } finally {
      setCreatingProject(false);
    }
  }

  async function sendEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProject || !eventName.trim()) return;
    setSendingEvent(true);

    try {
      const res = await fetch(
        `/api/v1/${selectedProject.id}/send/event`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${selectedProject.apiKey}`,
          },
          body: JSON.stringify({ name: eventName.trim(), time: eventTime }),
        }
      );
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || "Failed to send event", "error");
        return;
      }
      showToast(`Event "${eventName}" queued for ${eventTime}s ✓`);
      setEventName("");
    } catch {
      showToast("Network error", "error");
    } finally {
      setSendingEvent(false);
    }
  }

  async function sendText(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProject || !textMessage.trim()) return;
    setSendingText(true);

    try {
      const res = await fetch(
        `/api/v1/${selectedProject.id}/send/text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${selectedProject.apiKey}`,
          },
          body: JSON.stringify({ message: textMessage.trim() }),
        }
      );
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || "Failed to send text", "error");
        return;
      }
      showToast("Message queued ✓");
      setTextMessage("");
    } catch {
      showToast("Network error", "error");
    } finally {
      setSendingText(false);
    }
  }

  async function clearQueue() {
    if (!selectedProject) return;
    try {
      const res = await fetch(`/api/v1/${selectedProject.id}/clear`, {
        method: "POST",
        headers: { Authorization: `Bearer ${selectedProject.apiKey}` },
      });
      const data = await res.json();
      if (data.success) showToast("Queue cleared");
      else showToast(data.error, "error");
    } catch {
      showToast("Network error", "error");
    }
  }

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopyLabel((l) => ({ ...l, [key]: "Copied!" }));
    setTimeout(() => setCopyLabel((l) => ({ ...l, [key]: "" })), 1500);
  }

  if (authLoading || !user) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-site.vercel.app";

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logoIcon}>🐒</span>
          <span className={styles.logoText}>MonkeyLink</span>
        </div>

        <div className={styles.sidebarSection}>
          <div className="label">Projects</div>
          <div className={styles.projectList}>
            {projects.map((p) => (
              <button
                key={p.id}
                className={`${styles.projectBtn} ${selectedProject?.id === p.id ? styles.projectBtnActive : ""}`}
                onClick={() => setSelectedProject(p)}
              >
                <span className={styles.projectDot} />
                {p.name}
              </button>
            ))}
            {projects.length === 0 && (
              <p className={styles.empty}>No projects yet</p>
            )}
          </div>
        </div>

        <div className={styles.sidebarSection}>
          <div className="label">New Project</div>
          <form onSubmit={createProject} className={styles.newProjectForm}>
            <input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
            />
            <button
              className="btn-primary"
              type="submit"
              disabled={creatingProject}
              style={{ width: "100%" }}
            >
              {creatingProject ? "Creating…" : "+ Create"}
            </button>
          </form>
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.userChip}>
            <span>👤</span>
            <strong>{usernameFromUser(user)}</strong>
          </div>
          <button className={`btn-secondary ${styles.footerBtn}`} onClick={logout}>
            Sign Out
          </button>
          <button
            className={`btn-danger ${styles.footerBtn}`}
            onClick={() => setShowDelete(true)}
          >
            Delete Account
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {!selectedProject ? (
          <div className={styles.empty2}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🐒</div>
            <h2>No project selected</h2>
            <p>Create a project in the sidebar to get started.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.mainHeader}>
              <div>
                <h1 className={styles.projectTitle}>{selectedProject.name}</h1>
                <div className={styles.projectMeta}>
                  <span className="badge badge-green">Live</span>
                  <span style={{ color: "var(--text3)", fontSize: 12 }}>
                    ID: {selectedProject.id.slice(0, 8)}…
                  </span>
                </div>
              </div>
              <div className={styles.tabBar}>
                <button
                  className={`${styles.tab} ${activeTab === "control" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("control")}
                >
                  Control Panel
                </button>
                <button
                  className={`${styles.tab} ${activeTab === "docs" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("docs")}
                >
                  API Docs
                </button>
              </div>
            </div>

            {activeTab === "control" && (
              <div className={styles.grid}>
                {/* API Key card */}
                <div className={`card ${styles.fullWidth}`}>
                  <div className="label">API Key</div>
                  <div className={styles.apiKeyRow}>
                    <code style={{ flex: 1, padding: "10px 14px", display: "block", background: "var(--bg3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", wordBreak: "break-all" }}>
                      {selectedProject.apiKey}
                    </code>
                    <button
                      className="btn-secondary"
                      onClick={() => copyToClipboard(selectedProject.apiKey, "apiKey")}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {copyLabel["apiKey"] || "Copy"}
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 8 }}>
                    Paste this into the <code>apiKey</code> field of MonkeyLinkManager in Unity.
                    Project ID: <code>{selectedProject.id}</code> goes in <code>projectId</code>.
                  </p>
                </div>

                {/* Send Event */}
                <div className="card">
                  <div className="label" style={{ marginBottom: 4 }}>Send Event</div>
                  <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
                    Activates a GameObject in your Unity scene by name for a set duration.
                  </p>
                  <form onSubmit={sendEvent} className={styles.formGrid}>
                    <div>
                      <div className="label">GameObject Name</div>
                      <input
                        type="text"
                        placeholder='e.g. "metor"'
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <div className="label">Duration (seconds)</div>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        placeholder="5"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        required
                      />
                    </div>
                    <button
                      className="btn-primary"
                      type="submit"
                      disabled={sendingEvent}
                      style={{ alignSelf: "flex-end" }}
                    >
                      {sendingEvent ? "Sending…" : "⚡ Send Event"}
                    </button>
                  </form>
                </div>

                {/* Send Text */}
                <div className="card">
                  <div className="label" style={{ marginBottom: 4 }}>Send Text Message</div>
                  <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
                    Displays a message on the global TextMeshPro component in your scene.
                  </p>
                  <form onSubmit={sendText} className={styles.textForm}>
                    <div>
                      <div className="label">Message</div>
                      <textarea
                        rows={3}
                        placeholder="Type a message to show in your game…"
                        value={textMessage}
                        onChange={(e) => setTextMessage(e.target.value)}
                        required
                        style={{ resize: "vertical" }}
                      />
                    </div>
                    <button
                      className="btn-primary"
                      type="submit"
                      disabled={sendingText}
                    >
                      {sendingText ? "Sending…" : "💬 Send Text"}
                    </button>
                  </form>
                </div>

                {/* Quick Actions */}
                <div className={`card ${styles.fullWidth}`}>
                  <div className="label" style={{ marginBottom: 12 }}>Quick Actions</div>
                  <div className={styles.quickActions}>
                    <button className="btn-danger" onClick={clearQueue}>
                      🗑 Clear Queue
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => copyToClipboard(selectedProject.id, "pid")}
                    >
                      {copyLabel["pid"] || "Copy Project ID"}
                    </button>
                    <button className="btn-danger" onClick={deleteSelectedProject}>
                      Delete Project
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 12 }}>
                    Clearing the queue removes the pending event and text so Unity won't receive them on the next poll.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "docs" && (
              <div className={styles.docs}>
                <DocsTab project={selectedProject} baseUrl={baseUrl} onCopy={copyToClipboard} copyLabel={copyLabel} />
              </div>
            )}
          </>
        )}
      </main>

      {showDelete && (
        <div className={styles.modalBackdrop} onClick={closeDeleteModal}>
          <form
            className={styles.modal}
            onSubmit={deleteAccount}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>Delete account</h2>
            <p className={styles.modalText}>
              This permanently deletes your account and every project saved to it. Enter your
              password to confirm.
            </p>
            <input
              type="password"
              placeholder="Your password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
            {deleteError && <div className={styles.modalError}>{deleteError}</div>}
            <div className={styles.modalActions}>
              <button type="button" className="btn-secondary" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button type="submit" className="btn-danger" disabled={deleting || !deletePassword}>
                {deleting ? "Deleting…" : "Delete Forever"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toasts */}
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function DocsTab({
  project,
  baseUrl,
  onCopy,
  copyLabel,
}: {
  project: Project;
  baseUrl: string;
  onCopy: (text: string, key: string) => void;
  copyLabel: Record<string, string>;
}) {
  const pid = project.id;
  const key = project.apiKey;

  const sections = [
    {
      title: "Unity Setup",
      content: (
        <>
          <p>Add the <strong>MonkeyLinkManager</strong> script to a GameObject in your scene, then fill in the Inspector:</p>
          <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: 14, color: "var(--text2)", lineHeight: 2 }}>
            <li><code>apiKey</code> → paste your API key directly (see below)</li>
            <li><code>projectId</code> → paste <code>{pid}</code> directly</li>
            <li><code>pollInterval</code> → how often (seconds) Unity checks for updates</li>
            <li><code>eventObjects</code> → list of GameObjects to activate on events</li>
            <li><code>globalMessageText</code> → a TextMeshPro component for text messages</li>
            <li><code>audioSource</code> and <code>messageSound</code> → optional sound for messages</li>
          </ul>
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--text3)" }}>
            <code>MonkeyLinkManager.cs</code> handles polling and event dispatch automatically.
          </p>
        </>
      ),
    },
    {
      title: "Authentication",
      content: (
        <>
          <p>All API requests must include your API key as a Bearer token:</p>
          <CopyBlock
            label="Authorization header"
            value={`Authorization: Bearer ${key}`}
            copyKey="doc-auth"
            onCopy={onCopy}
            copyLabel={copyLabel}
          />
        </>
      ),
    },
    {
      title: "GET /api/v1/{projectId}/get/event",
      badge: "Unity polls this",
      content: (
        <>
          <p>Unity calls this every <code>pollInterval</code> seconds to check for a queued event. The event is consumed on read (shown once).</p>
          <CopyBlock
            label="Example request"
            value={`curl "${baseUrl}/api/v1/${pid}/get/event" \\\n  -H "Authorization: Bearer ${key}"`}
            copyKey="doc-get-event"
            onCopy={onCopy}
            copyLabel={copyLabel}
          />
          <p style={{ marginTop: 12, fontSize: 13 }}>Response when an event is waiting:</p>
          <pre>{`{
  "success": true,
  "type": "event",
  "payload": "{\\"name\\":\\"metor\\",\\"time\\":\\"5\\"}"
}`}</pre>
          <p style={{ marginTop: 8, fontSize: 13 }}>Response when queue is empty:</p>
          <pre>{`{ "success": true, "type": "event", "payload": null }`}</pre>
        </>
      ),
    },
    {
      title: "GET /api/v1/{projectId}/get/text",
      badge: "Unity polls this",
      content: (
        <>
          <p>Unity calls this to check for a queued text message. Consumed on read.</p>
          <CopyBlock
            label="Example request"
            value={`curl "${baseUrl}/api/v1/${pid}/get/text" \\\n  -H "Authorization: Bearer ${key}"`}
            copyKey="doc-get-text"
            onCopy={onCopy}
            copyLabel={copyLabel}
          />
          <pre style={{ marginTop: 12 }}>{`{
  "success": true,
  "type": "text",
  "payload": "Hello from the web!"
}`}</pre>
        </>
      ),
    },
    {
      title: "POST /api/v1/{projectId}/send/event",
      badge: "Dashboard / external",
      content: (
        <>
          <p>Queue an event that Unity will pick up on its next poll cycle.</p>
          <CopyBlock
            label="Example request"
            value={`curl -X POST "${baseUrl}/api/v1/${pid}/send/event" \\\n  -H "Authorization: Bearer ${key}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"metor","time":"5"}'`}
            copyKey="doc-send-event"
            onCopy={onCopy}
            copyLabel={copyLabel}
          />
          <p style={{ marginTop: 12, fontSize: 13 }}>Body fields:</p>
          <pre>{`{
  "name": "metor",   // GameObject name in Unity (must match exactly)
  "time": "5"        // Activation duration in seconds (as string)
}`}</pre>
        </>
      ),
    },
    {
      title: "POST /api/v1/{projectId}/send/text",
      badge: "Dashboard / external",
      content: (
        <>
          <p>Queue a text message to display in Unity&apos;s global TextMeshPro object.</p>
          <CopyBlock
            label="Example request"
            value={`curl -X POST "${baseUrl}/api/v1/${pid}/send/text" \\\n  -H "Authorization: Bearer ${key}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"message":"Hello from the web!"}'`}
            copyKey="doc-send-text"
            onCopy={onCopy}
            copyLabel={copyLabel}
          />
        </>
      ),
    },
    {
      title: "POST /api/v1/{projectId}/clear",
      badge: "Utility",
      content: (
        <>
          <p>Clears both the pending event and pending text for this project.</p>
          <CopyBlock
            label="Example request"
            value={`curl -X POST "${baseUrl}/api/v1/${pid}/clear" \\\n  -H "Authorization: Bearer ${key}"`}
            copyKey="doc-clear"
            onCopy={onCopy}
            copyLabel={copyLabel}
          />
        </>
      ),
    },
  ];

  return (
    <div className={styles.docSections}>
      {sections.map((s) => (
        <div key={s.title} className={`card ${styles.docCard}`}>
          <div className={styles.docCardHeader}>
            <h3 className={styles.docTitle}>{s.title}</h3>
            {s.badge && <span className="badge badge-blue">{s.badge}</span>}
          </div>
          <div className="divider" />
          <div className={styles.docBody}>{s.content}</div>
        </div>
      ))}
    </div>
  );
}

function CopyBlock({
  label,
  value,
  copyKey,
  onCopy,
  copyLabel,
}: {
  label: string;
  value: string;
  copyKey: string;
  onCopy: (text: string, key: string) => void;
  copyLabel: Record<string, string>;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span className="label">{label}</span>
        <button
          className="btn-secondary"
          onClick={() => onCopy(value, copyKey)}
          style={{ fontSize: 12, padding: "3px 10px" }}
        >
          {copyLabel[copyKey] || "Copy"}
        </button>
      </div>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{value}</pre>
    </div>
  );
}
