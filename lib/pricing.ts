/**
 * Pricing Utility - Server-Side Only
 *
 * FONTE DE VERDADE para cálculo de preços.
 * 
 * REGRA DE NEGÓCIO FUNDAMENTAL:
 * - Produto tem UM preço base fixo (basePrice).
 * - Desconto NÃO pertence ao produto. Desconto é EXCLUSIVAMENTE da assinatura.
 * - Sem assinatura => NÃO existe desconto.
 * - Com assinatura => desconto aplicado sobre basePrice.
 * 
 * Este módulo é server-side only para garantir que:
 * 1. O preço NUNCA venha do cliente (anti-fraude)
 * 2. A validação de assinatura ativa seja feita no banco
 * 3. Arredondamentos sejam consistentes
 * 
 * IMPORTANTE: Todos os dados de desconto vêm do banco de dados (SubscriptionPlan.discountPercent)
 */

import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PriceCalculationResult {
  /** Preço base do produto (sem desconto) */
  basePrice: number;
  /** Preço final após desconto (se aplicável) */
  finalPrice: number;
  /** Valor do desconto aplicado */
  discountAmount: number;
  /** Percentual de desconto aplicado (0-100) */
  discountPercent: number;
  /** Se há desconto ativo */
  hasDiscount: boolean;
  /** Label explicativo do desconto (ex: "Desconto Doende Bronze") */
  discountLabel: string | null;
  /** Slug do plano que dá o desconto (null se sem assinatura) */
  planSlug: string | null;
}

export interface CartItemPriceResult extends PriceCalculationResult {
  quantity: number;
  lineTotalBase: number;
  lineTotalFinal: number;
  lineDiscountAmount: number;
}

export interface CartPriceSummary {
  items: CartItemPriceResult[];
  subtotalBase: number;
  subtotalFinal: number;
  totalDiscount: number;
  discountLabel: string | null;
  hasSubscriptionDiscount: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Pricing Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula o preço de um produto considerando assinatura do usuário.
 * 
 * @param productId - ID do produto
 * @param userId - ID do usuário (opcional - sem usuário = sem desconto)
 * @returns Resultado do cálculo de preço
 */
export async function computePriceForUser(
  productId: string,
  userId?: string | null
): Promise<PriceCalculationResult> {
  // 1. Buscar produto do banco (fonte de verdade)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { basePrice: true },
  });

  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const basePrice = Number(product.basePrice);

  // 2. Se não há usuário, não há desconto
  if (!userId) {
    return {
      basePrice,
      finalPrice: basePrice,
      discountAmount: 0,
      discountPercent: 0,
      hasDiscount: false,
      discountLabel: null,
      planSlug: null,
    };
  }

  // 3. Verificar assinatura ativa do usuário (com discountPercent do banco)
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    include: {
      plan: {
        select: {
          slug: true,
          name: true,
          discountPercent: true,
        },
      },
    },
  });

  // 4. Se não há assinatura ativa, não há desconto
  if (!subscription) {
    return {
      basePrice,
      finalPrice: basePrice,
      discountAmount: 0,
      discountPercent: 0,
      hasDiscount: false,
      discountLabel: null,
      planSlug: null,
    };
  }

  // 5. Obter desconto do plano do banco de dados
  const discountPercent = subscription.plan.discountPercent;

  // 6. Se plano não tem desconto (ex: gratuito), retornar preço base
  if (discountPercent <= 0) {
    return {
      basePrice,
      finalPrice: basePrice,
      discountAmount: 0,
      discountPercent: 0,
      hasDiscount: false,
      discountLabel: null,
      planSlug: subscription.plan.slug,
    };
  }

  // 7. Calcular desconto com arredondamento consistente
  const discountAmount = roundPrice(basePrice * (discountPercent / 100));
  const finalPrice = roundPrice(basePrice - discountAmount);

  return {
    basePrice,
    finalPrice,
    discountAmount,
    discountPercent,
    hasDiscount: true,
    discountLabel: `Desconto ${subscription.plan.name}`,
    planSlug: subscription.plan.slug,
  };
}

/**
 * Calcula preço usando slug do plano diretamente (para preview/checkout).
 * Útil quando o usuário está selecionando um plano mas ainda não assinou.
 * NOTA: Esta função requer o discountPercent diretamente pois não tem acesso ao banco.
 * 
 * @param basePrice - Preço base do produto
 * @param planSlug - Slug do plano de assinatura (opcional)
 * @param discountPercent - Percentual de desconto do plano (deve vir do banco)
 * @returns Resultado do cálculo de preço
 */
