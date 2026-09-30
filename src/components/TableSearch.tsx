import React from "react";
import Image from "@/components/Image";

interface TableSearchProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const TableSearch: React.FC<TableSearchProps> = ({
  value = "",
  onChange,
  placeholder = "Search...",
}) => {
  return (
    <div className="flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-200 px-3 py-2 focus-within:ring-purple-400 bg-white transition">
      <Image src="/search.png" alt="search" width={14} height={14} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-[180px] bg-transparent outline-none text-xs text-gray-700 placeholder-gray-400"
      />
      {value && (
        <button
          onClick={() => onChange?.("")}
          className="text-gray-400 hover:text-gray-600 text-xs"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default TableSearch;