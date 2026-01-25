/**
 * PriceDisplay Component
 *
 * Componente único e consistente para exibir preços em toda a aplicação.
 * 
 * REGRA DE NEGÓCIO:
 * - Sem assinatura: mostra apenas preço base
 * - Com assinatura: mostra preço base riscado + preço final + badge de desconto
 * - Deixa CLARO que o desconto é da assinatura, não do produto
 */

'use client';

import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  /** Preço base do produto */
  basePrice: number;
  /** Preço final após desconto (se houver) */
  finalPrice?: number;
  /** Percentual de desconto (0-100) */
  discountPercent?: number;
  /** Label do desconto (ex: "Desconto Doende Bronze") */
  discountLabel?: string | null;
  /** Se deve mostrar o desconto (usuário tem assinatura com desconto) */
  hasDiscount?: boolean;
  /** Variante de tamanho */
  size?: 'sm' | 'md' | 'lg';
  /** Layout: inline ou stacked */
  layout?: 'inline' | 'stacked';
  /** Classes adicionais */
  className?: string;
  /** Mostrar badge de desconto */
  showBadge?: boolean;
}

/**
 * Formata valor para moeda brasileira
 */
function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

/**
 * Componente de exibição de preço
 * 
 * @example
 * // Sem desconto
 * <PriceDisplay basePrice={99.90} />
 * 
 * @example
 * // Com desconto de assinatura
 * <PriceDisplay 
 *   basePrice={99.90} 
 *   finalPrice={84.92} 
 *   discountPercent={15} 
 *   discountLabel="Desconto Doende Bronze"
 *   hasDiscount={true}
 * />
 */
export function PriceDisplay({
  basePrice,
  finalPrice,
  discountPercent = 0,
  discountLabel,
  hasDiscount = false,
  size = 'md',
  layout = 'inline',
  className,
  showBadge = true,
}: PriceDisplayProps) {
  // Se não há desconto, mostra apenas preço base
  if (!hasDiscount || !finalPrice || discountPercent <= 0) {
    return (
      <div className={cn('flex items-baseline gap-2', className)}>
        <span
          className={cn(
            'font-bold text-text-primary',
            size === 'sm' && 'text-sm',
            size === 'md' && 'text-lg',
            size === 'lg' && 'text-3xl'
          )}
        >
          {formatCurrency(basePrice)}
        </span>
      </div>
    );
  }

  // Com desconto de assinatura
  if (layout === 'stacked') {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {/* Preço original riscado */}
        <span
          className={cn(
            'text-muted line-through',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-lg'
          )}
        >
          {formatCurrency(basePrice)}
        </span>

        {/* Preço final + badge */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-bold text-text-primary',
              size === 'sm' && 'text-sm',
              size === 'md' && 'text-lg',
              size === 'lg' && 'text-3xl'
            )}
          >
            {formatCurrency(finalPrice)}
          </span>

          {showBadge && (
            <SubscriptionDiscountBadge
              discountPercent={discountPercent}
              discountLabel={discountLabel}
              size={size}
            />
          )}
        </div>
      </div>
    );
  }

  // Layout inline (padrão)
  return (
    <div className={cn('flex items-baseline gap-2 flex-wrap', className)}>
      <span
        className={cn(
          'font-bold text-text-primary',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-lg',
          size === 'lg' && 'text-3xl'
        )}
      >
        {formatCurrency(finalPrice)}
      </span>

      <span
        className={cn(
          'text-muted line-through',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-lg'
        )}
      >
        {formatCurrency(basePrice)}
      </span>

      {showBadge && (
        <SubscriptionDiscountBadge
          discountPercent={discountPercent}
          discountLabel={discountLabel}
          size={size}
        />
      )}
    </div>
  );
}

/**
 * Badge de desconto de assinatura
 * Deixa claro que o desconto é da assinatura, não promoção do produto
 */
interface DiscountBadgeProps {
  discountPercent: number;
  discountLabel?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function SubscriptionDiscountBadge({
  discountPercent,
  discountLabel,
  size = 'md'
}: DiscountBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-primary-purple text-white font-medium',
        size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
        size === 'md' && 'px-2 py-0.5 text-xs',
        size === 'lg' && 'px-3 py-1 text-sm'
      )}
      title={discountLabel || `${discountPercent}% de desconto da assinatura`}
    >
      -{discountPercent}% assinante
    </span>
  );
}

/**
 * Componente compacto para exibição em cards de produto
 */
interface CompactPriceDisplayProps {
  basePrice: number;
  finalPrice?: number;
  discountPercent?: number;
  hasDiscount?: boolean;
  className?: string;
}

export function CompactPriceDisplay({
  basePrice,
  finalPrice,
  discountPercent = 0,
  hasDiscount = false,
  className,
}: CompactPriceDisplayProps) {
  if (!hasDiscount || !finalPrice || discountPercent <= 0) {
    return (
      <span className={cn('text-sm sm:text-lg font-bold text-text-primary', className)}>
        {formatCurrency(basePrice)}
      </span>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <span className="text-xs sm:text-sm text-muted line-through">
        {formatCurrency(basePrice)}
      </span>
      <span className="text-sm sm:text-lg font-bold text-text-primary">
        {formatCurrency(finalPrice)}
      </span>
    </div>
  );
}

/**
 * Exibe o resumo de economia do usuário
 */
interface SavingsSummaryProps {
  totalDiscount: number;
  discountLabel?: string | null;
  className?: string;
}

export function SavingsSummary({ totalDiscount, discountLabel, className }: SavingsSummaryProps) {
  if (totalDiscount <= 0) return null;

  return (
    <div className={cn('flex items-center gap-2 text-primary-purple', className)}>
      <span className="text-sm font-medium">
        Você economiza {formatCurrency(totalDiscount)}
      </span>
      {discountLabel && (
        <span className="text-xs text-muted">({discountLabel})</span>
      )}
    </div>
  );
}

export default PriceDisplay;
