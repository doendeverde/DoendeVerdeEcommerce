# 📋 Documentação de Correções - Sistema de Checkout

**Data:** 23/01/2026  
**Status:** Em Progresso  
**Última Atualização:** 23/01/2026

## 📊 Resumo do Progresso

| Categoria | Total | Corrigidos | Pendentes |
|-----------|-------|------------|-----------|
| 🔴 Críticos | 5 | 5 | 0 |
| 🟠 Importantes | 10 | 3 | 7 |
| 🟡 Melhorias | 8 | 1 | 7 |

**Bugs Corrigidos Hoje:**
1. ✅ `buildCardPaymentRequest` - argumentos separados
2. ✅ Alternar crédito/débito - key no Brick força recriação
3. ✅ Parcelas em débito - maxInstallments=1
4. ✅ Webhook 401 - usar MP_ACCESS_TOKEN centralizado
5. ✅ Redirect /cart - agora vai para /products com toast
6. ✅ Scroll checkout - já funcionava (confirmado)
7. ✅ Email pré-preenchido - passa userEmail para Brick
8. ✅ Drawer auto-abrir - removido isDrawerOpen: true

---

## 🔴 BUGS CRÍTICOS (Bloqueiam funcionalidade)

### 1. ✅ Erro no Pagamento com Cartão de Crédito (CORRIGIDO)
**Arquivo:** `services/checkout.service.ts` linha ~348  
**Erro:** `Cannot read properties of undefined (reading 'payer')`

**Causa Raiz:**
A função `buildCardPaymentRequest` espera **2 argumentos**:
```typescript
buildCardPaymentRequest(cardData: CardPaymentData, baseRequest: PaymentRequest)
```
Mas estava sendo chamada com **1 argumento** (objeto combinado).

**Status:** ✅ CORRIGIDO em 23/01/2026  
**Solução Aplicada:** Separar `baseRequest` e `cardData` em objetos distintos

---

### 2. ✅ Bug ao Alternar entre Cartão de Crédito e Débito (CORRIGIDO)
**Arquivo:** `components/checkout/subscription/PaymentStep.tsx`  
**Problema:** Quando abre o Brick de crédito e depois débito (ou vice-versa), os dados não eram limpos e causava conflito

**Status:** ✅ CORRIGIDO em 23/01/2026  
**Solução Aplicada:** Usar `key={\`card-brick-${selectedMethod}\`}` para forçar recriação do Brick ao mudar método

---

### 3. ✅ Parcelas Aparecendo em Cartão de Débito (CORRIGIDO)
**Arquivo:** `components/checkout/subscription/PaymentStep.tsx`  
**Problema:** Cartão de débito não deve ter opção de parcelas (deve ser sempre 1)

**Status:** ✅ CORRIGIDO em 23/01/2026  
**Solução Aplicada:** `maxInstallments = isSubscription || selectedMethod === "debit_card" ? 1 : 12`

---

### 4. ✅ Webhook 401 - Access Token não encontrado (CORRIGIDO)
**Arquivo:** `app/api/webhooks/mercadopago/route.ts`  
**Erro:** `Must provide your access_token to proceed` (401 Unauthorized)

**Causa Raiz:**
Webhook estava usando `process.env.ACCESS_TOKEN_MP` (variável incorreta) ao invés da configuração centralizada.

**Status:** ✅ CORRIGIDO em 23/01/2026  
**Solução Aplicada:** Importar e usar `MP_ACCESS_TOKEN` de `@/lib/mercadopago-config`

---

### 5. ✅ Redirect para /cart Quebrado (CORRIGIDO)
**Arquivo:** `app/(default)/checkout/page.tsx`, `app/(default)/products/ProductCatalog.tsx`  
**Problema:** Redirect ia para `/cart` que não existe

**Causa Raiz:**
A página `/cart` nunca foi criada - o carrinho é um drawer lateral.

**Status:** ✅ CORRIGIDO em 23/01/2026  
**Solução Aplicada:** 
- Redirect agora vai para `/products?message=cart_validation_failed`
- `ProductCatalog` mostra toast com mensagem de erro via sonner
- Remove parâmetro da URL após mostrar toast

---

## 🟠 BUGS IMPORTANTES (Afetam UX)

### 6. ✅ Scroll Não Sobe ao Trocar Passo no Checkout (CONFIRMADO)
**Arquivo:** `app/(default)/checkout/ProductCheckoutClient.tsx`  
**Problema:** Ao trocar de passo, página não sobe para o topo

**Status:** ✅ JÁ CORRIGIDO  
**Verificação:** Confirmado em 23/01/2026 - useEffect linha ~109 faz scroll suave para o topo

---

### 7. ✅ Email do Cliente Não Preenchido Automaticamente no MP (CORRIGIDO)
**Arquivo:** `types/checkout.ts`, `app/(default)/checkout/page.tsx`, `ProductCheckoutClient.tsx`  
**Problema:** O campo de email no Brick do MP não estava pré-preenchido com email do usuário logado

