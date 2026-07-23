export type SupabaseAuthConfig = {
  url: string;
  publishableKey: string;
};

type NoteFlowRuntime = typeof globalThis & {
  __NOTEFLOW_AUTH_CONFIG__?: SupabaseAuthConfig;
};

export function getSupabaseAuthConfig(): SupabaseAuthConfig {
  const runtime = globalThis as NoteFlowRuntime;
  if (runtime.__NOTEFLOW_AUTH_CONFIG__) return runtime.__NOTEFLOW_AUTH_CONFIG__;

  return {
    url:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.SUPABASE_URL ??
      "",
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      "",
  };
}
