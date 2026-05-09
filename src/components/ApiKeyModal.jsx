import { useState } from 'react';
import { saveApiKey } from '../utils/anthropicClient';

export default function ApiKeyModal({ onSave, onCancel }) {
  const [key, setKey] = useState('');

  function handleSave() {
    const trimmed = key.trim();
    if (!trimmed) return;
    saveApiKey(trimmed);
    onSave();
  }

  return (
    <div className="modal-overlay" onClick={onCancel || undefined}>
      <div className="api-key-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Anthropic API Key</h2>
        <p className="ai-subtitle">
          Required for AI Generate and Doc Import. Your key is saved only in your browser and sent
          directly to Anthropic — never to any third-party server.
        </p>
        <input
          className="api-key-input"
          type="password"
          placeholder="sk-ant-..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={!key.trim()}>
            Save Key
          </button>
          {onCancel && (
            <button className="btn" onClick={onCancel}>Cancel</button>
          )}
        </div>
        <a
          className="api-key-link"
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
        >
          Get your API key at console.anthropic.com →
        </a>
      </div>
    </div>
  );
}
