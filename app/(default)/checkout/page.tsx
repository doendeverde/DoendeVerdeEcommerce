/**
 * Product Checkout Page
 *
 * Server Component that loads cart data and renders checkout flow.
 * Redirects to cart if empty or to login if not authenticated.
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { cartService } from "@/services/cart.service";
import * as addressRepository from "@/repositories/address.repository";
import { ProductCheckoutClient } from "./ProductCheckoutClient";
import type { CartCheckoutData } from "@/types/checkout";

export const metadata = {
  title: "Checkout | Doende HeadShop",
  description: "Finalize sua compra",
};

export default async function ProductCheckoutPage() {
  // 1. Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/checkout");
  }

  // 2. Get cart
  const cart = await cartService.getCart(session.user.id);

  // 3. Redirect if cart is empty
  if (cart.isEmpty) {
    redirect("/products?message=cart_empty");
  }

  // 4. Validate cart (check stock, prices)
  const cartValidation = await cartService.validateCartForCheckout(session.user.id);
  if (!cartValidation.valid) {
    // Redirect to cart page with validation errors
    redirect("/cart?validation=failed");
  }

  // 5. Get user addresses
  const addresses = await addressRepository.findUserAddresses(session.user.id);
  const defaultAddress = addresses.find((a) => a.isDefault);

  // 6. Build checkout data
  const checkoutData: CartCheckoutData = {
    items: cart.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || undefined,
      name: item.product.name + (item.variant ? ` - ${item.variant.name}` : ""),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      image: item.product.image?.url,
    })),
    subtotal: cart.subtotal,
    shipping: 0, // TODO: Calculate shipping
    discount: 0, // TODO: Apply subscription discount
    total: cart.subtotal, // subtotal + shipping - discount
    hasAddress: addresses.length > 0,
    addresses: addresses.map((a) => ({
      id: a.id,
      label: a.label || undefined,
      street: a.street,
      number: a.number,
      city: a.city,
      state: a.state,
      isDefault: a.isDefault,
    })),
    defaultAddressId: defaultAddress?.id || null,
  };

  return (
    <div className="min-h-screen bg-gray-bg py-8">
      <div className="container-main">
        <ProductCheckoutClient data={checkoutData} />
      </div>
    </div>
  );
}
