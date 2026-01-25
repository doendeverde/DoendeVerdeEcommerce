# 📋 Referência Completa do Sistema de Assinaturas

> **⚠️ DOCUMENTO DE REFERÊNCIA CRÍTICO**  
> Este documento detalha a arquitetura completa do sistema de assinaturas do Doende Verde.  
> **LEIA COMPLETAMENTE antes de fazer qualquer alteração relacionada a assinaturas ou pagamentos.**

---

## 🚨 LIMITAÇÃO CRÍTICA - CHECKOUT BRICKS + USUÁRIOS DE TESTE

### ❌ O QUE NÃO FUNCIONA

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⛔ CHECKOUT BRICKS NÃO SUPORTA USUÁRIOS DE TESTE DO MERCADO PAGO!     │
│                                                                         │
│  A documentação oficial do Mercado Pago afirma:                        │
│  "Integrações com Checkout Bricks não suportam usuários de teste"      │
│                                                                         │
│  Isso significa que:                                                    │
│  - Emails no formato test_user_XXXXXX@testuser.com NÃO FUNCIONAM       │
│  - O Brick simplesmente não carrega ou dá erro                         │
│  - Não há workaround - é limitação da API do MP                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### ❌ O QUE TAMBÉM NÃO FUNCIONA

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⛔ PREAPPROVAL API COM STATUS=AUTHORIZED EXIGE USUÁRIO DE TESTE!      │
│                                                                         │
│  Quando usamos credenciais de TESTE (TEST-xxx...):                     │
│  - A API /preapproval com status=authorized faz cobrança imediata      │
│  - O PolicyAgent do MP valida que o payer_email é de usuário de teste  │
│  - Emails REAIS retornam erro 403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES │
│                                                                         │
│  Ou seja: em ambiente de teste, precisa de email de teste, mas o       │
│  Checkout Bricks não aceita usuário de teste = PARADOXO!               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 🔄 PARADOXO DO AMBIENTE DE TESTE

| Componente | Exige email de teste? | Aceita email de teste? |
|------------|----------------------|------------------------|
| Checkout Bricks (Frontend) | ❌ Não | ⛔ **NÃO** |
| Preapproval API (Backend) | ✅ **SIM** | ✅ Sim |
| **Resultado** | 💥 **CONFLITO** | |

**Conclusão: É IMPOSSÍVEL testar o fluxo completo de assinatura com cartão em ambiente de teste usando Checkout Bricks.**

---

## ✅ SOLUÇÕES POSSÍVEIS

### Opção 1: Testar Apenas com PIX (Recomendado para Ambiente de Teste)

O PIX não tem a limitação do Checkout Bricks:
1. Usuário seleciona PIX no checkout
2. Sistema gera QR Code
3. Você aprova manualmente via script `scripts/approve-pix.ts`
4. Webhook processa o pagamento

```bash
# Aprovar PIX manualmente
npx tsx scripts/approve-pix.ts <payment_id>
```

### Opção 2: Testar com Credenciais de Produção (CUIDADO!)

**⚠️ MUITO CUIDADO - COBRANÇA REAL!**

1. Configure `MP_USE_PRODUCTION=true` no `.env`
2. Use suas credenciais de produção
3. Use um cartão REAL com limite baixo
4. Faça uma assinatura de valor mínimo (R$ 1,00)
5. **CANCELE IMEDIATAMENTE após o teste**

```env
# .env para teste de produção
MP_USE_PRODUCTION=true
MP_PROD_ACCESS_TOKEN=APP_USR-xxx...
MP_PROD_PUBLIC_KEY=APP_USR-xxx...
```

### Opção 3: Usar Card Form API Diretamente (Sem Brick)

Substituir o Checkout Bricks por tokenização manual:
1. Criar formulário customizado de cartão
2. Usar `MercadoPago.createCardToken()` diretamente
3. Isso aceita usuários de teste

**Desvantagem:** Mais trabalho, menos segurança visual, mais código para manter.

### Opção 4: Testar Backend Isoladamente

Testar apenas a integração backend com mocks:
1. Mockar o token do cartão
2. Testar a chamada à API de Preapproval
3. Verificar tratamento de erros
4. Testar webhooks

