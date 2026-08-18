"use client";

import { Database, FileCode2, KeyRound } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STEPS = [
  {
    icon: Database,
    title: "1. Buat project Supabase",
    desc: "Buka supabase.com → New Project, catat URL project dan anon key (Project Settings → API).",
  },
  {
    icon: FileCode2,
    title: "2. Jalankan schema.sql",
    desc: "Buka SQL Editor di dashboard Supabase, tempel isi file schema.sql di root project, lalu jalankan.",
  },
  {
    icon: KeyRound,
    title: "3. Isi .env.local",
    desc: "Salin .env.example menjadi .env.local, isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY, lalu restart server dev.",
  },
];

export function SetupGuide() {
  return (
    <div className="space-y-4">
      <Alert>
        <Database />
        <AlertTitle>Supabase belum dikonfigurasi</AlertTitle>
        <AlertDescription>
          Aplikasi tetap bisa dipakai penuh lewat <span className="font-medium text-foreground">Mode Lokal</span>{" "}
          (data tersimpan di browser). Langkah berikut hanya perlu dilakukan jika ingin menyimpan data permanen di cloud:
          tambahkan <code className="rounded bg-muted px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ke file{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.local</code>, lalu restart{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm run dev</code>.
        </AlertDescription>
      </Alert>
      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <step.icon className="size-4 text-emerald-600" />
                {step.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{step.desc}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
