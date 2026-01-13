interface TemplateConfigHeaderProps {
  exerciseName: string;
  onClose: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export function TemplateConfigHeader({
  exerciseName,
  onClose,
  onMouseDown,
}: TemplateConfigHeaderProps) {
  return (
    <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg cursor-move select-none">
      <span
        onMouseDown={onMouseDown}
        className="text-sm font-medium truncate flex-1"
      >
        {exerciseName}
      </span>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 text-lg leading-none ml-2 cursor-pointer"
      >
        ×
      </button>
    </div>
  );
}
