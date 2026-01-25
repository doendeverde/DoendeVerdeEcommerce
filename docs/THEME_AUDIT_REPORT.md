# 🔍 Auditoria de UI/UX e Arquitetura de Tema

> **Data:** Janeiro 2026  
> **Versão:** 1.0  
> **Escopo:** Análise completa do sistema de tema e consistência visual

---

## 📋 Sumário Executivo

### Estado Atual

O sistema já possui uma **boa fundação** com:
- ✅ CSS Variables centralizadas em `globals.css`
- ✅ ThemeProvider com next-themes funcionando
- ✅ Tokens de cor semânticos (success, error, warning, info, premium)
- ✅ Sistema de spacing baseado em 4px
- ✅ Classes utilitárias customizadas (container-main, page-content, card, etc.)

### Principais Problemas

| Gravidade | Quantidade | Descrição |
|-----------|------------|-----------|
| 🔴 Alta | 8 | Hardcoded colors sem dark mode |
| 🟠 Média | 12 | Inconsistência em border-radius |
| 🟡 Baixa | 15+ | Duplicação de estilos em botões/inputs |

---

## 🔴 Problemas de Alta Gravidade

### 1. Cores Hardcoded sem Dark Mode Support

**Impacto:** Elementos invisíveis ou com baixo contraste no dark mode.

| Arquivo | Problema | Linha |
|---------|----------|-------|
| `components/profile/AddressFormModal.tsx` | `border-gray-300` sem dark variant | 180, 198, 218, 233, 247, 262, 274, 289 |
| `components/profile/PreferencesFormModal.tsx` | `border-gray-300` repetido 10x | múltiplas |
| `components/auth/RegisterForm.tsx` | `border-gray-300 focus:ring-blue-500` | 151, 172, 193, 215, 236, 260 |
| `components/auth/LoginForm.tsx` | `border-gray-300 focus:ring-blue-500` | 133, 154 |
| `components/auth/OAuthButtons.tsx` | `bg-white border-gray-300` | 61 |
| `components/products/AddToCartButton.tsx` | `border-gray-200` | 88 |
| `components/orders/OrderPixPayment.tsx` | `bg-white border-gray-200` | 226 |
| `app/(default)/checkout/payment/failure/page.tsx` | `bg-white` hardcoded | 55 |
| `app/(default)/checkout/payment/pending/page.tsx` | `bg-white` hardcoded | 36 |
| `components/checkout/subscription/CheckoutStates.tsx` | `bg-white dark:bg-gray-900` (deveria usar token) | 22, 45, 89 |

**Correção:**
```tsx
// ❌ Antes
className="border-gray-300"

// ✅ Depois
className="border-gray-border"
```

---

### 2. Focus Ring Inconsistente

**Impacto:** Acessibilidade prejudicada, experiência inconsistente.

| Padrão Encontrado | Ocorrências | Problema |
|-------------------|-------------|----------|
| `focus:ring-blue-500` | 6 | Cor não alinhada com a marca |
| `focus:ring-primary-green` | 30+ | Correto ✅ |
| `focus:ring-2 focus:ring-primary-green/20` | 15+ | Correto ✅ |
| Sem focus ring | 10+ | Falta acessibilidade |

**Correção:** Padronizar para `focus:ring-2 focus:ring-primary-green/20 focus:border-primary-green`

---

### 3. Admin Pages com bg-orange Hardcoded

**Arquivo:** `app/(admin)/admin/page.tsx` (linha 92)
```tsx
// ❌ Ainda presente
className="bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800"
```

**Correção:** Usar `bg-warning-bg text-warning-text border-warning-text/20`

---

## 🟠 Problemas de Média Gravidade

### 4. Border Radius Inconsistente

| Valor | Uso | Deveria Ser |
|-------|-----|-------------|
| `rounded-lg` | Botões, inputs | ✅ `--radius-md` (12px) |
| `rounded-xl` | Cards, modais | ✅ `--radius-lg` (16px) |
| `rounded-2xl` | Alguns modais | ⚠️ Inconsistente |
| `rounded-full` | Badges, avatars | ✅ OK |
| `rounded-md` | ThemeToggle | ⚠️ Deveria ser rounded-lg |

**Arquivos afetados:**
- `components/ui/ThemeToggle.tsx` - usa `rounded-md` interno
- `components/ui/Modal.tsx` - usa `rounded-xl` (deveria ser consistente)
- `components/checkout/subscription/CheckoutStates.tsx` - usa `rounded-2xl`

