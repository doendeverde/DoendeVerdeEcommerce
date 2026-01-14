import { Search, SlidersHorizontal } from "lucide-react";

/**
 * Home Page — Product Catalog
 * 
 * Features:
 * - Search bar
 * - Category filters
 * - Product grid
 */
export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-muted" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-border rounded-xl text-sm placeholder:text-gray-muted focus:outline-none focus:ring-2 focus:ring-primary-green/20 focus:border-primary-green transition-colors"
          />
        </div>

        {/* Filters Button */}
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-border rounded-xl text-sm font-medium text-text-primary hover:bg-gray-bg transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Category Chips */}
      <CategoryFilters />

      {/* Products Grid - Placeholder */}
      <ProductsGrid />
    </div>
  );
}

/**
 * Category filter chips
 */
function CategoryFilters() {
  const categories = [
    { id: "all", label: "Todos", active: true },
    { id: "acessorios", label: "Acessórios", active: false },
    { id: "piteiras", label: "Piteiras", active: false },
    { id: "bongs", label: "Bongs", active: false },
    { id: "sedas", label: "Sedas", active: false },
    { id: "vaporizadores", label: "Vaporizadores", active: false },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${cat.active
              ? "bg-primary-green text-white"
              : "bg-white border border-gray-border text-text-primary hover:bg-gray-bg"
            }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Products grid - placeholder cards
 */
function ProductsGrid() {
  // Placeholder products for layout demonstration
  const placeholderProducts = [
    {
      id: "1",
      name: "Dichavador Premium Metal",
      description: "Dichavador de metal com 4 partes e filtro",
      category: "Acessórios",
      originalPrice: 89.90,
      price: 71.92,
      points: 90,
      stock: 15,
      image: null,
    },
    {
      id: "2",
      name: "Piteira de Vidro Artesanal",
      description: "Piteira de vidro borossilicato artesanal",
      category: "Piteiras",
      originalPrice: 45.00,
      price: 36.00,
      points: 45,
      stock: 8,
      image: null,
    },
    {
      id: "3",
      name: "Bong de Vidro 30cm",
      description: "Bong de vidro borossilicato com percolador",
      category: "Bongs",
      originalPrice: 159.90,
      price: 127.92,
      points: 160,
      stock: 3,
      image: null,
      lowStock: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {placeholderProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    category: string;
    originalPrice: number;
    price: number;
    points: number;
    stock: number;
    image: string | null;
    lowStock?: boolean;
  };
}

/**
 * Product card component
 */
function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="group bg-white rounded-xl border border-gray-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-bg">
        {/* Placeholder for image */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-muted">
          <span className="text-sm">Imagem do produto</span>
        </div>

        {/* Low Stock Badge */}
        {product.lowStock && (
          <span className="absolute top-3 right-3 px-2 py-1 text-xs font-medium text-white bg-primary-purple rounded-md">
            Últimas unidades
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category & Stock */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 bg-primary-green-light text-primary-green font-medium rounded-md">
            {product.category}
          </span>
          <span className="text-text-secondary">
            ● {product.stock} em estoque
          </span>
        </div>

        {/* Name & Description */}
        <div>
          <h3 className="font-semibold text-text-primary group-hover:text-primary-green transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-text-secondary line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>

        {/* Points */}
        <div className="flex items-center gap-1 text-sm text-primary-green">
          <span>★</span>
          <span>+{product.points} pontos</span>
        </div>

        {/* Price & Add to Cart */}
        <div className="flex items-end justify-between pt-2">
          <div>
            {product.originalPrice !== product.price && (
              <p className="text-sm text-text-secondary line-through">
                {formatPrice(product.originalPrice)}
              </p>
            )}
            <p className="text-lg font-bold text-text-primary">
              {formatPrice(product.price)}
            </p>
          </div>

          <button
            className="p-3 bg-primary-green text-white rounded-xl hover:bg-primary-green-hover transition-colors"
            aria-label="Adicionar ao carrinho"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
