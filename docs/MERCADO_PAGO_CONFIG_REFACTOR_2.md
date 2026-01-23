# 🔧 Refatoração: Configuração Dinâmica do Mercado Pago

**Commit:** `9f82f02` - feat: add centralized Mercado Pago configuration and validation  
**Data:** 23/01/2026  
**Branch:** `dev`  
**Autor:** Delmiro Carrilho

---

## 🤖 PROMPT PARA O AGENTE (COPIAR E COLAR)

```
Preciso refazer o commit 9f82f02 que implementa configuração dinâmica do Mercado Pago.

CONTEXTO:
- O sistema tinha credenciais hardcoded no .env
- MP_USE_PRODUCTION=false não tinha efeito  
- Causava erro cc_rejected_high_risk ao testar com credenciais de produção
- Card payment não funcionava (campos errados)
- Scroll to top não funcionava ao trocar de passo no checkout

OBJETIVO:
Implementar configuração centralizada que seleciona automaticamente credenciais TEST ou PRODUÇÃO baseado em MP_USE_PRODUCTION, além de corrigir bugs no checkout.

MUDANÇAS A FAZER (EM ORDEM):

1. CRIAR lib/mercadopago-config.ts:
   - Ler MP_USE_PRODUCTION do .env (true = PROD, false = TEST)
   - Exportar MP_PUBLIC_KEY (seleciona TEST ou PROD automaticamente)
   - Exportar MP_ACCESS_TOKEN (seleciona TEST ou PROD automaticamente)  
   - Exportar IS_MP_PRODUCTION (boolean)
   - Criar função validateMercadoPagoConfig() que valida se credenciais existem
   - Adicionar warnings se prefixo não bater (TEST- vs APP_USR-)
   - Adicionar logs de inicialização mostrando modo ativo (TESTE/PRODUÇÃO)

2. ATUALIZAR lib/mercadopago.ts:
   - ADICIONAR imports: { MP_ACCESS_TOKEN, MP_PUBLIC_KEY, validateMercadoPagoConfig, IS_MP_PRODUCTION } from "./mercadopago-config"
   - CHAMAR validateMercadoPagoConfig() logo após imports
   - ATUALIZAR mercadoPagoClient: usar accessToken: MP_ACCESS_TOKEN!
   - REMOVER função getMercadoPagoAccessToken() completamente
   - ATUALIZAR getAccessToken(): retornar MP_ACCESS_TOKEN diretamente
   - ATUALIZAR isTestMode(): retornar !IS_MP_PRODUCTION

3. ATUALIZAR next.config.ts:
   - ADICIONAR lógica antes de nextConfig:
     * const isProduction = process.env.MP_USE_PRODUCTION === "true"
     * const mercadoPagoEnv = { NEXT_PUBLIC_MP_PUBLIC_KEY: isProduction ? MP_PROD : MP_TEST, MP_USE_PRODUCTION }
   - ADICIONAR console.logs visuais com ━━━ mostrando modo (🟢 TESTE ou 🔴 PRODUÇÃO)
   - ADICIONAR env: mercadoPagoEnv dentro de nextConfig

4. ATUALIZAR .env:
   - REMOVER linhas hardcoded:
     * NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-...
     * MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
   - ADICIONAR após MP_TEST_ACCESS_TOKEN:
     ```
     # ⚠️  IMPORTANTE:
     # As credenciais são selecionadas AUTOMATICAMENTE baseado em MP_USE_PRODUCTION
     # NÃO edite NEXT_PUBLIC_MP_PUBLIC_KEY ou MERCADO_PAGO_ACCESS_TOKEN manualmente!
     # O sistema usa:
     #   - MP_USE_PRODUCTION=false → Credenciais de TESTE  
     #   - MP_USE_PRODUCTION=true  → Credenciais de PRODUÇÃO
     ```

5. ATUALIZAR components/checkout/CardPaymentBrick.tsx:
   - No useEffect de inicialização (onde tem const publicKey = process.env...), ADICIONAR após if (!publicKey):
     ```typescript
     // Validação: verificar se está usando credenciais corretas
     const isProduction = process.env.MP_USE_PRODUCTION === "true";
     if (isProduction && !publicKey.startsWith("APP_USR-")) {
       console.error("⚠️  AVISO: MP_USE_PRODUCTION=true mas public key não começa com APP_USR-");
     } else if (!isProduction && !publicKey.startsWith("TEST-")) {
       console.error("⚠️  AVISO: MP_USE_PRODUCTION=false mas public key não começa com TEST-");
     }
     
     console.log(`[CardPaymentBrick] Inicializando em modo: ${isProduction ? "PRODUÇÃO" : "TESTE"}`);
     console.log(`[CardPaymentBrick] Public Key: ${publicKey.substring(0, 20)}...`);
     ```

6. ATUALIZAR app/(default)/checkout/ProductCheckoutClient.tsx:
   
   A. FIX SCROLL TO TOP (linha ~82):
   ANTES:
   ```typescript
   useEffect(() => {
     window.scrollTo({ top: 0, behavior: "smooth" });
   }, []);
   ```
   DEPOIS:
   ```typescript
   useEffect(() => {
     window.scrollTo({ top: 0, behavior: "smooth" });
   }, [currentStep]); // ← ADICIONAR currentStep
   ```
   
   B. FIX CARD PAYMENT FIELDS (linha ~280, dentro de handlePaymentSubmit):
   ANTES:
   ```typescript
   paymentData = {
     method,
     cardToken: cardData.token,
     cardBrand: cardData.paymentMethodId,
     installments,
   };
   ```
   DEPOIS:
   ```typescript
   paymentData = {
     method,
     token: cardData.token,                          // ← MUDOU de cardToken para token
     paymentMethodId: cardData.paymentMethodId,      // ← MUDOU de cardBrand para paymentMethodId
     issuerId: cardData.issuerId,                    // ← NOVO
     installments,
     payerEmail: formData.email,                     // ← NOVO
     identificationType: cardData.identificationType, // ← NOVO
     identificationNumber: cardData.identificationNumber, // ← NOVO
   };
   ```

7. ATUALIZAR types/checkout.ts:
   - Na interface PaymentFormData, ADICIONAR novos campos:
   ```typescript
   export interface PaymentFormData {
     method: "pix" | "credit_card" | "debit_card";
     
     // New fields (aligned with Zod schema)
     token?: string;
     paymentMethodId?: string;
     issuerId?: number;
     payerEmail?: string;
     identificationType?: string;
     identificationNumber?: string;
     
     // Legacy fields (keep for compatibility)
     cardToken?: string;
     cardBrand?: string;
     
     installments?: number;
   }
   ```

8. ATUALIZAR services/checkout.service.ts:
   - Na função processCardPayment (linha ~370), SUBSTITUIR TUDO por:
   ```typescript
   async function processCardPayment(
     order: Order,
     paymentData: any,
     userEmail: string
   ): Promise<Payment> {
     const { createCardPayment, buildCardPaymentRequest, isPaymentApproved } = 
       await import("./mercadopago.service");

     console.log("[MercadoPago] Creating card payment:", {
       amount: order.total_amount,
       externalReference: order.id,
       email: userEmail,
       paymentMethodId: paymentData.paymentMethodId,
       installments: paymentData.installments,
     });

     // Build payment request
     const paymentRequest = buildCardPaymentRequest({
       amount: order.total_amount,
       token: paymentData.token,
       paymentMethodId: paymentData.paymentMethodId,
       issuerId: paymentData.issuerId,
       installments: paymentData.installments || 1,
       email: userEmail,
       description: `Pedido ${order.id}`,
       externalReference: order.id,
       metadata: {
         payment_id: order.payments[0].id,
         type: "product",
         order_id: order.id,
       },
     });

     // Create payment via Mercado Pago
     const mpPayment = await createCardPayment(paymentRequest);

     console.log("[MercadoPago] Card payment created:", {
       id: mpPayment.id,
       status: mpPayment.status,
       statusDetail: mpPayment.status_detail,
     });

     // Update payment record
     const payment = await paymentRepository.updatePayment(order.payments[0].id, {
       transaction_id: String(mpPayment.id),
       status: isPaymentApproved(mpPayment.status) ? "PAID" : "PENDING",
       payment_method: "CREDIT_CARD",
       paid_at: isPaymentApproved(mpPayment.status) ? new Date() : null,
     });

     return payment;
   }
   ```

DEPOIS DE FAZER TUDO:
1. Deletar pasta .next (limpar cache)
2. npm run dev
3. Verificar logs: deve mostrar "🟢 TESTE" com MP_USE_PRODUCTION=false
4. Testar pagamento com cartão de teste (5031 4332 1540 6351)
5. Verificar que webhook mostra live_mode: false
6. Order deve ficar PAID

ARQUIVOS MODIFICADOS:
- lib/mercadopago-config.ts (NOVO)
- lib/mercadopago.ts
- next.config.ts  
- .env
- components/checkout/CardPaymentBrick.tsx
- app/(default)/checkout/ProductCheckoutClient.tsx
- types/checkout.ts
- services/checkout.service.ts

Use este documento (MERCADO_PAGO_CONFIG_REFACTOR.md) como referência detalhada completa.
```

