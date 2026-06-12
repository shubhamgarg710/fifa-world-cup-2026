/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Set to "1" / "true" to disable the ESPN live-results overlay (openfootball only). */
  readonly VITE_DISABLE_ESPN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
