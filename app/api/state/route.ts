const workspaceId = "default";

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

export async function GET() {
  try {
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
    const state: unknown = await request.json();
    if (!state || typeof state !== "object" || Array.isArray(state)) {
      return Response.json({ error: "State must be a JSON object." }, { status: 400 });
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
      .bind(workspaceId, JSON.stringify(state), new Date().toISOString())
      .run();

    return Response.json({ saved: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "D1 write failed.";
    return Response.json({ saved: false, error: message }, { status: 503 });
  }
}