---

## 📋 Resumo das Mudanças

### Problema Original
- ❌ Credenciais do Mercado Pago hardcoded no `.env`
- ❌ `MP_USE_PRODUCTION=false` não tinha efeito
- ❌ Sistema sempre usava `NEXT_PUBLIC_MP_PUBLIC_KEY` e `MERCADO_PAGO_ACCESS_TOKEN` fixos
- ❌ Causava `cc_rejected_high_risk` ao testar (usava prod com cartão teste)
- ❌ Card payment não funcionava (campos errados)
- ❌ Scroll to top não funcionava ao trocar de passo

### Solução Implementada
- ✅ Configuração centralizada lê `MP_USE_PRODUCTION`
- ✅ Seleção automática de credenciais (TEST vs PRODUÇÃO)
- ✅ Validação na inicialização
- ✅ Logs visuais indicando modo ativo
- ✅ Card payment com campos corretos
- ✅ Scroll to top funcionando

---

## 🔨 Passo a Passo Detalhado

### **PASSO 1: Criar `lib/mercadopago-config.ts`**

Criar novo arquivo com configuração centralizada:

```typescript
/**
 * Configuração centralizada do Mercado Pago
 * 
 * Lê MP_USE_PRODUCTION e retorna as credenciais corretas
 */

const isProduction = process.env.MP_USE_PRODUCTION === "true";

/**
 * Public Key (usado no frontend - Checkout Bricks)
 * Seleciona automaticamente baseado em MP_USE_PRODUCTION
 */
export const MP_PUBLIC_KEY = isProduction
  ? process.env.MP_PROD_PUBLIC_KEY
  : process.env.MP_TEST_PUBLIC_KEY;

/**
 * Access Token (usado no backend - API calls)
 * Seleciona automaticamente baseado em MP_USE_PRODUCTION
 */
export const MP_ACCESS_TOKEN = isProduction
  ? process.env.MP_PROD_ACCESS_TOKEN
  : process.env.MP_TEST_ACCESS_TOKEN;

/**
 * Indica se está em modo produção
 */
export const IS_MP_PRODUCTION = isProduction;

/**
 * Valida se as credenciais necessárias estão configuradas
 */
export function validateMercadoPagoConfig() {
  if (!MP_PUBLIC_KEY) {
    throw new Error(
      `Credencial ${isProduction ? "MP_PROD_PUBLIC_KEY" : "MP_TEST_PUBLIC_KEY"} não configurada no .env`
    );
  }

  if (!MP_ACCESS_TOKEN) {
    throw new Error(
      `Credencial ${isProduction ? "MP_PROD_ACCESS_TOKEN" : "MP_TEST_ACCESS_TOKEN"} não configurada no .env`
    );
  }

  // Validação adicional: verificar se está usando credenciais corretas
  if (isProduction && !MP_PUBLIC_KEY?.startsWith("APP_USR-")) {
    console.warn("⚠️  MP_USE_PRODUCTION=true mas MP_PROD_PUBLIC_KEY não começa com APP_USR-");
  }

  if (!isProduction && !MP_PUBLIC_KEY?.startsWith("TEST-")) {
    console.warn("⚠️  MP_USE_PRODUCTION=false mas MP_TEST_PUBLIC_KEY não começa com TEST-");
  }
}

// Log de inicialização (apenas no servidor)
if (typeof window === "undefined") {
  console.log(`[MercadoPago Config] Modo: ${isProduction ? "PRODUÇÃO" : "TESTE"}`);
  console.log(`[MercadoPago Config] Public Key: ${MP_PUBLIC_KEY?.substring(0, 20)}...`);
}
```