**Causa Raiz:**
O `CartCheckoutData` não tinha o campo `userEmail` e não estava sendo passado para o `PaymentStep`.

**Status:** ✅ CORRIGIDO em 23/01/2026  
**Solução Aplicada:** 
- Adicionado `userEmail?: string` em `CartCheckoutData`
- Page passa `session.user.email` no checkout data
- `ProductCheckoutClient` passa `payerEmail={data.userEmail}` para `PaymentStep`

---

### 8. ✅ Carrinho Aparecendo na Tela ao Adicionar Produto (CORRIGIDO)
**Arquivo:** `stores/cart.ts` linha ~142  
**Problema:** Ao adicionar produto, drawer do carrinho abria automaticamente

**Causa Raiz:**
A função `addItem` fazia `set({ cart: data.cart, isDrawerOpen: true })` ao adicionar item.

**Status:** ✅ CORRIGIDO em 23/01/2026  
**Solução Aplicada:** Removido `isDrawerOpen: true` - agora apenas o toast é mostrado

---

### 9. ⚠️ Popup de "Ver Mais" no Admin Cortado
**Arquivo:** `components/admin/ProductCard.tsx` ou similar  
**Problema:** Menu dropdown do último produto fica cortado pelo scroll

**Status:** 🟠 PRECISA CORRIGIR  
**Solução:** Usar portal ou ajustar z-index/overflow

---

### 10. ⚠️ Remover Itens do Carrinho Não Persiste
**Arquivo:** `stores/cart.ts` + `services/cart.service.ts`  
**Problema:** Alterações no carrinho não persistem (adicionar/remover)

**Status:** 🟠 VERIFICAR - pode ser cache ou falta de sync

---

### 11. ⚠️ Frete Fixo em Assinatura Recorrente
**Arquivo:** `services/checkout.service.ts` ou config de planos  
**Problema:** Assinaturas devem ter frete fixo configurável

**Status:** 🟠 PRECISA IMPLEMENTAR

---

### 12. ✅ Modal de Login Não Abre (Abre Aba) - VERIFICADO OK
**Arquivo:** `components/layout/UserDropdown.tsx`  
**Problema:** Relatado que ao clicar em "Entrar" deslogado, abre aba /login ao invés do modal

**Status:** ✅ VERIFICADO EM 23/01/2026 - Código está correto  
**Análise:**
- `UserDropdown` usa `useAuthModalStore.getState().open("login")` corretamente
- `AuthModal` está montado em `AppProviders.tsx`
- Se o problema persistir, pode ser:
  - Erro de hydration (cliente x servidor)
  - Outro componente redirecionando
  - Cache do navegador

---

### 13. ⚠️ Exibição de "Meus Pedidos" no Mobile
**Arquivo:** `app/(protected)/orders/page.tsx` ou componentes  
**Problema:** Layout quebrado em dispositivos móveis

**Status:** 🟠 PRECISA CORRIGIR

---

### 14. ⚠️ Logout Redireciona para localhost:3000
**Arquivo:** Variável de ambiente `NEXTAUTH_URL`  
**Problema:** Ao fazer logout, redireciona para localhost ao invés da URL correta

**Causa Raiz:**
Variável de ambiente `NEXTAUTH_URL` não está configurada corretamente em produção.

**Status:** 🟠 REQUER CONFIGURAÇÃO DO AMBIENTE  
**Solução:** 
Adicionar em `.env` ou `.env.production`:
```
NEXTAUTH_URL=https://sua-url-de-producao.com.br
```
O código está correto - `signOut({ callbackUrl: "/" })` usa URL relativa que o NextAuth resolve contra `NEXTAUTH_URL`.

---

### 15. ⚠️ Mostrar Apenas 5 Opções de Frete
**Arquivo:** `components/checkout/ShippingOptions.tsx`  
**Problema:** Mostrar apenas 5 primeiras opções com botão "Ver mais"

**Status:** 🟠 PRECISA IMPLEMENTAR

---

## 🟡 MELHORIAS DE UX

### 16. 💡 Recuperação de Senha via Email
**Arquivos:** Novo endpoint + componente  
**Problema:** Não existe fluxo de recuperação de senha

**Status:** 🟡 PRECISA IMPLEMENTAR

---

### 17. 💡 Remover Caminho /dashboard
**Arquivo:** `app/(protected)/dashboard_/` (renomeado com _)  
**Problema:** Rota /dashboard não deve existir ou deve redirecionar

**Status:** ✅ PARECE OK (pasta tem _ no nome)

---

### 18. 💡 Benefícios de Planos com Status Ativo/Inativo
**Arquivo:** Componentes de comparação de planos  
**Problema:** Mostrar benefícios compartilhados marcados como ativo ou inativo

**Status:** 🟡 PRECISA IMPLEMENTAR

---

