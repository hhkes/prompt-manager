# Prompt Manager — Complete Handover Document

A personal AI prompt library. Store, organise, search, and copy prompts. Import prompts in bulk from a Word document using AI extraction. Generate new prompts with AI. All data lives in the browser (localStorage) — no database, no login.

---

## Technology Stack

| Layer | Choice |
|---|---|
| UI framework | React 19 (JSX, hooks) |
| Build tool | Vite 8 |
| Styling | Plain CSS custom properties (no Tailwind, no CSS-in-JS) |
| State / persistence | Browser localStorage |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) called directly from browser |
| Word doc parsing | `mammoth` (browser-compatible .docx → plain text) |
| Hosting | GitHub Pages (static, no server needed) |

---

## Project Structure

```
prompt-manager/
├── src/
│   ├── App.jsx                        # Root component — all state lives here
│   ├── App.css                        # All styles in one file
│   ├── main.jsx                       # React entry point
│   ├── components/
│   │   ├── Dashboard.jsx              # Home view: recently added + folder cards
│   │   ├── SearchBar.jsx              # Search input + category dropdown
│   │   ├── PromptList.jsx             # Renders list of PromptCard
│   │   ├── PromptCard.jsx             # Single prompt card (copy/view/edit/folder)
│   │   ├── PromptView.jsx             # Full-screen modal to view a prompt
│   │   ├── PromptForm.jsx             # Create / edit prompt modal
│   │   ├── AIGenerator.jsx            # AI-powered prompt generation modal
│   │   ├── DocImport.jsx              # Word doc upload → AI parse → preview → import
│   │   ├── ApiKeyModal.jsx            # Enter / update Anthropic API key
│   │   ├── FolderSidebar.jsx          # Left sidebar: folder list, create, rename, delete
│   │   └── ExportImport.jsx           # JSON backup export and import
│   └── utils/
│       ├── storage.js                 # All localStorage read/write logic
│       ├── anthropicClient.js         # Creates Anthropic SDK client from stored key
│       └── api.js                     # generatePrompt() and parseDocument() calls
├── index.html
├── vite.config.js
├── package.json
├── server.js                          # Optional local Node server (not used in production)
├── api/
│   ├── generate.js                    # Vercel serverless stub (not currently used)
│   └── parse-document.js              # Vercel serverless stub (not currently used)
└── .github/workflows/deploy.yml       # GitHub Actions → gh-pages auto-deploy
```

---

## Data Model

Everything is stored in three localStorage keys:

### `prompt-manager-prompts` — array of prompt objects
```json
{
  "id": "lz4x2abc",
  "title": "Professional email about delays",
  "category": "Writing",
  "tags": ["email", "professional"],
  "text": "You are a professional communications expert...",
  "notes": "Use when a project is running late and you need to inform a client",
  "createdAt": "2026-05-10T10:00:00.000Z",
  "updatedAt": "2026-05-10T10:00:00.000Z"
}
```

### `prompt-manager-folders` — array of folder objects
```json
{
  "id": "m7abc123",
  "name": "Marketing",
  "createdAt": "2026-05-10T10:00:00.000Z"
}
```

### `prompt-manager-folder-mappings` — array of join records (many-to-many)
```json
{
  "promptId": "lz4x2abc",
  "folderId": "m7abc123"
}
```

A prompt can belong to multiple folders. Deleting a prompt or folder cleans up its mappings automatically.

---

## Key Files — Full Source

### `src/utils/storage.js`
All CRUD for prompts, folders, and mappings. Key functions:

- `getPrompts()` / `savePrompt(data)` / `updatePrompt(id, updates)` / `deletePrompt(id)`
- `getFolders()` / `saveFolder(name)` / `renameFolder(id, name)` / `deleteFolder(id)`
- `getMappings()` / `setPromptFolders(promptId, folderIds[])` / `addPromptToFolder(promptId, folderId)` / `removePromptFromFolder(promptId, folderId)` / `getFolderIdsForPrompt(promptId)`
- `exportPrompts()` — returns JSON string of `{prompts, folders, mappings}`
- `importPrompts(jsonString)` — merges by id, skips duplicates, returns `{promptsAdded, foldersAdded}`

IDs are generated with: `Date.now().toString(36) + Math.random().toString(36).slice(2, 8)`

### `src/utils/anthropicClient.js`
```js
import Anthropic from '@anthropic-ai/sdk';

export const API_KEY_STORAGE = 'pm_anthropic_key';

export function getClient() {
  const apiKey = localStorage.getItem(API_KEY_STORAGE);
  if (!apiKey) throw new Error('NO_API_KEY');
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export function hasApiKey() {
  return !!localStorage.getItem(API_KEY_STORAGE);
}

export function saveApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE, key.trim());
}
```

The error string `'NO_API_KEY'` is a sentinel — components catch it and show the API key modal instead of a generic error.

### `src/utils/api.js`
Two functions that call Claude:

**`generatePrompt(description)`** — given a natural-language description of what a prompt should do, returns `{title, description, prompt}`.

