import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase: SupabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as unknown as SupabaseClient);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Nombres de buckets de almacenamiento
export const STORAGE_BUCKETS = {
  EAR_TAG_PHOTOS: "ear-tag-photos",
  RECEIPT_PHOTOS: "receipt-photos",
} as const;
