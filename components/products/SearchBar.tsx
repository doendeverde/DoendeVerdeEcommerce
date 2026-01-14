/**
 * SearchBar Component
 *
 * Campo de busca sempre visível no catálogo.
 */

'use client';

import { Search, X } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar produtos...',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div
      className={`relative flex items-center rounded-full border-2 bg-white transition-all ${isFocused
          ? 'border-primary-green shadow-sm ring-2 ring-primary-green/20'
          : 'border-gray-200'
        }`}
    >
      <Search
        className={`ml-4 h-5 w-5 flex-shrink-0 transition-colors ${isFocused ? 'text-primary-green' : 'text-gray-400'
          }`}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none"
      />
      {value && (
        <button
          onClick={handleClear}
          className="mr-2 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
