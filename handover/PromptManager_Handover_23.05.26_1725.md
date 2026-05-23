# Prompt Manager — Handover Document
**Date:** 23 May 2026, 17:25  
**Branch at time of writing:** `main` (commit `23592a8`)  
**Live URL:** https://hhkes.github.io/prompt-manager/  
**Repo:** https://github.com/hhkes/prompt-manager  

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Layout](#3-repository-layout)
4. [Data Model](#4-data-model)
5. [Component Reference](#5-component-reference)
6. [Utility / Logic Files](#6-utility--logic-files)
7. [CSS Design System](#7-css-design-system)
8. [Features Reference](#8-features-reference)
9. [Deployment Pipeline](#9-deployment-pipeline)
10. [Local Development Setup](#10-local-development-setup)
11. [AI Integration — Client-Side Architecture](#11-ai-integration--client-side-architecture)
12. [Known Constraints and Gotchas](#12-known-constraints-and-gotchas)
13. [Session Change Log](#13-session-change-log)
14. [Rebuild Checklist](#14-rebuild-checklist)

---

## 1. Project Overview

Prompt Manager is a **fully static, client-side React SPA** that lets users store, organise, search, and use AI prompts. There is no database and no server in production. Everything persists in **browser `localStorage`**. AI features call the Anthropic API directly from the browser using the user's own API key.

### Core capabilities
| Feature | Status |
|---|---|
| Create / edit / delete prompts | ✅ |
| Copy prompt to clipboard | ✅ |
| Folders (many-to-many with prompts) | ✅ |
| Categories and tags on prompts | ✅ |
| Full-text search (title, body, notes, tags, category) | ✅ |
| Filter by category or folder | ✅ |
| Dashboard (recent prompts + folder grid) | ✅ |
| AI prompt generator (Anthropic API, browser-direct) | ✅ |
| Word document import (mammoth + Anthropic API) | ✅ |
| JSON export / import (with folder data) | ✅ |
| API key management modal | ✅ |
| GitHub Pages deployment via Actions | ✅ |

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| UI framework | React | 19.2.4 |
| Bundler | Vite | 8.0.4 |
| AI SDK | @anthropic-ai/sdk | ^0.88.0 |
| Word parser | mammoth | ^1.12.0 |
| Hosting | GitHub Pages (static) | — |
| CI/CD | GitHub Actions | — |
| Node (build only) | Node.js | 20 |

**No router, no state management library, no UI component library.** All state lives in `App.jsx`. Styling is a single hand-written CSS file (`src/App.css`).

---

## 3. Repository Layout

```
prompt-manager/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Build + deploy to gh-pages on push to main
├── handover/
│   └── PromptManager_Handover_23.05.26_1725.md   # This file
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── icons.svg
│   ├── components/
│   │   ├── AIGenerator.jsx     # Modal — describe need → AI generates prompt
│   │   ├── ApiKeyModal.jsx     # Modal — enter/update Anthropic API key
│   │   ├── Dashboard.jsx       # Home view: recent prompts + folder tiles
│   │   ├── DocImport.jsx       # Header button — upload .docx → AI parses → bulk import
│   │   ├── ExportImport.jsx    # Header buttons — JSON export / import
│   │   ├── FolderSidebar.jsx   # Left sidebar: folder list with CRUD
│   │   ├── PromptCard.jsx      # Card in grid — copy, view, edit, folder toggle, delete
│   │   ├── PromptForm.jsx      # Modal — create / edit a prompt
│   │   ├── PromptList.jsx      # Grid of PromptCards
│   │   ├── PromptView.jsx      # Full-screen modal — read, copy, edit, folder assign
│   │   └── SearchBar.jsx       # Search input + category dropdown
│   ├── utils/
│   │   ├── anthropicClient.js  # Anthropic SDK wrapper; throws 'NO_API_KEY' sentinel
│   │   ├── api.js              # AI call functions: generatePrompt(), parseDocument()
│   │   └── storage.js          # All localStorage read/write logic
│   ├── App.css                 # Full application styles (~1070 lines)
│   ├── App.jsx                 # Root component, all state, all event handlers
│   ├── index.css               # Minimal resets (Vite default)
│   └── main.jsx                # ReactDOM.createRoot entry point
├── HANDOVER.md                 # Earlier handover doc (kept for reference)
├── index.html                  # Vite HTML shell
├── package.json
├── package-lock.json
├── server.js                   # Express dev server (local only, NOT used in production)
├── vercel.json                 # Vercel stubs (not currently active)
└── vite.config.js
```

---

## 4. Data Model

All data is stored in three `localStorage` keys:

### `prompt-manager-prompts` — array of prompt objects
```json
{
  "id": "m2abc1xyz",
  "title": "Explain code simply",
  "category": "Coding",
  "tags": ["code", "explain"],
  "text": "Explain the following code as if I were a junior developer...",
  "notes": "Use when onboarding new devs",
  "createdAt": "2026-05-23T12:00:00.000Z",
  "updatedAt": "2026-05-23T12:00:00.000Z"
}
```

### `prompt-manager-folders` — array of folder objects
```json
{
  "id": "n3def2uvw",
  "name": "Coding",
  "createdAt": "2026-05-23T12:00:00.000Z"
}
```

### `prompt-manager-folder-mappings` — array of junction objects (many-to-many)
```json
{ "promptId": "m2abc1xyz", "folderId": "n3def2uvw" }
```

**ID generation:** `Date.now().toString(36) + Math.random().toString(36).slice(2, 8)` — produces short URL-safe strings.

**API key storage:** Stored separately at localStorage key `pm_anthropic_key` (not included in export).

### Export format
`exportPrompts()` produces:
```json
{
  "prompts": [...],
  "folders": [...],
  "mappings": [...]
}
```
Legacy import (plain array of prompts) is also supported.

---

## 5. Component Reference

### `App.jsx` — root
Single source of truth. Holds all state and passes handlers down as props.

**State:**
```js
prompts          // array — loaded from storage
folders          // array — loaded from storage
mappings         // array — loaded from storage
search           // string — search query
categoryFilter   // string — active category filter
folderFilter     // string — active folder ID filter
showForm         // bool — PromptForm modal visible
editingPrompt    // object|null — prompt being edited
showAI           // bool — AIGenerator modal visible
viewingPrompt    // object|null — prompt open in PromptView
showApiKeyModal  // bool — ApiKeyModal visible
```

**Computed (useMemo):**
- `categories` — unique sorted category list
- `promptFolderMap` — `Map<promptId, folderId[]>` from mappings
- `filtered` — filtered prompt list applying folder/category/search

**Key handlers:**
| Handler | What it does |
|---|---|
| `handleSave(data)` | Create or update prompt; set folder assignments; open PromptView |
| `handleAISave(data)` | Save AI-generated prompt; open PromptView |
| `handleDocImport(parsedPrompts)` | Bulk save from Word doc; deduplicates folder names |
| `handleImport(count)` | JSON import result callback |
| `handleNeedApiKey()` | Opens ApiKeyModal (called by DocImport + AIGenerator when no key) |
| `handleApiKeySaved()` | Closes ApiKeyModal |

**Dashboard vs. list view:**  
When `!search && !categoryFilter && !folderFilter` → renders `<Dashboard>`.  
Otherwise → renders `<SearchBar>` + `<PromptList>`.

---

### `Dashboard.jsx`
Shows the 6 most recently added prompts (clickable → PromptView) and a folder tile grid (clickable → sets folderFilter).

Props: `prompts`, `folders`, `mappings`, `onSelectFolder`, `onView`

---

### `FolderSidebar.jsx`
Left sidebar. Lists all folders with prompt counts. Supports inline rename and delete. "All Prompts" entry clears folderFilter.

Props: `folders`, `selectedFolderId`, `onSelect`, `onCreate`, `onRename`, `onDelete`, `mappings`

---

### `PromptCard.jsx`
Card in the grid. Shows title (clickable), category badge, truncated text, notes, folder badges, tags, and action buttons.

Folder button opens a dropdown with checkboxes for all folders — checking/unchecking calls `onAddToFolder` / `onRemoveFromFolder`.

Props: `prompt`, `onEdit`, `onDelete`, `onView`, `folders`, `folderIds`, `onAddToFolder`, `onRemoveFromFolder`

---

### `PromptForm.jsx`
Modal overlay (click outside to cancel). Fields: Title, Category, Tags (comma-separated), Folders (checkboxes), Prompt Text, Notes. Title and text are required.

On submit calls `onSave({ id?, title, category, tags[], text, notes, folderIds[] })`.

Props: `prompt` (null for new), `folders`, `promptFolderIds`, `onSave`, `onCancel`

---

### `PromptView.jsx`
Full-screen modal. Shows all prompt fields. Has a large "Copy Prompt" button with visual feedback, "Save to Folder" dropdown (same checkbox pattern as PromptCard), and Edit button.

Props: `prompt`, `folders`, `folderIds`, `onClose`, `onEdit`, `onAddToFolder`, `onRemoveFromFolder`

---

### `AIGenerator.jsx`
Modal. User describes a need → clicks Generate → Anthropic API returns `{title, description, prompt}` → three editable fields appear → Save to Library.

On `NO_API_KEY` error: closes itself and calls `onNeedApiKey()`.

Props: `onSave`, `onClose`, `onNeedApiKey`

---

### `DocImport.jsx`
Renders a hidden `<input type="file" accept=".docx">` and an "Import Doc" button in the header.

Flow:
1. User picks a `.docx` file
2. `mammoth.extractRawText({ arrayBuffer })` converts to plain text (100% in-browser, no server)
3. `parseDocument(text)` calls Anthropic API → returns array of `{name, description, prompt, folder}`
4. Preview modal lists all extracted prompts
5. User clicks "Import All" → calls `onImport(prompts[])`

On `NO_API_KEY` error: calls `onNeedApiKey()` instead of showing inline error.

Props: `onImport`, `onNeedApiKey`

---

### `ApiKeyModal.jsx`
Simple modal with a password input. Saves to `localStorage.pm_anthropic_key` via `saveApiKey()`. If `onCancel` prop is absent, backdrop click does nothing (forces the user to enter a key).

Props: `onSave`, `onCancel` (optional)

---

### `SearchBar.jsx`
Text input + category `<select>`. Calls `onSearch(value)` on every keystroke and `onCategoryChange(value)` on select change.

Props: `onSearch`, `categories`, `selectedCategory`, `onCategoryChange`

---

### `ExportImport.jsx`
Two buttons: Export (triggers JSON download) and Import (hidden file input for `.json` files).

Props: `onImport(count)`

---

### `PromptList.jsx`
Maps `prompts` array to `PromptCard` components. Passes down folder props.

Props: `prompts`, `onEdit`, `onDelete`, `onView`, `folders`, `promptFolderMap`, `onAddToFolder`, `onRemoveFromFolder`

---

## 6. Utility / Logic Files

### `src/utils/anthropicClient.js`
```js
import Anthropic from '@anthropic-ai/sdk';

export const API_KEY_STORAGE = 'pm_anthropic_key';

export function getClient() {
  const apiKey = localStorage.getItem(API_KEY_STORAGE);
  if (!apiKey) throw new Error('NO_API_KEY');    // sentinel — caught by AIGenerator + DocImport
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export function hasApiKey() { return !!localStorage.getItem(API_KEY_STORAGE); }
export function saveApiKey(key) { localStorage.setItem(API_KEY_STORAGE, key.trim()); }
export function clearApiKey() { localStorage.removeItem(API_KEY_STORAGE); }
```

**`dangerouslyAllowBrowser: true`** is required because the Anthropic SDK detects a browser environment and refuses to run without it. The user's API key is never sent anywhere except directly to `api.anthropic.com`.

---

### `src/utils/api.js`
```js
import { getClient } from './anthropicClient';

export async function generatePrompt(description)
// Model: claude-sonnet-4-6, max_tokens: 1024
// Returns: { title, description, prompt }
// Uses regex /\{[\s\S]*\}/ before JSON.parse as safety net

export async function parseDocument(text)
// Model: claude-sonnet-4-6, max_tokens: 4096
// Returns: [{ name, description, prompt, folder }]
// Uses regex /\[[\s\S]*\]/ before JSON.parse as safety net
```

Both functions propagate the `NO_API_KEY` error from `getClient()` — callers must handle it.

---

### `src/utils/storage.js`
Pure localStorage CRUD. No side effects beyond reading/writing the three keys.

| Function | Description |
|---|---|
| `getPrompts()` | Read all prompts |
| `savePrompt({title, category, tags, text, notes})` | Create new prompt, returns it |
| `updatePrompt(id, updates)` | Merge updates, bumps updatedAt |
| `deletePrompt(id)` | Remove prompt + clean its mappings |
| `getAllCategories()` | Sorted unique categories |
| `getFolders()` | Read all folders |
| `saveFolder(name)` | Create new folder, returns it |
| `renameFolder(id, newName)` | Update folder name |
| `deleteFolder(id)` | Remove folder + clean its mappings |
| `getMappings()` | Read all prompt↔folder junction rows |
| `setPromptFolders(promptId, folderIds[])` | Replace all folder assignments for a prompt |
| `addPromptToFolder(promptId, folderId)` | Add single mapping (idempotent) |
| `removePromptFromFolder(promptId, folderId)` | Remove single mapping |
| `getFolderIdsForPrompt(promptId)` | Array of folder IDs for a prompt |
| `getPromptIdsInFolder(folderId)` | Array of prompt IDs in a folder |
| `exportPrompts()` | JSON string of {prompts, folders, mappings} |
| `importPrompts(jsonString)` | Merge by ID, returns {promptsAdded, foldersAdded} |

---

## 7. CSS Design System

File: `src/App.css` (~1070 lines)

### Custom properties (`:root`)
```css
--sage: #7c9a7e          /* primary brand colour */
--sage-light: #a8c5aa    /* lighter sage for hover states */
--sage-dark: #5a7a5c     /* darker sage for pressed states */
--surface: #ffffff        /* card / modal background */
--bg: #f5f4f1            /* page background */
--border: #e8e6e1        /* dividers, input borders */
--radius: 10px           /* standard border-radius */
--radius-lg: 16px        /* modals, large cards */
```

### Layout
- `.app` → flex column, min-height 100vh
- `.app-header` → sticky top bar, flex, space-between
- `.app-layout` → flex row: sidebar + main
- `.app-main` → flex-grow, overflow-y scroll

### Modals
All modals use `.modal-overlay` (fixed full-screen semi-transparent backdrop) with the inner panel as a child. Click outside → close (via `onClick` on overlay + `stopPropagation` on panel).

Specific modal classes: `.prompt-form`, `.ai-generator`, `.api-key-modal`, `.doc-import-preview`, `.prompt-view-overlay` / `.prompt-view`

### Badge system
`.badge` base class + modifiers:
- `.category-badge` — sage background
- `.folder-badge` — blue tint
- `.tag-badge` — grey tint

### Buttons
`.btn` base → `.btn-primary` (sage fill), `.btn-accent` (darker accent), `.btn-danger` (red), `.btn-sm` (smaller padding)

### Component-specific classes
| Class | Component |
|---|---|
| `.folder-sidebar` | FolderSidebar |
| `.folder-item`, `.folder-item.active` | FolderSidebar items |
| `.prompt-card` | PromptCard |
| `.dashboard`, `.dashboard-section` | Dashboard |
| `.dashboard-recent`, `.dashboard-recent-item` | Dashboard recent list |
| `.dashboard-folders`, `.dashboard-folder-item` | Dashboard folder grid |
| `.folder-dropdown`, `.folder-dropdown-menu` | Folder assign dropdowns |
| `.folder-dropdown-item` | Checkbox label in dropdown |
| `.doc-import-error` | Error in DocImport |
| `.doc-import-list`, `.doc-import-item` | Preview list in DocImport |
| `.doc-import-item-header`, `.doc-import-item-name` | DocImport item rows |
| `.doc-import-item-desc`, `.doc-import-item-prompt` | DocImport content |
| `.api-key-input` | Password input in ApiKeyModal |
| `.api-key-link` | Console link in ApiKeyModal |
| `.copy-btn-large` | Big copy button in PromptView |
| `.prompt-view-text` | Prompt body in PromptView (monospace, bg) |
| `.search-bar` | SearchBar container |
| `.prompt-count` | "N prompts in Folder" label |

---

## 8. Features Reference

### Creating a prompt (manual)
1. Click "New Prompt" → `PromptForm` modal opens
2. Fill Title (required), optional fields, select folders, enter text (required)
3. Save → `handleSave()` → `savePrompt()` + `setPromptFolders()` → `PromptView` auto-opens

### Editing a prompt
- Click "Edit" on any `PromptCard` or `PromptView` → opens `PromptForm` pre-filled
- Save calls `updatePrompt()` with the same ID

### AI Generate
1. Click "AI Generate" (checks `hasApiKey()` first — if missing, opens ApiKeyModal instead)
2. Describe the use case
3. Click "Generate" → `generatePrompt(description)` → Anthropic API
4. Edit the returned title / when-to-use / prompt text
5. "Save to Library" → `handleAISave()` → `PromptView` auto-opens

### Word Document Import
1. Click "Import Doc" → opens file picker (`.docx` only)
2. `mammoth.extractRawText()` runs in-browser — no server call
3. `parseDocument(text)` calls Anthropic API with full document text
4. Preview modal shows all extracted prompts grouped by folder
5. "Import All" → `handleDocImport()` creates folders (deduped by lower-case name) + prompts

### JSON Export / Import
- Export: downloads `prompts-export.json` with `{prompts, folders, mappings}`
- Import: reads `.json` file, merges by ID (no duplicates), shows counts

### Folder management
- Sidebar: create folder, click to filter, inline rename (pencil icon), delete
- Dashboard: folder tiles show prompt counts, click to filter
- PromptCard: "Folders" dropdown with checkboxes
- PromptView: "Save to Folder" dropdown with checkboxes
- PromptForm: folder checkboxes during create/edit

---

## 9. Deployment Pipeline

### GitHub Actions (`deploy.yml`)
Triggers on every push to `main` (and via `workflow_dispatch`).

```yaml
jobs:
  build-and-deploy:
    steps:
      - actions/checkout@v4
      - actions/setup-node@v4  (node 20, npm cache)
      - npm ci
      - npm run build           # env: GITHUB_PAGES=true → sets vite base to /prompt-manager/
      - touch dist/.nojekyll    # prevents GitHub Jekyll from blocking _assets
      - JamesIves/github-pages-deploy-action@v4  # deploys dist/ to gh-pages branch
```

### Vite base path
```js
// vite.config.js
base: process.env.GITHUB_PAGES ? '/prompt-manager/' : '/'
```
Locally: `base: '/'`. On GitHub Pages: `base: '/prompt-manager/'`.  
Without this, all asset paths would be wrong on Pages.

### `.nojekyll`
GitHub Pages runs Jekyll by default, which ignores files starting with `_`. Vite outputs `_assets/`. The `touch dist/.nojekyll` step disables Jekyll, ensuring those files are served.

### CRITICAL: MCP push_files vs create_or_update_file
In this project's development environment, code is pushed to GitHub via MCP tools (direct `git push` is blocked in the sandbox):
- **`mcp__github__push_files`** — creates commits but does **NOT** trigger GitHub Actions.
- **`mcp__github__create_or_update_file`** — creates a single-file commit via the GitHub API that **DOES** trigger Actions.

To force a deployment, use `create_or_update_file` to touch any file (e.g. the README or a comment in vite.config.js). The workflow will detect the push to `main` and rebuild.

### Checking deployment status
Go to: `https://github.com/hhkes/prompt-manager/actions`  
The most recent run should show success. Then check the `gh-pages` branch to confirm the commit SHA matches.

---

## 10. Local Development Setup

### Prerequisites
- Node.js 20+
- An Anthropic API key (from `https://console.anthropic.com/settings/keys`)

### Steps
```bash
git clone https://github.com/hhkes/prompt-manager
cd prompt-manager
npm install

# Start the React dev server only (AI features work via browser-direct API calls)
npm run dev
# → http://localhost:5173
```

On first launch, click the "⚠️ API Key" button in the header to enter your Anthropic key. It is saved to localStorage and persists across sessions.

### Optional: local Express server
`server.js` provides `/api/generate` and `/api/parse-document` endpoints that proxy Anthropic calls. These are **not used in production** (GitHub Pages is static) but may be useful for local development without exposing the API key to the browser.

To use it, create `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```
Then:
```bash
npm run start   # starts both Express (port 3001) and Vite (port 5173)
```
The Vite dev proxy routes `/api/*` to `http://localhost:3001`.

---

## 11. AI Integration — Client-Side Architecture

### Why client-side?
The app is hosted on GitHub Pages (static hosting only). There is no server to proxy API calls. The Anthropic SDK supports browser usage with `dangerouslyAllowBrowser: true`, so all AI calls run directly in the user's browser.

### Security model
- The API key is stored only in the user's `localStorage` — it never touches any server other than `api.anthropic.com`.
- The user is responsible for their own key and usage costs.
- `dangerouslyAllowBrowser: true` is an explicit opt-in required by the Anthropic SDK to acknowledge this design.

### Error handling pattern
`getClient()` throws `new Error('NO_API_KEY')` if no key is stored.  
Components catch this specific message:
```js
catch (err) {
  if (err.message === 'NO_API_KEY') {
    onNeedApiKey();   // opens ApiKeyModal
  } else {
    setError(err.message || 'Failed');
  }
}
```
This prevents generic error toasts and guides the user to set their key.

### Models used
| Feature | Model | max_tokens |
|---|---|---|
| AI Generate | `claude-sonnet-4-6` | 1024 |
| Doc Import parsing | `claude-sonnet-4-6` | 4096 |

### JSON extraction safety
Both API functions use a regex match before `JSON.parse`:
```js
const jsonMatch = raw.match(/\{[\s\S]*\}/);   // for objects
const jsonMatch = raw.match(/\[[\s\S]*\]/);   // for arrays
return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
```
This handles cases where the model adds preamble text before the JSON.

---

## 12. Known Constraints and Gotchas

### 1. localStorage only — no persistence across devices
Data is tied to the browser. To move data between devices, use Export (JSON) and Import.

### 2. GitHub Actions not triggered by some MCP push methods
If working from an AI coding sandbox where `git push` is blocked, the `push_files` MCP tool creates commits but doesn't trigger Actions. Use `create_or_update_file` for at least one file per deployment.

### 3. mammoth only handles `.docx`
Plain `.doc` files (old binary format) are not supported. The file picker is set to `.docx` only.

### 4. No authentication
The app has no login. Data is per-browser, per-origin. Multiple users on the same browser share the same localStorage.

### 5. Large localStorage
No size limit is enforced. Very large libraries of long prompts could hit the ~5 MB localStorage limit. There is no warning or pagination.

### 6. Anthropic API costs
Doc Import parses the entire document text in one API call (up to 4096 output tokens). For very large Word documents with many prompts, this can be expensive. There is no chunking.

### 7. vite.config.js base path
`GITHUB_PAGES=true` must be set during production builds. Without it, all asset URLs break on GitHub Pages. The Actions workflow sets this env var; local `npm run build` does not need it.

### 8. React 19
React 19 has breaking changes vs React 18 (e.g. `useEffect` strict mode double-invocation, ref behaviour). If upgrading other packages, verify React 19 compatibility.

---

## 13. Session Change Log

Changes made during the session that produced this handover document (relative to commit `5a2e057`):

### New files added
| File | Purpose |
|---|---|
| `src/utils/anthropicClient.js` | Wraps Anthropic SDK; handles key storage and `NO_API_KEY` sentinel |
| `src/components/ApiKeyModal.jsx` | Modal for entering/updating Anthropic API key |
| `src/components/DocImport.jsx` | Word document import feature |
| `src/components/Dashboard.jsx` | Home dashboard (recent prompts + folder tiles) |
| `HANDOVER.md` | Earlier handover documentation |
| `api/generate.js` | Vercel serverless stub (not currently active) |
| `api/parse-document.js` | Vercel serverless stub (not currently active) |
| `vercel.json` | Vercel config (not currently active) |

### Modified files
| File | What changed |
|---|---|
| `src/utils/api.js` | Completely rewritten: no longer fetches `/api/*` endpoints; now calls Anthropic SDK directly in-browser |
| `src/App.jsx` | Added DocImport, ApiKeyModal, Dashboard; added `handleDocImport`, `handleNeedApiKey`, `handleApiKeySaved`; header buttons updated |
| `src/components/AIGenerator.jsx` | Added `onNeedApiKey` prop; handles `NO_API_KEY` gracefully |
| `src/components/PromptView.jsx` | Added "Save to Folder" dropdown with checkbox list |
| `src/App.css` | Added doc-import styles, api-key-modal styles |
| `package.json` | Added `mammoth ^1.12.0`, `@anthropic-ai/sdk ^0.88.0`, `dotenv ^17.4.1` |
| `.github/workflows/deploy.yml` | Added `permissions: contents: write`; added `.nojekyll` step |
| `vite.config.js` | `base` made conditional on `GITHUB_PAGES` env var |

### Architectural shift
The most significant change was **moving all AI calls from a backend Express server to the browser** using `@anthropic-ai/sdk` with `dangerouslyAllowBrowser: true`. This was required because GitHub Pages serves only static files — there is no server to proxy API calls.

### Deployment trigger discovery
`mcp__github__push_files` creates commits that do **not** trigger GitHub Actions. `mcp__github__create_or_update_file` does trigger Actions. This was discovered when the gh-pages branch stayed stale at commit `5a2e057` despite multiple `push_files` calls.

---

## 14. Rebuild Checklist

Use this to recreate the project from scratch:

```
□ npm create vite@latest prompt-manager -- --template react
□ cd prompt-manager && npm install
□ npm install @anthropic-ai/sdk mammoth dotenv
□ Replace src/ with the files described in sections 5 and 6
□ Replace src/App.css with the full CSS file
□ Create .github/workflows/deploy.yml (see section 9)
□ Update vite.config.js base path (see section 9)
□ Push to GitHub; enable GitHub Pages from gh-pages branch in repo Settings
□ Verify Actions run and gh-pages branch is updated
□ Open the live URL; click "⚠️ API Key" and enter Anthropic key
□ Test: create a prompt manually
□ Test: AI Generate
□ Test: Import Doc (.docx with prompts)
□ Test: Export then Import JSON
□ Test: folder create, rename, delete
□ Test: search and filter
```

### Minimum file set for core functionality (no AI)
1. `src/utils/storage.js`
2. `src/components/PromptForm.jsx`
3. `src/components/PromptCard.jsx`
4. `src/components/PromptList.jsx`
5. `src/components/SearchBar.jsx`
6. `src/components/ExportImport.jsx`
7. `src/App.jsx` (stripped of AI/DocImport imports)
8. `src/App.css`

Add AI features on top:
9. `src/utils/anthropicClient.js`
10. `src/utils/api.js`
11. `src/components/ApiKeyModal.jsx`
12. `src/components/AIGenerator.jsx`
13. `src/components/DocImport.jsx`

Add UI enhancements:
14. `src/components/Dashboard.jsx`
15. `src/components/FolderSidebar.jsx`
16. `src/components/PromptView.jsx`

---

*Generated by Claude (claude-sonnet-4-6) on 23 May 2026.*
