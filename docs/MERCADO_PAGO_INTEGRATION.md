# Integração Mercado Pago - Doende Verde

## Visão Geral

A integração com o Mercado Pago foi implementada usando o **Checkout Pro**, que redireciona o usuário para a página segura do Mercado Pago para completar o pagamento.

## Arquivos Criados/Modificados

### Core
- [lib/mercadopago.ts](lib/mercadopago.ts) - Configuração do SDK e funções auxiliares
- [services/payment.service.ts](services/payment.service.ts) - Serviço de pagamento

### API Routes
- [app/api/checkout/payment-preference/route.ts](app/api/checkout/payment-preference/route.ts) - Cria preferência de pagamento
- [app/api/webhooks/mercadopago/route.ts](app/api/webhooks/mercadopago/route.ts) - Webhook para notificações

### Páginas de Callback
- [app/(default)/checkout/payment/success/page.tsx](app/(default)/checkout/payment/success/page.tsx) - Pagamento aprovado
- [app/(default)/checkout/payment/failure/page.tsx](app/(default)/checkout/payment/failure/page.tsx) - Pagamento recusado
- [app/(default)/checkout/payment/pending/page.tsx](app/(default)/checkout/payment/pending/page.tsx) - Pagamento pendente

## Fluxo de Pagamento

### Checkout Pro (Cartão)
1. Usuário seleciona plano e confirma preferências
2. Seleciona endereço de entrega
3. Escolhe método de pagamento (Cartão de Crédito/Débito)
4. Clica em "Finalizar assinatura"
5. Sistema cria preferência no Mercado Pago (`POST /api/checkout/payment-preference`)
6. Usuário é redirecionado para `init_point` do Mercado Pago
7. Completa pagamento na página segura do MP
8. MP redireciona para `/checkout/payment/success|failure|pending`
9. Webhook recebe notificação e atualiza status

### PIX
1. Usuário seleciona PIX como método
2. Sistema cria pagamento PIX direto (`createPixPaymentDirect`)
3. Retorna QR Code para exibição
4. Usuário paga via app do banco
5. Webhook recebe confirmação e ativa assinatura

## Variáveis de Ambiente

```env
# Mercado Pago - Credenciais de Teste
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-xxx
ACCESS_TOKEN_MP=TEST-xxx

# URL base para callbacks
AUTH_URL=http://localhost:3000
```

## Webhooks

O Mercado Pago envia notificações para `/api/webhooks/mercadopago`:

```typescript
// Tipos de notificação
- payment.created
- payment.approved
- payment.rejected
- payment.pending
- payment.cancelled
```

### Processamento
1. Valida assinatura (x-signature)
2. Busca detalhes do pagamento via API
3. Atualiza status do pedido/assinatura
4. Registra evento no banco (`WebhookEvent`)

## Modos de Teste

A integração detecta automaticamente se está em modo teste:

```typescript
// lib/mercadopago.ts
export function isTestMode(): boolean {
  return process.env.ACCESS_TOKEN_MP?.startsWith("TEST-") ?? false;
}
```

Em modo teste:
- Usa `sandbox_init_point` em vez de `init_point`
- Cartões de teste do MP funcionam
- Pagamentos são simulados

## Cartões de Teste

Use os cartões oficiais do Mercado Pago para testes:

| Número | Bandeira | Status |
|--------|----------|--------|
| 5031 4332 1540 6351 | Mastercard | Aprovado |
| 4235 6477 2802 5682 | Visa | Aprovado |
| 3753 651535 56885 | Amex | Aprovado |

CVV: 123 | Vencimento: Qualquer futuro | Nome: APRO

## Próximos Passos

1. [ ] Configurar webhooks em produção (URL pública)
2. [ ] Implementar retry de webhooks
3. [ ] Adicionar logs detalhados de pagamento
4. [ ] Configurar credenciais de produção
5. [ ] Implementar UI de PIX com QR Code
6. [ ] Adicionar suporte a parcelamento
7. [ ] Implementar estorno/cancelamento
