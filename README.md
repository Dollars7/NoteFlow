# NoteFlow

**NoteFlow** is a local-first, waterfall-style learning notebook designed for low-friction knowledge browsing.

Instead of imitating a social platform, NoteFlow reframes fragmented learning content into an **attention-friendly card feed**: quick to scan, easy to revisit, and structured for people who benefit from lower activation energy when starting study sessions.

---

## Concept

NoteFlow turns mixed content sources into a masonry-style notebook experience.

Typical inputs can include:

* RSS articles
* local Markdown notes
* JSON content seeds
* images and rich media metadata
* AI-generated summaries, tags, and card copy

Typical outputs are:

* a multi-column waterfall feed
* concise study cards
* tag-based filtering
* detail pages with source content + transformed summaries
* an optional AI-assisted content transformation pipeline

---

## Product Goal

Build a **local content browser for learning**, not a social app.

Core principles:

* **local-first**: runs with local data and simple storage
* **attention-friendly**: card-based layout reduces reading resistance
* **transformable**: raw content can be rewritten into study-friendly cards
* **browseable**: encourages lightweight review through a visual feed

---

## Why this exists

A lot of learning material is technically useful but ergonomically bad:

* too long
* too dense
* poorly structured
* hard to re-open
* unpleasant to casually revisit

NoteFlow is meant to reduce that friction by presenting knowledge in a format that feels closer to a visual notebook than a file system.

---

## MVP Scope

### Feed

* responsive 2-column to multi-column masonry layout
* card-based rendering with variable heights
* title, summary, tags, source, timestamp
* optional cover image or fallback visual block

### Detail View

* full content page for each note
* original source metadata
* transformed summary and key points
* related tags / similar notes

### Content Ingestion

* local JSON seeds
* local Markdown files
* RSS feeds

### Search and Filtering

* keyword search
* filter by tag
* filter by source type

### Storage

* SQLite for notes and metadata
* local file storage for media references

### AI Assist (phase 2)

* title generation
* summary generation
* tag extraction
* study-point extraction

---

## Proposed Tech Stack

### Frontend

* Next.js
* React
* Tailwind CSS

### Data / Storage

* SQLite
* Prisma

### Ingestion

* RSS parser
* local file scanner for Markdown / JSON

### AI Layer

* Ollama or external LLM API

---

## Suggested Project Structure

```text
noteflow/
├── app/
│   ├── page.tsx                  # home feed
│   ├── note/[id]/page.tsx        # note detail page
│   ├── search/page.tsx           # search / filter page
│   └── layout.tsx                # app shell
├── components/
│   ├── note-card.tsx             # masonry card
│   ├── masonry-feed.tsx          # feed layout wrapper
│   ├── search-bar.tsx            # top search
│   ├── tag-chip.tsx              # tag UI
│   └── top-nav.tsx               # header
├── lib/
│   ├── db.ts                     # database helpers
│   ├── ingest-rss.ts             # rss ingestion
│   ├── ingest-markdown.ts        # markdown ingestion
│   ├── transform-note.ts         # summary/tag generation
│   └── scoring.ts                # feed scoring logic
├── data/
│   ├── seeds/                    # local json note seeds
│   └── uploads/                  # local media references
├── prisma/
│   └── schema.prisma
├── public/
│   └── placeholders/
├── scripts/
│   ├── seed.ts                   # insert starter content
│   ├── import-rss.ts             # run rss sync
│   └── transform.ts              # run AI transforms
├── README.md
└── package.json
```

---

## Initial Data Model

### Note

* id
* title
* summary
* content
* sourceType
* sourceUrl
* coverImage
* createdAt
* updatedAt
* score

### Tag

* id
* name

### NoteTag

* noteId
* tagId

### Asset

* id
* noteId
* filePath
* type

---

## First Development Milestone

### Version 0.1

Goal: make it feel like a product immediately.

Deliverables:

* app shell
* top navigation
* masonry feed
* 10 mock notes
* note card component
* detail page

This version does **not** need:

* authentication
* comments
* user accounts
* social graph
* complex recommendation systems

---

## Design Direction

Visual tone:

* clean
* lightweight
* notebook-like
* calm but modern

Interaction goals:

* low cognitive load
* easy scanning
* visually varied cards
* strong readability

---

## Possible Future Directions

* reading history
* saved collections
* semantic search
* clustering by topic
* spaced review mode
* AI study coach overlays
* source-to-card batch conversion pipeline

---

## Positioning Statement

> NoteFlow is a waterfall-style learning notebook that transforms fragmented content into a more browseable, attention-friendly study experience.

---

## Resume-Friendly Description

Built a local-first learning content browser with a responsive masonry feed, structured note cards, source ingestion from RSS and Markdown, and an AI-assisted transformation pipeline for summaries and tags.

