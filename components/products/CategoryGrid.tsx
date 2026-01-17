/**
 * CategoryGrid Component
 * 
 * Grid de categorias navegável para homepage
 * Usa mesmo estilo que CategoryChips mas em formato de grid
 */

'use client';

import Link from 'next/link';
import { CategoryItem } from '@/types/product';

interface CategoryGridProps {
  categories: CategoryItem[];
  maxDisplay?: number;
}

export function CategoryGrid({ categories, maxDisplay = 6 }: CategoryGridProps) {
  const displayCategories = categories.slice(0, maxDisplay);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {displayCategories.map((category) => (
        <Link
          key={category.id}
          href={`/products?category=${category.slug}`}
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-primary-green hover:shadow-md"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl transition-colors group-hover:bg-green-50">
            🌿
          </div>
          <span className="text-sm font-medium text-center text-gray-700 group-hover:text-primary-green">
            {category.name}
          </span>
          {category.productCount !== undefined && category.productCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 group-hover:bg-green-50">
              {category.productCount}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
