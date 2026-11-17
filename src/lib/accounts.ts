import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebaseClient";

const EMAIL_DOMAIN = "monkeylink.app";

export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
export const MIN_PASSWORD_LENGTH = 6;

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}

export function usernameFromUser(user: User): string {
  return (user.email ?? "").split("@")[0];
}

export function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/email-already-in-use":
      return "That username is already taken.";
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Wrong username or password.";
    case "auth/weak-password":
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection.";
    case "auth/operation-not-allowed":
    case "auth/configuration-not-found":
      return "Email/Password sign-in is not enabled in Firebase yet.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
      return "Firebase keys are missing or wrong in the Vercel environment variables.";
    default:
      return (err as Error)?.message || "Something went wrong.";
  }
}

export function validateCredentials(username: string, password: string): string | null {
  if (!USERNAME_PATTERN.test(username.trim())) {
    return "Username must be 3-20 characters: letters, numbers, or underscores.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export async function createAccount(username: string, password: string): Promise<void> {
  await createUserWithEmailAndPassword(getFirebaseAuth(), usernameToEmail(username), password);
}

export async function signInAccount(username: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(getFirebaseAuth(), usernameToEmail(username), password);
}

export async function signOutAccount(): Promise<void> {
  await signOut(getFirebaseAuth());
}

export async function getIdToken(): Promise<string | null> {
  const user = getFirebaseAuth().currentUser;
  return user ? user.getIdToken() : null;
}

export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await getIdToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
