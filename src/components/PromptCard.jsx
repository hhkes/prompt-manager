import { useState, useEffect, useRef } from 'react';

export default function PromptCard({ prompt, onEdit, onDelete, onView, folders, folderIds, onAddToFolder, onRemoveFromFolder }) {
  const [copied, setCopied] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const dropdownRef = useRef(null);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Close dropdown on outside click
  useEffect(() => {
    if (!showFolderMenu) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowFolderMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFolderMenu]);

  const promptFolders = folders.filter((f) => folderIds.includes(f.id));

  return (
    <div className="prompt-card">
      <div className="prompt-card-header">
        <h3 onClick={() => onView(prompt)}>{prompt.title}</h3>
        {prompt.category && <span className="badge category-badge">{prompt.category}</span>}
      </div>

      <p className="prompt-text">{prompt.text}</p>

      {prompt.notes && <p className="prompt-notes">{prompt.notes}</p>}

      {promptFolders.length > 0 && (
        <div className="prompt-folders-badges">
          {promptFolders.map((f) => (
            <span key={f.id} className="badge folder-badge">{f.name}</span>
          ))}
        </div>
      )}

      {prompt.tags?.length > 0 && (
        <div className="prompt-tags">
          {prompt.tags.map((tag) => (
            <span key={tag} className="badge tag-badge">{tag}</span>
          ))}
        </div>
      )}

      <div className="prompt-card-actions">
        <button onClick={handleCopy} className="btn btn-sm">
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={() => onView(prompt)} className="btn btn-sm">View</button>
        <button onClick={() => onEdit(prompt)} className="btn btn-sm">Edit</button>

        <div className="folder-dropdown" ref={dropdownRef}>
          <button
            onClick={() => setShowFolderMenu(!showFolderMenu)}
            className="btn btn-sm"
          >
            Folders
          </button>
          {showFolderMenu && (
            <div className="folder-dropdown-menu">
              {folders.length === 0 ? (
                <div className="folder-dropdown-empty">No folders yet</div>
              ) : (
                folders.map((f) => {
                  const isAssigned = folderIds.includes(f.id);
                  return (
                    <label key={f.id} className="folder-dropdown-item">
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => {
                          if (isAssigned) {
                            onRemoveFromFolder(prompt.id, f.id);
                          } else {
                            onAddToFolder(prompt.id, f.id);
                          }
                        }}
                      />
                      {f.name}
                    </label>
                  );
                })
              )}
            </div>
          )}
        </div>

        <button onClick={() => onDelete(prompt.id)} className="btn btn-sm btn-danger">Delete</button>
      </div>
    </div>
  );
}
