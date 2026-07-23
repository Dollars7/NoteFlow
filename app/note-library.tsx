"use client";

import { useMemo, useState } from "react";
import {
  noteFlowCsvTemplate,
  parseNoteImport,
  type NoteImportResult,
} from "../lib/import-notes";
import type { NoteCard, SkillState } from "../lib/flow-engine";

type EditableCardFields =
  | "title"
  | "prompt"
  | "noteMarkdown"
  | "skillId"
  | "tags"
  | "mode";

type NoteLibraryProps = {
  cards: NoteCard[];
  skills: SkillState[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onChange: (id: string, patch: Partial<Pick<NoteCard, EditableCardFields>>) => void;
  onBulkChange: (
    ids: string[],
    patch: Partial<Pick<NoteCard, "skillId" | "tags" | "mode">>,
  ) => void;
  onBulkAddTag: (ids: string[], tag: string) => void;
  onDelete: (ids: string[]) => void;
  onImport: (cards: NoteCard[]) => void;
  onLearn: () => void;
};

const parseTags = (value: string) =>
  [...new Set(value.split(/[|;,]+/).map((tag) => tag.trim()).filter(Boolean))];

function TagEditor({
  card,
  onChange,
}: {
  card: NoteCard;
  onChange: (tags: string[]) => void;
}) {
  const [value, setValue] = useState((card.tags ?? []).join(", "));

  const commit = () => onChange(parseTags(value));

  return (
    <label className="tag-editor-field">
      <span>标签</span>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commit();
            event.currentTarget.blur();
          }
        }}
        placeholder="例如：java, interview, heap"
      />
    </label>
  );
}

