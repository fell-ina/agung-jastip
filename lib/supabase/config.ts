export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const isPlaceholder =
  supabaseUrl.includes("placeholder") || supabaseAnonKey.includes("placeholder");

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  supabaseUrl.includes("supabase.co") &&
  !isPlaceholder;
