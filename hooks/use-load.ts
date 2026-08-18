"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseLoadResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Hook kecil untuk memuat data async dari Supabase:
 * - auto-reload saat `deps` berubah
 * - `.reload()` untuk memuat ulang manual (mis. setelah CRUD)
 */
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []): UseLoadResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [version, setVersion] = useState(0);

  // Referensi loader terbaru tanpa menulis ref saat render.
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  useEffect(() => {
    let alive = true;
    loaderRef
      .current()
      .then((result) => {
        if (!alive) return;
        setData(result);
        setError(null);
        setHasLoaded(true);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : String(e));
        setHasLoaded(true);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return {
    data,
    loading: !hasLoaded,
    error,
    reload,
    setData,
  };
}
