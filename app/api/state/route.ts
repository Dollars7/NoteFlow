import { getChatGPTUser } from "../../chatgpt-auth";

async function ensureWorkspaceTable(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS workspace_state (
        id TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
    )
    .run();
}

function getDatabase() {
  const runtime = globalThis as typeof globalThis & { __NOTEFLOW_DB__?: D1Database };
  if (!runtime.__NOTEFLOW_DB__) throw new Error("D1 binding DB is unavailable.");
  return runtime.__NOTEFLOW_DB__;
}

async function storageKeyFor(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalizedEmail),
  );
  const hash = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `user:${hash}`;
}

async function authenticatedStorageKey() {
  const user = await getChatGPTUser();
  return user ? storageKeyFor(user.email) : null;
}

export async function GET() {
  try {
    const workspaceId = await authenticatedStorageKey();
    if (!workspaceId) {
      return Response.json({ state: null, error: "Authentication required." }, { status: 401 });
    }

    const db = getDatabase();
    await ensureWorkspaceTable(db);
    const row = await db
      .prepare("SELECT payload FROM workspace_state WHERE id = ?1")
      .bind(workspaceId)
      .first<{ payload: string }>();

    return Response.json({ state: row ? JSON.parse(row.payload) : null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "D1 read failed.";
    return Response.json({ state: null, error: message }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const workspaceId = await authenticatedStorageKey();
    if (!workspaceId) {
      return Response.json({ saved: false, error: "Authentication required." }, { status: 401 });
    }

    const state: unknown = await request.json();
    if (!state || typeof state !== "object" || Array.isArray(state)) {
      return Response.json({ error: "State must be a JSON object." }, { status: 400 });
    }

    const payload = JSON.stringify(state);
    if (payload.length > 5_000_000) {
      return Response.json({ saved: false, error: "Workspace state is too large." }, { status: 413 });
    }

    const db = getDatabase();
    await ensureWorkspaceTable(db);
    await db
      .prepare(
        `INSERT INTO workspace_state (id, payload, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(id) DO UPDATE SET
           payload = excluded.payload,
           updated_at = excluded.updated_at`,
      )
      .bind(workspaceId, payload, new Date().toISOString())
      .run();

    return Response.json({ saved: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "D1 write failed.";
    return Response.json({ saved: false, error: message }, { status: 503 });
  }
}
