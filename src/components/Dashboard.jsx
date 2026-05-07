export default function Dashboard({ prompts, folders, mappings, onSelectFolder, onView }) {
  const recent = prompts.slice(0, 6);

  function countForFolder(folderId) {
    return mappings.filter((m) => m.folderId === folderId).length;
  }

  return (
    <div className="dashboard">
      <section className="dashboard-section">
        <div className="dashboard-section-title">Recently Added</div>
        {recent.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 0' }}>
            No prompts yet. Click <strong>New Prompt</strong> to get started.
          </div>
        ) : (
          <div className="dashboard-recent">
            {recent.map((p) => (
              <div key={p.id} className="dashboard-recent-item" onClick={() => onView(p)}>
                <div className="dashboard-recent-title">{p.title}</div>
                {p.category && (
                  <span className="badge category-badge">{p.category}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {folders.length > 0 && (
        <section className="dashboard-section">
          <div className="dashboard-section-title">Folders</div>
          <div className="dashboard-folders">
            {folders.map((f) => (
              <div
                key={f.id}
                className="dashboard-folder-item"
                onClick={() => onSelectFolder(f.id)}
              >
                <div className="dashboard-folder-name">{f.name}</div>
                <div className="dashboard-folder-count">
                  {countForFolder(f.id)} prompt{countForFolder(f.id) !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
