# Sistema de Tema — Doende Verde E-commerce

> Documentação completa do sistema de temas dinâmicos (Light/Dark Mode)

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [CSS Variables (Design Tokens)](#css-variables-design-tokens)
4. [Tailwind CSS v4 Integration](#tailwind-css-v4-integration)
5. [Classes Utilitárias](#classes-utilitárias)
6. [Guia de Uso para Desenvolvedores](#guia-de-uso-para-desenvolvedores)
7. [Componentes Exemplo](#componentes-exemplo)
8. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O sistema de tema do Doende Verde utiliza:

- **next-themes** para gerenciamento de estado do tema
- **CSS Variables** para tokens dinâmicos
- **Tailwind CSS v4** com @theme inline para integração
- **Classe `.dark`** no `<html>` para alternar estilos

### Fluxo

```
User toggle → next-themes → .dark class on <html> → CSS variables update → UI reflects changes
```

---

## Arquitetura

### Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| `app/globals.css` | Define CSS variables e @theme inline |
| `components/providers/ThemeProvider.tsx` | Wrapper do next-themes |
| `components/ui/ThemeToggle.tsx` | Botão de alternância |
| `components/providers/AppProviders.tsx` | Provider raiz que inclui ThemeProvider |

### ThemeProvider Configuration

```tsx
// components/providers/ThemeProvider.tsx
<NextThemesProvider
  attribute="class"        // Usa classe CSS (não atributo data)
  defaultTheme="light"     // Tema padrão
  enableSystem={false}     // Desabilitado (apenas light/dark)
  storageKey="doende-theme" // Key no localStorage
>
```

---

## CSS Variables (Design Tokens)

### Light Mode (`:root`)

```css
:root {
  /* Background & Foreground */
  --background: #ffffff;
  --foreground: #171717;

  /* Primary Colors */
  --primary-green: #22C55E;
  --primary-green-hover: #16A34A;
  --primary-green-light: #DCFCE7;

  --primary-purple: #7C3AED;
  --primary-purple-hover: #6D28D9;
  --primary-purple-dark: #5B21B6;

  /* Neutral Colors */
  --gray-bg: #F9FAFB;
  --gray-border: #E5E7EB;
  --gray-muted: #9CA3AF;

  /* Text Colors */
  --text-primary: #111827;
  --text-secondary: #6B7280;

  /* Semantic Colors */
  --success: #22C55E;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;

  /* Cards & Surfaces */
  --card-bg: #ffffff;
  --card-border: #E5E7EB;
  --hover-bg: #f3f4f6;
}
```

### Dark Mode (`.dark`)

```css
.dark {
  --background: #09090b;
  --foreground: #fafafa;

  --primary-green: #4ade80;
  --primary-green-hover: #22c55e;
  --primary-green-light: #14532d;

  --primary-purple: #a78bfa;
  --primary-purple-hover: #8b5cf6;
  --primary-purple-dark: #7c3aed;

  --gray-bg: #18181b;
  --gray-border: #27272a;
  --gray-muted: #71717a;

  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;

  --success: #4ade80;
  --warning: #fbbf24;
  --error: #f87171;
  --info: #60a5fa;

  --card-bg: #18181b;
  --card-border: #27272a;
  --hover-bg: #27272a;
}
```

---

## Tailwind CSS v4 Integration

O Tailwind v4 usa `@theme inline` para registrar CSS variables como cores:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);

  /* Primary */
  --color-primary-green: var(--primary-green);
  --color-primary-green-hover: var(--primary-green-hover);
  --color-primary-green-light: var(--primary-green-light);
  --color-primary-purple: var(--primary-purple);
  --color-primary-purple-hover: var(--primary-purple-hover);
  --color-primary-purple-dark: var(--primary-purple-dark);

  /* Neutral */
  --color-gray-bg: var(--gray-bg);
  --color-gray-border: var(--gray-border);
  --color-gray-muted: var(--gray-muted);

  /* Text */
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);

  /* Semantic */
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-error: var(--error);
  --color-info: var(--info);

  /* Cards */
  --color-card-bg: var(--card-bg);
  --color-card-border: var(--card-border);
  
  /* Hover */
  --color-hover-bg: var(--hover-bg);
}
```

Isso permite usar classes como:
- `bg-primary-green`
- `text-text-primary`
- `bg-gray-bg`
- `border-gray-border`
- `bg-card-bg`
- `bg-hover-bg`

---

## Classes Utilitárias

### Semantic Classes (Recomendado)

| Classe | Light Mode | Dark Mode | Uso |
|--------|------------|-----------|-----|
| `bg-surface` | `--card-bg` (#fff) | `--card-bg` (#18181b) | Cards, modais |
| `bg-page` | `--gray-bg` (#F9FAFB) | `--gray-bg` (#18181b) | Background de página |
| `border-default` | `--gray-border` | `--gray-border` | Bordas padrão |
| `text-default` | `--text-primary` | `--text-primary` | Texto principal |
| `text-muted` | `--text-secondary` | `--text-secondary` | Texto secundário |
| `hover-bg:hover` | `--hover-bg` | `--hover-bg` | Hover em botões |

### Tailwind Theme Classes

| Classe | Descrição |
|--------|-----------|
| `bg-gray-bg` | Background neutro (grey-50 → grey-900) |
| `bg-card-bg` | Background de cards |
| `text-text-primary` | Texto principal |
| `text-text-secondary` | Texto secundário |
| `border-gray-border` | Borda padrão |
| `bg-hover-bg` | Background de hover |
| `text-gray-muted` | Texto muted/disabled |

---

## Guia de Uso para Desenvolvedores

### ✅ CORRETO — Use Theme Tokens

```tsx
// Backgrounds
<div className="bg-card-bg" />       // Card background
<div className="bg-gray-bg" />       // Page/section background
<div className="bg-hover-bg" />      // Hover states

// Texto
<p className="text-text-primary" />  // Texto principal
<p className="text-text-secondary" /> // Texto secundário

// Bordas
<div className="border border-gray-border" />

// Hover
<button className="hover:bg-hover-bg" />
```

### ❌ EVITAR — Classes Hardcoded

```tsx
// ❌ NÃO FAÇA ISSO
<div className="bg-gray-100 dark:bg-gray-800" />  // Use bg-gray-bg
<div className="bg-white dark:bg-gray-900" />     // Use bg-card-bg
<p className="text-gray-700 dark:text-gray-300" /> // Use text-text-primary
<p className="text-gray-500 dark:text-gray-400" /> // Use text-text-secondary
<button className="hover:bg-gray-100 dark:hover:bg-gray-700" /> // Use hover:bg-hover-bg
```

### Quando Usar dark: Variants

**EVITE** usar `dark:` para cores de status. Use os tokens semânticos que já adaptam automaticamente:

```tsx
// ❌ NÃO FAÇA ISSO
<div className="bg-green-100 dark:bg-green-900/40" />

// ✅ CORRETO — Use tokens que adaptam automaticamente
<div className="bg-green-bg text-green-text" />
<div className="bg-red-bg text-red-text" />
<div className="bg-yellow-bg text-yellow-text" />
<div className="bg-purple-bg text-purple-text" />
```

---

## Color Variant Tokens (NEW)

Tokens semânticos para cores de status que adaptam automaticamente ao tema:

### Disponíveis

| Variante | Background | Text | Border | Hover |
|----------|------------|------|--------|-------|
| Green | `bg-green-bg` | `text-green-text` | `border-green-border` | `hover:bg-green-bg-hover` |
| Red | `bg-red-bg` | `text-red-text` | `border-red-border` | `hover:bg-red-bg-hover` |
| Yellow | `bg-yellow-bg` | `text-yellow-text` | `border-yellow-border` | `hover:bg-yellow-bg-hover` |
| Blue | `bg-blue-bg` | `text-blue-text` | `border-blue-border` | `hover:bg-blue-bg-hover` |
| Purple | `bg-purple-bg` | `text-purple-text` | `border-purple-border` | `hover:bg-purple-bg-hover` |
| Orange | `bg-orange-bg` | `text-orange-text` | `border-orange-border` | `hover:bg-orange-bg-hover` |

### Uso Correto

```tsx
// Status badges
<span className="bg-green-bg text-green-text">Ativo</span>
<span className="bg-red-bg text-red-text">Bloqueado</span>
<span className="bg-yellow-bg text-yellow-text">Pendente</span>

// Alerts
<div className="bg-red-bg border border-red-border text-red-text">
  Erro ao processar
</div>

// Success icons
<div className="bg-green-bg rounded-full p-2">
  <Check className="text-green-text" />
</div>

// Buttons with hover
<button className="bg-green-bg text-green-text hover:bg-green-bg-hover">
  Confirmar
</button>
```

### Valores dos Tokens

#### Light Mode
```css
--green-bg: #DCFCE7;      --green-text: #166534;    --green-border: #86EFAC;
--red-bg: #FEE2E2;        --red-text: #991B1B;      --red-border: #FCA5A5;
--yellow-bg: #FEF9C3;     --yellow-text: #854D0E;   --yellow-border: #FDE047;
--blue-bg: #DBEAFE;       --blue-text: #1E40AF;     --blue-border: #93C5FD;
--purple-bg: #F3E8FF;     --purple-text: #6B21A8;   --purple-border: #C4B5FD;
--orange-bg: #FFEDD5;     --orange-text: #9A3412;   --orange-border: #FDBA74;
```

#### Dark Mode
```css
--green-bg: rgba(34, 197, 94, 0.15);   --green-text: #4ade80;   --green-border: rgba(34, 197, 94, 0.4);
--red-bg: rgba(239, 68, 68, 0.15);     --red-text: #f87171;     --red-border: rgba(239, 68, 68, 0.4);
--yellow-bg: rgba(234, 179, 8, 0.15);  --yellow-text: #facc15;  --yellow-border: rgba(234, 179, 8, 0.4);
--blue-bg: rgba(59, 130, 246, 0.15);   --blue-text: #60a5fa;    --blue-border: rgba(59, 130, 246, 0.4);
--purple-bg: rgba(139, 92, 246, 0.15); --purple-text: #a78bfa;  --purple-border: rgba(139, 92, 246, 0.4);
--orange-bg: rgba(249, 115, 22, 0.15); --orange-text: #fb923c;  --orange-border: rgba(249, 115, 22, 0.4);
```

---

## Componentes Exemplo

### Card Component

```tsx
function Card({ children }) {
  return (
    <div className="bg-card-bg border border-gray-border rounded-xl p-6">
      {children}
    </div>
  );
}
```

### Button Component

```tsx
function Button({ variant = 'primary', children }) {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors";
  
  const variants = {
    primary: "bg-primary-green text-white hover:bg-primary-green-hover",
    secondary: "bg-gray-bg text-text-primary hover:bg-hover-bg",
    ghost: "text-text-primary hover:bg-hover-bg",
  };

  return (
    <button className={`${baseClasses} ${variants[variant]}`}>
      {children}
    </button>
  );
}
```

### Input Component

```tsx
function Input({ ...props }) {
  return (
    <input
      className="
        w-full px-4 py-2 rounded-lg
        bg-card-bg
        border border-gray-border
        text-text-primary
        placeholder:text-gray-muted
        focus:border-primary-green focus:ring-2 focus:ring-primary-green/20
        transition-colors
      "
      {...props}
    />
  );
}
```

### Category Chip

```tsx
function CategoryChip({ active, children }) {
  return (
    <button
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition-all
        ${active
          ? 'bg-primary-green text-white'
          : 'bg-gray-bg text-text-primary hover:bg-hover-bg'
        }
      `}
    >
      {children}
    </button>
  );
}
```

---

## Troubleshooting

### Problema: Cor não muda ao trocar tema

**Causa:** Usando classes hardcoded como `bg-gray-100`.

**Solução:** Use tokens do tema:
```diff
- className="bg-gray-100"
+ className="bg-gray-bg"
```

### Problema: Flash de tema errado ao carregar

**Causa:** Hydration mismatch com next-themes.

**Solução:** Use pattern de mounted state:
```tsx
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return <Skeleton />;
}
```

### Problema: Contraste ruim no dark mode

**Causa:** Usando cores de texto fixas.

**Solução:** Use tokens semânticos:
```diff
- className="text-gray-700"
+ className="text-text-primary"
```

### Problema: Borda invisível no dark mode

**Causa:** Usando `border-gray-200` que some no dark.

**Solução:**
```diff
- className="border-gray-200"
+ className="border-gray-border"
```

---

## Checklist de Revisão

Ao criar/modificar componentes, verifique:

- [ ] Backgrounds usam `bg-card-bg`, `bg-gray-bg`, ou `bg-hover-bg`
- [ ] Texto usa `text-text-primary` ou `text-text-secondary`
- [ ] Bordas usam `border-gray-border`
- [ ] Hover states usam `hover:bg-hover-bg`
- [ ] Não há classes `bg-white`, `bg-gray-100`, `text-gray-700` sem dark variant
- [ ] Cores semânticas (success/error) têm dark variants apropriados
- [ ] Skeletons usam `bg-gray-bg` em vez de `bg-gray-200`

---

## Referência Rápida

```
┌─────────────────────────────────────────────────────────────┐
│                    LIGHT MODE → DARK MODE                  │
├─────────────────────────────────────────────────────────────┤
│ bg-card-bg:      #ffffff     →  #18181b                    │
│ bg-gray-bg:      #F9FAFB     →  #18181b                    │
│ bg-hover-bg:     #f3f4f6     →  #27272a                    │
│ border-gray-border: #E5E7EB  →  #27272a                    │
│ text-text-primary: #111827   →  #fafafa                    │
│ text-text-secondary: #6B7280 →  #a1a1aa                    │
│ text-gray-muted: #9CA3AF     →  #71717a                    │
└─────────────────────────────────────────────────────────────┘
```

---

*Documentação criada em 25/01/2026*
*Última atualização: Sistema de tema corrigido para usar tokens dinâmicos*
