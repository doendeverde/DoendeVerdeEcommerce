# Integração Mercado Pago - Doende Verde

> **Última atualização:** Janeiro 2026  
> **Status:** ✅ Implementado

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Fluxos de Pagamento](#fluxos-de-pagamento)
4. [Assinaturas (Preapproval)](#assinaturas-preapproval)
5. [Webhooks](#webhooks)
6. [Testes](#testes)
7. [Qualidade da Integração](#qualidade-da-integração)

---

## Visão Geral

A integração com o Mercado Pago utiliza:

- **Checkout Bricks** para pagamentos com cartão (CardPayment Brick)
- **PIX** com geração de QR Code inline
- **Preapproval API** para assinaturas recorrentes

### Métodos de Pagamento Suportados

| Método | Pedidos Únicos | Assinaturas | Observação |
|--------|----------------|-------------|------------|
| Cartão de Crédito | ✅ | ✅ | Via CardPayment Brick |
| Cartão de Débito | ✅ | ❌ | Apenas compras |
| PIX | ✅ | ✅ (1º pagamento) | QR Code inline |

---

## Arquitetura

### Arquivos Core
- `lib/mercadopago.ts` - SDK, configuração e funções auxiliares
- `lib/mercadopago-quality.ts` - Helpers para qualidade da integração
- `services/mercadopago.service.ts` - Serviço de pagamento MP
- `services/payment.service.ts` - Orquestração de pagamentos
- `services/subscription.service.ts` - Lógica de assinaturas

### API Routes
- `app/api/checkout/subscription/route.ts` - Checkout de assinatura
- `app/api/checkout/payment-preference/route.ts` - Preferência (legado)
- `app/api/webhooks/mercadopago/route.ts` - Webhook para notificações

### Páginas de Callback
- `app/(default)/checkout/payment/success/page.tsx` - Pagamento aprovado
- `app/(default)/checkout/payment/failure/page.tsx` - Pagamento recusado
- `app/(default)/checkout/payment/pending/page.tsx` - Pagamento pendente (PIX)

---

## Fluxos de Pagamento

### Cartão de Crédito (Pedido Único)
```
Cliente → CardPaymentBrick → [Token] → /api/checkout/payment → MP API → Webhook → Pedido Confirmado
```

### PIX (Pedido Único)
```
Cliente → Seleção PIX → /api/checkout/payment → MP API → QR Code Gerado
                                                          ↓
                          Webhook ← Pagamento Confirmado ← Cliente Paga no App
```

### Assinatura com Cartão
```
Cliente → CardPaymentBrick → [Token] → /api/checkout/subscription → MP Preapproval API
                                                                      ↓
                                         Assinatura Ativa ← Webhook (preapproval + payment)
```

### Assinatura com PIX (1º Pagamento)
```
Cliente → PIX → /api/checkout/subscription → MP Payment API → QR Code
                                                               ↓
                   Assinatura Ativa ← Webhook ← Cliente Paga ← QR Code
                                      (depois converte para cartão)
```

---

## Assinaturas (Preapproval)

### Por que Preapproval?

| Abordagem | Cobrança Recorrente | Gestão de Falhas |
|-----------|---------------------|------------------|
| ❌ Checkout Pro | Manual | Manual |
| ✅ Preapproval API | Automática pelo MP | Automática (retry) |

### Fluxo de Assinatura
1. Cliente seleciona plano
2. CardPaymentBrick gera `card_token_id`
3. Sistema cria `preapproval` no MP com `auto_recurring`
4. MP cobra automaticamente no ciclo configurado
5. Webhooks notificam sobre:
   - `subscription_preapproval` (status da assinatura)
   - `subscription_authorized_payment` (pagamentos)

### Modelo de Dados
```prisma
model Subscription {
  id            String   @id
  userId        String
  planId        String
  status        SubscriptionStatus // ACTIVE, PAUSED, CANCELED
  provider      String   // "mercadopago"
  providerSubId String?  // ID do preapproval no MP
  startedAt     DateTime
  nextBillingAt DateTime
  canceledAt    DateTime?
}

model SubscriptionCycle {
  id             String @id
  subscriptionId String
  status         CycleStatus
  cycleStart     DateTime
  cycleEnd       DateTime
  amount         Decimal
  paymentId      String? // ID do pagamento no MP
}
```

---

## Webhooks

### URL de Webhook
```
{BASE_URL}/api/webhooks/mercadopago
```

### Eventos Processados

| Evento | Ação |
|--------|------|
| `payment.created` | Log |
| `payment.approved` | Confirma pedido/ciclo |
| `payment.rejected` | Marca falha |
| `subscription_preapproval` | Atualiza status da assinatura |
| `subscription_authorized_payment` | Registra ciclo de cobrança |

### Teste de Webhooks (Local)

1. **Criar pagamento PIX** - Logs mostram:
   ```
   =====================================
   🔵 PIX PAYMENT ID: 1234567890
      Order ID: abc-123
      Amount: R$ 59.90
   =====================================
   ```

2. **Simular aprovação:**
   ```bash
   npx tsx scripts/approve-pix.ts 1234567890
   ```

---

## Testes

### Variáveis de Ambiente

```env
# Mercado Pago - Credenciais de Teste
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-xxx
ACCESS_TOKEN_MP=TEST-xxx

# URL base
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Cartões de Teste

| Número | Bandeira | Resultado |
|--------|----------|-----------|
| 5031 4332 1540 6351 | Mastercard | ✅ Aprovado |
| 4235 6477 2802 5682 | Visa | ✅ Aprovado |
| 3753 651535 56885 | Amex | ✅ Aprovado |
| 5031 4332 1540 6351 | Mastercard | ❌ Rejeitado (nome: OTHE) |

**CVV:** 123  
**Validade:** Qualquer data futura  
**Nome:** APRO (aprovado) | OTHE (rejeitado)

### Usuários de Teste

Criar em: https://www.mercadopago.com.br/developers/panel/test-users

- **Vendedor (seller)**: Usa credenciais da conta de desenvolvedor
- **Comprador (buyer)**: Para simular compras

---

## Qualidade da Integração

### Campos de Qualidade Implementados

Para máxima pontuação no painel do MP:

| Campo | Status | Local |
|-------|--------|-------|
| `statement_descriptor` | ✅ | lib/mercadopago-quality.ts |
| `additional_info.payer` | ✅ | Dados completos do pagador |
| `additional_info.items` | ✅ | Itens do pedido |
| `additional_info.shipments` | ✅ | Endereço de entrega |
| `three_d_secure_mode` | ✅ | "optional" para cartões |

### Helper de Qualidade

```typescript
// lib/mercadopago-quality.ts
import { buildAdditionalInfo, STATEMENT_DESCRIPTOR } from '@/lib/mercadopago-quality';

const payment = {
  statement_descriptor: STATEMENT_DESCRIPTOR, // "DOENDEVERDE"
  additional_info: buildAdditionalInfo({
    payer: { firstName, lastName, email, phone, address },
    items: orderItems,
    shipping: shippingAddress
  })
};
```

---

## Referências

- [Documentação oficial MP](https://www.mercadopago.com.br/developers/pt/docs)
- [API de Pagamentos](https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post)
- [API de Preapproval](https://www.mercadopago.com.br/developers/pt/reference/subscriptions/_preapproval/post)
- [Checkout Bricks](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/landing)
