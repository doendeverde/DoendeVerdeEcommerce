# 🔍 Auditoria Completa de Cache e Renderização

> **Data:** 26/01/2026  
> **Objetivo:** Identificar todas as estratégias de cache/renderização e explicar por que a home pode exibir dados antigos

---

## 📊 Resumo Executivo

### Problema Identificado
A **home page (`/`)** está usando **SSG (Static Site Generation) sem revalidação**, enquanto a página de produtos (`/products`) usa **ISR com revalidate=300**. Isso causa **inconsistência de dados**.

### Impacto
- ✅ Home renderiza em build time → dados congelados até próximo build
- ✅ /products revalida a cada 5min → dados sempre atualizados
- ❌ Usuário vê produtos diferentes na home vs na listagem
- ❌ Produtos novos não aparecem na home até rebuild

---

## 📁 Análise Detalhada por Arquivo

### 🏠 1. HOME PAGE - `/app/(default)/page.tsx`

```typescript
// NENHUMA configuração de revalidate ou dynamic
export default async function HomePage() {
  const result = await productService.getProductsWithCategories(filters);
  // ...
}
```

**Estratégia Atual:** SSG (Static Site Generation) puro  
**Comportamento:**
- ✅ Página é gerada em **build time** (`npm run build`)
- ✅ HTML estático servido instantaneamente
- ❌ Dados do banco **nunca** são recarregados após o build
- ❌ Produtos novos não aparecem até `npm run build` novamente

**Por que causa cache:**
- Next.js 15 App Router: páginas sem `dynamic` ou `revalidate` são **estáticas por padrão**
- Queries Prisma são executadas 1x no build, resultado é "embutido" no HTML
- Até fazer novo deploy, a home mostra sempre os mesmos produtos

**Adequação para E-commerce:** ❌ **INADEQUADO**
- E-commerce precisa mostrar produtos em tempo real
- Estoque muda constantemente
- Novos produtos devem aparecer imediatamente

**Correção Recomendada:**
```typescript
// Opção 1: ISR (mesma estratégia que /products)
export const revalidate = 300; // 5 minutos

// Opção 2: SSR (sempre fresh)
export const dynamic = "force-dynamic";
```

---

### 📦 2. PRODUCTS LISTING - `/app/(default)/products/page.tsx`

```typescript
export const revalidate = 300; // ✅ ISR configurado

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const result = await productService.getProductsWithCategories(filters);
  // ...
}
```

**Estratégia Atual:** ISR (Incremental Static Regeneration)  
**Comportamento:**
- ✅ Primeira requisição: gera página estática
- ✅ Próximas requisições: serve cache por 5 minutos
- ✅ Após 5min: próxima requisição triggera rebuild em background
- ✅ Dados atualizados a cada 5 minutos (no máximo)

**Por que NÃO causa cache persistente:**
- `revalidate: 300` força regeneração a cada 5 minutos
- Após revalidação, próximos visitantes veem dados novos
- Balanceia performance (cache) com freshness (rebuild automático)

**Adequação para E-commerce:** ✅ **ADEQUADO**
- 5 minutos é aceitável para catálogo de produtos
- Mantém performance sem sacrificar atualização
- Reduz carga no banco de dados

**Possível Otimização:**
```typescript
// Se precisar dados mais frescos
export const revalidate = 60; // 1 minuto

// Ou On-Demand Revalidation via API
// POST /api/revalidate?path=/products
```

---

### 🛍️ 3. PRODUCT DETAIL - `/app/(default)/products/[slug]/page.tsx`

```typescript
export const revalidate = 300; // ✅ ISR configurado

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await productService.getProductBySlug(slug);
  // ...
}
```

**Estratégia Atual:** ISR (Incremental Static Regeneration)  
**Comportamento:** Idêntico à listagem de produtos

**Adequação para E-commerce:** ✅ **ADEQUADO**
- Páginas de produto podem ter cache mais agressivo
- Descrição/imagens mudam raramente
- Preço/estoque podem usar client-side para atualização real-time

**Nota Importante:**
- Não existe `generateStaticParams`
- Todas as páginas [slug] são geradas on-demand
- Primeira visita: SSR, depois cache por 5min

---

