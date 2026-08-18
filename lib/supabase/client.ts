"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

let cached: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!cached) cached = createClient();
  return cached;
}
