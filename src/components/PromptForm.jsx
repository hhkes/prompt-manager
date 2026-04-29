import { useState, useEffect } from 'react';

export default function PromptForm({ prompt, folders, promptFolderIds, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFolderIds, setSelectedFolderIds] = useState([]);

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title || '');
      setCategory(prompt.category || '');
      setTagsInput((prompt.tags || []).join(', '));
      setText(prompt.text || '');
      setNotes(prompt.notes || '');
    }
  }, [prompt]);

  useEffect(() => {
    setSelectedFolderIds(promptFolderIds || []);
  }, [promptFolderIds]);

  function toggleFolder(folderId) {
    setSelectedFolderIds((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;

    onSave({
      id: prompt?.id,
      title: title.trim(),
      category: category.trim(),
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      text: text.trim(),
      notes: notes.trim(),
      folderIds: selectedFolderIds,
    });

    if (!prompt) {
      setTitle('');
      setCategory('');
      setTagsInput('');
      setText('');
      setNotes('');
      setSelectedFolderIds([]);
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form className="prompt-form" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h2>{prompt ? 'Edit Prompt' : 'New Prompt'}</h2>

        <label>
          Title *
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label>
          Category
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Coding, Writing, Research" />
        </label>

        <label>
          Tags (comma-separated)
          <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g. python, debug, api" />
        </label>

        <label>
          Folders
          {folders.length > 0 ? (
            <div className="folder-checkboxes">
              {folders.map((f) => (
                <label key={f.id} className="folder-checkbox-label" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedFolderIds.includes(f.id)}
                    onChange={() => toggleFolder(f.id)}
                  />
                  {f.name}
                </label>
              ))}
            </div>
          ) : (
            <div className="folder-none-hint">No folders created yet</div>
          )}
        </label>

        <label>
          Prompt Text *
          <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} required />
        </label>

        <label>
          Notes
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes about when to use this prompt..." />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">{prompt ? 'Update' : 'Save'}</button>
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
