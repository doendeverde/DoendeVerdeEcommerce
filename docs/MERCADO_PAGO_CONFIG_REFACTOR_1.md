# 🔧 Refatoração: Configuração Dinâmica do Mercado Pago

**Commit:** `9f82f02` - feat: add centralized Mercado Pago configuration and validation

Este documento descreve **passo a passo** todas as mudanças feitas para implementar a configuração dinâmica do Mercado Pago baseada em `MP_USE_PRODUCTION`.

---

## 📋 Resumo das Mudanças

### Problema Original
- Credenciais do Mercado Pago estavam **hardcoded** no `.env`
- `MP_USE_PRODUCTION=false` não tinha efeito
- Sistema sempre usava as credenciais que estavam em `NEXT_PUBLIC_MP_PUBLIC_KEY` e `MERCADO_PAGO_ACCESS_TOKEN`
- Causava erro `cc_rejected_high_risk` ao testar com credenciais de produção

### Solução Implementada
- ✅ Configuração centralizada que lê `MP_USE_PRODUCTION`
- ✅ Seleção automática de credenciais (TEST vs PRODUÇÃO)
- ✅ Validação de credenciais na inicialização
- ✅ Logs visuais indicando modo ativo
- ✅ Fix: scroll to top no checkout ao trocar de passo
- ✅ Fix: card payment com campos corretos (token, paymentMethodId, issuerId)

---

## 🔨 Passo a Passo para Reproduzir

### **PASSO 1: Criar `lib/mercadopago-config.ts`**

Criar novo arquivo em `lib/mercadopago-config.ts`:

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

**Localização:** Linhas 1-52

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

/**
 * Obtém a Public Key do Mercado Pago (exportado para uso no frontend).
 */
export function getMercadoPagoPublicKey(): string {
  if (!MP_PUBLIC_KEY) {
    throw new Error("NEXT_PUBLIC_MP_PUBLIC_KEY não configurado no .env");
  }
  
  return MP_PUBLIC_KEY;
}

/**
 * Indica se está usando credenciais de produção.
 */
export const isMercadoPagoProduction = IS_MP_PRODUCTION;

