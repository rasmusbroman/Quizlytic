import { useState } from "react";
import { FiFilter } from "react-icons/fi";

export interface SortOption {
  label: string;
  value: string;
  sortFn: (a: any, b: any) => number;
}

interface SortDropdownProps {
  sortOptions: SortOption[];
  currentSort: string;
  onSelectSort: (value: string) => void;
  className?: string;
}

export default function SortDropdown({
  sortOptions,
  currentSort,
  onSelectSort,
  className = "",
}: SortDropdownProps) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center px-4 py-2 border border-border rounded-md text-foreground hover:bg-accent"
      >
        <span className="mr-2 sm:inline">Sort</span>
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