---

### **PASSO 2: Atualizar `lib/mercadopago.ts`**

#### A. Imports (linhas 1-16)

**ANTES:**
```typescript
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

// ─────────────────────────────────────────────────────────────────────────────
// Environment Configuration
// ─────────────────────────────────────────────────────────────────────────────

function getMercadoPagoAccessToken(): string {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.ACCESS_TOKEN_MP;
  
  if (!token) {
    throw new Error(
      "Mercado Pago Access Token não configurado. " +
      "Configure MERCADO_PAGO_ACCESS_TOKEN ou ACCESS_TOKEN_MP no .env"
    );
  }
  
  return token;
}
```

**DEPOIS:**
```typescript
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { 
  MP_ACCESS_TOKEN, 
  MP_PUBLIC_KEY, 
  validateMercadoPagoConfig,
  IS_MP_PRODUCTION 
} from "./mercadopago-config";

// ─────────────────────────────────────────────────────────────────────────────
// Environment Configuration
// ─────────────────────────────────────────────────────────────────────────────

// Valida configuração na inicialização
validateMercadoPagoConfig();
```

#### B. Funções de configuração (linhas 17-52)

**ANTES:**
```typescript
export function getMercadoPagoPublicKey(): string {
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
  
  if (!publicKey) {
    throw new Error("NEXT_PUBLIC_MP_PUBLIC_KEY não configurado no .env");
  }
  
  return publicKey;
}

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: getMercadoPagoAccessToken(),
  options: {
    timeout: 5000,
  },
});
```