export function NoteLibrary({
  cards,
  skills,
  selectedId,
  onSelect,
  onCreate,
  onChange,
  onBulkChange,
  onBulkAddTag,
  onDelete,
  onImport,
  onLearn,
}: NoteLibraryProps) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTag, setBulkTag] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<NoteImportResult | null>(null);
  const [importFallbackSkill, setImportFallbackSkill] = useState(skills[0]?.id ?? "intervals");

  const selected = cards.find((card) => card.id === selectedId) ?? cards[0];
  const skillName = skills.find((skill) => skill.id === selected?.skillId)?.name;

  const filteredCards = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return cards;
    return cards.filter((card) =>
      [
        card.title,
        card.prompt,
        card.noteMarkdown,
        ...(card.tags ?? []),
        skills.find((skill) => skill.id === card.skillId)?.name ?? card.skillId,
      ].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [cards, query, skills]);

  const allFilteredSelected =
    filteredCards.length > 0 && filteredCards.every((card) => selectedIds.has(card.id));

  const toggleSelected = (cardId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) filteredCards.forEach((card) => next.delete(card.id));
      else filteredCards.forEach((card) => next.add(card.id));
      return next;
    });
  };

  const addBulkTag = () => {
    const tag = bulkTag.trim();
    if (!tag || selectedIds.size === 0) return;
    onBulkAddTag([...selectedIds], tag);
    setBulkTag("");
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(
      `确定删除选中的 ${selectedIds.size} 个知识对象吗？相关记忆记录也会一起删除。`,
    );
    if (!confirmed) return;
    onDelete([...selectedIds]);
    setSelectedIds(new Set());
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setImportPreview(parseNoteImport(text, skills, importFallbackSkill));
  };

  const commitImport = () => {
    if (!importPreview?.cards.length) return;
    onImport(importPreview.cards);
    onSelect(importPreview.cards[0].id);
    setImportPreview(null);
    setImportOpen(false);
  };

  const downloadTemplate = () => {
    const blob = new Blob([noteFlowCsvTemplate], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "noteflow-import-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="notes-workspace">
      <aside className="notes-sidebar">
        <div className="notes-sidebar-heading">
          <div>
            <p className="eyebrow">Knowledge objects</p>
            <h1>笔记库</h1>
          </div>
          <div className="library-create-actions">
            <button type="button" className="import-button" onClick={() => setImportOpen(true)}>
              导入
            </button>
            <button type="button" className="new-note-button" onClick={onCreate}>＋ 新笔记</button>
          </div>
        </div>

        <label className="note-search">
          <span className="sr-only">搜索笔记</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、正文、领域或标签"
          />
        </label>

        <div className="selection-heading">
          <label>
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleAllFiltered}
              aria-label="选择当前搜索结果"
            />
            <span>{selectedIds.size > 0 ? `已选择 ${selectedIds.size} 项` : `共 ${cards.length} 项`}</span>
          </label>
          {selectedIds.size > 0 && (
            <button type="button" onClick={() => setSelectedIds(new Set())}>取消选择</button>
          )}
        </div>

        <div className="note-list">
          {filteredCards.map((card) => (
            <div className={`note-list-row ${card.id === selected?.id ? "selected" : ""}`} key={card.id}>
              <input
                type="checkbox"
                checked={selectedIds.has(card.id)}
                onChange={() => toggleSelected(card.id)}
                aria-label={`选择 ${card.title}`}
              />
              <button type="button" className="note-row-main" onClick={() => onSelect(card.id)}>
                <span>
                  {skills.find((skill) => skill.id === card.skillId)?.name ?? card.skillId}
                  {(card.tags ?? []).slice(0, 2).map((tag) => <i key={tag}>#{tag}</i>)}
                </span>
                <strong>{card.title}</strong>
                <small>{card.noteMarkdown ? "有笔记背面" : "等待补充"}</small>
              </button>
            </div>
          ))}
          {filteredCards.length === 0 && <p className="empty-search">没有匹配的笔记。</p>}
        </div>
      </aside>

      <div className="library-main">
        {selectedIds.size > 0 && (
          <section className="bulk-toolbar" aria-label="批量管理">
            <strong>{selectedIds.size} 项</strong>
            <label>
              <span>知识领域</span>
              <select
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) {
                    onBulkChange([...selectedIds], { skillId: event.target.value });
                    event.target.value = "";
                  }
                }}
              >
                <option value="" disabled>批量移动到…</option>
                {skills.map((skill) => <option value={skill.id} key={skill.id}>{skill.name}</option>)}
              </select>
            </label>
            <label className="bulk-tag-field">
              <span className="sr-only">批量添加标签</span>
              <input
                value={bulkTag}
                onChange={(event) => setBulkTag(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addBulkTag();
                }}
                placeholder="添加标签"
              />
              <button type="button" onClick={addBulkTag}>添加</button>
            </label>
            <button type="button" className="danger-button" onClick={deleteSelected}>删除</button>
          </section>
        )}

        {selected ? (
          <article className="note-editor">
            <header className="note-editor-heading">
              <div>
                <span>{skillName} · 同一对象的笔记面</span>
                <h2>领域与标签会跟着知识对象一起进入调度和导出。</h2>
              </div>
              <button type="button" className="secondary-button" onClick={onLearn}>
                去学习
                <span aria-hidden="true">→</span>
              </button>
            </header>

            <div className="card-metadata-fields">
              <label>
                <span>知识领域</span>
                <select
                  value={selected.skillId}
                  onChange={(event) => onChange(selected.id, { skillId: event.target.value })}
                >
                  {skills.map((skill) => <option value={skill.id} key={skill.id}>{skill.name}</option>)}
                </select>
              </label>
              <label>
                <span>检索模式</span>
                <select
                  value={selected.mode}
                  onChange={(event) =>
                    onChange(selected.id, { mode: event.target.value as NoteCard["mode"] })
                  }
                >
                  <option value="recall">Recall · 回忆</option>
                  <option value="solve">Solve · 解题</option>
                  <option value="design">Design · 设计</option>
                  <option value="speak">Speak · 口述</option>
                </select>
              </label>
              <TagEditor
                key={selected.id}
                card={selected}
                onChange={(tags) => onChange(selected.id, { tags })}
              />
            </div>

            <label className="editor-field title-field">
              <span>标题</span>
              <input
                value={selected.title}
                onChange={(event) => onChange(selected.id, { title: event.target.value })}
              />
            </label>

            <label className="editor-field">
              <span>检索问题 · 卡片正面</span>
              <textarea
                className="prompt-editor"
                value={selected.prompt}
                onChange={(event) => onChange(selected.id, { prompt: event.target.value })}
              />
            </label>

            <label className="editor-field markdown-editor">
              <span>Markdown 笔记 · 卡片背面</span>
              <textarea
                value={selected.noteMarkdown}
                onChange={(event) => onChange(selected.id, { noteMarkdown: event.target.value })}
                placeholder={"## 核心概念\n\n写下解释、例子和容易卡住的地方……"}
              />
            </label>

            <footer className="editor-footer">
              <span><i /> 自动保存到 NoteFlow 数据库</span>
              <span>一个对象 · 两个视图</span>
            </footer>
          </article>
        ) : (
          <section className="empty-library">
            <p className="eyebrow">笔记库为空</p>
            <h2>新建一条笔记，或从 CSV / Anki 导入。</h2>
            <button type="button" className="primary-button" onClick={onCreate}>新建笔记</button>
          </section>
        )}
      </div>

      {importOpen && (
        <div className="import-overlay" role="presentation">
          <section className="import-dialog" role="dialog" aria-modal="true" aria-labelledby="import-title">
            <header>
              <div>
                <p className="eyebrow">Bulk import</p>
                <h2 id="import-title">导入 CSV 或 Anki 文件</h2>
              </div>
              <button type="button" onClick={() => setImportOpen(false)} aria-label="关闭导入">×</button>
            </header>

            <div className="import-format-grid">
              <div>
                <strong>NoteFlow CSV</strong>
                <p>支持 title、prompt、noteMarkdown、skill、tags、mode、hintKeywords、scaffold。</p>
                <button type="button" onClick={downloadTemplate}>下载 CSV 模板</button>
              </div>
              <div>
                <strong>Anki 格式</strong>
                <p>支持 Front / Back / Tags 表头，也支持无表头的 Front ⇥ Back ⇥ Tags TSV。</p>
              </div>
            </div>

            <label className="import-fallback">
              <span>无法识别 Deck / skill 时归入</span>
              <select
                value={importFallbackSkill}
                onChange={(event) => setImportFallbackSkill(event.target.value)}
              >
                {skills.map((skill) => <option value={skill.id} key={skill.id}>{skill.name}</option>)}
              </select>
            </label>

            <label className="file-drop">
              <input
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
                onChange={(event) => void handleImportFile(event.target.files?.[0])}
              />
              <strong>选择 CSV / TSV 文件</strong>
              <span>支持引号、单元格内换行和 UTF-8 BOM</span>
            </label>

            {importPreview && (
              <div className="import-preview">
                <div className="import-preview-heading">
                  <div>
                    <strong>{importPreview.cards.length} 条可导入</strong>
                    <span>{importPreview.format === "anki" ? "检测为 Anki 格式" : "检测为 NoteFlow CSV"}</span>
                  </div>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={importPreview.cards.length === 0}
                    onClick={commitImport}
                  >
                    确认导入
                  </button>
                </div>
                {importPreview.warnings.length > 0 && (
                  <ul className="import-warnings">
                    {importPreview.warnings.slice(0, 5).map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                )}
                <div className="import-card-preview">
                  {importPreview.cards.slice(0, 4).map((card) => (
                    <div key={card.id}>
                      <span>{skills.find((skill) => skill.id === card.skillId)?.name}</span>
                      <strong>{card.title}</strong>
                      <small>{card.tags.map((tag) => `#${tag}`).join(" ") || "无标签"}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
