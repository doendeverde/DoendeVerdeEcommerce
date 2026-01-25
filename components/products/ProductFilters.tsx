/**
 * ProductFilters Component
 *
 * Filtros avançados: preço, estoque, ordenação.
 * Modal em mobile, sidebar em desktop.
 */

'use client';

import { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';

interface ProductFiltersProps {
  minPrice: number | undefined;
  maxPrice: number | undefined;
  inStock: boolean;
  sortBy: 'price' | 'name' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  onFiltersChange: (filters: {
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: 'price' | 'name' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }) => void;
  onClear: () => void;
}

const sortOptions = [
  { value: 'createdAt-desc', label: 'Mais recentes' },
  { value: 'createdAt-asc', label: 'Mais antigos' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'name-asc', label: 'A-Z' },
  { value: 'name-desc', label: 'Z-A' },
];

export function ProductFilters({
  minPrice,
  maxPrice,
  inStock,
  sortBy,
  sortOrder,
  onFiltersChange,
  onClear,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice?.toString() || '');
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice?.toString() || '');

  const hasActiveFilters =
    minPrice !== undefined ||
    maxPrice !== undefined ||
    inStock ||
    sortBy !== 'createdAt' ||
    sortOrder !== 'desc';

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-') as [
      'price' | 'name' | 'createdAt',
      'asc' | 'desc'
    ];
    onFiltersChange({ sortBy: newSortBy, sortOrder: newSortOrder });
  };

  const handleApplyPriceFilter = () => {
    onFiltersChange({
      minPrice: localMinPrice ? parseFloat(localMinPrice) : undefined,
      maxPrice: localMaxPrice ? parseFloat(localMaxPrice) : undefined,
    });
  };

  const handleClear = () => {
    setLocalMinPrice('');
    setLocalMaxPrice('');
    onClear();
  };

  return (
    <>
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${hasActiveFilters
          ? 'bg-primary-purple text-white'
          : 'bg-gray-bg text-text-primary hover:bg-hover-bg'
          }`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
        {hasActiveFilters && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
            !
          </span>
        )}
      </button>

      {/* Sort Dropdown (always visible) */}
      <div className="relative">
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => handleSortChange(e.target.value)}
          className="appearance-none rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 pr-10 text-sm font-medium text-gray-700 dark:text-gray-300 outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Filter Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-auto rounded-t-2xl bg-white dark:bg-gray-900 p-6 shadow-xl md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Filtros</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-hover-bg hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-text-primary">
                Faixa de Preço
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    R$
                  </span>
                  <input
                    type="number"
                    value={localMinPrice}
                    onChange={(e) => setLocalMinPrice(e.target.value)}
                    placeholder="Min"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary-green focus:ring-2 focus:ring-primary-green/20"
                  />
                </div>
                <span className="text-gray-400">—</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    R$
                  </span>
                  <input
                    type="number"
                    value={localMaxPrice}
                    onChange={(e) => setLocalMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary-green focus:ring-2 focus:ring-primary-green/20"
                  />
                </div>
              </div>
            </div>

            {/* In Stock Toggle */}
            <div className="mb-6">
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-sm font-medium text-text-primary">
                  Apenas em estoque
                </span>
                <button
                  onClick={() => onFiltersChange({ inStock: !inStock })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${inStock ? 'bg-primary-green' : 'bg-gray-border'
                    }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${inStock ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClear}
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Limpar
              </button>
              <button
                onClick={() => {
                  handleApplyPriceFilter();
                  setIsOpen(false);
                }}
                className="flex-1 rounded-lg bg-primary-green py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
