import PromptCard from './PromptCard';

export default function PromptList({ prompts, onEdit, onDelete, onView, folders, promptFolderMap, onAddToFolder, onRemoveFromFolder }) {
  if (prompts.length === 0) {
    return <div className="empty-state">No prompts found. Add one or try a different search.</div>;
  }

  return (
    <div className="prompt-list">
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          folders={folders}
          folderIds={promptFolderMap.get(prompt.id) || []}
          onAddToFolder={onAddToFolder}
          onRemoveFromFolder={onRemoveFromFolder}
        />
      ))}
    </div>
  );
}
