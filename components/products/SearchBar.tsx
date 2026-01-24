/**
 * SearchBar Component
 *
 * Campo de busca com debounce para evitar múltiplas requisições.
 * O estado local garante UX responsiva enquanto o debounce aguarda.
 */

'use client';

import { Search, X } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar produtos...',
  debounceMs = 400,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  // Local state for immediate UI feedback
  const [localValue, setLocalValue] = useState(value);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local value when external value changes (e.g., URL navigation)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange handler
  const debouncedOnChange = useCallback(
    (newValue: string) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue); // Immediate UI update
    debouncedOnChange(newValue); // Debounced actual change
  };

  const handleClear = () => {
    // Clear immediately without debounce for better UX
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div
      className={`relative flex items-center rounded-full border-2 bg-surface transition-all ${isFocused
        ? 'border-primary-green shadow-sm ring-2 ring-primary-green/20'
        : 'border-gray-200 dark:border-gray-700'
        }`}
    >
      <Search
        className={`ml-4 h-5 w-5 flex-shrink-0 transition-colors ${isFocused ? 'text-primary-green' : 'text-gray-400 dark:text-gray-500'
          }`}
      />
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="mr-2 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
