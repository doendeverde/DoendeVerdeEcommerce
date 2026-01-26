/**
 * Revalidation Helper
 * 
 * Funções utilitárias para revalidar cache do Next.js via API.
 * Usado no admin após criar/editar/deletar recursos.
 */

/**
 * Revalidate specific paths
 * 
 * @example
 * // Após criar produto
 * await revalidatePaths(["/", "/products"]);
 * 
 * // Após editar produto
 * await revalidatePaths(["/", "/products", `/products/${slug}`]);
 */
export async function revalidatePaths(paths: string[]): Promise<boolean> {
  try {
    const secret = process.env.REVALIDATE_SECRET;
    
    if (!secret) {
      console.warn("[Revalidate] REVALIDATE_SECRET not configured - skipping revalidation");
      return false;
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    
    const response = await fetch(`${baseUrl}/api/revalidate?secret=${secret}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paths }),
    });

    if (!response.ok) {
      console.error("[Revalidate] Failed:", await response.text());
      return false;
    }

    const data = await response.json();
    console.log("[Revalidate] Success:", data);
    
    return true;
  } catch (error) {
    console.error("[Revalidate] Error:", error);
    return false;
  }
}

/**
 * Revalidate by tags
 * 
 * @example
 * await revalidateTags(["products"]);
 */
export async function revalidateTags(tags: string[]): Promise<boolean> {
  try {
    const secret = process.env.REVALIDATE_SECRET;
    
    if (!secret) {
      console.warn("[Revalidate] REVALIDATE_SECRET not configured - skipping revalidation");
      return false;
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    
    const response = await fetch(`${baseUrl}/api/revalidate?secret=${secret}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tags }),
    });

    if (!response.ok) {
      console.error("[Revalidate] Failed:", await response.text());
      return false;
    }

    const data = await response.json();
    console.log("[Revalidate] Success:", data);
    
    return true;
  } catch (error) {
    console.error("[Revalidate] Error:", error);
    return false;
  }
}

/**
 * Revalidate product-related pages
 * Call this after creating, updating, or deleting a product
 */
export async function revalidateProductPages(productSlug?: string): Promise<void> {
  const paths = ["/", "/products"];
  
  if (productSlug) {
    paths.push(`/products/${productSlug}`);
  }

  await revalidatePaths(paths);
}

/**
 * Revalidate subscription-related pages
 * Call this after creating, updating, or deleting a subscription plan
 */
export async function revalidateSubscriptionPages(planSlug?: string): Promise<void> {
  const paths = ["/subscriptions"];
  
  if (planSlug) {
    paths.push(`/checkout/subscription/${planSlug}`);
  }

  await revalidatePaths(paths);
}

/**
 * Revalidate category-related pages
 * Call this after creating, updating, or deleting a category
 */
export async function revalidateCategoryPages(): Promise<void> {
  await revalidatePaths(["/", "/products"]);
}
