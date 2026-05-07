import { useState } from 'react';
import { generatePrompt } from '../utils/api';

export default function AIGenerator({ onSave, onClose }) {
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [promptDesc, setPromptDesc] = useState('');
  const [promptText, setPromptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasResult = title || promptText;

  async function handleGenerate() {
    if (!description.trim()) return;
    setLoading(true);
    setError('');
    setTitle('');
    setPromptDesc('');
    setPromptText('');

    try {
      const result = await generatePrompt(description.trim());
      setTitle(result.title || '');
      setPromptDesc(result.description || '');
      setPromptText(result.prompt || '');
    } catch (err) {
      setError(err.message || 'Failed to generate prompt');
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!promptText) return;
    onSave({
      title: title || description.slice(0, 60),
      category: 'AI Generated',
      tags: ['ai-generated'],
      text: promptText,
      notes: promptDesc || `Generated from: "${description}"`,
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ai-generator" onClick={(e) => e.stopPropagation()}>
        <h2>AI Prompt Generator</h2>
        <p className="ai-subtitle">Describe what you need and AI will craft an optimized prompt for you.</p>

        <label>
          What do you need a prompt for?
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. I need a prompt that helps me write professional emails to clients about project delays..."
          />
        </label>

        <button
          onClick={handleGenerate}
          className="btn btn-primary"
          disabled={loading || !description.trim()}
        >
          {loading ? 'Generating...' : 'Generate Prompt'}
        </button>

        {error && <div className="error-msg">{error}</div>}

        {hasResult && (
          <div className="ai-result">
            <label>
              Prompt Name
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short title for this prompt"
              />
            </label>

            <label>
              When to use
              <input
                type="text"
                value={promptDesc}
                onChange={(e) => setPromptDesc(e.target.value)}
                placeholder="When / why to use this prompt"
              />
            </label>

            <label>
              Prompt Text
              <textarea
                rows={8}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
              />
            </label>

            <div className="form-actions">
              <button onClick={handleSave} className="btn btn-primary" disabled={!promptText}>
                Save to Library
              </button>
              <button onClick={onClose} className="btn">Discard</button>
            </div>
          </div>
        )}

        {!hasResult && (
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <button onClick={onClose} className="btn">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