### 📋 4. SUBSCRIPTIONS PAGE - `/app/(default)/subscriptions/page.tsx`

```typescript
export const dynamic = "force-dynamic"; // ✅ SSR configurado

export default async function SubscriptionsPage() {
  const [plans, session] = await Promise.all([
    subscriptionService.getPlans(),
    auth(),
  ]);
  // ...
}
```

**Estratégia Atual:** SSR (Server-Side Rendering) puro  
**Comportamento:**
- ✅ Página renderizada a cada requisição
- ✅ Dados sempre frescos do banco
- ❌ Sem cache - pode ser lento sob carga

**Por que NÃO usa cache:**
- `dynamic = "force-dynamic"` desabilita qualquer cache
- Next.js executa query no servidor a cada pageview
- Session check também força rendering dinâmico

**Adequação para E-commerce:** ⚠️ **ACEITÁVEL mas pode melhorar**
- Planos não mudam frequentemente
- Poderia usar `revalidate: 300` ao invés de SSR puro
- Session check pode ser feito client-side

**Otimização Sugerida:**
```typescript
// Trocar para ISR
export const revalidate = 300;
// Session check via client-side (useSession)
```

---

### 🔐 5. ADMIN PAGES - `/app/(admin)/admin/**/*.tsx`

```typescript
// Todas as páginas admin:
export const dynamic = "force-dynamic";
```

**Páginas afetadas:**
- `/admin/page.tsx` - Dashboard
- `/admin/products/page.tsx` - Lista produtos
- `/admin/orders/page.tsx` - Pedidos
- `/admin/users/page.tsx` - Usuários
- Todas as páginas [id] de edição

**Estratégia Atual:** SSR (Server-Side Rendering) puro  
**Comportamento:** Sempre fresh, nunca cache

**Adequação para Admin:** ✅ **ADEQUADO**
- Admin precisa dados em tempo real
- Volumes de acesso são baixos
- Performance não é crítica
- Segurança > Performance

---

### 🛡️ 6. PROTECTED PAGES - `/app/(protected)/**/*.tsx`

```typescript
// my-subscription, profile, orders
export const dynamic = "force-dynamic";
```

**Estratégia Atual:** SSR puro  
**Adequação:** ✅ **ADEQUADO**
- Dados são específicos do usuário
- Não podem ser cacheados (são pessoais)
- Sempre precisam de auth check

---

### 🔓 7. AUTH PAGES - `/app/(auth)/**/*.tsx`

**NENHUMA configuração de cache**

**Estratégia Atual:** SSG (páginas estáticas)  
**Comportamento:**
- Login/Register/Forgot Password são formulários estáticos
- HTML gerado uma vez no build
- Client-side hydration para interatividade

**Adequação:** ✅ **ADEQUADO**
- Formulários de auth não precisam dados dinâmicos
- Estático = loading instantâneo
- Validação/submit é client-side

---

### 🛒 8. CHECKOUT PAGES

```typescript
// /checkout/page.tsx
// NENHUMA configuração - mas tem auth check

// /checkout/subscription/[slug]/page.tsx
export const dynamic = "force-dynamic";
```

**Estratégia Atual:** Mista
- Checkout de carrinho: SSG (mas auth redirect força SSR)
- Checkout de assinatura: SSR explícito

**Adequação:** ✅ **ADEQUADO**
- Checkout sempre precisa dados frescos
- Middleware força auth check = sempre SSR na prática
- Dados de carrinho/endereço são pessoais

---

## 🔄 Services & Repositories - SEM CACHE

**Arquivos Analisados:**
- `services/product.service.ts`
- `repositories/product.repository.ts`
- Todos os outros services/repositories

**Resultado:**
- ✅ Nenhum uso de `fetch()` com cache
- ✅ Nenhum uso de `unstable_cache()`
- ✅ Todas as queries são diretas ao Prisma
- ✅ Prisma não tem cache habilitado

**Implicação:**
- Cache está **APENAS na camada de páginas Next.js**
- Services sempre retornam dados frescos
- O problema é **puramente a configuração das pages**

---

## 🎯 Comparação: Home vs Products

