/**
 * Client-side auth for the static frontend.
 *
 * There is no server session: sign-up/sign-in return an auth token that we keep
 * in localStorage and send as a Bearer header on per-user API calls.
 */

const STORAGE_KEY = "prelegal.auth";

export interface AuthUser {
  userId: number;
  email: string;
  token: string;
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setUser(user: AuthUser): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Authorization header for the current user, or empty if signed out. */
export function authHeader(): Record<string, string> {
  const user = getUser();
  return user ? { Authorization: `Bearer ${user.token}` } : {};
}

/** Sign in or register; stores the user and returns it. Throws on failure. */
export async function authenticate(
  mode: "login" | "signup",
  email: string,
  password: string,
): Promise<AuthUser> {
  const res = await fetch(`/api/${mode}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail ?? "Authentication failed");
  }
  const user = (await res.json()) as AuthUser;
  setUser(user);
  return user;
}
