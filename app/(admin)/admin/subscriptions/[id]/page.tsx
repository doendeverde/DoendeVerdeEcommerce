import { notFound } from "next/navigation";
import { adminService } from "@/services/admin.service";
import { SubscriptionPlanForm } from "@/components/admin/subscriptions";

interface EditPlanPageProps {
  params: Promise<{ id: string }>;
}

// Color scheme interface matching the form
interface ColorScheme {
  primary: string;
  text: string;
  primaryDark: string;
  textDark: string;
  badge?: string;
  icon?: string;
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
        discountPercent: plan.discountPercent || 0,
        billingCycle: plan.billingCycle as "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL",
        colorScheme: (plan.colorScheme as ColorScheme) || null,
        isActive: plan.isActive,
        isFeatured: plan.isFeatured,
        shippingProfileId: plan.shippingProfileId || null,
      }}
    />
  );
}
