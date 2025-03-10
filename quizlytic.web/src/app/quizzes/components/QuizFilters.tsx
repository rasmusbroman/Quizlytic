interface QuizFiltersProps {
  showActive: boolean;
  showPaused: boolean;
  showCreated: boolean;
  onToggleActive: () => void;
  onTogglePaused: () => void;
  onToggleCreated: () => void;
}

export default function QuizFilters({
  showActive,
  showPaused,
  showCreated,
  onToggleActive,
  onTogglePaused,
  onToggleCreated,
}: QuizFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      <button
        onClick={onToggleActive}
        className={`px-3 py-1 rounded-md text-sm ${
          showActive
            ? "bg-green-100 text-green-800 border border-green-300"
            : "bg-gray-100 text-gray-600 border border-gray-200"
        }`}
      >
        Active
      </button>
      <button
        onClick={onTogglePaused}
        className={`px-3 py-1 rounded-md text-sm ${
          showPaused
            ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
            : "bg-gray-100 text-gray-600 border border-gray-200"
        }`}
      >
        Paused
      </button>
      <button
        onClick={onToggleCreated}
        className={`px-3 py-1 rounded-md text-sm ${
          showCreated
            ? "bg-blue-100 text-blue-800 border border-blue-300"
            : "bg-gray-100 text-gray-600 border border-gray-200"
        }`}
      >
        Draft
      </button>
    </div>
  );
}