---

## 🏗️ ARQUITETURA DO SISTEMA DE ASSINATURAS

### Visão Geral do Fluxo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CHECKOUT DE ASSINATURA                        │
└─────────────────────────────────────────────────────────────────────────┘

    FRONTEND (Next.js)                          BACKEND (API Routes)
    ──────────────────                          ────────────────────
         │                                              │
    1. Usuário escolhe plano                            │
         │                                              │
    2. /checkout/subscription                           │
         │                                              │
    3. Preenche dados:                                  │
       - Preferências                                   │
       - Endereço                                       │
       - Pagamento (Brick)                              │
         │                                              │
    4. Checkout Bricks tokeniza ─────────────────→ (SDK MP direto)
       cartão e retorna TOKEN                           │
         │                                              │
    5. Submit form ─────────────────────────────→ POST /api/checkout/subscription
         │                                              │
         │                                       6. Valida dados
         │                                              │
         │                                       7. Cria UserSubscription
         │                                          status: PENDING
         │                                              │
         │                                       8. Chama createPreapproval()
         │                                          com card_token + status=authorized
         │                                              │
         │                                              ↓
         │                                       ┌──────────────────┐
         │                                       │  MERCADO PAGO    │
         │                                       │  POST /preapproval│
         │                                       └──────────────────┘
         │                                              │
         │                                       9. MP processa e faz
         │                                          primeira cobrança
         │                                              │
         │                                       10. Retorna preapproval_id
         │                                              │
         │                                       11. Atualiza UserSubscription
         │                                           providerSubId = preapproval_id
         │                                              │
    ←───────────────────────────────────────────── 12. Retorna sucesso
         │                                              │
    13. Redirect para                                   │
        /profile/subscriptions                          │
         │                                              │
         │                                              │
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              WEBHOOK (Assíncrono)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                                                        │
                                                 14. MP envia webhook
                                                     topic: subscription_authorized_payment
                                                        │
                                                        ↓
                                                 POST /api/webhooks/mercadopago
                                                        │
                                                 15. Valida assinatura
                                                        │
                                                 16. Atualiza status
                                                     para ACTIVE
                                                        │
                                                 17. Cria Payment record
```

### Componentes Principais

```
📁 Frontend (Componentes)
├── app/(default)/subscriptions/
│   └── page.tsx                    # Lista planos disponíveis
│
├── app/(default)/checkout/
│   └── subscription/               # Checkout de assinatura (se existir)
│
└── components/checkout/
    ├── CardPaymentBrick.tsx        # ⚠️ CHECKOUT BRICKS (limitação de teste)
    └── subscription/
        ├── PaymentStep.tsx         # Usa CardPaymentBrick
        ├── AddressStep.tsx         # Coleta endereço
        ├── PreferencesStep.tsx     # Coleta preferências
        └── OrderSummary.tsx        # Resumo do pedido

📁 Backend (Services)
├── services/
│   ├── subscription.service.ts     # CRUD de planos e assinaturas
│   └── subscription-mp.service.ts  # Integração com MP Preapproval
│
├── lib/
│   ├── mercadopago-subscriptions.ts # Wrapper da API Preapproval
│   └── mercadopago-config.ts        # Configuração centralizada
│
└── app/api/
    ├── checkout/subscription/
    │   └── route.ts                 # Endpoint de checkout
    └── webhooks/mercadopago/
        └── route.ts                 # Recebe webhooks do MP
```

---

## 📊 MODELO DE DADOS

### Prisma Schema (Simplificado)

```prisma
model UserSubscription {
  id              String   @id @default(uuid())
  userId          String
  planId          String
  status          SubscriptionStatus
  
  // Dados do Mercado Pago
  providerSubId   String?  // ID do Preapproval no MP
  providerPayId   String?  // ID do último pagamento
  
  // Datas
  startedAt       DateTime?
  nextBillingAt   DateTime?
  canceledAt      DateTime?
  
  // Relações
  user            User     @relation(...)
  plan            SubscriptionPlan @relation(...)
}

