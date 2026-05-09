import { useRef, useState } from 'react';
import mammoth from 'mammoth';

export default function DocImport({ onImport, folders, onCreateFolder }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    setLoading(true);
    setError('');
    setPreview(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const { value: text } = await mammoth.extractRawText({ arrayBuffer });

      const response = await fetch('/api/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Failed to parse document');
      }

      const { prompts } = await response.json();
      setPreview(prompts);
    } catch (err) {
      setError(err.message || 'Failed to process document');
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (!preview) return;
    onImport(preview);
    setPreview(null);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".docx"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <button
        className="btn btn-sm"
        onClick={() => inputRef.current.click()}
        disabled={loading}
      >
        {loading ? 'Parsing...' : 'Import Doc'}
      </button>

      {error && (
        <div className="doc-import-error">{error}</div>
      )}

      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="doc-import-preview" onClick={(e) => e.stopPropagation()}>
            <h2>Document Import Preview</h2>
            <p className="ai-subtitle">
              Found {preview.length} prompt{preview.length !== 1 ? 's' : ''}. Review before importing.
            </p>

            <div className="doc-import-list">
              {preview.map((p, i) => (
                <div key={i} className="doc-import-item">
                  <div className="doc-import-item-header">
                    <span className="doc-import-item-name">{p.name}</span>
                    <span className="badge folder-badge">{p.folder}</span>
                  </div>
                  <div className="doc-import-item-desc">{p.description}</div>
                  <div className="doc-import-item-prompt">{p.prompt}</div>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleConfirm}>
                Import All
              </button>
              <button className="btn" onClick={() => setPreview(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
