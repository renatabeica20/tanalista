export const ANTHROPIC_MODEL_CLASSIFY =
  import.meta.env.VITE_ANTHROPIC_MODEL_CLASSIFY ||
  "claude-3-5-haiku-latest";

export const ANTHROPIC_MODEL_ORGANIZE =
  import.meta.env.VITE_ANTHROPIC_MODEL_ORGANIZE ||
  "claude-3-5-sonnet-latest";

export const ANTHROPIC_MODEL_VISION =
  import.meta.env.VITE_ANTHROPIC_MODEL_VISION ||
  "claude-3-5-sonnet-latest";

export const APP_PUBLIC_URL =
  (
    import.meta.env.VITE_APP_PUBLIC_URL ||
    "https://tanalistaapp.com.br"
  ).replace(/\/+$/, "");

export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "");

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "";
