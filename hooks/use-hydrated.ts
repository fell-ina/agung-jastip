"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Mengembalikan `true` setelah komponen ter-hydrate di client.
 * Dipakai sebagai guard untuk menghindari mismatch SSR pada UI yang
 * bergantung pada state browser (mis. tema).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