**Proposta de padronização:**
```css
/* Tokens de radius */
--radius-sm: 8px;   /* elementos pequenos */
--radius-md: 12px;  /* botões, inputs, badges */
--radius-lg: 16px;  /* cards, modais */
--radius-xl: 20px;  /* hero sections */
--radius-full: 9999px; /* pills, avatars */
```

---

### 5. Padrões de Botão Duplicados

O mesmo estilo de botão primário aparece em **17+ arquivos** com pequenas variações:

```tsx
// Variação 1 (CartSummary)
"rounded-lg bg-primary-green py-3 text-sm font-semibold text-white transition-all hover:bg-green-600 disabled:bg-gray-300"

// Variação 2 (AddressStep)  
"py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"

// Variação 3 (CheckoutStates)
"px-6 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
```

**Problema:** 
- Algumas usam `font-semibold`, outras `font-medium`
- Algumas usam `disabled:bg-gray-300`, outras `disabled:opacity-50`
- Padding inconsistente (`py-3` vs `py-2.5` vs `py-4`)

---

### 6. Input Styles Não Centralizados

Inputs aparecem com estilos inline em vez de usar a classe `.input-default` definida no CSS:

**Existente em globals.css:**
```css
.input-default {
  width: 100%;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--gray-border);
  background-color: var(--card-bg);
  color: var(--text-primary);
  transition: border-color 0.2s, box-shadow 0.2s;
}
```

**Mas componentes usam:**
```tsx
className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
```

---

### 7. Shadow Inconsistente

| Componente | Shadow | Deveria |
|------------|--------|---------|
| Modal | `shadow-2xl` | `shadow-xl` |
| Cards | `shadow-sm` | ✅ OK |
| Dropdowns | `shadow-lg` | ✅ OK |
| Cart Drawer | `shadow-xl` | ✅ OK |
| Product Card hover | `shadow-lg` | ✅ OK |

---

## 🟡 Problemas de Baixa Gravidade

### 8. Ausência de Componentes Base Reutilizáveis

Não existem componentes base abstraídos como:
- `<Button variant="primary|secondary|ghost" size="sm|md|lg" />`
- `<Input label error placeholder />`
- `<Card variant="default|elevated" padding="sm|md|lg" />`
- `<Badge variant="success|warning|error|info" />`

### 9. Transições Inconsistentes

| Padrão | Ocorrências |
|--------|-------------|
| `transition-colors` | 50+ |
| `transition-all` | 20+ |
| `transition-all duration-200` | 10+ |
| `transition-opacity duration-200` | 5+ |

**Proposta:** Padronizar para `transition-colors` para cor e `transition-all duration-200` para transforms.

### 10. Disabled States Inconsistentes

| Padrão | Significado |
|--------|-------------|
| `disabled:opacity-50` | Reduz opacidade |
| `disabled:bg-gray-300 dark:disabled:bg-gray-700` | Muda cor de fundo |
| `disabled:cursor-not-allowed` | Cursor |

**Proposta:** Padronizar para `disabled:opacity-50 disabled:cursor-not-allowed`

### 11. Texto Secundário - Uso Misto

| Classe | Deveria Usar |
|--------|--------------|
| `text-gray-500` | `text-muted` ou `text-text-secondary` |
| `text-gray-600` | `text-muted` ou `text-text-secondary` |
| `text-gray-400` | `text-gray-muted` |

### 12. Arquivos Legacy com Estilos Antigos

- `app/(protected)/dashboard_/page.tsx` - usa `bg-white` hardcoded
- `app/(protected)/subscriptions_/page.tsx` - usa `bg-white` hardcoded

---

## 📊 Métricas de Consistência

### Tokens Utilizados vs Hardcoded

| Categoria | Tokens (✅) | Hardcoded (❌) | Taxa |
|-----------|-------------|----------------|------|
| Background | 85% | 15% | 🟡 |
| Text | 70% | 30% | 🟠 |
| Border | 60% | 40% | 🔴 |
| Focus | 80% | 20% | 🟡 |
| Shadow | 95% | 5% | 🟢 |

---

## 🏗️ Proposta de Arquitetura

### 1. Source of Truth

```
globals.css
├── :root (Light Mode)
│   ├── Colors (primary, semantic, neutral)
│   ├── Spacing (4px scale)
│   ├── Radius
│   ├── Shadows
│   └── Typography
├── .dark (Dark Mode)
│   └── Color overrides
└── @theme inline (Tailwind integration)
```

### 2. Tokens e Nomenclatura