System prompt asks for JSON with exactly three fields: `title` (≤5 words), `description` (one sentence on when to use it), `prompt` (the full optimised prompt text). Uses `claude-sonnet-4-6`, `max_tokens: 1024`.

**`parseDocument(text)`** — given raw text extracted from a .docx file, returns an array of `{name, description, prompt, folder}` objects.

System prompt instructs Claude to identify every distinct AI prompt in the document and assign each one to a category folder (Marketing, Sales, Customer Service, Writing, Analysis, HR, Legal, etc.). Uses `claude-sonnet-4-6`, `max_tokens: 4096`.

Both functions parse the raw text response with a regex (`/\{[\s\S]*\}/` or `/\[[\s\S]*\]/`) before `JSON.parse` as a safety net against any preamble text.

---

## Component Reference

### `App.jsx` — root
Holds all state: `prompts`, `folders`, `mappings` (loaded from storage on mount), plus UI state for which modal is open. On every write it calls `refresh()` which re-reads all three storage collections.

State variables:
- `prompts` / `folders` / `mappings` — data
- `search`, `categoryFilter`, `folderFilter` — active filters
- `showForm`, `editingPrompt` — create/edit modal
- `showAI` — AI generator modal
- `viewingPrompt` — full view modal
- `showApiKeyModal` — API key modal

When no filter is active (`!search && !categoryFilter && !folderFilter`), the main area shows `<Dashboard>`. Otherwise it shows `<SearchBar>` + `<PromptList>`.

After saving a new prompt (both manual and AI-generated), `viewingPrompt` is set to the new prompt so it opens immediately.

`handleDocImport(parsedPrompts)` — receives the array from DocImport, iterates through each parsed prompt, finds or creates the folder by name (case-insensitive), saves the prompt, then calls `addPromptToFolder`. Uses a `Map<lowerName, id>` built at the start to avoid duplicate folder creation within the same import batch.

### `Dashboard.jsx`
- Shows the 6 most recently added prompts (click to open PromptView)
- Shows folder grid with prompt count per folder (click to filter by folder)
- No folders section if `folders.length === 0`

### `FolderSidebar.jsx`
Left sidebar. "All Prompts" item always shown at top (clears folder filter). Each folder item shows prompt count badge, inline rename input (Enter/Escape), delete button (confirm dialog). Add-folder form at the bottom.

### `PromptCard.jsx`
Displayed in the list. Shows title, category badge, truncated text, notes, folder badges, tag badges. Action buttons: Copy (clipboard, 1.5s feedback), View (opens PromptView), Edit (opens PromptForm), Folders (dropdown checkbox to assign/unassign folders), Delete (confirm dialog). Outside-click closes the folder dropdown.

### `PromptView.jsx`
Full-screen overlay modal. Shows all metadata, "Copy Prompt" button (large, green, feedback on copy), "Save to Folder" dropdown (checkbox list), "Edit" button. Outside click closes. `folderIds` prop passed in so it knows current folder assignments.

### `PromptForm.jsx`
Create/edit modal. Fields: Title (required), Category (free text), Tags (comma-separated), Folders (checkbox list), Prompt Text (required), Notes. On submit calls `onSave({id?, title, category, tags[], text, notes, folderIds[]})`.

### `AIGenerator.jsx`
1. User types a description of what they need a prompt for
2. Click "Generate Prompt" → calls `generatePrompt()` from api.js
3. On `NO_API_KEY` error: closes itself and calls `onNeedApiKey()` to show ApiKeyModal
4. On success: shows three editable fields — Prompt Name, When to use, Prompt Text
5. "Save to Library" saves with category `'AI Generated'` and tag `'ai-generated'`

### `DocImport.jsx`
1. Hidden `<input type="file" accept=".docx">` triggered by "Import Doc" button
2. On file select: reads as `ArrayBuffer`, passes to `mammoth.extractRawText()` to get plain text
3. Sends text to `parseDocument()` from api.js
4. On `NO_API_KEY` error: calls `onNeedApiKey()` (does NOT show an error inline)
5. On success: shows preview modal listing every extracted prompt with name, folder badge, description, prompt text
6. "Import All" calls `onImport(preview)` → `handleDocImport` in App.jsx

### `ApiKeyModal.jsx`
Password input (monospace font), "Save Key" button, link to `console.anthropic.com/settings/keys`. Saves to `pm_anthropic_key` in localStorage. `onCancel` prop is optional — if not provided, the backdrop click does nothing (used when key is required to proceed).

### `ExportImport.jsx`
- Export: calls `exportPrompts()`, creates a Blob, triggers download as `prompts-backup-YYYY-MM-DD.json`
- Import: hidden file input, reads JSON, calls `importPrompts()`, alerts with count

---

## App.css Design System

All styles in one file. CSS custom properties defined on `:root`:

