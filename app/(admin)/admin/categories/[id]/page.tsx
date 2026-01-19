import { notFound } from "next/navigation";
import { adminService } from "@/services/admin.service";
import { CategoryForm } from "@/components/admin/categories";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const category = await adminService.getCategoryById(id);

  if (!category) {
    notFound();
  }

  return (
    <CategoryForm
      mode="edit"
      initialData={{
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        imageUrl: category.imageUrl || "",
        isActive: category.isActive,
      }}
    />
  );
}
