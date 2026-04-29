const STORAGE_KEY = 'prompt-manager-prompts';
const FOLDERS_KEY = 'prompt-manager-folders';
const MAPPINGS_KEY = 'prompt-manager-folder-mappings';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ===== Prompts =====

export function getPrompts() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveAllPrompts(prompts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

export function savePrompt({ title, category, tags, text, notes }) {
  const prompts = getPrompts();
  const now = new Date().toISOString();
  const newPrompt = {
    id: generateId(),
    title,
    category: category || '',
    tags: tags || [],
    text,
    notes: notes || '',
    createdAt: now,
    updatedAt: now,
  };
  prompts.unshift(newPrompt);
  saveAllPrompts(prompts);
  return newPrompt;
}

export function updatePrompt(id, updates) {
  const prompts = getPrompts();
  const idx = prompts.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  prompts[idx] = { ...prompts[idx], ...updates, updatedAt: new Date().toISOString() };
  saveAllPrompts(prompts);
  return prompts[idx];
}

export function deletePrompt(id) {
  const prompts = getPrompts().filter((p) => p.id !== id);
  saveAllPrompts(prompts);
  // Clean up mappings for this prompt
  const mappings = getMappings().filter((m) => m.promptId !== id);
  saveAllMappings(mappings);
}

export function getAllCategories() {
  const prompts = getPrompts();
  const cats = new Set(prompts.map((p) => p.category).filter(Boolean));
  return [...cats].sort();
}

export function getAllTags() {
  const prompts = getPrompts();
  const tags = new Set(prompts.flatMap((p) => p.tags || []));
  return [...tags].sort();
}

// ===== Folders =====

export function getFolders() {
  const data = localStorage.getItem(FOLDERS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveAllFolders(folders) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export function saveFolder(name) {
  const folders = getFolders();
  const now = new Date().toISOString();
  const newFolder = {
    id: generateId(),
    name,
    createdAt: now,
  };
  folders.push(newFolder);
  saveAllFolders(folders);
  return newFolder;
}

export function renameFolder(id, newName) {
  const folders = getFolders();
  const idx = folders.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  folders[idx].name = newName;
  saveAllFolders(folders);
  return folders[idx];
}

export function deleteFolder(id) {
  const folders = getFolders().filter((f) => f.id !== id);
  saveAllFolders(folders);
  // Clean up mappings for this folder
  const mappings = getMappings().filter((m) => m.folderId !== id);
  saveAllMappings(mappings);
}

// ===== Folder–Prompt Mappings =====

export function getMappings() {
  const data = localStorage.getItem(MAPPINGS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveAllMappings(mappings) {
  localStorage.setItem(MAPPINGS_KEY, JSON.stringify(mappings));
}

export function setPromptFolders(promptId, folderIds) {
  let mappings = getMappings().filter((m) => m.promptId !== promptId);
  for (const folderId of folderIds) {
    mappings.push({ promptId, folderId });
  }
  saveAllMappings(mappings);
}

export function addPromptToFolder(promptId, folderId) {
  const mappings = getMappings();
  const exists = mappings.some((m) => m.promptId === promptId && m.folderId === folderId);
  if (!exists) {
    mappings.push({ promptId, folderId });
    saveAllMappings(mappings);
  }
}

export function removePromptFromFolder(promptId, folderId) {
  const mappings = getMappings().filter(
    (m) => !(m.promptId === promptId && m.folderId === folderId)
  );
  saveAllMappings(mappings);
}

export function getFolderIdsForPrompt(promptId) {
  return getMappings()
    .filter((m) => m.promptId === promptId)
    .map((m) => m.folderId);
}

export function getPromptIdsInFolder(folderId) {
  return getMappings()
    .filter((m) => m.folderId === folderId)
    .map((m) => m.promptId);
}

// ===== Export / Import =====

export function exportPrompts() {
  return JSON.stringify(
    {
      prompts: getPrompts(),
      folders: getFolders(),
      mappings: getMappings(),
    },
    null,
    2
  );
}

export function importPrompts(jsonString) {
  const parsed = JSON.parse(jsonString);

  // Legacy format: plain array of prompts
  if (Array.isArray(parsed)) {
    const existing = getPrompts();
    const existingIds = new Set(existing.map((p) => p.id));
    const newPrompts = parsed.filter((p) => !existingIds.has(p.id));
    saveAllPrompts([...newPrompts, ...existing]);
    return { promptsAdded: newPrompts.length, foldersAdded: 0 };
  }

  // New format: { prompts, folders, mappings }
  let promptsAdded = 0;
  let foldersAdded = 0;

  if (parsed.prompts && Array.isArray(parsed.prompts)) {
    const existing = getPrompts();
    const existingIds = new Set(existing.map((p) => p.id));
    const newPrompts = parsed.prompts.filter((p) => !existingIds.has(p.id));
    saveAllPrompts([...newPrompts, ...existing]);
    promptsAdded = newPrompts.length;
  }

  if (parsed.folders && Array.isArray(parsed.folders)) {
    const existing = getFolders();
    const existingIds = new Set(existing.map((f) => f.id));
    const newFolders = parsed.folders.filter((f) => !existingIds.has(f.id));
    saveAllFolders([...existing, ...newFolders]);
    foldersAdded = newFolders.length;
  }

  if (parsed.mappings && Array.isArray(parsed.mappings)) {
    const existing = getMappings();
    const existingSet = new Set(existing.map((m) => `${m.promptId}:${m.folderId}`));
    const newMappings = parsed.mappings.filter(
      (m) => !existingSet.has(`${m.promptId}:${m.folderId}`)
    );
    saveAllMappings([...existing, ...newMappings]);
  }

  return { promptsAdded, foldersAdded };
}
