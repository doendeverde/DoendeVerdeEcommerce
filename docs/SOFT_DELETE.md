# 🗑️ Estratégia de Soft Delete - Produtos

> **Última atualização:** Janeiro 2026

## 📌 Resumo

Este projeto utiliza **soft delete** para produtos ao invés de exclusão permanente (hard delete).
Isso garante integridade referencial com pedidos históricos e permite auditoria.

---

## 🎯 Por que Soft Delete?

### Problemas com Hard Delete

1. **Erro de Foreign Key**: Produtos com `OrderItem` associados não podem ser deletados
2. **Perda de histórico**: Pedidos antigos ficariam com `productId` inválido
3. **Inconsistência de dados**: Relatórios e métricas seriam afetados
4. **Impossibilidade de auditoria**: Sem rastro do que foi removido

### Benefícios do Soft Delete

1. ✅ **Integridade referencial**: Pedidos históricos continuam válidos
2. ✅ **Auditoria**: Timestamp de quando foi "deletado"
3. ✅ **Recuperabilidade**: Possibilidade de reativar produtos
4. ✅ **Sem erros de FK**: Nunca falha por constraint violation

---

## 🗄️ Implementação no Banco de Dados

### Schema Prisma

```prisma
model Product {
  // ... outros campos ...
  
  /// Soft delete timestamp - quando preenchido, produto está "excluído"
  deletedAt DateTime?
  
  // Index para otimizar queries com filtro de soft delete
  @@index([deletedAt])
}
```

### Semântica

| `deletedAt` | Status |
|-------------|--------|
| `null` | Produto ativo (visível) |
| `DateTime` | Produto "deletado" (oculto) |

---

## 🔌 Implementação na API

### Rota DELETE `/api/admin/products/[id]`

```typescript
// ❌ ANTES (hard delete - causava erro de FK)
await prisma.product.delete({ where: { id } });

// ✅ DEPOIS (soft delete)
await prisma.product.update({
  where: { id },
  data: { 
    deletedAt: new Date(),
    isPublished: false, // Garantia extra
  },
});
```

### Resposta da API

```json
{
  "success": true,
  "message": "Produto \"Nome do Produto\" desativado com sucesso",
  "hadOrders": true
}
```

---

## 🔍 Implementação nas Queries

### Regra de Ouro

> **Todas as queries públicas DEVEM incluir `deletedAt: null`**

### Repository de Produtos

```typescript
// Base where clause para queries públicas
const publicProductWhere = {
  isPublished: true,
  status: ProductStatus.ACTIVE,
  deletedAt: null, // ← CRÍTICO: exclui soft-deleted
};
```

### Queries Afetadas

| Query | Filtra `deletedAt`? | Motivo |
|-------|---------------------|--------|
| `findMany` (público) | ✅ Sim | Listagem de produtos na loja |
| `findBySlug` (público) | ✅ Sim | Página de produto |
| `findRelated` (público) | ✅ Sim | Produtos relacionados |
| `findById` (carrinho) | ❌ Não* | Validação de itens existentes |
| `getProducts` (admin) | ⚙️ Configurável | Parâmetro `showDeleted` |

*O `findById` não filtra para manter compatibilidade com pedidos existentes.
A verificação de soft-delete é feita na camada de serviço (cart.service).

---

## 🖥️ Implementação no Frontend

### Admin - ProductsTable

1. **Indicador visual**: Linha com opacidade reduzida + badge "Desativado"
2. **Imagem em grayscale**: Produto soft-deleted tem imagem cinza
3. **Botão "Desativar"**: Substitui "Excluir" (não mostra para já deletados)
4. **Toast de confirmação**: Feedback claro ao usuário

### Loja (Público)

- Produtos soft-deleted **NUNCA aparecem** em:
  - Home
  - Listagem de produtos
  - Busca
  - Categorias
  - Produtos relacionados
  - Destaques/vitrines

---

## 🔄 Cache e Revalidação

### Problema

Páginas com ISR/SSG podem continuar mostrando produtos deletados até revalidação.

### Solução

Após soft delete, chamamos `revalidateProductPages()`:

```typescript
await prisma.product.update({ ... });

// Revalida cache de páginas que listam produtos
await revalidateProductPages(product.slug);
```

### Páginas Revalidadas

- `/` (Home)
- `/products` (Listagem)
- `/products/${slug}` (Página do produto)

---

## 🛒 Impacto no Carrinho

### Cenário

Usuário adiciona produto ao carrinho → Admin desativa produto → Usuário tenta finalizar compra

### Comportamento

1. **Adicionar ao carrinho**: Verifica `deletedAt !== null` → Retorna erro
2. **Carrinho existente**: Item permanece, mas checkout valida disponibilidade
3. **Checkout**: Falha com mensagem clara se produto foi desativado

---

## ⚠️ Regras Importantes para Desenvolvedores

### ✅ FAZER

```typescript
// Sempre incluir deletedAt: null em queries públicas
const products = await prisma.product.findMany({
  where: {
    isPublished: true,
    status: ProductStatus.ACTIVE,
    deletedAt: null, // ← Não esquecer!
  },
});
```

### ❌ NÃO FAZER

```typescript
// NUNCA usar delete em produtos
await prisma.product.delete({ where: { id } }); // ❌

// NUNCA esquecer filtro de soft delete em queries públicas
const products = await prisma.product.findMany({
  where: { isPublished: true }, // ❌ Falta deletedAt: null
});
```

---

## 🧪 Testando Soft Delete

### Checklist

- [ ] Produto com pedidos pode ser "deletado" (soft)
- [ ] Produto "deletado" não aparece na loja
- [ ] Produto "deletado" não pode ser adicionado ao carrinho
- [ ] Pedidos históricos continuam funcionando
- [ ] Admin mostra indicador visual para produtos deletados
- [ ] Cache é revalidado após soft delete

### Comando de Migration

```bash
npx prisma migrate dev --name add_product_soft_delete
```

---

## 📚 Arquivos Relacionados

| Arquivo | Responsabilidade |
|---------|------------------|
| `prisma/schema.prisma` | Campo `deletedAt` no modelo Product |
| `repositories/product.repository.ts` | Filtro base `publicProductWhere` |
| `services/admin.service.ts` | `getProducts` com `showDeleted` |
| `services/cart.service.ts` | Validação de soft-delete no carrinho |
| `app/api/admin/products/[id]/route.ts` | Endpoint DELETE (soft) |
| `app/(admin)/admin/products/ProductsTable.tsx` | UI com indicadores |
| `lib/revalidate.ts` | Funções de revalidação de cache |

---

## 🔮 Futuras Melhorias

1. **Restaurar produto**: Endpoint para "reativar" produtos soft-deleted
2. **Exclusão permanente**: Para admin super, com confirmação dupla
3. **Limpeza automática**: Job para remover produtos soft-deleted há mais de X meses
4. **Auditoria**: Log de quem e quando soft-deleted

---

*Documentação gerada como parte da implementação de soft delete.*
