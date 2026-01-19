"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  Upload,
  X,
  Plus,
  Image as ImageIcon,
  GripVertical,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductStatus } from "@prisma/client";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  displayOrder: number;
  isPrimary: boolean;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockAlert: number;
  loyaltyPoints: number;
  status: ProductStatus;
  isPublished: boolean;
  categoryId: string;
  images: ProductImage[];
}

interface ProductFormProps {
  product?: ProductData;
  categories: Category[];
  isEditing?: boolean;
}

const statusOptions: { value: ProductStatus; label: string }[] = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "OUT_OF_STOCK", label: "Sem estoque" },
  { value: "DISCONTINUED", label: "Descontinuado" },
];

/**
 * Formulário de produto para criação/edição
 * Inclui upload de imagens e validação
 */
export function ProductForm({ product, categories, isEditing }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    basePrice: product?.basePrice?.toString() || "",
    compareAtPrice: product?.compareAtPrice?.toString() || "",
    stock: product?.stock?.toString() || "0",
    lowStockAlert: product?.lowStockAlert?.toString() || "5",
    loyaltyPoints: product?.loyaltyPoints?.toString() || "0",
    status: product?.status || "DRAFT" as ProductStatus,
    isPublished: product?.isPublished ?? false,
    categoryId: product?.categoryId || "",
  });

  const [images, setImages] = useState<ProductImage[]>(product?.images || []);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : generateSlug(name),
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const addImage = () => {
    if (!newImageUrl.trim()) return;

    const newImage: ProductImage = {
      id: `temp-${Date.now()}`,
      url: newImageUrl.trim(),
      altText: null,
      displayOrder: images.length,
      isPrimary: images.length === 0,
    };

    setImages((prev) => [...prev, newImage]);
    setNewImageUrl("");
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      // If removed image was primary, make first image primary
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const setPrimaryImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate
      if (!formData.name.trim()) throw new Error("Nome é obrigatório");
      if (!formData.categoryId) throw new Error("Categoria é obrigatória");
      if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
        throw new Error("Preço deve ser maior que zero");
      }

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description.trim(),
        basePrice: parseFloat(formData.basePrice),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        stock: parseInt(formData.stock) || 0,
        lowStockAlert: parseInt(formData.lowStockAlert) || 5,
        loyaltyPoints: parseInt(formData.loyaltyPoints) || 0,
        status: formData.status,
        isPublished: formData.isPublished,
        categoryId: formData.categoryId,
        images: images.map((img, index) => ({
          url: img.url,
          altText: img.altText,
          displayOrder: index,
          isPrimary: img.isPrimary,
        })),
      };

      const url = isEditing
        ? `/api/admin/products/${product!.id}`
        : "/api/admin/products";

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar produto");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">
              Informações Básicas
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Nome do produto *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple bg-gray-bg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple resize-none"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-gray-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Preço</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Preço comparativo (R$)
                </label>
                <input
                  type="number"
                  name="compareAtPrice"
                  value={formData.compareAtPrice}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="Preço original para mostrar desconto"
                  className="w-full px-3 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple"
                />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-xl border border-gray-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Estoque</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Quantidade em estoque
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Alerta de estoque baixo
                </label>
                <input
                  type="number"
                  name="lowStockAlert"
                  value={formData.lowStockAlert}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Pontos de fidelidade
                </label>
                <input
                  type="number"
                  name="loyaltyPoints"
                  value={formData.loyaltyPoints}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl border border-gray-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Imagens</h2>

            {/* Image list */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={cn(
                      "relative group rounded-lg overflow-hidden border-2",
                      img.isPrimary ? "border-primary-purple" : "border-gray-border"
                    )}
                  >
                    <img
                      src={img.url}
                      alt={img.altText || "Imagem do produto"}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(img.id)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          img.isPrimary
                            ? "bg-primary-purple text-white"
                            : "bg-white text-text-primary hover:bg-gray-bg"
                        )}
                        title="Definir como principal"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="p-2 rounded-lg bg-white text-red-600 hover:bg-red-50 transition-colors"
                        title="Remover"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {img.isPrimary && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-primary-purple text-white rounded">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add image by URL */}
            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Cole a URL da imagem"
                className="flex-1 px-3 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple"
              />
              <button
                type="button"
                onClick={addImage}
                className="px-4 py-2 bg-gray-bg text-text-primary rounded-lg hover:bg-gray-border transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>
            <p className="text-xs text-text-secondary">
              Adicione imagens usando URLs. A primeira imagem ou a marcada com estrela será a principal.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Status</h2>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Status do produto
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-border text-primary-purple focus:ring-primary-purple/20"
              />
              <span className="text-sm text-text-primary">
                Publicado na loja
              </span>
            </label>
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl border border-gray-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Categoria</h2>

            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-border p-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-purple text-white font-medium rounded-lg hover:bg-primary-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? "Salvar alterações" : "Criar produto"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
