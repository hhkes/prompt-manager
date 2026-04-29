import { useRef } from 'react';
import { exportPrompts, importPrompts } from '../utils/storage';

export default function ExportImport({ onImport }) {
  const fileRef = useRef();

  function handleExport() {
    const data = exportPrompts();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const result = importPrompts(ev.target.result);
        onImport(result);
      } catch (err) {
        alert('Failed to import: ' + err.message);
      }
      fileRef.current.value = '';
    };
    reader.readAsText(file);
  }

  return (
    <div className="export-import">
      <button onClick={handleExport} className="btn btn-sm">Export</button>
      <label className="btn btn-sm import-btn">
        Import
        <input type="file" accept=".json" ref={fileRef} onChange={handleImport} hidden />
      </label>
    </div>
  );
}
