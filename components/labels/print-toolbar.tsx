"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintToolbar({ count }: { count: number }) {
  return (
    <div className="print-hidden mx-auto mb-6 flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/labels" />}>
          <ArrowLeft /> Kembali
        </Button>
        <span className="text-sm text-muted-foreground">
          {count} label siap dicetak
        </span>
      </div>
      <Button onClick={() => window.print()}>
        <Printer /> Cetak Label
      </Button>
    </div>
  );
}
