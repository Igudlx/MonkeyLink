"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { useAuth } from "@/lib/useAuth";
import {
  createAccount,
  friendlyAuthError,
  signInAccount,
  validateCredentials,
} from "@/lib/accounts";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, configError } = useAuth();
  const [mode, setMode] = useState<"signin" | "create">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [user, authLoading, router]);

  function switchMode(next: "signin" | "create") {
    setMode(next);
    setError("");
    setPassword("");
    setConfirm("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "create") {
      const problem = validateCredentials(username, password);
      if (problem) {
        setError(problem);
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "create") {
        await createAccount(username, password);
      } else {
        await signInAccount(username, password);
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  const creating = mode === "create";

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.logo}>🐒</div>
        <h1 className={styles.title}>MonkeyLink</h1>
        <p className={styles.subtitle}>
          {creating ? "Create your account" : "Sign in to your control panel"}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <div className="label">Username</div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              autoCapitalize="none"
              autoFocus
              required
            />
          </div>

          <div>
            <div className="label">Password</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete={creating ? "new-password" : "current-password"}
              required
            />
          </div>

          {creating && (
            <div>
              <div className="label">Confirm Password</div>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Enter password again"
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {(error || configError) && <div className={styles.error}>{error || configError}</div>}

          <button
            className="btn-primary"
            type="submit"
            disabled={busy || authLoading}
            style={{ width: "100%" }}
          >
            {busy
              ? creating
                ? "Creating account…"
                : "Signing in…"
              : creating
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        <div className={styles.switchRow}>
          {creating ? (
            <>
              Already have an account?
              <button type="button" className={styles.linkBtn} onClick={() => switchMode("signin")}>
                Sign in
              </button>
            </>
          ) : (
            <>
              No account yet?
              <button type="button" className={styles.linkBtn} onClick={() => switchMode("create")}>
                Create account
              </button>
            </>
          )}
        </div>

        {creating && (
          <p className={styles.hint}>
            Username: 3-20 letters, numbers or underscores. Password: at least 6 characters.
          </p>
        )}
      </div>
    </div>
  );
}
