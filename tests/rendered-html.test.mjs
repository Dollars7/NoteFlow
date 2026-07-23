import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders learning boundaries and goal controls without leaking an answer", async () => {
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
  assert.doesNotMatch(html, /Min-heap invariant|Overlap invariant/);
  assert.doesNotMatch(html, /Decision receipt|Today(?:.|&#x27;|’s Flow)/i);
});

test("implements unified notes, scoped sprint scheduling, and D1 persistence", async () => {
  const [page, engine, noteLibrary, importer, apiRoute, schema, hosting, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/flow-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/note-library.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/import-notes.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/state/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(engine, /type NoteCard/);
  assert.match(engine, /type GoalProfile/);
  assert.match(engine, /tags: string\[\]/);
  assert.match(engine, /focusSkillIds/);
  assert.match(engine, /sprintUrgency/);
  assert.match(engine, /retentionNeed/);
  assert.match(engine, /recordSilentSkip/);
  assert.match(engine, /skipCount >= 3/);

  assert.match(page, /hint-keywords/);
  assert.match(page, /hint-scaffold/);
  assert.match(page, /MediaRecorder/);
  assert.match(page, /刚才卡在哪一句/);
  assert.match(page, /是否继续不会进入调度权重/);
  assert.match(page, /fetch\("\/api\/state"/);
  assert.match(noteLibrary, /一个对象 · 两个视图/);
  assert.match(noteLibrary, /Markdown 笔记 · 卡片背面/);
  assert.match(noteLibrary, /批量移动到/);
  assert.match(noteLibrary, /导入 CSV 或 Anki 文件/);
  assert.match(noteLibrary, /确定删除选中的/);
  assert.match(importer, /front.*back.*tags/i);
  assert.match(importer, /parseRows/);
  assert.match(importer, /noteFlowCsvTemplate/);
  assert.match(page, /deletedCardIds/);
  assert.match(page, /bulkAddTag/);

  assert.match(apiRoute, /ON CONFLICT\(id\) DO UPDATE/);
  assert.match(schema, /workspace_state/);
  assert.deepEqual(JSON.parse(hosting), { d1: "DB", r2: null });

  assert.doesNotMatch(page, /availableMinutes|completedIds|Decision receipt/);
  assert.doesNotMatch(engine, /sessionLength|willingnessToContinue/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