### 19. 💡 Medidas no Produto (Não Perfil de Frete)
**Arquivo:** Schema de produto + admin  
**Problema:** Medidas devem estar no produto, não em perfil de frete separado

**Status:** 🟡 AVALIAR ARQUITETURA

---

### 20. 💡 Chip de Desconto por Assinatura
**Arquivo:** `components/products/ProductCard.tsx`  
**Problema:** Mostrar badge de desconto para assinantes

**Status:** 🟡 PRECISA IMPLEMENTAR

---

### 21. 💡 Comentar Sistema de Pontuação
**Arquivo:** Vários  
**Problema:** Ocultar/comentar features de pontuação não implementadas

**Status:** 🟡 PRECISA FAZER

---

### 22. 💡 Dark Mode
**Arquivo:** Tema + configuração  
**Problema:** Implementar suporte a dark mode

**Status:** 🟡 BAIXA PRIORIDADE

---

### 23. 💡 Recuperação de Carrinho ao Alterar Valor
**Arquivo:** `services/cart.service.ts`  
**Problema:** Se produto muda de preço, carrinho deve atualizar

**Status:** 🟡 PRECISA IMPLEMENTAR

---

## ✅ ITEMS JÁ VERIFICADOS/CORRIGIDOS

| Item | Status | Notas |
|------|--------|-------|
| Scroll to top no checkout | ✅ | useEffect com currentStep |
| Caminho /dashboard removido | ✅ | Pasta tem _ no nome |
| Config dinâmica do MP | ✅ | mercadopago-config.ts implementado |

---

## 📊 Prioridade de Implementação

### Fase 1 - Crítico (Bloqueia vendas)
1. Corrigir `buildCardPaymentRequest` - erro no pagamento com cartão
2. Corrigir bug ao alternar crédito/débito
3. Corrigir parcelas em cartão de débito
4. Verificar webhook PIX

### Fase 2 - Importante (UX ruim)
5. Email preenchido automaticamente no Brick
6. Carrinho não abrir automaticamente
7. Popup admin cortado
8. Persistência do carrinho
9. Modal de login

### Fase 3 - Melhorias
10. Frete fixo assinatura
11. Opções de frete limitadas
12. Pedidos mobile
13. Logout redirect
14. Recuperação de senha

### Fase 4 - Nice to Have
15. Benefícios comparativos
16. Chip desconto assinatura
17. Dark mode

---

## 🔧 DETALHAMENTO DA CORREÇÃO #1 (buildCardPaymentRequest)

### Problema
```typescript
// checkout.service.ts - ERRADO
const paymentRequest = buildCardPaymentRequest({
  amount,
  token: paymentData.token,
  paymentMethodId: paymentData.paymentMethodId,
  // ... tudo misturado
});
```

### Assinatura Correta (mercadopago.service.ts)
```typescript
export function buildCardPaymentRequest(
  cardData: CardPaymentData,    // Dados do cartão (token, installments, etc)
  baseRequest: PaymentRequest   // Dados base (amount, description, payer, etc)
): CardPaymentRequest
```

### Correção Necessária
```typescript
// checkout.service.ts - CORRETO

// 1. Criar baseRequest separado
const baseRequest: PaymentRequest = {
  amount,
  description: `Pedido ${orderId}`,
  externalReference: orderId,
  payer: {
    email: user.email,
    firstName: user.fullName?.split(' ')[0],
    lastName: user.fullName?.split(' ').slice(1).join(' '),
  },
  metadata: {
    payment_id: paymentId,
    type: "product",
    order_id: orderId,
  },
};

// 2. Criar cardData com dados do cartão
const cardData: CardPaymentData = {
  token: paymentData.token,
  paymentMethodId: paymentData.paymentMethodId,
  issuerId: paymentData.issuerId || 0,
  installments: paymentData.method === 'debit_card' ? 1 : (paymentData.installments || 1),
  payerEmail: user.email,
  identificationType: paymentData.identificationType,
  identificationNumber: paymentData.identificationNumber,
};

// 3. Chamar com 2 argumentos
const paymentRequest = buildCardPaymentRequest(cardData, baseRequest);
```

---

## 📁 Arquivos Principais para Correções

```
services/
├── checkout.service.ts     # Correção #1 (buildCardPaymentRequest)
├── mercadopago.service.ts  # Referência das funções
├── cart.service.ts         # Persistência carrinho

components/
├── checkout/
│   ├── CardPaymentBrick.tsx    # Email, parcelas débito
│   └── subscription/
│       └── PaymentStep.tsx     # Alternância crédito/débito
├── cart/
│   └── AddToCartButton.tsx     # Popup vs drawer
├── auth/
│   └── LoginModal.tsx          # Modal vs aba

app/
├── api/
│   └── webhooks/
│       └── mercadopago/route.ts # Webhook PIX
├── (protected)/
│   └── orders/                  # Mobile layout
```

---

**Próximo Passo:** Implementar Correção #1 (buildCardPaymentRequest)
