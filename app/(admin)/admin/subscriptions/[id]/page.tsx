import { notFound } from "next/navigation";
import { adminService } from "@/services/admin.service";
import { SubscriptionPlanForm } from "@/components/admin/subscriptions";

interface EditPlanPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSubscriptionPlanPage({ params }: EditPlanPageProps) {
  const { id } = await params;
  const plan = await adminService.getSubscriptionPlanById(id);

  if (!plan) {
    notFound();
  }

  return (
    <SubscriptionPlanForm
      mode="edit"
      initialData={{
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description || "",
        shortDescription: plan.shortDescription || "",
        price: plan.price,
        billingCycle: plan.billingCycle as "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL",
        features: plan.features || [],
        imageUrl: plan.imageUrl || "",
        isActive: plan.isActive,
        isFeatured: plan.isFeatured,
      }}
    />
  );
}
