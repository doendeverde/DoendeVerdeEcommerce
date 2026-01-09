---
applyTo: "**"
---

# 🧠 Project Context — Headshop E-commerce + Subscriptions Platform

This project is a **custom Headshop e-commerce platform** with **recurring subscriptions**, focused on **deep user personalization**.
There is **NO marketplace**, **NO sellers**, and **NO commissions**.  
All sales are **first-party**, owned by the platform.

The system supports:
- Physical products
- Subscription plans
- Personalized kits based on user preferences
- Recurring billing (credit card)
- Full order, payment, and shipment flow

This file defines **architecture rules, coding standards, naming conventions, and business logic expectations**.
GitHub Copilot MUST always follow these instructions.

---

## 🏗️ Tech Stack (MANDATORY)

- **Frontend:** Next.js (App Router)
- **Language:** TypeScript (strict mode)
- **Backend:** API Routes / Server Actions
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** JWT / Session-based (implementation flexible)
- **Payments:** External gateway (e.g. Mercado Pago)
- **Styling:** Component-based (MUI / Tailwind or equivalent)
- **Architecture:** Clean, modular, scalable

---

## 🧩 Architectural Principles

### 1. Clean Architecture
- Clear separation of concerns:
  - `domain` → business rules
  - `services` → orchestration & logic
  - `repositories` → database access (Prisma)
  - `api` → transport layer
- No business logic inside controllers/routes.
- No direct Prisma calls inside UI components.

### 2. Predictability Over Cleverness
- Prefer explicit, readable code.
- Avoid overengineering.
- Favor maintainability over micro-optimizations.

### 3. Single Source of Truth
- Enums defined once and reused everywhere.
- Business rules centralized.
- No duplicated validation logic.

---

## 🗄️ Database & Prisma Rules

### General
- Every model:
  - Uses `id String @id @default(uuid())`
  - Has `createdAt` and `updatedAt`
- All relations are explicit.
- No implicit magic relations.

### Naming
- Models: `PascalCase`
- Fields: `snake_case` in DB, `camelCase` in code
- Enums: `UPPER_SNAKE_CASE`

### Required Core Models
Copilot MUST assume the existence of:

- `User`
- `UserProfile`
- `UserPreferences`
- `Address`
- `Category`
- `Product`
- `ProductImage`
- `SubscriptionPlan`
- `SubscriptionPlanItem`
- `UserSubscription`
- `Order`
- `OrderItem`
- `Payment`
- `Shipment`

### User Preferences Are CRITICAL
`UserPreferences` drives:
- Subscription personalization
- Product recommendations
- Kit composition

Copilot must NEVER simplify or flatten preferences.

---

## 🧠 Business Rules (VERY IMPORTANT)

### Users
- Must be **18+** (birth_date validation)
- Can have multiple addresses
- Can have multiple orders
- Can have only ONE active subscription per plan

### Subscriptions
- Are recurring
- Can be `ACTIVE`, `PAUSED`, `CANCELED`, or `EXPIRED`
- Generate orders automatically
- Next billing date must always be calculated, never hardcoded

### Products
- Can be:
  - One-time purchase
  - Subscription item
- Stock must be validated before order confirmation

### Orders
- Can originate from:
  - One-time purchase
  - Subscription cycle
- Orders are immutable after payment confirmation

---

## 🧪 Validation & Error Handling

- Use Zod (or equivalent) for input validation
- Never trust frontend input
- Always return meaningful error messages
- Prefer domain-level validation over UI-level validation

---

## 🧱 Frontend Guidelines

- Components must be:
  - Small
  - Reusable
  - Stateless when possible
- Business logic NEVER lives in components
- Use hooks for orchestration, not logic
- Avoid deeply nested components

---

## 🔐 Security Rules

- Never expose internal IDs directly
- Sensitive fields never returned by default:
  - password_hash
  - internal payment identifiers
- Always validate ownership (user ↔ resource)

---

## 📦 Folder Structure (REFERENCE)

src/
├─ app/
├─ domain/
├─ services/
├─ repositories/
├─ lib/
├─ schemas/
├─ types/
└─ utils/

Copilot should respect this structure when creating files.

---

## 🧠 How Copilot Should Think

When generating code, Copilot MUST:
1. Understand the business domain
2. Respect personalization logic
3. Prefer clarity over brevity
4. Follow Prisma best practices
5. Avoid shortcuts that break scalability
6. Assume this project will grow

Copilot should act as a **senior engineer**, not a code generator.

---

## 🚫 What NOT To Do

- Do NOT assume marketplace logic
- Do NOT introduce sellers or commissions
- Do NOT flatten user preferences
- Do NOT write logic inside React components
- Do NOT bypass Prisma relations
- Do NOT generate undocumented magic behavior

---

## ✅ Final Rule

If something is ambiguous:
👉 Prefer **explicit, extensible, and well-documented solutions**.

This project values **long-term maintainability over speed**.