enum SubscriptionStatus {
  PENDING       // Aguardando primeira cobrança
  ACTIVE        // Ativa e em dia
  PAUSED        // Pausada pelo usuário/vendedor
  CANCELED      // Cancelada
  PAST_DUE      // Pagamento atrasado
  EXPIRED       // Expirada (fim do período)
}
```

---

## 🔑 CREDENCIAIS E CONFIGURAÇÃO

### Variáveis de Ambiente

```env
# ════════════════════════════════════════════════════════════
# MERCADO PAGO - CONFIGURAÇÃO
# ════════════════════════════════════════════════════════════

# Flag que determina qual conjunto de credenciais usar
# true = Produção (cobranças reais)
# false = Teste (sandbox)
MP_USE_PRODUCTION=false

# ─────────────────────────────────────────────────────────────
# CREDENCIAIS DE TESTE (quando MP_USE_PRODUCTION=false)
# ─────────────────────────────────────────────────────────────
MP_TEST_ACCESS_TOKEN=TEST-686632316717044-...
MP_TEST_PUBLIC_KEY=TEST-3bc1f0a3-...

# ─────────────────────────────────────────────────────────────
# CREDENCIAIS DE PRODUÇÃO (quando MP_USE_PRODUCTION=true)
# ─────────────────────────────────────────────────────────────
MP_PROD_ACCESS_TOKEN=APP_USR-...
MP_PROD_PUBLIC_KEY=APP_USR-...

# ─────────────────────────────────────────────────────────────
# WEBHOOK (para desenvolvimento local)
# ─────────────────────────────────────────────────────────────
WEBHOOK_NGROK_URL=https://abc123.ngrok.io
```

### Comportamento da Configuração

```typescript
// lib/mercadopago-config.ts

const IS_MP_PRODUCTION = process.env.MP_USE_PRODUCTION === "true";

const MP_ACCESS_TOKEN = IS_MP_PRODUCTION
  ? process.env.MP_PROD_ACCESS_TOKEN
  : process.env.MP_TEST_ACCESS_TOKEN;

const MP_PUBLIC_KEY = IS_MP_PRODUCTION
  ? process.env.MP_PROD_PUBLIC_KEY
  : process.env.MP_TEST_PUBLIC_KEY;
```

---

## 🔄 API DE PREAPPROVAL DO MERCADO PAGO

### Endpoint Principal

```
POST https://api.mercadopago.com/preapproval
```

### Request Body (Assinatura sem Plano Associado)

```json
{
  "back_url": "https://seusite.com/profile/subscriptions",
  "reason": "Assinatura Doende Bronze - Doende Verde",
  "payer_email": "cliente@email.com",
  "card_token_id": "token_gerado_pelo_brick",
  "status": "authorized",
  "notification_url": "https://seusite.com/api/webhooks/mercadopago",
  "external_reference": "sub_uuid_interno",
  "auto_recurring": {
    "frequency": 1,
    "frequency_type": "months",
    "transaction_amount": 49.90,
    "currency_id": "BRL",
    "start_date": "2025-01-24T12:00:00.000Z"
  }
}
```

### Response de Sucesso

```json
{
  "id": "2c938084726fca480172750000000000",
  "status": "authorized",
  "reason": "Assinatura Doende Bronze - Doende Verde",
  "payer_email": "cliente@email.com",
  "external_reference": "sub_uuid_interno",
  "next_payment_date": "2025-02-24T12:00:00.000Z",
  "date_created": "2025-01-24T12:00:00.000Z"
}
```

### Erro 403 - PolicyAgent (O QUE VOCÊ ENCONTROU)

```json
{
  "status": 403,
  "blocked_by": "PolicyAgent",
  "message": "At least one policy returned UNAUTHORIZED.",
  "code": "PA_UNAUTHORIZED_RESULT_FROM_POLICIES"
}
```

**Causa:** Usando credenciais de TESTE com email REAL.  
**Solução:** Ver seção "SOLUÇÕES POSSÍVEIS" no início deste documento.

---

## 🧪 COMO TESTAR CORRETAMENTE

### ✅ Teste de PIX (Funciona em Ambiente de Teste)

1. Faça checkout selecionando PIX
2. Sistema gera QR Code (payment_id)
3. Simule pagamento:
   ```bash
   npx tsx scripts/approve-pix.ts <payment_id>
   ```
4. Webhook é acionado e processa pagamento

### ✅ Teste de Cartão (Apenas em Produção)

1. Configure `MP_USE_PRODUCTION=true`
2. Use cartão REAL
3. Faça assinatura de teste (valor mínimo)
4. **CANCELE imediatamente após validar**

### ❌ NÃO FUNCIONA

- Checkout Bricks + Usuário de Teste
- Preapproval API + Email Real + Credenciais de Teste

---

## 📞 WEBHOOKS

### Tópicos Relevantes para Assinaturas

| Tópico | Quando é enviado |
|--------|------------------|
| `subscription_preapproval` | Assinatura criada/atualizada |
| `subscription_authorized_payment` | Cobrança recorrente bem-sucedida |
| `payment` | Qualquer pagamento (incluindo subscription) |

### Configuração no Painel MP

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em "Webhooks"
4. Configure URL: `https://seu-dominio/api/webhooks/mercadopago`
5. Marque os tópicos: `payment`, `subscription_preapproval`, `subscription_authorized_payment`

