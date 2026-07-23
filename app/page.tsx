import { getSupabaseAuthConfig } from "../lib/auth-config";
import { AuthGate } from "./auth-gate";

export const dynamic = "force-dynamic";

export default function Home() {
  return <AuthGate config={getSupabaseAuthConfig()} />;
}
