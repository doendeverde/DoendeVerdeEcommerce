# 🔐 Environment Configuration - Hardening de URLs Públicas

## Visão Geral

Este documento descreve a solução de hardening para URLs públicas usadas em integrações externas (Mercado Pago, Melhor Envio, webhooks).

### Problema Resolvido

- URLs inválidas (`localhost`) causavam erro 400 em APIs externas
- URLs estavam espalhadas em múltiplos arquivos
- Não havia validação preventiva

### Solução Implementada

- Módulo centralizado: `lib/environment.ts`
- Validação defensiva automática
- Separação clara entre DEV e PROD

---

## 📁 Arquitetura

```
lib/
├── environment.ts          # ← MÓDULO CENTRAL (NOVO)
├── mercadopago.ts          # Usa environment.ts
├── mercadopago-config.ts   # Configuração de credenciais
└── mercadopago-subscriptions.ts

services/
├── mercadopago.service.ts      # Usa environment.ts
└── subscription-mp.service.ts  # Usa environment.ts
```

---

## 🔧 Variáveis de Ambiente

### Obrigatórias

```env
# ============================================================================
# AUTH.JS - URL base da aplicação
# ============================================================================
AUTH_URL='http://localhost:3000'           # DEV: pode ser localhost
# ou
NEXTAUTH_URL='https://meudominio.com.br'   # PROD: domínio real

# ============================================================================
# WEBHOOKS - URL pública para integrações externas
# ============================================================================
# ⚠️ OBRIGATÓRIO em DEV para webhooks funcionarem
WEBHOOK_NGROK_URL='https://xxx.ngrok-free.dev'
```

### Fluxo de Prioridade

| Contexto | Prioridade | Variável |
|----------|------------|----------|
| Webhooks (DEV) | 1º | `WEBHOOK_NGROK_URL` |
| Webhooks (PROD) | 2º | `NEXTAUTH_URL` |
| Webhooks (fallback) | 3º | `AUTH_URL` |
| Back URLs | 1º | `NEXTAUTH_URL` |
| Back URLs (fallback) | 2º | `AUTH_URL` |

---

## 🛡️ Validação Defensiva

### Comportamento

| Ambiente | URL com localhost | Resultado |
|----------|-------------------|-----------|
| **PRODUÇÃO** | ❌ | **ERRO** - Bloqueia execução |
| **DESENVOLVIMENTO** | ⚠️ | **WARNING** - Log detalhado |

### Exemplo de Log (DEV)

```
════════════════════════════════════════════════════════════════════════════════
[Environment] ⚠️ AVISO: MercadoPago Webhook URL usando localhost
[Environment] ⚠️ URL: http://localhost:3000/api/webhooks/mercadopago
[Environment] ⚠️
[Environment] ⚠️ Integrações externas (webhooks, callbacks) podem FALHAR!
[Environment] ⚠️ Configure WEBHOOK_NGROK_URL ou use um domínio de staging.
════════════════════════════════════════════════════════════════════════════════
```

### Exemplo de Erro (PROD)

```
Error: ERRO CRÍTICO: URL de MercadoPago Webhook URL contém localhost. 
Configure NEXTAUTH_URL com o domínio de produção.
```

---

## 📦 Funções Disponíveis

### `lib/environment.ts`

```typescript
// Detecção de ambiente
IS_PRODUCTION          // boolean
IS_DEVELOPMENT         // boolean

// URLs base
getAppBaseUrl()        // URL da aplicação (pode ser localhost em dev)
getWebhookBaseUrl()    // URL pública para webhooks (nunca localhost)

// Mercado Pago
getMercadoPagoWebhookUrl()     // Ex: https://xxx.ngrok.dev/api/webhooks/mercadopago
getMercadoPagoBackUrl(path)    // Ex: https://meusite.com/subscriptions
getMercadoPagoBackUrls()       // { success, failure, pending }

// Melhor Envio
getMelhorEnvioCallbackUrl()    // Ex: https://xxx.ngrok.dev/api/webhooks/melhor-envio

// Debug
getAllConfiguredUrls()          // Retorna todas URLs para logging
```

---

## 🚀 Como Configurar

### Desenvolvimento Local

1. **Instale ngrok** (ou similar):
   ```bash
   npm install -g ngrok
   # ou baixe de https://ngrok.com
   ```

2. **Inicie o túnel**:
   ```bash
   ngrok http 3000
   ```

3. **Copie a URL** (ex: `https://abc123.ngrok-free.dev`)

4. **Configure no `.env`**:
   ```env
   WEBHOOK_NGROK_URL='https://abc123.ngrok-free.dev'
   ```

5. **Reinicie o servidor**:
   ```bash
   npm run dev
   ```

### Produção

1. **Configure no `.env` de produção**:
   ```env
   NEXTAUTH_URL='https://meudominio.com.br'
   # WEBHOOK_NGROK_URL não precisa existir em produção
   ```

2. **Garanta que o domínio está acessível** publicamente

---

## 🔄 Migração DEV → PROD

### Checklist

- [ ] `NEXTAUTH_URL` configurado com domínio real
- [ ] SSL/HTTPS habilitado
- [ ] Webhook endpoint acessível: `GET https://meudominio.com.br/api/webhooks/mercadopago`
- [ ] `MP_USE_PRODUCTION=true` para credenciais de produção

### Nenhuma Mudança de Código Necessária

O módulo `environment.ts` detecta automaticamente:
- Se `WEBHOOK_NGROK_URL` existe → usa (DEV)
- Se não → usa `NEXTAUTH_URL` (PROD)

---

## 📝 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `lib/environment.ts` | **NOVO** - Módulo centralizado |
| `lib/mercadopago.ts` | Importa de environment.ts |
| `services/mercadopago.service.ts` | Usa getMercadoPagoWebhookUrl() |
| `services/subscription-mp.service.ts` | Usa getMercadoPagoWebhookUrl() e getMercadoPagoBackUrl() |

---

## ⚠️ Regras de Ouro

1. **NUNCA** hardcode URLs diretamente nos serviços
2. **SEMPRE** use as funções de `lib/environment.ts`
3. **NUNCA** use `process.env.AUTH_URL` diretamente para webhooks
4. **SEMPRE** configure `WEBHOOK_NGROK_URL` para testes locais

---

## 🐛 Troubleshooting

### Erro 400 do Mercado Pago

```
Causa: back_url ou notification_url contém localhost
Solução: Configure WEBHOOK_NGROK_URL no .env
```

### Webhook não recebido

```
Causa: URL não é pública / acessível pela internet
Solução: 
1. Verifique se ngrok está rodando
2. Teste: curl https://xxx.ngrok.dev/api/webhooks/mercadopago
```

### Warning de localhost

```
Causa: WEBHOOK_NGROK_URL não configurado
Solução: Configure no .env ou ignore se não estiver testando webhooks
```

---

## 📚 Referências

- [Mercado Pago Webhooks](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/additional-content/your-integrations/notifications/webhooks)
- [ngrok Documentation](https://ngrok.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
