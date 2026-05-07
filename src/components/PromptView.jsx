import { useState, useRef, useEffect } from 'react';

export default function PromptView({ prompt, folders, folderIds, onClose, onEdit, onAddToFolder, onRemoveFromFolder }) {
  const [copied, setCopied] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const folderRef = useRef(null);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    if (!showFolderMenu) return;
    function handleClick(e) {
      if (folderRef.current && !folderRef.current.contains(e.target)) {
        setShowFolderMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFolderMenu]);

  const promptFolders = folders.filter((f) => folderIds.includes(f.id));

  return (
    <div className="prompt-view-overlay" onClick={onClose}>
      <div className="prompt-view" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-view-header">
          <div style={{ flex: 1 }} />
          <button className="prompt-view-close" onClick={onClose}>Close</button>
        </div>

        <h1 className="prompt-view-title">{prompt.title}</h1>

        <div className="prompt-view-meta">
          {prompt.category && (
            <span className="badge category-badge">{prompt.category}</span>
          )}
          {promptFolders.map((f) => (
            <span key={f.id} className="badge folder-badge">{f.name}</span>
          ))}
          {prompt.tags?.map((tag) => (
            <span key={tag} className="badge tag-badge">{tag}</span>
          ))}
        </div>

        <div className="prompt-view-actions">
          <button
            className={`copy-btn-large ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? 'Copied to clipboard' : 'Copy Prompt'}
          </button>

          {onAddToFolder && (
            <div className="folder-dropdown" ref={folderRef}>
              <button
                className="btn"
                onClick={() => setShowFolderMenu(!showFolderMenu)}
              >
                Save to Folder
              </button>
              {showFolderMenu && (
                <div className="folder-dropdown-menu">
                  {folders.length === 0 ? (
                    <div className="folder-dropdown-empty">No folders yet</div>
                  ) : (
                    folders.map((f) => {
                      const assigned = folderIds.includes(f.id);
                      return (
                        <label key={f.id} className="folder-dropdown-item">
                          <input
                            type="checkbox"
                            checked={assigned}
                            onChange={() => {
                              if (assigned) onRemoveFromFolder(prompt.id, f.id);
                              else onAddToFolder(prompt.id, f.id);
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
          )}

          <button className="btn" onClick={() => { onEdit(prompt); onClose(); }}>
            Edit
          </button>
        </div>

        <div className="prompt-view-label">Prompt</div>
        <div className="prompt-view-text">{prompt.text}</div>

        {prompt.notes && (
          <>
            <div className="prompt-view-label">Notes</div>
            <div className="prompt-view-notes">{prompt.notes}</div>
          </>
        )}
      </div>
    </div>
  );
}