| Aspecto | Home (/) | Products (/products) |
|---------|----------|---------------------|
| **Config** | Nenhuma | `revalidate: 300` |
| **Estratégia** | SSG | ISR |
| **Atualização** | Apenas no build | A cada 5min |
| **Query no banco** | 1x no build | A cada revalidação |
| **Produtos novos** | ❌ Não aparecem | ✅ Aparecem em 5min |
| **Adequação** | ❌ Ruim | ✅ Boa |

---

## 🚨 Por que a Home Mostra Dados Antigos

### Causa Raiz
```typescript
// app/(default)/page.tsx
// ❌ SEM configuração = SSG puro
export default async function HomePage() {
  const result = await productService.getProductsWithCategories(filters);
  // Executa 1x no build, nunca mais
}
```

### Fluxo Detalhado

1. **Build Time (`npm run build`)**
   ```
   Next.js executa HomePage()
   → productService.getProductsWithCategories()
   → productRepository.findMany()
   → Prisma query ao banco
   → Retorna [Produto A, Produto B, Produto C]
   → HTML é gerado com esses 3 produtos
   → HTML é salvo no filesystem
   ```

2. **Runtime (usuário acessa `/`)**
   ```
   Next.js serve HTML pré-gerado
   → SEM query ao banco
   → SEM execução de código
   → Sempre os mesmos 3 produtos
   ```

3. **Admin adiciona Produto D**
   ```
   Admin cria produto via /admin/products/new
   → Produto D salvo no banco ✅
   → Home continua mostrando [A, B, C] ❌
   → /products mostra [A, B, C, D] ✅ (revalidou)
   ```

4. **Por que /products funciona?**
   ```
   Usuário acessa /products após 5min
   → Next.js vê que cache expirou
   → Executa ProductsPage() novamente
   → Nova query ao banco
   → Retorna [A, B, C, D]
   → Novo HTML gerado
   → Cache atualizado
   ```

---

## 💡 Estratégia Unificada Recomendada

### ⚡ Curto Prazo (IMPLEMENTAR AGORA)

#### 1. Corrigir Home Page
```typescript
// app/(default)/page.tsx
export const revalidate = 300; // ← ADICIONAR ESTA LINHA

export default async function HomePage() {
  // resto do código igual
}
```

**Impacto:**
- ✅ Home e /products terão mesma estratégia
- ✅ Dados sincronizados
- ✅ Produtos novos aparecem em até 5min

#### 2. Verificar Páginas Estáticas Acidentais

Procurar por páginas sem `dynamic` ou `revalidate` que deveriam ter:

```bash
# Comando para encontrar
grep -r "export default async function" app/(default) | grep -v "dynamic\|revalidate"
```

---

### 🎯 Médio Prazo (OTIMIZAÇÕES)

#### 1. On-Demand Revalidation

Criar API route para revalidar páginas específicas:

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path");
  
  if (path) {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path });
  }

  return NextResponse.json({ revalidated: false }, { status: 400 });
}
```

**Uso:**
```typescript
// Após criar produto no admin
await fetch(`/api/revalidate?secret=${SECRET}&path=/`);
await fetch(`/api/revalidate?secret=${SECRET}&path=/products`);
```

#### 2. Tags para Cache Granular

```typescript
// services/product.service.ts
import { unstable_cache } from "next/cache";

async function getProducts(filters: ProductFilters) {
  return unstable_cache(
    async () => {
      return await productRepository.findMany(filters);
    },
    ["products-list"],
    {
      revalidate: 300,
      tags: ["products"],
    }
  )();
}
```

**Revalidação:**
```typescript
import { revalidateTag } from "next/cache";

// Após criar produto
revalidateTag("products");
```

#### 3. Client-Side para Dados Real-Time

Para estoque e preço, considerar:

```typescript
// components/products/ProductCard.tsx
"use client";

export function ProductStock({ productId }: { productId: string }) {
  const { data: stock } = useSWR(`/api/products/${productId}/stock`, fetcher, {
    refreshInterval: 10000, // 10 segundos
  });

  return <span>Estoque: {stock}</span>;
}
```

---

### 🏗️ Longo Prazo (ARQUITETURA)

#### 1. Cache Strategy por Tipo de Dados

| Tipo de Dado | Estratégia | Revalidate |
|--------------|-----------|------------|
| Produtos | ISR | 300s (5min) |
| Categorias | ISR | 600s (10min) |
| Planos | ISR | 600s (10min) |
| Pedidos | SSR | N/A |
| Perfil | SSR | N/A |
| Admin | SSR | N/A |
| Auth | SSG | N/A |

#### 2. Redis para Cache de Query

Para alta performance:

```typescript
// lib/cache.ts
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

