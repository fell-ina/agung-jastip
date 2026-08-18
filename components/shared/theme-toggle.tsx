"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * Tombol toggle mode terang/gelap. Awalnya mengikuti sistem;
 * setelah diklik, memilih terang atau gelap secara eksplisit.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        aria-label="Memuat pengaturan tampilan"
        className={className}
      >
        <Sun />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      title={isDark ? "Mode terang" : "Mode gelap"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={className}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
