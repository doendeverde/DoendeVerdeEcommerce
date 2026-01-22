# Configuração de Webhooks — Mercado Pago

Este guia explica como configurar webhooks do Mercado Pago para receber notificações de pagamento em tempo real.

## 📋 Índice

1. [Pré-requisitos](#-pré-requisitos)
2. [Configuração Local (Desenvolvimento)](#-configuração-local-desenvolvimento)
3. [Configuração no Painel do Mercado Pago](#-configuração-no-painel-do-mercado-pago)
4. [Variáveis de Ambiente](#-variáveis-de-ambiente)
5. [Testando Webhooks](#-testando-webhooks)
6. [Eventos Suportados](#-eventos-suportados)
7. [Troubleshooting](#-troubleshooting)

---

## ✅ Pré-requisitos

- Conta no Mercado Pago (desenvolvedor)
- Aplicação criada no painel de desenvolvedores
- Node.js 18+ instalado
- ngrok instalado (para desenvolvimento local)

---

## 🔧 Configuração Local (Desenvolvimento)

### 1. Instalar ngrok

```bash
# Windows (com Chocolatey)
choco install ngrok

# macOS (com Homebrew)
brew install ngrok

# Ou baixe em: https://ngrok.com/download
```

### 2. Criar conta no ngrok

1. Acesse [https://dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup)
2. Crie uma conta gratuita
3. Copie seu **authtoken**

### 3. Configurar ngrok

```bash
ngrok config add-authtoken SEU_TOKEN_AQUI
```

### 4. Iniciar túnel ngrok

```bash
# Expõe localhost:3000 publicamente
ngrok http 3000
```

Você verá algo como:
```
Forwarding    https://abc123xyz.ngrok-free.dev -> http://localhost:3000
```

### 5. Configurar variável de ambiente

Copie a URL HTTPS (sem a barra final) e adicione ao `.env`:

```bash
WEBHOOK_NGROK_URL=https://abc123xyz.ngrok-free.dev
```

> ⚠️ **Importante:** A URL do ngrok muda cada vez que você reinicia (versão gratuita). Atualize o `.env` quando necessário.

---

## 🔐 Configuração no Painel do Mercado Pago

### Passo 1: Acessar o painel de desenvolvedores

1. Acesse: [https://www.mercadopago.com.br/developers/panel](https://www.mercadopago.com.br/developers/panel)
2. Faça login com sua conta Mercado Pago

### Passo 2: Selecionar sua aplicação

1. No menu lateral, clique em **"Suas integrações"**
2. Selecione a aplicação que deseja configurar
3. Se não tiver uma aplicação, clique em **"Criar aplicação"**

### Passo 3: Configurar Webhooks

1. Na página da aplicação, clique na aba **"Webhooks"**
2. Clique em **"Configurar notificações"** ou **"Adicionar URL"**

### Passo 4: Preencher os dados

| Campo | Valor |
|-------|-------|
| **Modo** | Selecione "Produção" ou "Teste" conforme necessário |
| **URL** | `https://SUA-URL.ngrok-free.dev/api/webhooks/mercadopago` |
| **Eventos** | Marque os eventos desejados (ver abaixo) |

### Passo 5: Selecionar eventos

Marque os seguintes eventos:

- ✅ **Pagamentos (payment)** — Obrigatório
  - Notifica quando um pagamento é criado, aprovado, rejeitado, etc.

- ⬜ **Assinaturas (subscription_preapproval)** — Opcional
  - Para assinaturas gerenciadas pelo MP

- ⬜ **Planos de assinatura (subscription_preapproval_plan)** — Opcional
  - Para planos de assinatura

- ⬜ **Pagamentos autorizados (subscription_authorized_payment)** — Opcional
  - Para cobranças recorrentes

### Passo 6: Salvar e obter Secret

1. Clique em **"Salvar"**
2. Após salvar, o MP mostrará o **Signing Secret**
3. Copie o secret e adicione ao `.env`:

```bash
MP_WEBHOOK_SECRET=seu_secret_aqui
```

---

## 📝 Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```bash
# ═══════════════════════════════════════════════════════════════════════════
# MERCADO PAGO - CREDENCIAIS
# ═══════════════════════════════════════════════════════════════════════════

# Public Key (usada no frontend para Checkout Bricks)
# Obtida em: Mercado Pago > Suas integrações > Credenciais
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Access Token (usada no backend para criar pagamentos)
# ⚠️ NUNCA exponha esta variável no frontend!
# Use TEST- para sandbox, APP_USR- para produção
ACCESS_TOKEN_MP=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# ═══════════════════════════════════════════════════════════════════════════
# WEBHOOK
# ═══════════════════════════════════════════════════════════════════════════

# URL do ngrok para desenvolvimento local
# Exemplo: https://abc123.ngrok-free.dev (SEM barra no final)
WEBHOOK_NGROK_URL=https://seu-tunnel.ngrok-free.dev

# Secret para validar assinatura do webhook
# Obtido após configurar webhook no painel do MP
MP_WEBHOOK_SECRET=seu_secret_aqui

# ═══════════════════════════════════════════════════════════════════════════
# PRODUÇÃO
# ═══════════════════════════════════════════════════════════════════════════

# URL base da aplicação (produção)
# Usado como fallback se WEBHOOK_NGROK_URL não estiver definido
NEXTAUTH_URL=https://seudominio.com.br
AUTH_URL=https://seudominio.com.br
```

### Prioridade das URLs

O sistema usa a seguinte prioridade para determinar a URL do webhook:

1. `WEBHOOK_NGROK_URL` — Para desenvolvimento local
2. `NEXTAUTH_URL` — Para produção
3. `AUTH_URL` — Fallback

---

## 🧪 Testando Webhooks

### Método 1: Simular via Painel do MP

1. No painel do MP, vá em **Webhooks**
2. Clique em **"Simular notificação"**
3. Selecione o tipo de evento (ex: payment)
4. Clique em **"Enviar"**
5. Verifique os logs do seu servidor

### Método 2: Usando curl

```bash
# Simula uma notificação de pagamento
curl -X POST https://SEU-NGROK.ngrok-free.dev/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-request-id: test-123" \
  -d '{
    "type": "payment",
    "action": "payment.updated",
    "data": {
      "id": "123456789"
    }
  }'
```

### Método 3: Fazer um pagamento de teste

1. Use cartões de teste do Mercado Pago
2. Complete um checkout
3. Verifique se o webhook foi recebido nos logs

#### Cartões de Teste

| Bandeira | Número | CVV | Validade |
|----------|--------|-----|----------|
| Mastercard | 5031 4332 1540 6351 | 123 | Qualquer futura |
| Visa | 4235 6477 2802 5682 | 123 | Qualquer futura |
| Amex | 3753 651535 56885 | 1234 | Qualquer futura |

Use **APRO** como nome do titular para aprovar.

### Verificando logs

Os logs do webhook aparecem no terminal do servidor:

```
[Webhook] ════════════════════════════════════════════════
[Webhook] Received notification
[Webhook] Request ID: test-123
[Webhook] Type: payment
[Webhook] Action: payment.updated
[Webhook] Data ID: 123456789
[Webhook] ✅ Signature valid
[Webhook] Payment processing result: { success: true, action: 'payment_approved' }
```

---

## 📨 Eventos Suportados

### payment (Pagamentos)

| Action | Descrição |
|--------|-----------|
| `payment.created` | Pagamento criado |
| `payment.updated` | Status atualizado |

#### Status de Pagamento

| Status | Descrição | Ação do Sistema |
|--------|-----------|-----------------|
| `approved` | Aprovado | Ativa assinatura |
| `pending` | Pendente | Aguarda |
| `in_process` | Em análise | Aguarda |
| `rejected` | Rejeitado | Notifica erro |
| `cancelled` | Cancelado | Cancela pedido |
| `refunded` | Reembolsado | Processa reembolso |
| `charged_back` | Chargeback | Cancela assinatura |

### subscription_preapproval (Assinaturas)

| Action | Descrição |
|--------|-----------|
| `created` | Assinatura criada |
| `updated` | Assinatura atualizada |
| `cancelled` | Assinatura cancelada |

---

## 🔍 Troubleshooting

### Erro: "notification_url attribute must be url valid"

**Causa:** A URL do webhook não é válida ou está vazia.

**Solução:**
1. Verifique se `WEBHOOK_NGROK_URL` está no `.env`
2. Confirme que a URL não tem barra no final
3. Confirme que o ngrok está rodando
4. Reinicie o servidor Next.js

### Erro: "Invalid signature"

**Causa:** O `MP_WEBHOOK_SECRET` está incorreto ou não configurado.

**Solução:**
1. Verifique se `MP_WEBHOOK_SECRET` está no `.env`
2. Copie o secret novamente do painel do MP
3. Reinicie o servidor

### Webhook não chega

**Causas possíveis:**
1. ngrok não está rodando
2. URL no painel do MP está desatualizada
3. Firewall bloqueando conexões

**Soluções:**
1. Verifique se ngrok está ativo: `ngrok http 3000`
2. Atualize a URL no painel do MP
3. Teste com curl localmente primeiro

### Pagamento aprovado mas assinatura não criada

**Causa:** Erro no processamento do webhook.

**Solução:**
1. Verifique os logs do servidor
2. Confirme que o `external_reference` é um `orderId` válido
3. Verifique se os metadata estão corretos

---

## 📚 Links Úteis

- [Documentação Webhooks MP](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Painel de Desenvolvedores](https://www.mercadopago.com.br/developers/panel)
- [Cartões de Teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/your-integrations/test/cards)
- [ngrok Dashboard](https://dashboard.ngrok.com/)

---

## 🔄 Checklist de Configuração

- [ ] ngrok instalado e configurado
- [ ] `WEBHOOK_NGROK_URL` no `.env`
- [ ] `ACCESS_TOKEN_MP` no `.env`
- [ ] `NEXT_PUBLIC_MP_PUBLIC_KEY` no `.env`
- [ ] Webhook configurado no painel do MP
- [ ] `MP_WEBHOOK_SECRET` no `.env`
- [ ] Evento "payment" selecionado no painel
- [ ] Teste de webhook realizado com sucesso

---

## 📌 Produção

Para produção, substitua a URL do ngrok pela URL real do seu domínio:

```bash
# .env de produção
NEXTAUTH_URL=https://seudominio.com.br
# Remova WEBHOOK_NGROK_URL em produção
```

E atualize a URL no painel do Mercado Pago para:
```
https://seudominio.com.br/api/webhooks/mercadopago
```
