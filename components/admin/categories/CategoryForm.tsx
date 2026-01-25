"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, ImageIcon } from "lucide-react";
import Link from "next/link";

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

interface CategoryFormProps {
  initialData?: CategoryFormData & { id: string };
  mode: "create" | "edit";
}

/**
 * Gera slug a partir do nome
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-") // Remove hífens duplicados
    .trim();
}

export default function CategoryForm({ initialData, mode }: CategoryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    isActive: initialData?.isActive ?? true,
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-gera slug apenas se o slug ainda não foi editado manualmente
      slug: prev.slug === generateSlug(prev.name) ? generateSlug(name) : prev.slug,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = mode === "create"
        ? "/api/admin/categories"
        : `/api/admin/categories/${initialData?.id}`;

      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slug: formData.slug || generateSlug(formData.name),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar categoria");
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/categories"
          className="p-2 hover:bg-hover-bg rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-default">
            {mode === "create" ? "Nova Categoria" : "Editar Categoria"}
          </h1>
          <p className="text-muted text-sm">
            {mode === "create"
              ? "Preencha os dados para criar uma nova categoria"
              : `Editando: ${initialData?.name}`}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card-bg rounded-xl border border-gray-border p-6 space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">Informações Básicas</h2>

              {/* Nome */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className="w-full px-4 py-3 bg-gray-bg border border-gray-border rounded-lg text-text-primary placeholder-gray-muted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Ex: Papéis e Sedas"
                />
              </div>

              {/* Slug */}
              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Slug (URL)
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-bg border border-gray-border rounded-lg text-text-primary placeholder-gray-muted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="papeis-e-sedas"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  Identificador único usado na URL. Gerado automaticamente a partir do nome.
                </p>
              </div>

              {/* Descrição */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Descrição
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-bg border border-gray-border rounded-lg text-text-primary placeholder-gray-muted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                  placeholder="Uma breve descrição da categoria..."
                />
              </div>
            </div>
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-card-bg rounded-xl border border-gray-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Status</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-muted rounded-full peer peer-checked:bg-green-500 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </div>
                <span className="text-text-secondary">Categoria ativa</span>
              </label>
              <p className="mt-2 text-xs text-text-secondary">
                Categorias inativas não aparecem no site.
              </p>
            </div>

            {/* Imagem */}
            <div className="bg-card-bg rounded-xl border border-gray-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Imagem</h2>
              <div>
                <label
                  htmlFor="imageUrl"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  URL da Imagem
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-bg border border-gray-border rounded-lg text-text-primary placeholder-gray-muted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              {/* Preview */}
              <div className="mt-4">
                {formData.imageUrl ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-bg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-gray-bg flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-muted" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-border">
          <Link
            href="/admin/categories"
            className="px-6 py-3 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {mode === "create" ? "Criar Categoria" : "Salvar Alterações"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
