import { IoSearch } from "react-icons/io5";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full border border-border rounded-md px-4 py-3 pr-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="absolute right-3 top-3 text-primary">
        <IoSearch className="h-6 w-6" />
      </div>
    </div>
  );
}
