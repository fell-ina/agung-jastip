"use client";

/**
 * Autentikasi Mode Lokal (tanpa Supabase).
 *
 * Sesi disimpan di localStorage browser. Sandi disimpan sebagai hash
 * (SHA-256 bila tersedia, fallback FNV-1a untuk konteks non-secure seperti
 * akses lewat IP LAN http://192.168.x.x). Ini GATE kemudahan, bukan
 * keamanan tingkat produksi — saat Supabase terhubung, login akan
 * digantikan Supabase Auth (email + sandi).
 */

const SESSION_KEY = "agung-jastip:auth:session";
const PASSWORD_HASH_KEY = "agung-jastip:auth:password-hash";

/* ---------- Store kecil untuk useSyncExternalStore ---------- */

export interface AuthState {
  ready: boolean;
  authed: boolean;
}

const AUTH_LISTENERS = new Set<() => void>();
let cachedAuthState: AuthState | null = null;

function readAuthState(): AuthState {
  return { ready: true, authed: isLoggedIn() };
}

/** Snapshot untuk client (membaca localStorage). */
export function getAuthState(): AuthState {
  if (!cachedAuthState) cachedAuthState = readAuthState();
  return cachedAuthState;
}

/** Snapshot untuk server/SSR — selalu belum siap (objek distabilkan). */
const AUTH_SERVER_STATE: AuthState = { ready: false, authed: false };
export function getAuthServerState(): AuthState {
  return AUTH_SERVER_STATE;
}

export function subscribeAuth(listener: () => void): () => void {
  AUTH_LISTENERS.add(listener);
  return () => {
    AUTH_LISTENERS.delete(listener);
  };
}

function notifyAuthChanged(): void {
  cachedAuthState = readAuthState();
  AUTH_LISTENERS.forEach((listener) => listener());
}

/** Sandi bawaan saat pertama kali dipakai. Ubah di menu Pengaturan → Ganti Sandi. */
export const DEFAULT_PASSWORD = "agung123";

async function hashSha256(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Fallback FNV-1a — konteks non-secure (HTTP LAN) tanpa Web Crypto.
function hashFnv1a(password: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < password.length; i++) {
    h ^= password.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/**
 * Hitung kedua hash. Konteks akses bisa berubah (localhost aman vs IP LAN
 * HTTP), jadi verifikasi selalu menerima salah satu algoritma agar pemilik
 * aplikasi tidak terkunci. SHA-256 dipakai bila tersedia.
 */
async function computeHashes(password: string): Promise<{
  sha256: string | null;
  fnv: string;
}> {
  const subtle = typeof crypto !== "undefined" ? crypto.subtle : undefined;
  const sha256 = subtle?.digest ? await hashSha256(password) : null;
  return { sha256, fnv: hashFnv1a(password) };
}

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

async function getOrInitHash(): Promise<string> {
  const store = storage();
  if (!store) return "";
  const existing = store.getItem(PASSWORD_HASH_KEY);
  if (existing) return existing;
  const { sha256, fnv } = await computeHashes(DEFAULT_PASSWORD);
  const hash = sha256 ?? fnv;
  store.setItem(PASSWORD_HASH_KEY, hash);
  return hash;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const stored = await getOrInitHash();
  if (!stored) return false;
  const { sha256, fnv } = await computeHashes(password);
  return (sha256 !== null && sha256 === stored) || fnv === stored;
}

export async function login(password: string): Promise<boolean> {
  const ok = await verifyPassword(password);
  if (ok) {
    storage()?.setItem(SESSION_KEY, "1");
    notifyAuthChanged();
  }
  return ok;
}

export function logout(): void {
  storage()?.removeItem(SESSION_KEY);
  notifyAuthChanged();
}

export function isLoggedIn(): boolean {
  return storage()?.getItem(SESSION_KEY) === "1";
}

export async function changePassword(
  current: string,
  next: string,
): Promise<"ok" | "wrong"> {
  if (!(await verifyPassword(current))) return "wrong";
  const store = storage();
  if (!store) return "wrong";
  const { sha256, fnv } = await computeHashes(next);
  store.setItem(PASSWORD_HASH_KEY, sha256 ?? fnv);
  return "ok";
}

/** `true` selama sandi bawaan masih aktif (belum pernah diganti). */
export async function isDefaultPasswordActive(): Promise<boolean> {
  return verifyPassword(DEFAULT_PASSWORD);
}
