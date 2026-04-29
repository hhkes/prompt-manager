import { useState } from 'react';

export default function FolderSidebar({
  folders,
  selectedFolderId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  mappings,
}) {
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  function countForFolder(folderId) {
    return mappings.filter((m) => m.folderId === folderId).length;
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName('');
  }

  function startRename(folder) {
    setRenamingId(folder.id);
    setRenameValue(folder.name);
  }

  function confirmRename(id) {
    if (renameValue.trim()) {
      onRename(id, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  }

  function handleRenameKey(e, id) {
    if (e.key === 'Enter') confirmRename(id);
    if (e.key === 'Escape') {
      setRenamingId(null);
      setRenameValue('');
    }
  }

  return (
    <aside className="folder-sidebar">
      <div className="folder-sidebar-title">Folders</div>

      <ul className="folder-list">
        <li
          className={`folder-item ${selectedFolderId === '' ? 'active' : ''}`}
          onClick={() => onSelect('')}
        >
          <span className="folder-item-name">All Prompts</span>
        </li>

        {folders.map((folder) => (
          <li
            key={folder.id}
            className={`folder-item ${selectedFolderId === folder.id ? 'active' : ''}`}
            onClick={() => onSelect(folder.id)}
          >
            {renamingId === folder.id ? (
              <input
                className="folder-rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => confirmRename(folder.id)}
                onKeyDown={(e) => handleRenameKey(e, folder.id)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <>
                <span className="folder-item-name">{folder.name}</span>
                <span className="folder-item-count">{countForFolder(folder.id)}</span>
                <span className="folder-item-actions">
                  <button
                    className="folder-action-btn"
                    onClick={(e) => { e.stopPropagation(); startRename(folder); }}
                    title="Rename"
                  >
                    ren
                  </button>
                  <button
                    className="folder-action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${folder.name}"?`)) onDelete(folder.id);
                    }}
                    title="Delete"
                  >
                    del
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>

      <form className="folder-add" onSubmit={handleCreate}>
        <input
          className="folder-add-input"
          type="text"
          placeholder="New folder..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="folder-add-btn">Add</button>
      </form>
    </aside>
  );
}
