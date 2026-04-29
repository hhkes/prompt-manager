import { useState } from 'react';
import { generatePrompt } from '../utils/api';

export default function AIGenerator({ onSave, onClose }) {
  const [description, setDescription] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (!description.trim()) return;
    setLoading(true);
    setError('');
    setResult('');

    try {
      const prompt = await generatePrompt(description.trim());
      setResult(prompt);
    } catch (err) {
      setError(err.message || 'Failed to generate prompt');
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!result) return;
    onSave({
      title: description.slice(0, 60) + (description.length > 60 ? '...' : ''),
      category: 'AI Generated',
      tags: ['ai-generated'],
      text: result,
      notes: `Generated from: "${description}"`,
    });
    setDescription('');
    setResult('');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ai-generator" onClick={(e) => e.stopPropagation()}>
        <h2>AI Prompt Generator</h2>
        <p className="ai-subtitle">Describe what you need and AI will craft an optimized prompt for you.</p>

        <label>
          What do you need a prompt for?
          <textarea
            rows={4}
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

        {result && (
          <div className="ai-result">
            <label>
              Generated Prompt (edit if needed):
              <textarea
                rows={8}
                value={result}
                onChange={(e) => setResult(e.target.value)}
              />
            </label>
            <div className="form-actions">
              <button onClick={handleSave} className="btn btn-primary">Save to Library</button>
              <button onClick={onClose} className="btn">Discard</button>
            </div>
          </div>
        )}

        {!result && (
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <button onClick={onClose} className="btn">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
