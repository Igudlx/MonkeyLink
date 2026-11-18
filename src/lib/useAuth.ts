"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "./firebaseClient";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState("");

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (next) => {
        setUser(next);
        setLoading(false);
      });
      return unsubscribe;
    } catch {
      setConfigError("Firebase keys are missing or wrong in the Vercel environment variables.");
      setLoading(false);
    }
  }, []);

  return { user, loading, configError };
}