```css
--sage: #7c9a7e;        /* primary green */
--sage-light: #a8c5aa;  /* accent green */
--sage-dark: #5a7a5c;   /* hover/active green */
--cream: #faf9f7;
--surface: #ffffff;     /* cards, modals */
--bg: #f5f4f1;          /* page background */
--border: #e8e6e1;
--text: #2c2c2c;
--muted: #888;
--radius: 10px;
--radius-lg: 16px;
--shadow: 0 2px 12px rgba(0,0,0,0.08);
```

Badge colours:
- Category: green (`#eef4ee` / `#5a7a5c`)
- Folder: purple (`#f0eef8` / `#5b4b8a`)
- Tag: amber (`#fdf4e3` / `#7a5c00`)

Modal pattern: `.modal-overlay` (fixed, full-screen, blur backdrop) containing a centred card (`.prompt-form`, `.ai-generator`, `.doc-import-preview`, `.api-key-modal`). Clicking the overlay closes the modal; clicking the card stops propagation.

Prompt card hover effect: negative horizontal margin (`-2rem`) + positive padding to create a "pop out" effect without layout shift.

---

## GitHub Pages Deployment

### Workflow: `.github/workflows/deploy.yml`
```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          GITHUB_PAGES: true
      - run: touch dist/.nojekyll
      - uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist
          branch: gh-pages
          clean: true
```

### `vite.config.js`
```js
base: process.env.GITHUB_PAGES ? '/prompt-manager/' : '/',
```

The `GITHUB_PAGES` env var set in the workflow switches the asset base path from `/` (local dev) to `/prompt-manager/` (GitHub Pages subdirectory). The `.nojekyll` file is required so GitHub doesn't run Jekyll and block the `_` prefixed asset filenames.

### Enabling GitHub Pages
In the repo: Settings → Pages → Source: Deploy from branch → Branch: `gh-pages` / `/ (root)`.

The repo must be **public** for the free GitHub Pages tier. The deployed URL is `https://<username>.github.io/<repo-name>/`.

---

## Local Development

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:3001` (defined in `vite.config.js`). In production (GitHub Pages) there is no backend — all AI calls go directly from the browser to Anthropic's API using the key stored in localStorage.

If you want to run the Node server locally for testing:
```bash
# create .env with:
ANTHROPIC_API_KEY=sk-ant-...

npm run server     # starts server.js on port 3001
```

But the server is not needed for the deployed app.

---

## Setting Up Elsewhere — Step by Step

1. **Create a new repo** on GitHub (public)

2. **Scaffold with Vite:**
   ```bash
   npm create vite@latest prompt-manager -- --template react
   cd prompt-manager
   npm install
   npm install @anthropic-ai/sdk mammoth
   ```

3. **Replace `src/`** with the components and utils described above

4. **Replace `src/App.css`** with the full stylesheet

5. **Update `vite.config.js`:**
   ```js
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     base: process.env.GITHUB_PAGES ? '/your-repo-name/' : '/',
     server: { host: true, allowedHosts: true },
   })
   ```

6. **Create `.github/workflows/deploy.yml`** (copy from above, adjust repo name in base if needed)

7. **Push to GitHub**, go to Settings → Pages, set source to `gh-pages` branch

8. **Open the deployed URL**, click **⚠️ API Key**, enter your Anthropic API key from `console.anthropic.com/settings/keys`

---

## Features Summary

| Feature | How it works |
|---|---|
| Create prompt | PromptForm modal → saves to localStorage |
| Edit prompt | Same form, pre-populated |
| Delete prompt | Confirm dialog, removes prompt + its folder mappings |
| Copy prompt | `navigator.clipboard.writeText`, 1.5s "Copied" feedback |
| Full view | PromptView overlay with all metadata |
| Search | Filters by title, text, category, notes, tags simultaneously |
| Category filter | Dropdown shows all categories currently in use |
| Folders | Sidebar navigation; prompts can belong to multiple folders |
| Assign to folder | Checkbox dropdown on card or in PromptView |
| Dashboard | Home when no filter active: recent prompts + folder grid |
| AI Generate | Describe what you need → Claude writes an optimised prompt |
| Doc Import | Upload .docx → mammoth extracts text → Claude identifies prompts → preview → bulk import into correct folders |
| JSON Export | Downloads full backup including folders and mappings |
| JSON Import | Merges by ID, skips duplicates |
| API key storage | `localStorage('pm_anthropic_key')`, password input, never sent to any server |

---

## Known Constraints

- **No accounts / sync** — data is per-browser, per-device. Use Export/Import to move between browsers.
- **localStorage limit** — typically 5–10 MB. Sufficient for hundreds of prompts.
- **API key security** — key is in localStorage (accessible to JS). Acceptable for a personal single-user tool on a trusted browser. Do not use on shared computers.
- **Anthropic API costs** — each Doc Import and AI Generate call costs API credits. A typical document parse costs roughly $0.01–$0.05 depending on length.
- **Doc Import supports .docx only** — plain text, PDF, or other formats are not supported. mammoth only handles the .docx (Office Open XML) format.
