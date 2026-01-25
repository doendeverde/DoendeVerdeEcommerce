# 📋 DoendeVerde - Backlog de Tasks

> **Criado em:** Janeiro 2026  
> **Status:** Em progresso  

---

## 📊 Status Geral

| Categoria | Total | Concluído | Em Progresso | Pendente |
|-----------|-------|-----------|--------------|----------|
| Checkout | 8 | 2 | 1 | 5 |
| Carrinho | 5 | 1 | 0 | 4 |
| Autenticação | 5 | 2 | 0 | 3 |
| Assinaturas | 4 | 3 | 0 | 1 |
| UI/UX | 8 | 1 | 0 | 7 |
| Admin | 4 | 2 | 0 | 2 |
| Sistema | 5 | 0 | 0 | 5 |

---

## 🔴 CRÍTICO - Checkout & Pagamentos

### ✅ CONCLUÍDO

- [x] **Benefícios compartilhados com ativo/inativo** - Sistema de PlanBenefits com enabled true/false para comparação entre planos
- [x] **colorScheme nos planos** - Cores customizáveis por plano (primary, text, primaryDark, textDark)

### 🔄 EM PROGRESSO

- [ ] **Bug PIX não aprovando em produção** - Webhook não está recebendo notificação ou não está processando corretamente
  - Verificar: `NEXTAUTH_URL` está configurado corretamente em prod
  - Verificar: Webhook configurado no painel do Mercado Pago
  - Verificar: Logs do webhook em produção
  - Arquivo: `app/api/webhooks/mercadopago/route.ts`

### ✅ CONCLUÍDO RECENTEMENTE

- [x] **Visualização do PIX mostrando valor sem frete** - Corrigido: `amount` agora inclui frete
  - Arquivo: `app/(default)/checkout/subscription/[slug]/SubscriptionCheckoutClient.tsx`

### ❌ PENDENTE

| # | Task | Descrição | Arquivos Relacionados |
|---|------|-----------|----------------------|
| 1 | Preencher email automaticamente no cartão MP | Email do cliente deve preencher automaticamente no formulário de cartão | `components/checkout/CreditCardForm.tsx` |
| 2 | Subir scroll na tela de checkout | Ao entrar no checkout, scroll deve ir para o topo | `app/(default)/checkout/page.tsx` |
| 3 | Bug cartão crédito → débito | Limpar dados ao trocar entre métodos de pagamento | `components/checkout/PaymentSection.tsx` |
| 4 | Atualizar status PIX via webhook | Quando webhook confirmar pagamento, atualizar status em tempo real | `app/api/webhooks/mercadopago/route.ts` |
| 5 | Gravar tipo de frete no pedido | Salvar método, valor e prazo de entrega no pedido | `services/checkout.service.ts`, `prisma/schema.prisma` |

---

## 🟠 ALTA - Carrinho

### ✅ CONCLUÍDO

- [x] **Carrinho persistido** - Items salvos no localStorage/banco

### ❌ PENDENTE

| # | Task | Descrição | Arquivos Relacionados |
|---|------|-----------|----------------------|
| 1 | Remover/adicionar items persistido | Operações devem ser persistidas corretamente | `stores/cart.ts`, `services/cart.service.ts` |
| 2 | Cart validation failed - redirect | Redirecionar para cart/home quando dados inválidos | `app/(default)/checkout/page.tsx` |
| 3 | Recuperação de carrinho se alterar valor | Detectar alteração de preço e avisar usuário | `services/cart.service.ts` |
| 4 | Carrinho não aparecer na tela | Ao adicionar ao carrinho, mostrar apenas popup, não abrir drawer | `components/cart/AddToCartButton.tsx` |
| 5 | **Carrinho deslogado (guest cart)** | Permitir adicionar items ao carrinho sem login, usando localStorage. Ao logar, fazer merge do carrinho local com o do banco | `stores/cart.ts`, `services/cart.service.ts`, `hooks/useCart.ts` |

---

## 🟡 MÉDIA - Autenticação

### ✅ CONCLUÍDO

- [x] **Login com credentials** - Implementado
- [x] **OAuth (Google, GitHub)** - Implementado

### ❌ PENDENTE

| # | Task | Descrição | Arquivos Relacionados |
|---|------|-----------|----------------------|
| 1 | Recuperação de senha via email | Fluxo completo de reset password | `app/api/auth/forgot-password/route.ts` (criar) |
| 2 | Clicar em "Entrar" deslogado abre aba errada | Deve abrir modal de login, não aba separada | `components/layout/Header.tsx` |
| 3 | Logout redireciona para localhost:3000 | Corrigir URL de redirect após logout | `lib/auth.ts` |
| 4 | Verificação de email | Fluxo de confirmação de email | `app/api/auth/verify-email/route.ts` (criar) |
| 5 | **WhatsApp obrigatório no cadastro** | Tornar campo de WhatsApp obrigatório no registro de usuário | `schemas/auth.schema.ts`, `app/api/register/route.ts`, `components/auth/RegisterForm.tsx`, `prisma/schema.prisma` |

---

## 🟢 MÉDIA - Assinaturas

### ✅ CONCLUÍDO