export async function getCachedProducts(filters: ProductFilters) {
  const cacheKey = `products:${JSON.stringify(filters)}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const fresh = await productRepository.findMany(filters);
  await redis.setex(cacheKey, 300, fresh); // 5min
  
  return fresh;
}
```

#### 3. Webhook para Invalidação Imediata

```typescript
// app/api/webhooks/product-updated/route.ts
export async function POST(request: Request) {
  const { productId } = await request.json();
  
  // Invalidar caches relacionados
  revalidatePath("/");
  revalidatePath("/products");
  revalidateTag("products");
  
  return NextResponse.json({ success: true });
}
```

---

## 📋 Checklist de Implementação

### ✅ Prioridade CRÍTICA (fazer HOJE)

- [ ] Adicionar `export const revalidate = 300;` em `app/(default)/page.tsx`
- [ ] Testar: criar produto no admin e verificar se aparece na home em 5min
- [ ] Adicionar comentário explicativo sobre a estratégia

### ✅ Prioridade ALTA (fazer essa semana)

- [ ] Implementar `/api/revalidate` route
- [ ] Chamar revalidate após criar/editar/deletar produtos no admin
- [ ] Documentar o fluxo de revalidação

### ✅ Prioridade MÉDIA (próximo sprint)

- [ ] Avaliar uso de `unstable_cache` nos services
- [ ] Implementar tags de cache
- [ ] Criar dashboard de monitoramento de cache

### ✅ Prioridade BAIXA (futuro)

- [ ] Avaliar Redis para cache de queries
- [ ] Implementar webhooks de invalidação
- [ ] Client-side updates para dados real-time

---

## 🔧 Exemplo de Correção Imediata

**ANTES:**
```typescript
// app/(default)/page.tsx
export default async function HomePage() {
  const result = await productService.getProductsWithCategories(filters);
  // ...
}
```

**DEPOIS:**
```typescript
// app/(default)/page.tsx

/**
 * ISR com revalidação a cada 5 minutos
 * Garante que produtos novos apareçam na home em até 5min após criação
 */
export const revalidate = 300;

export default async function HomePage() {
  const result = await productService.getProductsWithCategories(filters);
  // ...
}
```

---

## 📊 Impacto Esperado da Correção

| Métrica | Antes | Depois |
|---------|-------|--------|
| **Tempo até produto aparecer na home** | ∞ (nunca, até rebuild) | ≤ 5 minutos |
| **Consistência home vs /products** | ❌ Inconsistente | ✅ Consistente |
| **Performance** | ⚡ Excelente (estático) | ⚡ Excelente (ISR) |
| **Carga no banco** | 📉 Mínima | 📈 Baixa (+1 query/5min) |
| **UX do admin** | 😞 Frustrante | 😊 Previsível |

---

## 🎓 Conceitos Importantes

### SSG (Static Site Generation)
```
Build time: Query ao banco → HTML gerado
Runtime: Serve HTML estático (sem query)
Cache: Infinito (até novo build)
Use quando: Dados quase nunca mudam (páginas de marketing)
```

### ISR (Incremental Static Regeneration)
```
Build time: HTML gerado
Runtime: Serve cache
Após X segundos: Rebuild automático em background
Cache: Limitado pelo revalidate
Use quando: Dados mudam periodicamente (produtos)
```

### SSR (Server-Side Rendering)
```
Build time: Nada
Runtime: Query ao banco → HTML gerado
Cache: Nenhum
Use quando: Dados sempre mudam (dados do usuário)
```

---

## 📚 Referências

- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Incremental Static Regeneration](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#time-based-revalidation)
- [On-Demand Revalidation](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#on-demand-revalidation)
- [Cache Behavior in Next.js 15](https://nextjs.org/blog/next-15#caching-updates)

---

**Última atualização:** 26/01/2026
