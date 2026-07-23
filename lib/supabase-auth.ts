import { createClient, type User } from "@supabase/supabase-js";
import { getSupabaseAuthConfig } from "./auth-config";

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
  provider: string;
};

export async function authenticateRequest(
  request: Request,
): Promise<AuthenticatedUser | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;

  const config = getSupabaseAuthConfig();
  if (!config.url || !config.publishableKey) {
    throw new Error("Supabase authentication is not configured.");
  }

  const supabase = createClient(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return toAuthenticatedUser(data.user);
}

function toAuthenticatedUser(user: User): AuthenticatedUser {
  const displayName =
    stringMetadata(user.user_metadata, "full_name") ??
    stringMetadata(user.user_metadata, "name") ??
    user.email ??
    "NoteFlow learner";

  return {
    id: user.id,
    email: user.email ?? "",
    displayName,
    provider:
      stringMetadata(user.app_metadata, "provider") ??
      user.identities?.[0]?.provider ??
      "email",
  };
}

function stringMetadata(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
