"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Invalid password");
        setLoading(false);
        return;
      }

      localStorage.setItem("ml_admin_token", data.token);
      router.push("/dashboard");
    } catch {
      setError("Network error — is the server running?");
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.logo}>🐒</div>
        <h1 className={styles.title}>MonkeyLink</h1>
        <p className={styles.subtitle}>
          Control panel for your Unity game
        </p>

        <form onSubmit={handleLogin} className={styles.form}>
          <div>
            <div className="label">Admin Password</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className={styles.hint}>
          Default password is set via <code>ADMIN_PASSWORD</code> env var.
        </p>
      </div>
    </div>
  );
}