### Desenvolvimento Local (ngrok)

```bash
# Terminal 1: Inicie ngrok
ngrok http 3000

# Terminal 2: Configure no .env
WEBHOOK_NGROK_URL=https://abc123.ngrok.io

# Terminal 3: Inicie o dev server
npm run dev
```

---

## 🐛 TROUBLESHOOTING

### Erro: PA_UNAUTHORIZED_RESULT_FROM_POLICIES (403)

**Causa:** Email real com credenciais de teste.  
**Solução:** Use PIX para testes ou credenciais de produção.

### Erro: Checkout Bricks não carrega

**Causa:** Pode ser usuário de teste ou public key inválida.  
**Verificar:**
1. `NEXT_PUBLIC_MP_PUBLIC_KEY` está configurado?
2. O usuário logado não é um usuário de teste do MP?
3. Console do browser mostra algum erro do SDK?

### Erro: Token do cartão inválido/expirado

**Causa:** Token expira em ~15 minutos.  
**Solução:** Refazer o checkout do zero.

### Erro: Webhook não está sendo chamado

**Verificar:**
1. ngrok está rodando?
2. `WEBHOOK_NGROK_URL` está correto?
3. Webhook está configurado no painel MP?
4. URL do webhook no painel tem o path `/api/webhooks/mercadopago`?

---

## 📚 LINKS ÚTEIS

- [Documentação Preapproval](https://www.mercadopago.com.br/developers/pt/docs/subscriptions)
- [Checkout Bricks](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks)
- [Cartões de Teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/test-cards)
- [Usuários de Teste](https://www.mercadopago.com.br/developers/panel/test-users)
- [Painel de Aplicações](https://www.mercadopago.com.br/developers/panel/app)
- [API Reference - Preapproval](https://www.mercadopago.com.br/developers/pt/reference/subscriptions/_preapproval/post)

---

## ⚡ RESUMO RÁPIDO

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CHECKLIST RÁPIDO                                 │
└─────────────────────────────────────────────────────────────────────────┘

□ Checkout Bricks NÃO aceita usuários de teste do MP
□ Preapproval API EXIGE usuário de teste (em ambiente sandbox)
□ Resultado: Impossível testar cartão em ambiente de teste
□ Solução: Usar PIX para testes ou testar com credenciais de produção
□ Credenciais: MP_USE_PRODUCTION controla qual usar
□ Webhooks: Precisa de ngrok para dev local
□ Erro 403 PolicyAgent: Email real + credenciais teste = bloqueado

┌─────────────────────────────────────────────────────────────────────────┐
│                     FLUXO SIMPLIFICADO                                  │
└─────────────────────────────────────────────────────────────────────────┘

1. Frontend → CardPaymentBrick → Tokeniza cartão
2. Frontend → POST /api/checkout/subscription → Cria subscription
3. Backend → POST /preapproval (MP) → Cria assinatura + primeira cobrança
4. MP → Webhook → Confirma pagamento
5. Backend → Atualiza status para ACTIVE
6. MP → Cobra automaticamente todo mês
```

---

*Última atualização: Janeiro 2026*
*Versão: 1.0*
