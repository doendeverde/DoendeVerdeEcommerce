# Doende HeadShop — UI System & Interface Specification
Versão: 1.0  
Produto: E-commerce + Assinaturas (HeadShop)  
Objetivo: Documento-base para padronização visual, experiência do usuário e geração de telas via GitHub Copilot.

---

## 1. Visão Geral da Identidade Visual

O Doende HeadShop utiliza uma identidade **clean, moderna e amigável**, combinando:
- Tons **verdes** (ação, sucesso, natureza)
- Tons **roxos** (exclusividade, assinatura, status)
- Layouts claros, com bastante espaçamento e leitura fácil
- Interface pensada para **confiança, recorrência e fidelização**

A experiência deve transmitir:
- Simplicidade
- Clareza de benefícios
- Sensação de comunidade e progressão (pontos, planos, níveis)

---

## 2. Paleta de Cores (Base)

### Cores Primárias
- **Verde Principal**: `#22C55E`
  - Ações principais
  - Botões de compra
  - Status positivos
  - Pontos e recompensas

- **Roxo Principal**: `#7C3AED`
  - Assinaturas
  - Planos premium
  - Destaques de status do usuário

### Cores Secundárias
- **Roxo Escuro / Gradiente**: `#5B21B6 → #7C3AED`
- **Verde Claro**: `#DCFCE7`
- **Cinza Claro (Background)**: `#F9FAFB`
- **Cinza Médio (Bordas)**: `#E5E7EB`
- **Texto Principal**: `#111827`
- **Texto Secundário**: `#6B7280`

### Estados
- Sucesso: Verde
- Aviso / Destaque: Roxo
- Erro: Vermelho Suave `#EF4444`
- Desativado: Cinza `#9CA3AF`

---

## 3. Tipografia

- Fonte padrão: **Sans-serif moderna** (ex: Inter, Poppins ou equivalente)
- Hierarquia clara e consistente

### Escala
- Título de página: `24–28px`, peso 600
- Título de seção: `18–20px`, peso 600
- Texto padrão: `14–16px`, peso 400
- Texto auxiliar: `12–13px`, peso 400

---

## 4. Grid, Espaçamento e Layout

- Layout baseado em **cards**
- Bordas arredondadas padrão: `12px`
- Cards internos: `16px` de padding
- Seções principais: `24–32px` de espaçamento vertical
- Grid de produtos:
  - Desktop: 3 ou 4 colunas
  - Tablet: 2 colunas
  - Mobile: 1 coluna

---

## 5. Componentes Fundamentais

### 5.1 Header (Topo)

Elementos obrigatórios:
- Logo Doende HeadShop (esquerda)
- Menu:
  - Produtos
  - Marcas
  - Assinaturas
  - Meus Pontos
- Ícone de carrinho
- Avatar do usuário com dropdown

Dropdown do usuário:
- Nome
- Papel (ex: Administrador)
- Minhas Compras
- Área Administrativa (se ADMIN)
- Sair

---

### 5.2 Banner de Status do Usuário

Usado no catálogo e carrinho.

Características:
- Fundo em gradiente roxo
- Exibe:
  - Plano atual (ex: Doende Prata)
  - Percentual de desconto ativo
  - Pontos disponíveis
- Ícones simples, leitura rápida

---

## 6. Cards de Produto

Estrutura obrigatória:

- Imagem do produto (proporção 1:1)
- Badge de categoria (ex: Acessórios, Piteiras)
- Badge opcional:
  - “Últimas unidades”
- Nome do produto
- Descrição curta
- Pontos ganhos (ex: +90 pontos)
- Preço original (riscado, se houver desconto)
- Preço final destacado
- Botão de adicionar ao carrinho (ícone)

Regras:
- Card inteiro é clicável (exceto botão)
- Hover com leve elevação ou sombra

---

## 7. Filtros e Busca

- Campo de busca sempre visível
- Chips de categoria:
  - Todos
  - Acessórios
  - Piteiras
  - Bongs
  - Sedas
  - Vaporizadores
- Filtro avançado via botão “Filtros”

---

## 8. Carrinho (Drawer Lateral)

Características:
- Abre da direita
- Overlay escuro no fundo
- Scroll independente

Conteúdo:
- Lista de produtos
- Quantidade (+ / -)
- Preço unitário
- Plano ativo aplicado automaticamente
- Cupons disponíveis
- Subtotal
- Desconto
- Total final
- Pontos que serão ganhos
- Botão **Finalizar Compra**

---

## 9. Modal de Finalização de Compra

Formato:
- Modal central
- Fundo escurecido

Etapas:
1. Resumo do pedido
2. Descontos aplicados
3. Total
4. Escolha de pagamento:
   - Cartão de Crédito
   - Cartão de Débito
   - PIX

Estilo:
- Opções em cards clicáveis
- Ícones grandes e claros

---

## 10. Página de Assinaturas

Layout:
- Título central: “Escolha seu plano”
- Subtítulo explicativo
- Cards de plano lado a lado

Planos:
- Gratuito
- Doende X
- Doende Bronze
- Doende Prata

Destaques:
- Plano atual com badge
- “Mais popular” destacado
- Plano premium com borda roxa

Cada card deve conter:
- Nome
- Preço
- Benefícios em lista
- CTA:
  - Assinar agora
  - Plano atual (desabilitado)

---

## 11. Seções Informativas

### “Por que assinar?”
- Cards com ícones
- Texto curto e direto

### FAQ
- Accordion
- Perguntas frequentes sobre:
  - Cancelamento
  - Cupons
  - Pontos

---

## 12. Página “Minhas Compras”

Layout:
- Header com gradiente
- Barra de busca por pedido/produto
- Filtro de status

Cada pedido:
- Número do pedido
- Data
- Total
- Status (Entregue, Enviado)
- Lista de produtos
- Bloco de pagamento
- Bloco de entrega
- Endereço
- Código de rastreio
- Barra de progresso

---

## 13. Área Administrativa

### Gestão de Produtos

Visão em tabela:
- Imagem
- Nome
- Categoria
- Preço
- Estoque
- Cashback (pontos)
- Ações (editar / excluir)

Resumo superior:
- Total de produtos
- Itens em estoque
- Estoque baixo

---

### Modal “Novo Produto”

Tabs:
1. Informações Básicas
2. Especificação
3. Imagens

Campos obrigatórios:
- Nome do produto
- Categoria
- Descrição detalhada

CTA:
- Botão roxo “Cadastrar Produto”

---

## 14. Estados e Feedbacks

- Loading com spinner simples
- Empty states amigáveis
- Confirmações visuais claras
- Ações sempre retornam feedback

---

## 15. Regras para GitHub Copilot

Sempre que gerar telas:
- Usar layout em cards
- Manter bordas arredondadas
- Priorizar clareza visual
- Não poluir interface
- Usar cores conforme função (verde = ação, roxo = status)

Este documento é a **fonte de verdade visual e estrutural** do Doende HeadShop.
