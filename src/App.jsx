import { useState, useEffect, useMemo } from 'react';
import SearchBar from './components/SearchBar';
import PromptList from './components/PromptList';
import PromptForm from './components/PromptForm';
import PromptView from './components/PromptView';
import AIGenerator from './components/AIGenerator';
import ExportImport from './components/ExportImport';
import FolderSidebar from './components/FolderSidebar';
import Dashboard from './components/Dashboard';
import {
  getPrompts,
  savePrompt,
  updatePrompt,
  deletePrompt,
  getAllCategories,
  getFolders,
  saveFolder,
  renameFolder,
  deleteFolder as deleteFolderStorage,
  getMappings,
  setPromptFolders,
  addPromptToFolder,
  removePromptFromFolder,
  getFolderIdsForPrompt,
} from './utils/storage';
import './App.css';

export default function App() {
  const [prompts, setPrompts] = useState([]);
  const [folders, setFolders] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [viewingPrompt, setViewingPrompt] = useState(null);

  function refresh() {
    setPrompts(getPrompts());
    setFolders(getFolders());
    setMappings(getMappings());
  }

  useEffect(() => {
    refresh();
  }, []);

  const categories = useMemo(() => getAllCategories(), [prompts]);

  // Build a map: promptId -> folderIds[]
  const promptFolderMap = useMemo(() => {
    const map = new Map();
    for (const m of mappings) {
      if (!map.has(m.promptId)) map.set(m.promptId, []);
      map.get(m.promptId).push(m.folderId);
    }
    return map;
  }, [mappings]);

  const filtered = useMemo(() => {
    let list = prompts;

    // Folder filter
    if (folderFilter) {
      const idsInFolder = new Set(
        mappings.filter((m) => m.folderId === folderFilter).map((m) => m.promptId)
      );
      list = list.filter((p) => idsInFolder.has(p.id));
    }

    // Category filter
    if (categoryFilter) {
      list = list.filter((p) => p.category === categoryFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.text.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.notes || '').toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [prompts, search, categoryFilter, folderFilter, mappings]);

  function handleSave(data) {
    let saved;
    if (data.id) {
      saved = updatePrompt(data.id, data);
    } else {
      saved = savePrompt(data);
    }
    setPromptFolders(saved.id, data.folderIds || []);
    refresh();
    setShowForm(false);
    setEditingPrompt(null);
    if (!data.id) setViewingPrompt(saved);
  }

  function handleEdit(prompt) {
    setEditingPrompt(prompt);
    setShowForm(true);
  }

  function handleDelete(id) {
    if (confirm('Delete this prompt?')) {
      deletePrompt(id);
      refresh();
    }
  }

  function handleAISave(data) {
    const created = savePrompt(data);
    setPromptFolders(created.id, data.folderIds || []);
    refresh();
    setShowAI(false);
    setViewingPrompt(created);
  }

  function handleImport(count) {
    refresh();
    if (typeof count === 'object') {
      alert(`Imported ${count.promptsAdded} prompt${count.promptsAdded !== 1 ? 's' : ''} and ${count.foldersAdded} folder${count.foldersAdded !== 1 ? 's' : ''}.`);
    } else {
      alert(`Imported ${count} new prompt${count !== 1 ? 's' : ''}.`);
    }
  }

  // Folder handlers
  function handleCreateFolder(name) {
    saveFolder(name);
    refresh();
  }

  function handleRenameFolder(id, newName) {
    renameFolder(id, newName);
    refresh();
  }

  function handleDeleteFolder(id) {
    deleteFolderStorage(id);
    if (folderFilter === id) setFolderFilter('');
    refresh();
  }

  function handleAddToFolder(promptId, folderId) {
    addPromptToFolder(promptId, folderId);
    refresh();
  }

  function handleRemoveFromFolder(promptId, folderId) {
    removePromptFromFolder(promptId, folderId);
    refresh();
  }

  function handleView(prompt) {
    setViewingPrompt(prompt);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Prompt Manager</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => { setEditingPrompt(null); setShowForm(true); }}>
            New Prompt
          </button>
          <button className="btn btn-accent" onClick={() => setShowAI(true)}>
            AI Generate
          </button>
          <ExportImport onImport={handleImport} />
        </div>
      </header>

      <div className="app-layout">
        <FolderSidebar
          folders={folders}
          selectedFolderId={folderFilter}
          onSelect={setFolderFilter}
          onCreate={handleCreateFolder}
          onRename={handleRenameFolder}
          onDelete={handleDeleteFolder}
          mappings={mappings}
        />

        <main className="app-main">
          {!search && !categoryFilter && !folderFilter ? (
            <Dashboard
              prompts={prompts}
              folders={folders}
              mappings={mappings}
              onSelectFolder={(id) => setFolderFilter(id)}
              onView={handleView}
            />
          ) : (
            <>
              <SearchBar
                onSearch={setSearch}
                categories={categories}
                selectedCategory={categoryFilter}
                onCategoryChange={setCategoryFilter}
              />
              <div className="prompt-count">
                {filtered.length} prompt{filtered.length !== 1 ? 's' : ''}
                {folderFilter && folders.find((f) => f.id === folderFilter)
                  ? ` in ${folders.find((f) => f.id === folderFilter).name}`
                  : ''}
              </div>
              <PromptList
                prompts={filtered}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                folders={folders}
                promptFolderMap={promptFolderMap}
                onAddToFolder={handleAddToFolder}
                onRemoveFromFolder={handleRemoveFromFolder}
              />
            </>
          )}
        </main>
      </div>

      {showForm && (
        <PromptForm
          prompt={editingPrompt}
          folders={folders}
          promptFolderIds={editingPrompt ? getFolderIdsForPrompt(editingPrompt.id) : []}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingPrompt(null); }}
        />
      )}

      {showAI && (
        <AIGenerator onSave={handleAISave} onClose={() => setShowAI(false)} />
      )}

      {viewingPrompt && (
        <PromptView
          prompt={viewingPrompt}
          folders={folders}
          folderIds={promptFolderMap.get(viewingPrompt.id) || []}
          onClose={() => setViewingPrompt(null)}
          onEdit={handleEdit}
          onAddToFolder={handleAddToFolder}
          onRemoveFromFolder={handleRemoveFromFolder}
        />
      )}
    </div>
  );
}