**DEPOIS:**
```typescript
export function getMercadoPagoPublicKey(): string {
  if (!MP_PUBLIC_KEY) {
    throw new Error("NEXT_PUBLIC_MP_PUBLIC_KEY não configurado no .env");
  }
  
  return MP_PUBLIC_KEY;
}

export const isMercadoPagoProduction = IS_MP_PRODUCTION;

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
  },
});
```

#### C. Funções de helper (linhas 165-182)

**ANTES:**
```typescript
export function isTestMode(): boolean {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.ACCESS_TOKEN_MP;
  return token?.startsWith("TEST-") ?? false;
}

export function getAccessToken(): string {
  return getMercadoPagoAccessToken();
}
```

**DEPOIS:**
```typescript
export function isTestMode(): boolean {
  return !IS_MP_PRODUCTION;
}

export function getAccessToken(): string {
  if (!MP_ACCESS_TOKEN) {
    throw new Error("Mercado Pago Access Token não configurado");
  }
  return MP_ACCESS_TOKEN;
}
```

---

### **PASSO 3: Atualizar `next.config.ts`**

**ANTES:**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```

**DEPOIS:**
```typescript
import type { NextConfig } from "next";

// ─────────────────────────────────────────────────────────────────────────────
// Mercado Pago Dynamic Environment Selection
// ─────────────────────────────────────────────────────────────────────────────

const isProduction = process.env.MP_USE_PRODUCTION === "true";