// Initialize Mercado Pago client
export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
  },
});
```

**Localização:** Linhas 165-182

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

**Localização:** Linhas 29-35

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

**NOTA:** Remover as linhas `NEXT_PUBLIC_MP_PUBLIC_KEY` e `MERCADO_PAGO_ACCESS_TOKEN` hardcoded!

---

### **PASSO 5: Atualizar `components/checkout/CardPaymentBrick.tsx`**

**Localização:** Linhas 70-80

**ANTES:**
```typescript
// Initialize Mercado Pago Brick
useEffect(() => {
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

  if (!publicKey) {
    setError("Configuração de pagamento não encontrada");
    setStatus("error");
    return;
  }

  if (!brickContainerRef.current) return;
```

**DEPOIS:**
```typescript
// Initialize Mercado Pago Brick
useEffect(() => {
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

  if (!publicKey) {
    setError("Configuração de pagamento não encontrada");
    setStatus("error");
    return;
  }

  // Validação: verificar se está usando credenciais corretas
  const isProduction = process.env.MP_USE_PRODUCTION === "true";
  if (isProduction && !publicKey.startsWith("APP_USR-")) {
    console.error("⚠️  AVISO: MP_USE_PRODUCTION=true mas public key não começa com APP_USR-");
  } else if (!isProduction && !publicKey.startsWith("TEST-")) {
    console.error("⚠️  AVISO: MP_USE_PRODUCTION=false mas public key não começa com TEST-");
  }

  console.log(`[CardPaymentBrick] Inicializando em modo: ${isProduction ? "PRODUÇÃO" : "TESTE"}`);
  console.log(`[CardPaymentBrick] Public Key: ${publicKey.substring(0, 20)}...`);

  if (!brickContainerRef.current) return;
```

---

### **PASSO 6: Atualizar `app/(default)/checkout/ProductCheckoutClient.tsx`**

#### **Fix 1: Scroll to Top ao trocar de passo**

**Localização:** Linha 82 (aproximadamente)

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
}, [currentStep]);
```

#### **Fix 2: Card Payment - Campos corretos**

**Localização:** Linha 280 (aproximadamente, dentro de `handlePaymentSubmit`)

**ANTES:**
```typescript
// Card payment
paymentData = {
  method,
  cardToken: cardData.token,
  cardBrand: cardData.paymentMethodId,
  installments,
  // Campos faltando: issuerId, payerEmail, identificationType, identificationNumber
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

**Localização:** Interface `PaymentFormData`

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

**Localização:** Função `processCardPayment` (linha ~370)

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

Ao refazer essas mudanças, siga esta ordem:

- [ ] **1.** Criar `lib/mercadopago-config.ts`
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
- [ ] **12.** Reiniciar dev server

---

## 🧪 Como Testar

Após implementar todas as mudanças:

1. **Verificar logs de inicialização:**
   ```bash
   npm run dev
   ```
   Deve aparecer:
   ```
   🔧 Next.js Config: Mercado Pago
   Modo: 🟢 TESTE
   Public Key: TEST-185a0830-f9f6-42a3-9...
   ```

2. **Testar pagamento com cartão:**
   - Ir ao checkout
   - Selecionar pagamento com cartão
   - Usar cartão de teste: `5031 4332 1540 6351`
   - CPF: qualquer válido
   - Deve aprovar (`status: approved`)

3. **Verificar logs do webhook:**
   ```
   [Webhook] Live mode: false  ← deve ser false em teste
   [Webhook] ✅ Order found
   [Webhook] - Order Status: PAID
   ```

4. **Mudar para produção (quando necessário):**
   ```env
   MP_USE_PRODUCTION=true
   ```
   Reiniciar servidor → deve mostrar "🔴 PRODUÇÃO"

---

## 🐛 Troubleshooting

### Problema: Ainda mostra credenciais de produção com `MP_USE_PRODUCTION=false`

**Solução:**
1. Verificar se `.env` não tem `NEXT_PUBLIC_MP_PUBLIC_KEY` hardcoded
2. Deletar pasta `.next`
3. Reiniciar servidor

### Problema: `getMercadoPagoAccessToken is not defined`

**Solução:**
- Verificar que `lib/mercadopago.ts` usa `MP_ACCESS_TOKEN` da config
- Função `getAccessToken()` deve retornar `MP_ACCESS_TOKEN` diretamente

### Problema: Card payment dá 400 "dados inválidos"

**Solução:**
- Verificar que `ProductCheckoutClient.tsx` envia: `token`, `paymentMethodId`, `issuerId`
- Verificar que `types/checkout.ts` tem os novos campos
- Verificar que `checkout.service.ts` usa `createCardPayment` real

---

## 📝 Arquivos Modificados

Total: **8 arquivos**

1. ✅ `lib/mercadopago-config.ts` (novo)
2. ✅ `lib/mercadopago.ts`
3. ✅ `next.config.ts`
4. ✅ `.env`
5. ✅ `components/checkout/CardPaymentBrick.tsx`
6. ✅ `app/(default)/checkout/ProductCheckoutClient.tsx`
7. ✅ `types/checkout.ts`
8. ✅ `services/checkout.service.ts`

---

## 🎯 Resultado Final

- ✅ Sistema usa `MP_USE_PRODUCTION` corretamente
- ✅ Credenciais selecionadas automaticamente (TEST vs PROD)
- ✅ Logs visuais mostram modo ativo
- ✅ Validação na inicialização
- ✅ Scroll to top funciona no checkout
- ✅ Card payment funciona com campos corretos
- ✅ Pagamentos aprovados em modo teste
- ✅ Webhook processa corretamente

---

**Data:** 23/01/2026  
**Commit:** `9f82f02`  
**Branch:** `dev`
