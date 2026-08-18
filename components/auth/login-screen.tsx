"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { DEFAULT_PASSWORD, isDefaultPasswordActive } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function LoginScreen() {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDefaultHint, setShowDefaultHint] = useState(false);

  // Hint sandi bawaan hanya tampil selama sandi belum diganti.
  useEffect(() => {
    let alive = true;
    void isDefaultPasswordActive().then((active) => {
      if (alive) setShowDefaultHint(active);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await login(password);
      if (!ok) {
        setError("Sandi salah. Coba lagi.");
        setPassword("");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50 to-background px-4 py-10 dark:from-emerald-950/50">
      {/* Dekorasi latar */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-teal-400/10 blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-950/30">
            <ShoppingBag className="size-7" />
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {APP_NAME}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {APP_TAGLINE} — masuk untuk mengelola
          </p>
        </div>

        {/* Kartu login */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="login-password">Sandi</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={show ? "text" : "password"}
                  autoFocus
                  autoComplete="current-password"
                  placeholder="Masukkan sandi"
                  className="pr-10 pl-9"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  aria-invalid={error ? true : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  tabIndex={-1}
                  aria-label={show ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            </div>

            <Button
              type="submit"
              className="h-11 w-full text-base"
              disabled={busy || !password}
            >
              {busy ? "Memeriksa..." : "Masuk"}
            </Button>
          </form>

          {!isSupabaseConfigured && showDefaultHint ? (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Sandi bawaan:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                {DEFAULT_PASSWORD}
              </code>{" "}
              — ubah di menu Pengaturan.
            </p>
          ) : !isSupabaseConfigured ? (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Sandi sudah diganti — gunakan sandi milikmu sendiri.
            </p>
          ) : (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Autentikasi akan dialihkan ke akun Supabase setelah terhubung.
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME} · {APP_TAGLINE}
        </p>
      </div>
    </div>
  );
}
