import { useState } from "react";
import { FiFilter } from "react-icons/fi";
import { SortOption } from "../hooks/useQuizList";

interface SortDropdownProps {
  sortOptions: SortOption[];
  currentSort: string;
  onSelectSort: (value: string) => void;
}

export default function SortDropdown({
  sortOptions,
  currentSort,
  onSelectSort,
}: SortDropdownProps) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center px-3 py-1 border border-border rounded-md text-foreground hover:bg-accent"
      >
        <span className="mr-2 hidden sm:inline">Sort</span>
        <FiFilter className="w-5 h-5" />
      </button>

      {showOptions && (
        <div className="absolute right-0 mt-1 w-48 bg-card rounded-md shadow-lg z-10 border border-border">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              className={`block w-full text-left px-4 py-2 text-sm ${
                currentSort === option.value
                  ? "bg-accent text-primary"
                  : "text-foreground hover:bg-accent"
              }`}
              onClick={() => {
                onSelectSort(option.value);
                setShowOptions(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
