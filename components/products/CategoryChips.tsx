/**
 * CategoryChips Component
 *
 * Chips de categoria para filtro rápido.
 * Inclui "Todos" como primeira opção.
 */

'use client';

import { CategoryWithCount } from '@/types/product';

interface CategoryChipsProps {
  categories: CategoryWithCount[];
  selectedCategory: string | null;
  onSelect: (categorySlug: string | null) => void;
  isLoading?: boolean;
}

export function CategoryChips({
  categories,
  selectedCategory,
  onSelect,
  isLoading,
}: CategoryChipsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-24 animate-pulse rounded-full bg-gray-200"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* "Todos" chip */}
      <button
        onClick={() => onSelect(null)}
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${selectedCategory === null
            ? 'bg-primary-green text-white shadow-sm'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
      >
        Todos
      </button>

      {/* Category chips */}
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.slug)}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${selectedCategory === category.slug
              ? 'bg-primary-green text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          {category.name}
          <span
            className={`rounded-full px-1.5 py-0.5 text-xs ${selectedCategory === category.slug
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-500'
              }`}
          >
            {category.productCount}
          </span>
        </button>
      ))}
    </div>
  );
}
