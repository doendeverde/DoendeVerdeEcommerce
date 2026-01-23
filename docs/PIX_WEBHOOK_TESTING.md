# 🔔 Testando Webhooks PIX - Guia de Uso

Este guia explica como testar pagamentos PIX em ambiente de desenvolvimento.

## 📋 Visão Geral

Quando você cria um pagamento PIX, o sistema exibe logs destacados com o **Payment ID**. Você pode usar esse ID para simular a aprovação do pagamento via webhook.

## 🚀 Como Testar

### 1. Criar um Pagamento PIX

Faça um checkout com PIX (subscription ou produto). Você verá nos logs do terminal:

```
================================================================================
🔵 PIX PAYMENT ID (use para webhook): 1234567890
   Order ID: abc-123
   Amount: R$ 59.90
   Webhook URL: http://localhost:3000/api/webhooks/mercadopago
================================================================================
```

### 2. Copiar o Payment ID

Copie o número que aparece após `PIX PAYMENT ID`.

### 3. Disparar o Webhook de Aprovação

Execute o script com o Payment ID:

```bash
npx tsx scripts/approve-pix.ts 1234567890
```

### 4. Verificar Resultado

O script mostrará se o webhook foi processado com sucesso. Verifique:

- ✅ Status do pagamento no banco mudou para `PAID`
- ✅ Status do pedido mudou para `CONFIRMED`
- ✅ Assinatura foi criada (se for checkout de subscription)

## 📍 Onde os Logs Aparecem

Os logs com o Payment ID aparecem em **4 pontos** do sistema:

### 1. **Checkout de Subscription** (`/api/checkout/subscription`)
```
🔵 PIX PAYMENT ID (Subscription - use para webhook): 1234567890
   Order ID: abc-123
   Plan: Premium
   Amount: R$ 59.90
```

### 2. **Serviço Mercado Pago** (`mercadopago.service.ts`)
```
🔵 PIX PAYMENT ID (use para webhook): 1234567890
   External Reference: abc-123
   Amount: R$ 59.90
   Webhook URL: http://localhost:3000/api/webhooks/mercadopago
```

### 3. **Checkout Service** (`checkout.service.ts`)
```
🔵 PIX PAYMENT ID (Checkout Service - use para webhook): 1234567890
   Order ID: abc-123
   Payment ID: payment-456
   Amount: R$ 59.90
```

### 4. **Regenerar PIX** (`/api/orders/[orderId]/regenerate-pix`)
```
🔵 PIX PAYMENT ID (Regenerated - use para webhook): 1234567890
   Order ID: abc-123
   Amount: R$ 59.90
```

## 🔧 Configuração

Certifique-se de ter a variável de ambiente configurada:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Se não estiver definida, o script usará `http://localhost:3000` por padrão.

## 🧪 Testando em Produção

Em produção, os webhooks são disparados automaticamente pelo Mercado Pago quando o pagamento é aprovado. Este script é apenas para testes locais.

Para produção, configure a URL do webhook no painel do Mercado Pago:
```
https://seudominio.com/api/webhooks/mercadopago
```

## 📝 Exemplo Completo

```bash
# Terminal 1: Executar o servidor Next.js
npm run dev

# Terminal 2: Fazer checkout PIX
# (através da interface ou API)

# Copiar o Payment ID dos logs

# Terminal 3: Aprovar o pagamento
npx tsx scripts/approve-pix.ts 1234567890
```

## ⚠️ Troubleshooting

### Webhook retorna 404
- Verifique se o servidor está rodando
- Confirme a URL em `NEXT_PUBLIC_APP_URL`

### Webhook retorna 500
- Verifique se o Payment ID existe no Mercado Pago
- Confira os logs do servidor para ver o erro detalhado

### Pagamento não aprova
- Verifique se o Payment ID está correto
- Confirme se o pagamento existe no banco de dados
- Veja se há erros nos logs do webhook (`/api/webhooks/mercadopago`)

## 🛠️ Scripts Auxiliares

### Verificar Token do Mercado Pago
```bash
Get-Content .env | Select-String "MELHOR_ENVIO_TOKEN"
```

### Ver logs de shipping
```bash
npx tsx scripts/test-shipping.ts 22041080
```

### Tornar usuário admin
```bash
npx tsx scripts/make-admin-by-email.ts seu@email.com
```

---

**Feito com ❤️ para facilitar o desenvolvimento**
