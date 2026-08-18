"use client";

import { useState } from "react";
import { Database, HardDrive, RotateCcw } from "lucide-react";

import { SetupGuide } from "@/components/shared/setup-guide";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { resetLocalData } from "@/lib/local-db";

/**
 * Banner yang tampil di Dashboard saat Supabase belum dikonfigurasi.
 * Memberi tahu bahwa aplikasi berjalan penuh di Mode Lokal (localStorage),
 * plus aksi reset data contoh dan panduan konek Supabase.
 */
export function LocalModeBanner() {
  const [showGuide, setShowGuide] = useState(false);

  function handleReset() {
    if (!window.confirm("Hapus semua data lokal dan muat ulang data contoh?")) return;
    resetLocalData();
    window.location.reload();
  }

  return (
    <div className="mb-6 space-y-3">
      <Alert className="border-amber-500/40 bg-amber-500/5">
        <HardDrive />
        <AlertTitle className="flex flex-wrap items-center gap-2">
          Mode Lokal aktif
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            tanpa Supabase
          </span>
        </AlertTitle>
        <AlertDescription>
          Aplikasi berjalan penuh dengan <span className="font-medium text-foreground">data contoh</span> yang
          tersimpan di browser ini (localStorage). Semua fitur — trip, pesanan, tagihan WhatsApp, label resi,
          biaya operasional — sudah bisa dicoba sekarang. Data akan hilang jika cache browser dibersihkan,
          jadi hubungkan Supabase untuk penyimpanan permanen.
        </AlertDescription>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RotateCcw /> Reset data contoh
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowGuide((v) => !v)}>
            <Database /> Cara hubungkan Supabase
          </Button>
        </div>
      </Alert>
      {showGuide && <SetupGuide />}
    </div>
  );
}
