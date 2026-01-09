
# Headshop E-commerce & Subscription Platform

## 📦 Sobre o Projeto

Este projeto é uma plataforma de **e-commerce próprio com modelo de assinaturas**, desenvolvida para um **Headshop digital** focado em **personalização profunda da experiência do usuário**.

O sistema permite:
- Venda direta de produtos (sem marketplace, sem sellers)
- Assinaturas recorrentes de kits personalizados
- Coleta estruturada de preferências do usuário (hábitos, estilos e consumo)
- Preparação para automação, analytics e personalização futura via IA

O projeto foi pensado desde o início para ser **escalável, organizado e tecnicamente sólido**, evitando acúmulos de débito técnico comuns em MVPs apressados.

---

## 🎯 Objetivo

Criar uma base tecnológica que permita:
- Entender profundamente o perfil de cada cliente
- Montar kits de assinatura alinhados aos hábitos reais do usuário
- Evoluir facilmente para recomendações inteligentes
- Operar com clareza legal e estrutural (ex: +18, dados separados, segurança)

---

## 🧠 Conceito Central

A plataforma se baseia em três pilares:

### 1. Dados bem modelados
Separação clara entre:
- **USER** → autenticação e identidade legal
- **USER_PROFILE** → dados complementares
- **USER_PREFERENCES** → hábitos e gostos reais

Isso evita duplicidade, facilita manutenção e permite crescimento saudável.

### 2. Assinaturas como produto vivo
Planos:
- Possuem data de validade
- Podem ser pausados, expirados ou cancelados
- São compostos por produtos reais do catálogo

### 3. Personalização como core feature
As preferências do usuário não são apenas decorativas:
- Elas influenciam kits
- Permitem analytics
- Preparam o terreno para automação futura

---

## 🧱 Stack Tecnológica

### Backend / Infra
- **PostgreSQL** – banco de dados relacional
- **Prisma ORM** – modelagem, migrations e queries tipadas
- **Node.js** – camada de API

### Frontend
- **Next.js** – aplicação web
- **React** – UI
- **TypeScript** – segurança de tipos

### Arquitetura
- Monorepo-friendly
- Domínio documentado antes do código
- Schema-first approach

---

## 🗂️ Documentação Importante

Este repositório possui documentos essenciais:

### 📄 Documento de Entidades (PDF)
Fonte canônica com todas as entidades, campos e regras de negócio.

📎 `Documento_Entidades_Completo_Headshop.pdf`

### 🧠 Domain Reference (Copilot)
Arquivo criado para **alimentar o GitHub Copilot** e manter consistência de domínio.

📎 `DOMAIN_REFERENCE.md`

⚠️ Sempre utilize este arquivo como referência ao gerar:
- Prisma schema
- APIs
- Lógicas de negócio

---

## 🔐 Regras de Negócio Importantes

- Usuários devem ser **maiores de 18 anos**
- Preferências usam **ENUMs e arrays**
- Não existe marketplace ou comissões
- Assinaturas possuem início e fim explícitos
- Dados sensíveis são isolados corretamente

---

## 🚀 Status do Projeto

🟡 **Em desenvolvimento ativo**

Próximos passos previstos:
- Geração do `schema.prisma`
- Criação das migrations
- Seed inicial (categorias, produtos, planos)
- Implementação da API
- Integração com gateway de pagamento

---

## 🧭 Visão de Futuro

Este projeto foi arquitetado para:
- Crescer sem reescrever o banco
- Integrar IA de recomendação
- Suportar múltiplos planos e campanhas
- Evoluir para automação logística e CRM

---

## 🧑‍💻 Autor

Projeto idealizado e desenvolvido como uma base sólida para um **Headshop moderno**, orientado por dados, experiência do usuário e boas práticas de engenharia de software.

---

> **Regra de ouro:**  
> Se algo não está documentado aqui ou no DOMAIN_REFERENCE.md, não é parte oficial do domínio.
