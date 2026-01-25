# 🔄 Plano de Refatoração do Sistema de Assinaturas

> **Versão:** 1.0.0  
> **Data:** Janeiro 2026  
> **Status:** Planejamento

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Problemas Atuais](#2-problemas-atuais)
3. [Novas Funcionalidades](#3-novas-funcionalidades)
4. [Alterações no Banco de Dados](#4-alterações-no-banco-de-dados)
5. [Tela de Gerenciamento (Assinante)](#5-tela-de-gerenciamento-assinante)
6. [Sistema de Benefícios Dinâmicos](#6-sistema-de-benefícios-dinâmicos)
7. [Informações de Frete no Pedido](#7-informações-de-frete-no-pedido)
8. [API Endpoints](#8-api-endpoints)
9. [Componentes a Criar/Modificar](#9-componentes-a-criarmodificar)
10. [Roadmap de Implementação](#10-roadmap-de-implementação)
11. [Checklist de Implementação](#11-checklist-de-implementação)

---

## 1. Visão Geral

### 1.1 Objetivo

Refatorar o sistema de assinaturas para:
- Permitir gerenciamento dinâmico de benefícios por plano
- Melhorar a experiência do assinante com tela dedicada
- Armazenar informações completas de frete nos pedidos
- Facilitar a gestão administrativa

### 1.2 Escopo

- **Backend:** Novos models, migrations, services e API routes
- **Admin:** CRUD de benefícios, visualização de frete
- **Cliente:** Tela de gerenciamento de assinatura

---

## 2. Problemas Atuais

### 2.1 Benefícios Hardcoded
```
ATUAL: features String[] @default([]) // Array de strings solto
```
- Não há consistência entre planos
- Difícil gerenciar visualmente
- Não permite ativar/desativar por plano

### 2.2 Frete Não Persistido
```
ATUAL: shippingData Json? // Dados genéricos não estruturados
```
- Não armazena tipo de frete (PAC, SEDEX, etc.)
- Não registra tempo estimado de entrega
- Admin não consegue ver detalhes do frete

### 2.3 Tela de Assinatura Inexistente
- Cliente não tem visão clara da sua assinatura
- Não consegue ver próxima cobrança
- Não consegue cancelar de forma autônoma

---

## 3. Novas Funcionalidades

### 3.1 Sistema de Benefícios Dinâmicos
- CRUD de benefícios globais (admin)
- Toggle de benefícios por plano (admin)
- Exibição dinâmica em todo o sistema

### 3.2 Frete Estruturado no Pedido
- Modelo dedicado para informações de envio
- Tipo, valor, prazo, transportadora
- Visualização no admin

### 3.3 Portal do Assinante
- Dashboard da assinatura
- Histórico de pagamentos
- Cancelamento com aviso prévio

---

## 4. Alterações no Banco de Dados

### 4.1 Novo Model: `Benefit` (Benefício Global)

```prisma
model Benefit {
  id          String   @id @default(uuid())
  name        String   // Ex: "Frete Grátis"
  slug        String   @unique // Ex: "frete-gratis"
  description String?  // Descrição longa
  icon        String?  // Ícone lucide: "Truck", "Percent", etc.
  isActive    Boolean  @default(true)
  displayOrder Int     @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  planBenefits PlanBenefit[]

  @@index([isActive])
  @@index([slug])
}
```

### 4.2 Novo Model: `PlanBenefit` (Relação Plano-Benefício)

```prisma
model PlanBenefit {
  id        String           @id @default(uuid())
  planId    String
  benefitId String
  enabled   Boolean          @default(true) // true = plano TEM este benefício
  customValue String?        // Valor customizado (ex: "10%" em vez do padrão)
  createdAt DateTime         @default(now())
  
  plan      SubscriptionPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  benefit   Benefit          @relation(fields: [benefitId], references: [id], onDelete: Cascade)

  @@unique([planId, benefitId])
  @@index([planId])
  @@index([benefitId])
}
```

### 4.3 Novo Model: `OrderShippingInfo` (Frete do Pedido)

```prisma
model OrderShippingInfo {
  id               String   @id @default(uuid())
  orderId          String   @unique
  carrier          String   // Ex: "Correios", "Jadlog"
  serviceCode      String   // Ex: "04014" (SEDEX)
  serviceName      String   // Ex: "SEDEX"
  estimatedDays    Int      // Prazo em dias úteis
  shippingCost     Decimal  @db.Decimal(10, 2)
  packageWeight    Decimal? @db.Decimal(10, 3) // kg
  packageDimensions Json?   // { width, height, length }
  quotedAt         DateTime // Quando a cotação foi feita
  createdAt        DateTime @default(now())
  
  order            Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
}
```

### 4.4 Atualização: `SubscriptionPlan`

```prisma
model SubscriptionPlan {
  // ... campos existentes ...
  
  // REMOVER: features String[] @default([])
  // ADICIONAR:
  planBenefits PlanBenefit[]
}
```

### 4.5 Atualização: `Order`

```prisma
model Order {
  // ... campos existentes ...
  
  // ADICIONAR:
  shippingInfo OrderShippingInfo?
}
```

### 4.6 Atualização: `Subscription`

```prisma
model Subscription {
  // ... campos existentes ...
  
  // ADICIONAR campos para melhor controle:
  pausedAt        DateTime?  // Quando foi pausada
  cancelRequestedAt DateTime? // Quando solicitou cancelamento
  cancelReason    String?    // Motivo do cancelamento
  currentPeriodStart DateTime // Início do período atual
  currentPeriodEnd   DateTime // Fim do período atual (quando expira)
}
```

---

## 5. Tela de Gerenciamento (Assinante)

### 5.1 Rota
```
/subscriptions (ou /minha-assinatura)
```

### 5.2 Layout da Página

```
┌─────────────────────────────────────────────────────────────────┐
│  Minha Assinatura                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ PLANO PREMIUM                            ATIVA ✓        │   │
│  │                                                          │   │
│  │ R$ 89,90/mês                                            │   │
│  │                                                          │   │
│  │ Próxima cobrança: 15 de Fevereiro de 2026              │   │
│  │ Membro desde: 15 de Janeiro de 2026                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📦 SEUS BENEFÍCIOS                                       │   │
│  │                                                          │   │
│  │ ✓ Frete Grátis em todos os pedidos                      │   │
│  │ ✓ 15% de desconto em produtos                           │   │
│  │ ✓ Acesso antecipado a lançamentos                       │   │
│  │ ✓ Atendimento prioritário                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 💳 HISTÓRICO DE PAGAMENTOS                               │   │
│  │                                                          │   │
│  │ Jan/2026  R$ 89,90  ✓ Pago   15/01/2026                │   │
│  │ Dez/2025  R$ 89,90  ✓ Pago   15/12/2025                │   │
│  │ Nov/2025  R$ 89,90  ✓ Pago   15/11/2025                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⚙️ AÇÕES                                                  │   │
│  │                                                          │   │
│  │ [Trocar Plano]  [Pausar Assinatura]  [Cancelar]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Estados da Assinatura

| Status | Cor | Descrição |
|--------|-----|-----------|
| `ACTIVE` | 🟢 Verde | Assinatura ativa e pagamento em dia |
| `PAUSED` | 🟡 Amarelo | Pausada temporariamente pelo usuário |
| `PENDING_CANCELLATION` | 🟠 Laranja | Cancelamento solicitado, ativa até fim do período |
| `CANCELED` | 🔴 Vermelho | Cancelada (histórico) |
| `EXPIRED` | ⚫ Cinza | Expirou por falta de pagamento |

### 5.4 Fluxo de Cancelamento

```
┌──────────────┐     ┌────────────────────┐     ┌─────────────────┐
│   Cliente    │────▶│ Modal de Aviso     │────▶│ Confirmação     │
│  clica       │     │                    │     │                 │
│  "Cancelar"  │     │ "Sua assinatura    │     │ "Cancelamento   │
│              │     │  permanecerá ativa │     │  agendado para  │
│              │     │  até DD/MM/YYYY"   │     │  DD/MM/YYYY"    │
└──────────────┘     │                    │     └─────────────────┘
                     │ [Manter Plano]     │
                     │ [Confirmar Cancel] │
                     └────────────────────┘
```

**Regras de Cancelamento:**
1. Usuário solicita cancelamento
2. Sistema marca `cancelRequestedAt = now()`
3. Status muda para `PENDING_CANCELLATION`
4. Assinatura permanece ativa até `currentPeriodEnd`
5. Job/webhook cancela efetivamente no fim do período
6. Não há cobrança automática ao fim do período

---

## 6. Sistema de Benefícios Dinâmicos

### 6.1 Tela Admin: Gerenciar Benefícios

**Rota:** `/admin/benefits`

```
┌─────────────────────────────────────────────────────────────────┐
│  Benefícios de Assinatura                    [+ Novo Benefício] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────┬─────────────────────────────┬─────────┬─────────────┐  │
│  │ #  │ Nome                        │ Status  │ Ações       │  │
│  ├────┼─────────────────────────────┼─────────┼─────────────┤  │
│  │ 1  │ 🚚 Frete Grátis             │ ✓ Ativo │ [✏️] [🗑️]   │  │
│  │ 2  │ 💰 Desconto em Produtos     │ ✓ Ativo │ [✏️] [🗑️]   │  │
│  │ 3  │ 🎁 Brinde Mensal            │ ✓ Ativo │ [✏️] [🗑️]   │  │
│  │ 4  │ ⚡ Acesso Antecipado        │ ✓ Ativo │ [✏️] [🗑️]   │  │
│  │ 5  │ 💬 Suporte Prioritário      │ ✗ Inativo│ [✏️] [🗑️]   │  │
│  └────┴─────────────────────────────┴─────────┴─────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Tela Admin: Editar Plano (com Benefícios)

**Rota:** `/admin/subscriptions/[id]`

```
┌─────────────────────────────────────────────────────────────────┐
│  Editar Plano: Premium                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Nome: [Premium_________________]                               │
│  Preço: [R$ 89,90______________]                               │
│  Desconto: [15%________________]                                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📦 BENEFÍCIOS DESTE PLANO                                      │
│                                                                 │
│  ┌─────────────────────────────────────────┬──────┬──────────┐ │
│  │ Benefício                               │ Ativo│ Valor    │ │
│  ├─────────────────────────────────────────┼──────┼──────────┤ │
│  │ 🚚 Frete Grátis                         │ [✓]  │ ───      │ │
│  │ 💰 Desconto em Produtos                 │ [✓]  │ [15%___] │ │
│  │ 🎁 Brinde Mensal                        │ [✓]  │ ───      │ │
│  │ ⚡ Acesso Antecipado                    │ [ ]  │ ───      │ │
│  │ 💬 Suporte Prioritário                  │ [ ]  │ ───      │ │
│  └─────────────────────────────────────────┴──────┴──────────┘ │
│                                                                 │
│  [Salvar Alterações]                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Benefícios Sugeridos (Seed)

| Nome | Slug | Ícone | Descrição |
|------|------|-------|-----------|
| Frete Grátis | `frete-gratis` | `Truck` | Frete grátis em todos os pedidos |
| Desconto em Produtos | `desconto-produtos` | `Percent` | Desconto percentual em produtos |
| Brinde Mensal | `brinde-mensal` | `Gift` | Brinde surpresa todo mês |
| Acesso Antecipado | `acesso-antecipado` | `Zap` | Acesso a lançamentos antes de todos |
| Suporte Prioritário | `suporte-prioritario` | `HeadsetIcon` | Atendimento preferencial |
| Pontos em Dobro | `pontos-dobro` | `Star` | Pontos de fidelidade multiplicados |

### 6.4 Exibição dos Benefícios no Frontend

**Componente reutilizável:** `PlanBenefitsList`

```tsx
interface PlanBenefitsListProps {
  planId: string;
  variant?: 'card' | 'list' | 'compact';
  showDisabled?: boolean;
}

// Uso em diferentes locais:
<PlanBenefitsList planId={plan.id} variant="card" />      // Card de plano
<PlanBenefitsList planId={plan.id} variant="list" />      // Página de detalhes
<PlanBenefitsList planId={plan.id} variant="compact" />   // Checkout
```

---

## 7. Informações de Frete no Pedido

### 7.1 Armazenamento

Ao criar o pedido, salvar as informações do frete selecionado:

```typescript
// No checkout.service.ts
const orderShippingInfo = await prisma.orderShippingInfo.create({
  data: {
    orderId: order.id,
    carrier: shippingOption.carrier,         // "Correios"
    serviceCode: shippingOption.serviceCode, // "04014"
    serviceName: shippingOption.serviceName, // "SEDEX"
    estimatedDays: shippingOption.deliveryTime, // 5
    shippingCost: shippingOption.price,      // 25.90
    packageWeight: calculatedWeight,          // 0.5
    packageDimensions: {
      width: 20,
      height: 10,
      length: 30
    },
    quotedAt: new Date()
  }
});
```

### 7.2 Exibição no Admin

**Rota:** `/admin/orders/[id]`

```
┌─────────────────────────────────────────────────────────────────┐
│  Pedido #ABC123                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📦 INFORMAÇÕES DE ENVIO                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Transportadora: Correios                                 │   │
│  │ Serviço: SEDEX (04014)                                  │   │
│  │ Prazo estimado: 5 dias úteis                            │   │
│  │ Valor do frete: R$ 25,90                                │   │
│  │ Peso: 0,5 kg                                            │   │
│  │ Dimensões: 20 x 10 x 30 cm                              │   │
│  │ Cotado em: 25/01/2026 às 14:30                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. API Endpoints

### 8.1 Benefícios (Admin)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/admin/benefits` | Listar todos os benefícios |
| `POST` | `/api/admin/benefits` | Criar benefício |
| `PUT` | `/api/admin/benefits/[id]` | Atualizar benefício |
| `DELETE` | `/api/admin/benefits/[id]` | Excluir benefício |

### 8.2 Plano-Benefícios (Admin)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/admin/subscriptions/[planId]/benefits` | Listar benefícios do plano |
| `PUT` | `/api/admin/subscriptions/[planId]/benefits` | Atualizar benefícios do plano |

### 8.3 Assinatura do Usuário

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/user/subscription` | Dados da assinatura ativa |
| `GET` | `/api/user/subscription/benefits` | Benefícios da assinatura |
| `GET` | `/api/user/subscription/payments` | Histórico de pagamentos |
| `POST` | `/api/user/subscription/cancel` | Solicitar cancelamento |
| `POST` | `/api/user/subscription/pause` | Pausar assinatura |
| `POST` | `/api/user/subscription/resume` | Retomar assinatura |

### 8.4 Benefícios Públicos

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/plans/[planId]/benefits` | Benefícios de um plano (público) |

---

## 9. Componentes a Criar/Modificar

### 9.1 Novos Componentes

| Componente | Local | Descrição |
|------------|-------|-----------|
| `BenefitsList` | `components/admin/benefits/` | Tabela de benefícios (admin) |
| `BenefitForm` | `components/admin/benefits/` | Formulário de benefício |
| `PlanBenefitsEditor` | `components/admin/subscriptions/` | Editor de benefícios por plano |
| `PlanBenefitsList` | `components/subscriptions/` | Exibição de benefícios (público) |
| `SubscriptionDashboard` | `components/subscriptions/` | Dashboard do assinante |
| `SubscriptionCard` | `components/subscriptions/` | Card com info da assinatura |
| `PaymentHistory` | `components/subscriptions/` | Histórico de pagamentos |
| `CancelSubscriptionModal` | `components/subscriptions/` | Modal de cancelamento |
| `OrderShippingInfo` | `components/admin/orders/` | Info de frete no admin |

### 9.2 Componentes a Modificar

| Componente | Modificação |
|------------|-------------|
| `SubscriptionPlanForm` | Adicionar seção de benefícios |
| `SubscriptionPlanCard` | Exibir benefícios dinâmicos |
| `OrderDetails` (admin) | Adicionar seção de frete |
| `CheckoutCartSummary` | Mostrar info de frete selecionado |

### 9.3 Novas Páginas

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/subscriptions` | `app/(protected)/subscriptions/page.tsx` | Dashboard do assinante |
| `/admin/benefits` | `app/(admin)/admin/benefits/page.tsx` | Gerenciar benefícios |
| `/admin/benefits/new` | `app/(admin)/admin/benefits/new/page.tsx` | Criar benefício |
| `/admin/benefits/[id]` | `app/(admin)/admin/benefits/[id]/page.tsx` | Editar benefício |

---

## 10. Roadmap de Implementação

### Fase 1: Database & Models (1-2 dias)
- [ ] Criar migration com novos models
- [ ] Atualizar schema.prisma
- [ ] Criar seed com benefícios padrão
- [ ] Testar migrations

### Fase 2: Backend - Benefícios (2-3 dias)
- [ ] Repository: `benefit.repository.ts`
- [ ] Service: `benefit.service.ts`
- [ ] API Routes: `/api/admin/benefits/*`
- [ ] Validação com Zod

### Fase 3: Admin - Benefícios (2-3 dias)
- [ ] Página de listagem
- [ ] Formulário de criação/edição
- [ ] Integração com planos
- [ ] Testes manuais

### Fase 4: Backend - Frete (1-2 dias)
- [ ] Atualizar checkout.service para salvar frete
- [ ] Criar endpoint para consultar frete do pedido
- [ ] Atualizar order.repository

### Fase 5: Admin - Frete (1 dia)
- [ ] Componente OrderShippingInfo
- [ ] Integrar na página de detalhes do pedido

### Fase 6: Portal do Assinante (3-4 dias)
- [ ] Página principal `/subscriptions`
- [ ] API routes do usuário
- [ ] Componente de dashboard
- [ ] Histórico de pagamentos
- [ ] Modal de cancelamento
- [ ] Fluxo de pausa/retomada

### Fase 7: Integração & Testes (2 dias)
- [ ] Exibir benefícios no checkout
- [ ] Exibir benefícios nas páginas de planos
- [ ] Testes end-to-end
- [ ] Ajustes de UX

**Total estimado: 12-17 dias**

---

## 11. Checklist de Implementação

### Database
- [ ] Migration: `Benefit` model
- [ ] Migration: `PlanBenefit` model
- [ ] Migration: `OrderShippingInfo` model
- [ ] Migration: Campos extras em `Subscription`
- [ ] Seed: Benefícios padrão
- [ ] Remover campo `features` do `SubscriptionPlan` (após migração de dados)

### Backend
- [ ] `repositories/benefit.repository.ts`
- [ ] `services/benefit.service.ts`
- [ ] `schemas/benefit.schema.ts`
- [ ] `types/benefit.ts`
- [ ] Atualizar `subscription.service.ts`
- [ ] Atualizar `checkout.service.ts` (frete)
- [ ] Atualizar `order.repository.ts` (frete)

### API Routes
- [ ] `/api/admin/benefits` (CRUD)
- [ ] `/api/admin/subscriptions/[id]/benefits`
- [ ] `/api/user/subscription`
- [ ] `/api/user/subscription/cancel`
- [ ] `/api/user/subscription/pause`
- [ ] `/api/user/subscription/resume`
- [ ] `/api/plans/[id]/benefits`

### Admin Pages
- [ ] `/admin/benefits` - Listagem
- [ ] `/admin/benefits/new` - Criar
- [ ] `/admin/benefits/[id]` - Editar
- [ ] Atualizar `/admin/subscriptions/[id]` - Seção de benefícios
- [ ] Atualizar `/admin/orders/[id]` - Seção de frete

### Client Pages
- [ ] `/subscriptions` - Dashboard do assinante

### Components
- [ ] `BenefitsList`
- [ ] `BenefitForm`
- [ ] `PlanBenefitsEditor`
- [ ] `PlanBenefitsList`
- [ ] `SubscriptionDashboard`
- [ ] `SubscriptionCard`
- [ ] `PaymentHistory`
- [ ] `CancelSubscriptionModal`
- [ ] `PauseSubscriptionModal`
- [ ] `OrderShippingInfo`

### Atualizar Components Existentes
- [ ] `SubscriptionPlanForm` - Adicionar editor de benefícios
- [ ] `SubscriptionPlanCard` - Exibir benefícios
- [ ] `WhySubscribe` - Usar benefícios dinâmicos
- [ ] `OrderDetails` (admin) - Info de frete
- [ ] `CheckoutCartSummary` - Mostrar frete

---

## 📝 Notas de Implementação

### Migração de Dados (features → benefits)

Ao implementar, criar script para migrar dados existentes:

```typescript
// scripts/migrate-features-to-benefits.ts
async function migrateFeatures() {
  const plans = await prisma.subscriptionPlan.findMany();
  
  for (const plan of plans) {
    for (const feature of plan.features) {
      // Criar ou encontrar benefício
      let benefit = await prisma.benefit.findFirst({
        where: { name: feature }
      });
      
      if (!benefit) {
        benefit = await prisma.benefit.create({
          data: { name: feature, slug: slugify(feature) }
        });
      }
      
      // Criar relação
      await prisma.planBenefit.create({
        data: {
          planId: plan.id,
          benefitId: benefit.id,
          enabled: true
        }
      });
    }
  }
}
```

### Cancelamento com Período de Graça

O cancelamento não é imediato - o usuário mantém acesso até o fim do período pago:

```typescript
// Em subscription.service.ts
async cancelSubscription(userId: string, reason?: string) {
  const subscription = await this.getActiveSubscription(userId);
  
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'PENDING_CANCELLATION',
      cancelRequestedAt: new Date(),
      cancelReason: reason
    }
  });
  
  // Opcional: Notificar Mercado Pago para não renovar
  // await this.mpService.cancelPreapproval(subscription.providerSubId);
  
  return { 
    message: 'Cancelamento agendado',
    activeUntil: subscription.currentPeriodEnd 
  };
}
```

---

> **Este documento deve ser atualizado conforme a implementação avança.**