const mercadoPagoEnv = {
  NEXT_PUBLIC_MP_PUBLIC_KEY: isProduction
    ? process.env.MP_PROD_PUBLIC_KEY
    : process.env.MP_TEST_PUBLIC_KEY,
  MP_USE_PRODUCTION: process.env.MP_USE_PRODUCTION,
};

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔧 Next.js Config: Mercado Pago");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`   Modo: ${isProduction ? "🔴 PRODUÇÃO" : "🟢 TESTE"}`);
console.log(`   Public Key: ${mercadoPagoEnv.NEXT_PUBLIC_MP_PUBLIC_KEY?.substring(0, 25)}...`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

const nextConfig: NextConfig = {
  env: mercadoPagoEnv,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```

---

### **PASSO 4: Atualizar `.env`**

**ANTES:**
```env
# --- TESTE (Sandbox) ---
MP_TEST_PUBLIC_KEY=TEST-185a0830-f9f6-42a3-9362-e99e65771e48
MP_TEST_ACCESS_TOKEN=TEST-6866323167170449-012101-d113f3bfa6da60446a2a44ae37f8f45f-260965760

# --- Credenciais Ativas (baseado em MP_USE_PRODUCTION) ---
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-530774d7-5b2d-4139-856b-68371198d437
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-6866323167170449-012101-6d106bc6e91a4096ce548697ea54396f-260965760

# Webhook
```

**DEPOIS:**
```env
# --- TESTE (Sandbox) ---
MP_TEST_PUBLIC_KEY=TEST-185a0830-f9f6-42a3-9362-e99e65771e48
MP_TEST_ACCESS_TOKEN=TEST-6866323167170449-012101-d113f3bfa6da60446a2a44ae37f8f45f-260965760

# ⚠️  IMPORTANTE:
# As credenciais são selecionadas AUTOMATICAMENTE baseado em MP_USE_PRODUCTION
# NÃO edite NEXT_PUBLIC_MP_PUBLIC_KEY ou MERCADO_PAGO_ACCESS_TOKEN manualmente!
# O sistema usa:
#   - MP_USE_PRODUCTION=false → Credenciais de TESTE
#   - MP_USE_PRODUCTION=true  → Credenciais de PRODUÇÃO

# Webhook
```

**⚠️ IMPORTANTE:** Remover completamente as linhas hardcoded!

---

### **PASSO 5: Atualizar `components/checkout/CardPaymentBrick.tsx`**

**Localização:** Linhas 70-90 (dentro do useEffect)

**ADICIONAR** após `if (!publicKey) { ... }`:

```typescript
// Validação: verificar se está usando credenciais corretas
const isProduction = process.env.MP_USE_PRODUCTION === "true";
if (isProduction && !publicKey.startsWith("APP_USR-")) {
  console.error("⚠️  AVISO: MP_USE_PRODUCTION=true mas public key não começa com APP_USR-");
} else if (!isProduction && !publicKey.startsWith("TEST-")) {
  console.error("⚠️  AVISO: MP_USE_PRODUCTION=false mas public key não começa com TEST-");
}

console.log(`[CardPaymentBrick] Inicializando em modo: ${isProduction ? "PRODUÇÃO" : "TESTE"}`);
console.log(`[CardPaymentBrick] Public Key: ${publicKey.substring(0, 20)}...`);
```

---

### **PASSO 6: Atualizar `app/(default)/checkout/ProductCheckoutClient.tsx`**

#### A. Fix Scroll to Top (linha ~82)

**ANTES:**
```typescript
// Scroll to top on mount
useEffect(() => {
  window.scrollTo({ top: 0, behavior: "smooth" });
}, []);
```

**DEPOIS:**
```typescript
// Scroll to top when step changes
useEffect(() => {
  window.scrollTo({ top: 0, behavior: "smooth" });
}, [currentStep]); // ← MUDANÇA AQUI
```

#### B. Fix Card Payment Fields (linha ~280)

**ANTES:**
```typescript
// Card payment
paymentData = {
  method,
  cardToken: cardData.token,
  cardBrand: cardData.paymentMethodId,
  installments,
};
```

**DEPOIS:**
```typescript
// Card payment
paymentData = {
  method,
  token: cardData.token,
  paymentMethodId: cardData.paymentMethodId,
  issuerId: cardData.issuerId,
  installments,
  payerEmail: formData.email,
  identificationType: cardData.identificationType,
  identificationNumber: cardData.identificationNumber,
};
```

---

### **PASSO 7: Atualizar `types/checkout.ts`**

**Interface PaymentFormData:**

**ANTES:**
```typescript
export interface PaymentFormData {
  method: "pix" | "credit_card" | "debit_card";
  cardToken?: string;
  cardBrand?: string;
  installments?: number;
}
```

**DEPOIS:**
```typescript
export interface PaymentFormData {
  method: "pix" | "credit_card" | "debit_card";
  
  // New fields (aligned with Zod schema)
  token?: string;
  paymentMethodId?: string;
  issuerId?: number;
  payerEmail?: string;
  identificationType?: string;
  identificationNumber?: string;
  
  // Legacy fields (keep for compatibility)
  cardToken?: string;
  cardBrand?: string;
  
  installments?: number;
}
```

---

### **PASSO 8: Atualizar `services/checkout.service.ts`**

**Função `processCardPayment` (linha ~370):**

**ANTES:**
```typescript
async function processCardPayment(
  order: Order,
  paymentData: any,
  userEmail: string
): Promise<Payment> {
  // Placeholder - implement real card payment
  throw new Error("Card payment not implemented yet");
}
```

**DEPOIS:**
```typescript
async function processCardPayment(
  order: Order,
  paymentData: any,
  userEmail: string
): Promise<Payment> {
  const { createCardPayment, buildCardPaymentRequest, isPaymentApproved } = 
    await import("./mercadopago.service");

  console.log("[MercadoPago] Creating card payment:", {
    amount: order.total_amount,
    externalReference: order.id,
    email: userEmail,
    paymentMethodId: paymentData.paymentMethodId,
    installments: paymentData.installments,
  });

  // Build payment request
  const paymentRequest = buildCardPaymentRequest({
    amount: order.total_amount,
    token: paymentData.token,
    paymentMethodId: paymentData.paymentMethodId,
    issuerId: paymentData.issuerId,
    installments: paymentData.installments || 1,
    email: userEmail,
    description: `Pedido ${order.id}`,
    externalReference: order.id,
    metadata: {
      payment_id: order.payments[0].id,
      type: "product",
      order_id: order.id,
    },
  });

  // Create payment via Mercado Pago
  const mpPayment = await createCardPayment(paymentRequest);

  console.log("[MercadoPago] Card payment created:", {
    id: mpPayment.id,
    status: mpPayment.status,
    statusDetail: mpPayment.status_detail,
  });

  // Update payment record
  const payment = await paymentRepository.updatePayment(order.payments[0].id, {
    transaction_id: String(mpPayment.id),
    status: isPaymentApproved(mpPayment.status) ? "PAID" : "PENDING",
    payment_method: "CREDIT_CARD",
    paid_at: isPaymentApproved(mpPayment.status) ? new Date() : null,
  });

  return payment;
}
```

---

## ✅ Checklist de Implementação

Siga esta ordem exata:

- [ ] **1.** Criar `lib/mercadopago-config.ts` (arquivo novo)
- [ ] **2.** Atualizar imports em `lib/mercadopago.ts`
- [ ] **3.** Atualizar funções em `lib/mercadopago.ts` (isTestMode, getAccessToken)
- [ ] **4.** Atualizar `next.config.ts` com injeção dinâmica
- [ ] **5.** Atualizar `.env` (remover hardcoded, adicionar aviso)
- [ ] **6.** Adicionar logs em `CardPaymentBrick.tsx`
- [ ] **7.** Fix scroll em `ProductCheckoutClient.tsx` (useEffect)
- [ ] **8.** Fix card payment fields em `ProductCheckoutClient.tsx`
- [ ] **9.** Atualizar `types/checkout.ts` (PaymentFormData)
- [ ] **10.** Implementar `processCardPayment` real em `checkout.service.ts`
- [ ] **11.** Deletar pasta `.next` (limpar cache)
- [ ] **12.** Reiniciar dev server: `npm run dev`

---

## 🧪 Como Testar

Após implementar:

### 1. Verificar logs de inicialização

```bash
npm run dev
```

Deve aparecer:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Next.js Config: Mercado Pago
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Modo: 🟢 TESTE
   Public Key: TEST-185a0830-f9f6-42a3-9...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[MercadoPago Config] Modo: TESTE
[MercadoPago Config] Public Key: TEST-185a0830-f9f6-4...
```

### 2. Testar pagamento com cartão

- Ir ao checkout com produtos no carrinho
- Preencher endereço e shipping
- Selecionar pagamento com cartão
- Usar cartão de teste:
  - **Número:** 5031 4332 1540 6351
  - **CVV:** 123
  - **Validade:** 11/25
  - **Nome:** APRO
  - **CPF:** qualquer válido
- Deve aprovar (`status: approved`)

### 3. Verificar logs do payment

```
[MercadoPago] Creating card payment: {
  amount: 135.91,
  externalReference: 'xxx',
  email: 'user@email.com',
  paymentMethodId: 'visa',
  installments: 1
}
[MercadoPago] Card payment created: {
  id: 1344078775,
  status: 'approved',
  statusDetail: 'accredited'
}
```

### 4. Verificar logs do webhook

```
[Webhook] Live mode: false  ← deve ser false em teste!
[Webhook] ✅ Order found
[Webhook] - Order Status: PAID
[Webhook] - Payment Status: PAID
```

### 5. Testar modo produção (quando necessário)

```env
MP_USE_PRODUCTION=true
```

Reiniciar → deve mostrar "🔴 PRODUÇÃO"

---

## 🐛 Troubleshooting

### ❌ Ainda mostra credenciais de produção com `MP_USE_PRODUCTION=false`

**Solução:**
1. Verificar se `.env` não tem `NEXT_PUBLIC_MP_PUBLIC_KEY` hardcoded
2. Deletar pasta `.next`
3. Reiniciar servidor

### ❌ `getMercadoPagoAccessToken is not defined`

**Solução:**
- Verificar que `lib/mercadopago.ts` importa `MP_ACCESS_TOKEN` da config
- Função `getAccessToken()` deve retornar `MP_ACCESS_TOKEN` diretamente
- Remover qualquer chamada a `getMercadoPagoAccessToken()`

### ❌ Card payment dá 400 "dados inválidos"

**Solução:**
- Verificar que `ProductCheckoutClient.tsx` envia: `token`, `paymentMethodId`, `issuerId`, `payerEmail`
- Verificar que `types/checkout.ts` tem os novos campos
- Verificar que `checkout.service.ts` usa `createCardPayment` real (não placeholder)

### ❌ Scroll não funciona ao trocar de passo

**Solução:**
- Verificar que useEffect tem `[currentStep]` como dependência (não `[]`)

### ❌ Parcelas não aparecem

**Solução:**
- Em modo TESTE, parcelas sempre aparecem
- Em modo PRODUÇÃO, depende do valor e configuração da conta MP
- Verificar `maxInstallments` no CardPaymentBrick (deve ser 12 para produtos, 1 para subscription)

---

## 📝 Arquivos Modificados

**Total:** 8 arquivos principais

| Arquivo | Tipo | Mudanças |
|---------|------|----------|
| `lib/mercadopago-config.ts` | **NOVO** | Config centralizada |
| `lib/mercadopago.ts` | Refactor | Usa config centralizada |
| `next.config.ts` | Refactor | Injeta env dinamicamente |
| `.env` | Update | Remove hardcoded, adiciona aviso |
| `components/checkout/CardPaymentBrick.tsx` | Fix | Adiciona logs e validação |
| `app/(default)/checkout/ProductCheckoutClient.tsx` | Fix | Scroll + card payment fields |
| `types/checkout.ts` | Update | Novos campos payment |
| `services/checkout.service.ts` | Refactor | Implementa card payment real |

---

## 🎯 Resultado Final

Após implementar todas as mudanças:

- ✅ Sistema usa `MP_USE_PRODUCTION` corretamente
- ✅ Credenciais selecionadas automaticamente (TEST vs PROD)
- ✅ Logs visuais mostram modo ativo em tempo real
- ✅ Validação robusta na inicialização
- ✅ Scroll to top funciona no checkout
- ✅ Card payment funciona com campos corretos
- ✅ Pagamentos aprovados em modo teste
- ✅ Webhook processa corretamente (live_mode: false)
- ✅ Orders ficam PAID automaticamente

---

## 📊 Estatísticas do Commit

```
14 files changed, 1932 insertions(+), 175 deletions(-)

Principais adições:
- docs/CHECKOUT_ROADMAP.md: +1413 linhas
- lib/mercadopago-config.ts: +60 linhas (NOVO)
- services/checkout.service.ts: +123 linhas
- app/api/webhooks/mercadopago/route.ts: +128 linhas

Principais remoções:
- Funções obsoletas em lib/mercadopago.ts
- Credenciais hardcoded no .env
```

---

**Documento criado:** 23/01/2026  
**Última atualização:** 23/01/2026  
**Versão:** 1.0  
**Status:** ✅ Pronto para usar
