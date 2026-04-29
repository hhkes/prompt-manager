import { useState } from 'react';

export default function PromptView({ prompt, folders, folderIds, onClose, onEdit }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const promptFolders = folders.filter((f) => folderIds.includes(f.id));

  return (
    <div className="prompt-view-overlay" onClick={onClose}>
      <div className="prompt-view" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-view-header">
          <div style={{ flex: 1 }} />
          <button className="prompt-view-close" onClick={onClose}>
            Close
          </button>
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
          <button
            className="btn"
            onClick={() => { onEdit(prompt); onClose(); }}
          >
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