#### Cores
```
--primary-{color}      → Cores da marca (green, purple)
--{semantic}-bg        → Background semântico (success-bg, error-bg)
--{semantic}-text      → Texto semântico (success-text, error-text)
--gray-{purpose}       → Neutros (gray-bg, gray-border, gray-muted)
--text-{level}         → Texto (text-primary, text-secondary)
```

#### Spacing
```
--space-{n}            → Múltiplos de 4px (space-1=4px, space-4=16px)
--{context}-padding    → Contextual (card-padding, container-padding)
--{context}-gap        → Gaps (section-gap, card-gap)
```

#### Radius
```
--radius-sm            → 8px (small elements)
--radius-md            → 12px (buttons, inputs)
--radius-lg            → 16px (cards, modals)
--radius-xl            → 20px (hero sections)
--radius-full          → Pills, avatars
```

### 3. Componentes Base Propostos

```
components/ui/
├── Button.tsx         → Primary, Secondary, Ghost, Outline variants
├── Input.tsx          → Text, Email, Password, Textarea
├── Card.tsx           → Default, Elevated, Interactive
├── Badge.tsx          → Success, Warning, Error, Info, Premium
├── Modal.tsx          → (já existe, refatorar)
├── Spinner.tsx        → Loading indicator
├── Skeleton.tsx       → Loading placeholders
└── index.ts           → Barrel exports
```

#### Button Component Spec

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