- [x] **Benefits com enabled/disabled** - Sistema implementado
- [x] **ColorScheme nos planos** - Cores customizáveis
- [x] **Auto-attach benefits** - Novos benefits anexados a todos os planos

### ❌ PENDENTE

| # | Task | Descrição | Arquivos Relacionados |
|---|------|-----------|----------------------|
| 1 | Frete fixo em assinatura recorrente | Definir valor fixo de frete para assinaturas | `services/subscription.service.ts` |
| 2 | Medidas no produto (não perfil de frete) | Dimensões devem vir do produto, não do perfil | `prisma/schema.prisma`, `services/shipping.service.ts` |

---

## 🔵 UI/UX

### ✅ CONCLUÍDO

- [x] **Chip de desconto por assinatura** - Implementado

### ❌ PENDENTE

| # | Task | Descrição | Arquivos Relacionados |
|---|------|-----------|----------------------|
| 1 | Popup "mais do produto" no admin | Último item fica dentro de scroll | `components/admin/products/ProductActions.tsx` |
| 2 | Dark mode | Implementar tema escuro completo | `app/globals.css`, `docs/THEME_SYSTEM.md` |
| 3 | Exibição de pedidos no mobile | Ajustar layout responsivo | `app/(protected)/orders/page.tsx` |
| 4 | Remover caminho /dashboard errado | Corrigir redirects para dashboard | `middleware.ts` |
| 5 | Corrigir redirect para /cart | Verificar redirects após ações | `middleware.ts` |
| 6 | Comentar código de pontuação | Ocultar features de pontos não implementadas | Vários arquivos |

---

## 🟣 Admin

### ✅ CONCLUÍDO

- [x] **Dashboard com métricas** - Implementado
- [x] **CRUD de produtos** - Implementado

### ❌ PENDENTE

| # | Task | Descrição | Arquivos Relacionados |
|---|------|-----------|----------------------|
| 1 | Exibir frete corretamente no pedido | Mostrar método, valor e prazo na visualização | `app/(admin)/admin/orders/[id]/page.tsx` |
| 2 | Popup do produto (scroll bug) | Corrigir overflow do dropdown | `components/admin/products/ProductActions.tsx` |

---

## ⚫ Sistema/Infra

### ❌ PENDENTE

| # | Task | Descrição | Arquivos Relacionados |
|---|------|-----------|----------------------|
| 1 | Rate Limiting | Implementar limitação de requisições | `middleware.ts`, `lib/rate-limit.ts` |
| 2 | Emails Transacionais | Integrar Resend para envio de emails | `lib/email.ts` (criar) |
| 3 | Validação HMAC Webhook MP | Verificar assinatura do webhook | `app/api/webhooks/mercadopago/route.ts` |
| 4 | Soft Delete | Implementar exclusão lógica | `prisma/schema.prisma` |
| 5 | Testes automatizados | Configurar Jest/Vitest | `__tests__/` (criar) |

---

## 📝 Próximos Passos (Prioridade)

### Sprint Atual - Checkout & Pagamentos

1. **Bug ao clicar em "Pagar"** - Investigar e corrigir
2. **Preencher email automaticamente** - No formulário de cartão MP
3. **Scroll ao topo no checkout** - Melhorar UX
4. **Bug troca cartão/débito** - Limpar estado

### Próxima Sprint - Carrinho & Auth

1. **Recuperação de senha** - Fluxo completo
2. **Cart validation redirect** - Melhorar error handling
3. **Logout redirect** - Corrigir URL

---

## 📊 Schema do Checkout - Referência

### Fluxo Atual

```
1. Carrinho → 2. Checkout → 3. Endereço → 4. Frete → 5. Pagamento → 6. Confirmação
```

### Tabelas Envolvidas

```prisma
Order {
  id
  userId
  status (PENDING, PAID, SHIPPED, DELIVERED, CANCELLED)
  totalAmount
  discountAmount
  shippingAmount
  addressId
  // TODO: Adicionar campos de frete
  shippingMethod    String?   // "PAC", "SEDEX", etc
  shippingCarrier   String?   // "Correios", "Jadlog"
  estimatedDelivery DateTime?
}

Payment {
  id
  orderId
  method (CREDIT_CARD, PIX, BOLETO)
  status (PENDING, APPROVED, REJECTED, REFUNDED)
  amount
  externalId (MP payment_id)
  pixCode
  pixExpiration
}

CartItem {
  id
  cartId
  productId
  quantity
  price
}
```

### APIs do Checkout

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/checkout` | POST | Criar pedido |
| `/api/checkout/subscription` | POST | Assinar plano |
| `/api/payments/create` | POST | Criar pagamento MP |
| `/api/webhooks/mercadopago` | POST | Receber notificações |

---

## 🔗 Documentos Relacionados

- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) - Documentação principal
- [MERCADO_PAGO_INTEGRATION.md](MERCADO_PAGO_INTEGRATION.md) - Integração MP
- [SUBSCRIPTION_SYSTEM_REFERENCE.md](SUBSCRIPTION_SYSTEM_REFERENCE.md) - Sistema de assinaturas
- [THEME_SYSTEM.md](THEME_SYSTEM.md) - Sistema de temas

---

*Última atualização: Janeiro 2026*
