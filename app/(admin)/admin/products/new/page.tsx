import { adminService } from "@/services/admin.service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductForm } from "../ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Página de criação de novo produto (Admin)
 */
export default async function NewProductPage() {
  const categories = await adminService.getCategories();

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para produtos
      </Link>

      <AdminPageHeader
        title="Novo Produto"
        description="Preencha as informações do produto"
      />

      <ProductForm categories={categories} />
    </div>
  );
}