// Variants
primary   → bg-primary-green text-white hover:bg-primary-green-hover
secondary → bg-gray-bg text-text-primary hover:bg-hover-bg
ghost     → bg-transparent text-text-primary hover:bg-hover-bg
outline   → border-default text-text-primary hover:bg-hover-bg
danger    → bg-error text-white hover:bg-error/90
```

#### Input Component Spec

```tsx
interface InputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Base classes
"w-full px-4 py-2.5 rounded-lg border border-gray-border bg-card-bg text-text-primary
placeholder:text-gray-muted
focus:border-primary-green focus:ring-2 focus:ring-primary-green/20
disabled:opacity-50 disabled:cursor-not-allowed"
```

---

## 📅 Plano Incremental

### Fase 1: Fundação (1-2 dias)
- [ ] Adicionar tokens faltantes em globals.css
- [ ] Criar componente `Button` base
- [ ] Criar componente `Input` base
- [ ] Documentar padrões em THEME_SYSTEM.md

### Fase 2: Migração Crítica (2-3 dias)
- [ ] Corrigir todos `border-gray-300` → `border-gray-border`
- [ ] Corrigir `focus:ring-blue-500` → `focus:ring-primary-green`
- [ ] Substituir `bg-white` hardcoded → `bg-surface` ou `bg-card-bg`
- [ ] Corrigir admin pages com cores hardcoded

### Fase 3: Componentes (3-5 dias)
- [ ] Criar componente `Card`
- [ ] Criar componente `Badge`
- [ ] Migrar usos existentes para componentes

### Fase 4: Refatoração Profunda (5-7 dias)
- [ ] Migrar todos os botões para `<Button />`
- [ ] Migrar todos os inputs para `<Input />`
- [ ] Remover estilos inline duplicados

### Fase 5: Validação (1-2 dias)
- [ ] Testar dark mode em todas as páginas
- [ ] Verificar contraste (WCAG AA)
- [ ] Testar responsividade
- [ ] Atualizar documentação final

---

## 🔄 Progress Log

### Janeiro 2026 - Correções Implementadas

#### ✅ Componentes Base Criados
- **`components/ui/Button.tsx`** - Button com variants (primary, secondary, ghost, outline, danger, success) e IconButton
- **`components/ui/Input.tsx`** - Input, TextArea, Select com suporte a labels, errors, icons
- **`components/ui/Badge.tsx`** - Badge, StatusBadge, OrderStatusBadge, SubscriptionStatusBadge
- **`components/ui/Card.tsx`** - Card, CardHeader, CardFooter, StatCard com variants
- **`components/ui/index.ts`** - Barrel exports atualizados

#### ✅ Formulários de Autenticação Corrigidos
- **`components/auth/LoginForm.tsx`**
  - Corrigido: `border-gray-300` → `border-gray-border`
  - Corrigido: `focus:ring-blue-500` → `focus:ring-primary-green/20 focus:border-primary-green`
  - Adicionado: `bg-white dark:bg-gray-900` para dark mode
  
- **`components/auth/RegisterForm.tsx`**
  - Corrigidos 6 inputs (fullName, email, birthDate, whatsapp, password, confirmPassword)
  - Corrigido checkbox `acceptTerms` com `accent-primary-green`
  
- **`components/auth/OAuthButtons.tsx`**
  - Corrigido: Google button `border-gray-300` → `border-gray-border`
  - Corrigido: `text-gray-700` → `text-text-primary`
  - Corrigido: divider `bg-white` → `bg-card-bg`

#### ✅ Modais de Perfil Corrigidos
- **`components/profile/AddressFormModal.tsx`**
  - Corrigidos 8 inputs com `border-gray-border bg-white dark:bg-gray-900`
  - Labels: `text-gray-700` → `text-text-secondary`
  - Error message: `bg-red-50` → `bg-error-bg`
  - Cancel button: `border-gray-300 text-gray-700` → `border-gray-border text-text-secondary`
  
- **`components/profile/PreferencesFormModal.tsx`**
  - Corrigidos 10+ selects e inputs
  - Section headers: `text-gray-800` → `text-text-primary`
  - Checkbox containers: `border-gray-200 bg-green-50` → `border-gray-border bg-success-bg`
  - Added `accent-primary-green` to checkboxes
  - Error message: `bg-red-50` → `bg-error-bg`

#### 📊 Resumo de Correções
| Categoria | Antes | Depois |
|-----------|-------|--------|
| `border-gray-300` | 30+ ocorrências | 0 ✅ |
| `border-gray-200` | 8 ocorrências | 0 ✅ |
| `focus:ring-blue-500` | 6 ocorrências | 0 ✅ |
| `text-gray-700` em labels | 20+ | ~3 restantes |
| `bg-green-50` (hardcoded) | 10+ | 0 ✅ |

#### Arquivos Adicionais Corrigidos (Janeiro 2026 - Sessão 2)
- **`components/checkout/CardPaymentStep.tsx`** - Back buttons com `border-gray-border`
- **`app/(default)/checkout/payment/pending/page.tsx`** - Secondary link com theme tokens
- **`app/(default)/checkout/payment/failure/page.tsx`** - Secondary link com theme tokens
- **`components/products/AddToCartButton.tsx`** - Quantity selector com `border-gray-border`, `text-text-secondary`
- **`components/orders/OrderPixPayment.tsx`** - QR code container com dark mode support
- **`app/(default)/products/page.tsx`** - Skeleton loader com `bg-card-bg border-gray-border`

---

## ✅ Checklist de Validação

### Por Página

- [ ] **Home** - Cores, espaçamento, responsividade
- [ ] **Produtos** - Cards, filtros, paginação
- [ ] **Produto Detalhe** - Imagens, preço, botões
- [ ] **Carrinho** - Drawer, items, summary
- [ ] **Checkout** - Steps, forms, payment
- [ ] **Login/Register** - Forms, OAuth buttons
- [ ] **Profile** - Cards, modals, forms
- [ ] **Orders** - Lista, cards, filtros
- [ ] **Admin** - Dashboard, tabelas, forms
- [ ] **Subscriptions** - Plans, benefits

### Por Estado

- [ ] Default
- [ ] Hover
- [ ] Focus (keyboard navigation)
- [ ] Active/Pressed
- [ ] Disabled
- [ ] Loading
- [ ] Error
- [ ] Empty state

### Por Modo

- [ ] Light mode
- [ ] Dark mode
- [ ] System preference

---

## 📚 Referências

- [globals.css](../app/globals.css) - Tokens principais
- [THEME_SYSTEM.md](./THEME_SYSTEM.md) - Documentação atual
- [ThemeProvider.tsx](../components/providers/ThemeProvider.tsx) - Provider config
- [UX_UI_design.instructions.md](../.github/instructions/UX_UI_design.instructions.md) - Guidelines

---

## 🔧 Quick Fixes Imediatos

### 1. Corrigir borders hardcoded (5 min cada arquivo)

```bash
# Arquivos para corrigir
components/profile/AddressFormModal.tsx
components/profile/PreferencesFormModal.tsx
components/auth/RegisterForm.tsx
components/auth/LoginForm.tsx
components/auth/OAuthButtons.tsx
```

### 2. Adicionar focus ring padrão

Criar classe utilitária em globals.css:
```css
.focus-ring {
  @apply focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 focus:outline-none;
}
```

### 3. Corrigir disabled state

Criar classe utilitária:
```css
.btn-disabled {
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}
```

---

**Próximo Passo:** Começar pela Fase 1 - criar componentes base `Button` e `Input`.