export function computePriceWithPlan(
  basePrice: number,
  planSlug?: string | null,
  discountPercent?: number
): PriceCalculationResult {
  // Se não há plano ou desconto, não há desconto
  if (!planSlug || !discountPercent || discountPercent <= 0) {
    return {
      basePrice,
      finalPrice: basePrice,
      discountAmount: 0,
      discountPercent: 0,
      hasDiscount: false,
      discountLabel: null,
      planSlug: planSlug || null,
    };
  }

  // Obter nome do plano para o label
  const planName = getPlanDisplayName(planSlug);
  const discountAmount = roundPrice(basePrice * (discountPercent / 100));
  const finalPrice = roundPrice(basePrice - discountAmount);

  return {
    basePrice,
    finalPrice,
    discountAmount,
    discountPercent,
    hasDiscount: true,
    discountLabel: `Desconto ${planName}`,
    planSlug,
  };
}

/**
 * Calcula preços para todos os itens do carrinho.
 * 
 * @param userId - ID do usuário
 * @returns Resumo de preços do carrinho
 */
export async function computeCartPrices(userId: string): Promise<CartPriceSummary> {
  // 1. Buscar carrinho com itens
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: { basePrice: true },
          },
          variant: {
            select: { price: true },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return {
      items: [],
      subtotalBase: 0,
      subtotalFinal: 0,
      totalDiscount: 0,
      discountLabel: null,
      hasSubscriptionDiscount: false,
    };
  }

  // 2. Buscar assinatura ativa com discountPercent do banco
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { plan: { select: { slug: true, name: true, discountPercent: true } } },
  });

  const planSlug = subscription?.plan.slug || null;
  const discountPercent = subscription?.plan.discountPercent || 0;
  const discountLabel = subscription && discountPercent > 0 ? `Desconto ${subscription.plan.name}` : null;
  const hasSubscriptionDiscount = discountPercent > 0;

  // 3. Calcular cada item
  let subtotalBase = 0;
  let subtotalFinal = 0;
  let totalDiscount = 0;

  const items: CartItemPriceResult[] = cart.items.map((item) => {
    // Preço base: variante ou produto
    const basePrice = item.variant?.price
      ? Number(item.variant.price)
      : Number(item.product.basePrice);

    const quantity = item.quantity;

    // Calcular desconto
    let discountAmount = 0;
    let finalPrice = basePrice;

    if (hasSubscriptionDiscount) {
      discountAmount = roundPrice(basePrice * (discountPercent / 100));
      finalPrice = roundPrice(basePrice - discountAmount);
    }

    const lineTotalBase = roundPrice(basePrice * quantity);
    const lineTotalFinal = roundPrice(finalPrice * quantity);
    const lineDiscountAmount = roundPrice(lineTotalBase - lineTotalFinal);

    subtotalBase += lineTotalBase;
    subtotalFinal += lineTotalFinal;
    totalDiscount += lineDiscountAmount;

    return {
      basePrice,
      finalPrice,
      discountAmount,
      discountPercent,
      hasDiscount: hasSubscriptionDiscount,
      discountLabel,
      planSlug,
      quantity,
      lineTotalBase,
      lineTotalFinal,
      lineDiscountAmount,
    };
  });

  return {
    items,
    subtotalBase: roundPrice(subtotalBase),
    subtotalFinal: roundPrice(subtotalFinal),
    totalDiscount: roundPrice(totalDiscount),
    discountLabel,
    hasSubscriptionDiscount,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Functions (Anti-fraud)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida se o preço recebido corresponde ao preço calculado.
 * USAR NO CHECKOUT para garantir que o cliente não manipulou o preço.
 * 
 * @param productId - ID do produto
 * @param userId - ID do usuário
 * @param claimedPrice - Preço que o cliente alegou
 * @param tolerance - Tolerância em centavos (default 1 centavo)
 * @returns true se o preço é válido
 */
export async function validatePrice(
  productId: string,
  userId: string | null,
  claimedPrice: number,
  tolerance: number = 0.01
): Promise<boolean> {
  const calculated = await computePriceForUser(productId, userId);
  return Math.abs(calculated.finalPrice - claimedPrice) <= tolerance;
}

/**
 * Valida e retorna o preço correto para checkout.
 * Se o preço alegado não bater, retorna o preço correto do servidor.
 * 
 * @param productId - ID do produto
 * @param userId - ID do usuário
 * @returns Preço calculado corretamente
 */
export async function getValidatedPrice(
  productId: string,
  userId: string | null
): Promise<PriceCalculationResult> {
  return computePriceForUser(productId, userId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Arredonda preço para 2 casas decimais de forma consistente.
 * Usa Math.round para evitar problemas de floating point.
 */
export function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Obtém o nome de exibição do plano a partir do slug.
 */
function getPlanDisplayName(slug: string): string {
  const names: Record<string, string> = {
    gratuito: "Gratuito",
    "doende-x": "Doende X",
    "doende-bronze": "Doende Bronze",
    "doende-prata": "Doende Prata",
  };
  return names[slug] || slug;
}

/**
 * Obtém o percentual de desconto de um plano pelo slug.
 * Busca do banco de dados para garantir dados atualizados.
 */
export async function getPlanDiscountPercent(planSlug: string | null): Promise<number> {
  if (!planSlug) return 0;
  
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { slug: planSlug },
    select: { discountPercent: true },
  });
  
  return plan?.discountPercent || 0;
}
