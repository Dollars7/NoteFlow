import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

let loadedWorker;

function createFakeDb() {
  const rows = new Map();

  return {
    prepare(query) {
      let values = [];
      const statement = {
        bind(...nextValues) {
          values = nextValues;
          return statement;
        },
        async first() {
          if (!query.startsWith("SELECT payload")) return null;
          const payload = rows.get(values[0]);
          return payload === undefined ? null : { payload };
        },
        async all() {
          return { results: [], success: true };
        },
        async run() {
          if (query.startsWith("INSERT INTO workspace_state")) {
            rows.set(values[0], values[1]);
          }
          return { success: true };
        },
      };
      return statement;
    },
    async batch() {
      return [];
    },
  };
}

async function dispatch(request, db = createFakeDb()) {
  if (!loadedWorker) {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
    ({ default: loadedWorker } = await import(workerUrl.href));
  }

  return loadedWorker.fetch(
    request,
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
      DB: db,
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function render() {
  return dispatch(
    new Request("http://localhost/", {
      headers: {
        accept: "text/html",
        "oai-authenticated-user-email": "alice@example.com",
      },
    }),
  );
}

test("server-renders an authenticated private workspace without leaking an answer", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>NoteFlow/);
  assert.match(html, /System handles the decision/);
  assert.match(html, /当前能力状态/);
  assert.match(html, /开始本次学习/);
  assert.match(html, /笔记库/);
  assert.match(html, /最近要学什么/);
  assert.match(html, /面试冲刺/);
  assert.match(html, /这次只学哪些知识/);
  assert.match(html, /alice@example\.com/);
  assert.match(html, /个人空间/);
  assert.doesNotMatch(html, /Min-heap invariant|Overlap invariant/);
  assert.doesNotMatch(html, /Decision receipt|Today(?:.|&#x27;|’s Flow)/i);
});

test("isolates D1 workspace state by authenticated identity", async () => {
  const db = createFakeDb();
  const requestFor = (email, method = "GET", body) =>
    new Request("http://localhost/api/state", {
      method,
      headers: {
        "content-type": "application/json",
        "oai-authenticated-user-email": email,
      },
      body,
    });

  const aliceWrite = await dispatch(
    requestFor("alice@example.com", "PUT", JSON.stringify({ owner: "alice" })),
    db,
  );
  const bobWrite = await dispatch(
    requestFor("bob@example.com", "PUT", JSON.stringify({ owner: "bob" })),
    db,
  );
  assert.equal(aliceWrite.status, 200);
  assert.equal(bobWrite.status, 200);

  const aliceRead = await dispatch(requestFor("alice@example.com"), db);
  const bobRead = await dispatch(requestFor("bob@example.com"), db);
  assert.deepEqual(await aliceRead.json(), { state: { owner: "alice" } });
  assert.deepEqual(await bobRead.json(), { state: { owner: "bob" } });

  const anonymous = await dispatch(
    new Request("http://localhost/api/state", { headers: { accept: "application/json" } }),
    db,
  );
  assert.equal(anonymous.status, 401);
});

test("implements unified notes, scoped scheduling, and authenticated persistence", async () => {
  const [
    serverPage,
    clientApp,
    auth,
    engine,
    noteLibrary,
    importer,
    apiRoute,
    schema,
    hosting,
    packageJson,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/noteflow-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/chatgpt-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/flow-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/note-library.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/import-notes.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/state/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(serverPage, /requireChatGPTUser/);
  assert.match(auth, /oai-authenticated-user-email/);
  assert.match(engine, /type NoteCard/);
  assert.match(engine, /tags: string\[\]/);
  assert.match(engine, /focusSkillIds/);
  assert.match(engine, /sprintUrgency/);
  assert.match(engine, /recordSilentSkip/);
  assert.match(engine, /skipCount >= 3/);

  assert.match(clientApp, /hint-keywords/);
  assert.match(clientApp, /hint-scaffold/);
  assert.match(clientApp, /MediaRecorder/);
  assert.match(clientApp, /刚才卡在哪一句/);
  assert.match(clientApp, /是否继续不会进入调度权重/);
  assert.match(clientApp, /fetch\("\/api\/state"/);
  assert.match(clientApp, /noteflow-memory-v3/);
  assert.match(clientApp, /deletedCardIds/);
  assert.match(clientApp, /bulkAddTag/);

  assert.match(noteLibrary, /一个对象 · 两个视图/);
  assert.match(noteLibrary, /Markdown 笔记 · 卡片背面/);
  assert.match(noteLibrary, /批量移动到/);
  assert.match(noteLibrary, /导入 CSV 或 Anki 文件/);
  assert.match(importer, /front.*back.*tags/i);
  assert.match(importer, /parseRows/);

  assert.match(apiRoute, /storageKeyFor/);
  assert.match(apiRoute, /SHA-256/);
  assert.match(apiRoute, /Authentication required/);
  assert.match(apiRoute, /ON CONFLICT\(id\) DO UPDATE/);
  assert.doesNotMatch(apiRoute, /workspaceId = "default"/);
  assert.match(schema, /workspace_state/);
  const hostingConfig = JSON.parse(hosting);
  assert.equal(hostingConfig.d1, "DB");
  assert.equal(hostingConfig.r2, null);
  assert.match(hostingConfig.project_id, /^appgprj_/);

  assert.doesNotMatch(clientApp, /availableMinutes|completedIds|Decision receipt/);
  assert.doesNotMatch(engine, /sessionLength|willingnessToContinue/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
