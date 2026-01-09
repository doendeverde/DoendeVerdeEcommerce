# 📦 Headshop Platform – Domain Entities Documentation (v1)

Este documento descreve **todas as entidades do projeto Headshop**, seus campos, responsabilidades, enums e relacionamentos.
Ele foi escrito para servir como **documentação técnica oficial** e como **fonte de contexto para o GitHub Copilot** (Prisma + PostgreSQL).

> **Escopo:** Headshop próprio (não marketplace). Venda pelo próprio site. Produtos físicos + assinaturas. Preferências do usuário.

---

## ✅ Checklist de Entidades (revisado)
A lista abaixo é o “índice” do domínio. Se algo existir no projeto e não estiver aqui, este doc deve ser atualizado.

### Identidade e Perfil
- [x] `User`
- [x] `UserPreferences`
- [x] `Address`

### Catálogo
- [x] `Category`
- [x] `Product`
- [x] `ProductImage`
- [x] `ProductVariant` (opcional, mas recomendado)
- [x] `ProductOption` / `ProductOptionValue` (opcional – para variantes)
- [x] `Tag` + `ProductTag` (opcional – filtros/SEO)

### Carrinho e Checkout
- [x] `Cart`
- [x] `CartItem`

### Pedidos e Entrega
- [x] `Order`
- [x] `OrderItem`
- [x] `OrderAddressSnapshot` (snapshot de endereço no momento do pedido)
- [x] `Shipment` (entrega/rastreio)

### Pagamentos
- [x] `Payment`
- [x] `Refund` (opcional, mas recomendado)

### Assinaturas
- [x] `SubscriptionPlan`
- [x] `Subscription`
- [x] `SubscriptionProduct` (join N:N plano ↔ produtos)
- [x] `SubscriptionCycle` (ciclos/renovações) (opcional, mas recomendado)

### Marketing e Experiência
- [x] `Coupon` (opcional)
- [x] `OrderDiscount` (opcional)
- [x] `Review` (opcional)

### Operação
- [x] `StockMovement` (opcional – auditoria de estoque)
- [x] `WebhookEvent` (opcional – auditoria de callbacks do provedor)

---

## 🧱 Convenções Gerais (Prisma/Postgres)

- **IDs**: UUID (`String @id @default(uuid())`)
- **Timestamps**: `createdAt`, `updatedAt`
- **Soft delete (opcional)**: `deletedAt`
- **Valores monetários**: `Decimal` (nunca float)
- **Enums**: usar enums para dados categóricos
- **Snapshot**: dados “mutáveis” (ex.: endereço) devem ser copiados para o pedido ao finalizar checkout

---

# 👤 Identidade e Perfil

## 1) User
Representa o usuário da plataforma (cliente).

### Campos (sugestão)
```ts
id              UUID (PK)
fullName        String
email           String (unique)
passwordHash    String
birthDate       Date
whatsapp        String
role            UserRole
status          UserStatus
createdAt       DateTime
updatedAt       DateTime
```

### Relacionamentos
- 1 → 1 `UserPreferences`
- 1 → N `Address`
- 1 → 1 `Cart` (recomendado)
- 1 → N `Order`
- 1 → N `Subscription`
- 1 → N `Review`

### Enums
```ts
enum UserRole { CUSTOMER ADMIN }
enum UserStatus { ACTIVE BLOCKED }
```

---

## 2) Address
Endereços cadastrados pelo usuário (para entrega).

```ts
id            UUID (PK)
userId        UUID (FK)
label         String?   // "Casa", "Trampo", etc.
street        String
number        String
complement    String?
district      String
city          String
state         String
postalCode    String
country       String
isDefault     Boolean
createdAt     DateTime
updatedAt     DateTime
```

Relacionamentos:
- N → 1 `User`

---

## 3) UserPreferences
Preferências detalhadas para personalização e recomendação.

```ts
id                      UUID (PK)
userId                  UUID (FK)

yearsSmoking            Int

rollingPaperPreference  RollingPaperType[]
rollingPaperSize        RollingPaperSize[]

paperFilterSize         PaperFilterSize[]
glassFilterSize         GlassFilterSize[]

consumptionFrequency    ConsumptionFrequency
consumptionMoment       ConsumptionMoment[]

likesAccessories        Boolean
likesCollectibles       Boolean
likesPremiumItems       Boolean

createdAt               DateTime
updatedAt               DateTime
```

Enums:
```ts
enum RollingPaperType { WHITE BROWN CELLULOSE MIXED }
enum RollingPaperSize { MINI KING_SIZE_SLIM KING_SIZE_TRADITIONAL KING_SIZE_LONG MIXED }
enum PaperFilterSize { SHORT MEDIUM LONG ULTRA_LONG MIXED }
enum GlassFilterSize { SHORT_2_4 MEDIUM_4_6 LONG_6_PLUS MIXED }
enum ConsumptionFrequency { OCCASIONAL WEEKLY DAILY HEAVY }
enum ConsumptionMoment { MORNING AFTERNOON NIGHT WEEKEND }
```

---

# 🛍️ Catálogo

## 4) Category
Categorias para filtros e organização.

```ts
id        UUID (PK)
name      String
slug      String (unique)
createdAt DateTime
updatedAt DateTime
```

Relacionamentos:
- 1 → N `Product`

---

## 5) Product
Produto físico base (o “pai” do catálogo).

```ts
id            UUID (PK)
name          String
slug          String (unique)
description   String
active        Boolean

basePrice     Decimal        // preço padrão (ou mínimo)
stockMode     StockMode      // SIMPLE ou VARIANT

categoryId    UUID (FK)

createdAt     DateTime
updatedAt     DateTime
```

Relacionamentos:
- N → 1 `Category`
- 1 → N `ProductImage`
- 1 → N `ProductVariant` (quando `stockMode=VARIANT`)
- N → N `Tag` via `ProductTag` (opcional)
- N → N `SubscriptionPlan` via `SubscriptionProduct` (opcional)

Enums:
```ts
enum StockMode { SIMPLE VARIANT }
```

---

## 6) ProductImage ✅ (estava faltando)
Imagens do produto (galeria).

```ts
id          UUID (PK)
productId   UUID (FK)
url         String
altText     String?
sortOrder   Int
createdAt   DateTime
```

Relacionamentos:
- N → 1 `Product`

---

## 7) ProductVariant (recomendado)
Variações como tamanho/cor/kit. Ajuda muito para estoque e precificação por variação.

```ts
id            UUID (PK)
productId     UUID (FK)
sku           String (unique)
name          String        // ex: "Piteira Longa", "Seda King Slim"
price         Decimal?
stock         Int
active        Boolean
createdAt     DateTime
updatedAt     DateTime
```

Relacionamentos:
- N → 1 `Product`
- (opcional) N → N `ProductOptionValue`

---

## 8) ProductOption / ProductOptionValue (opcional)
Modelagem flexível para variantes (“Tamanho”, “Cor”, “Material”).

### ProductOption
```ts
id          UUID (PK)
productId   UUID (FK)
name        String   // ex: "Tamanho"
createdAt   DateTime
```

### ProductOptionValue
```ts
id            UUID (PK)
optionId      UUID (FK)
value         String  // ex: "Longa"
createdAt     DateTime
```

---

## 9) Tag / ProductTag (opcional)
Melhora filtros e SEO.

### Tag
```ts
id        UUID (PK)
name      String
slug      String (unique)
```

### ProductTag (join)
```ts
productId UUID (FK)
tagId     UUID (FK)
```

---

# 🛒 Carrinho e Checkout

## 10) Cart
Carrinho do usuário (persistente).

```ts
id          UUID (PK)
userId      UUID (FK, unique)
status      CartStatus
createdAt   DateTime
updatedAt   DateTime
```

Enums:
```ts
enum CartStatus { ACTIVE ABANDONED CONVERTED }
```

---

## 11) CartItem
Itens do carrinho.

```ts
id            UUID (PK)
cartId        UUID (FK)
productId     UUID (FK)
variantId     UUID? (FK)    // opcional se houver variantes
quantity      Int
unitPrice     Decimal       // preço capturado no momento
createdAt     DateTime
updatedAt     DateTime
```

---

# 📦 Pedidos e Entrega

## 12) Order
Pedido finalizado.

```ts
id              UUID (PK)
userId          UUID (FK)

status          OrderStatus
subtotalAmount  Decimal
discountAmount  Decimal
shippingAmount  Decimal
totalAmount     Decimal

currency        String      // "BRL"
notes           String?

createdAt       DateTime
updatedAt       DateTime
```

Relacionamentos:
- N → 1 `User`
- 1 → N `OrderItem`
- 1 → 1 `OrderAddressSnapshot`
- 1 → N `Payment`
- 1 → N `Shipment`
- 1 → N `OrderDiscount` (opcional)
- 1 → N `Refund` (opcional)

Enum:
```ts
enum OrderStatus { PENDING PAID CANCELED SHIPPED DELIVERED }
```

---

## 13) OrderItem
Itens do pedido (snapshot de produto/variante).

```ts
id            UUID (PK)
orderId       UUID (FK)

productId     UUID (FK)
variantId     UUID? (FK)

title         String        // snapshot do nome
sku           String?       // snapshot
quantity      Int
unitPrice     Decimal
totalPrice    Decimal

createdAt     DateTime
```

---

## 14) OrderAddressSnapshot (recomendado)
Snapshot do endereço no momento do checkout.
> Não deve “apontar” para Address diretamente como fonte de verdade do pedido.

```ts
id          UUID (PK)
orderId     UUID (FK, unique)

fullName    String
whatsapp    String

street      String
number      String
complement  String?
district    String
city        String
state       String
postalCode  String
country     String

createdAt   DateTime
```

---

## 15) Shipment
Entrega/rastreio (pode haver mais de uma entrega por pedido).

```ts
id              UUID (PK)
orderId         UUID (FK)

carrier         String?      // correios, jadlog, etc
trackingCode    String?
status          ShipmentStatus

shippedAt       DateTime?
deliveredAt     DateTime?

createdAt       DateTime
updatedAt       DateTime
```

Enum:
```ts
enum ShipmentStatus { PENDING LABEL_CREATED IN_TRANSIT DELIVERED LOST RETURNED }
```

---

# 💳 Pagamentos

## 16) Payment
Pagamento associado a um pedido.

```ts
id              UUID (PK)
orderId         UUID (FK)

provider        PaymentProvider
status          PaymentStatus

amount          Decimal
transactionId   String?
payload         Json?         // resposta do gateway, se quiser salvar

createdAt       DateTime
updatedAt       DateTime
```

Enums:
```ts
enum PaymentProvider { MERCADO_PAGO STRIPE MANUAL }
enum PaymentStatus { PENDING PAID FAILED REFUNDED }
```

---

## 17) Refund (opcional, recomendado)
Reembolsos de pagamentos.

```ts
id              UUID (PK)
paymentId        UUID (FK)
orderId          UUID (FK)

amount           Decimal
reason           String?
providerRefundId String?

createdAt        DateTime
```

---

# 🔁 Assinaturas

## 18) SubscriptionPlan
Plano de assinatura (mensal).

```ts
id            UUID (PK)
name          String
slug          String (unique)
description   String

price         Decimal
billingCycle  BillingCycle
active        Boolean

createdAt     DateTime
updatedAt     DateTime
```

Enum:
```ts
enum BillingCycle { MONTHLY }
```

---

## 19) Subscription
Assinatura do usuário.

```ts
id                UUID (PK)
userId            UUID (FK)
planId            UUID (FK)

status            SubscriptionStatus
startedAt         DateTime
nextBillingAt     DateTime
canceledAt        DateTime?

provider          PaymentProvider?
providerSubId     String?

createdAt         DateTime
updatedAt         DateTime
```

Enum:
```ts
enum SubscriptionStatus { ACTIVE PAUSED CANCELED }
```

---

## 20) SubscriptionProduct (join) ✅ importante
Relaciona produtos que compõem um plano de assinatura (bundles).

```ts
planId     UUID (FK)
productId  UUID (FK)
quantity   Int
```

> Se quiser granularidade por variante, pode adicionar `variantId` opcional.

---

## 21) SubscriptionCycle (opcional, recomendado)
Registra cada ciclo/renovação (tipo “fatura” interna da assinatura).

```ts
id              UUID (PK)
subscriptionId  UUID (FK)

cycleStart      DateTime
cycleEnd        DateTime

status          CycleStatus
amount          Decimal
paymentId       UUID? (FK)

createdAt       DateTime
```

Enum:
```ts
enum CycleStatus { PENDING PAID FAILED SKIPPED }
```

---

# 🧩 Marketing e Experiência (opcionais)

## 22) Coupon
Cupom de desconto.

```ts
id            UUID (PK)
code          String (unique)
type          DiscountType
value         Decimal
active        Boolean
startsAt      DateTime?
endsAt        DateTime?
usageLimit    Int?
usedCount     Int
createdAt     DateTime
```

Enums:
```ts
enum DiscountType { PERCENT FIXED }
```

---

## 23) OrderDiscount
Aplicação de desconto no pedido.

```ts
id          UUID (PK)
orderId     UUID (FK)
couponId    UUID? (FK)
type        DiscountType
amount      Decimal
createdAt   DateTime
```

---

## 24) Review
Avaliação de produto (pós-compra).

```ts
id          UUID (PK)
userId      UUID (FK)
productId   UUID (FK)
rating      Int          // 1..5
comment     String?
createdAt   DateTime
```

---

# 🧰 Operação (opcionais)

## 25) StockMovement
Auditoria de alterações de estoque (bom para suporte/controle).

```ts
id          UUID (PK)
productId   UUID (FK)
variantId   UUID? (FK)

type        StockMovementType
quantity    Int
reason      String?
createdAt   DateTime
```

Enum:
```ts
enum StockMovementType { IN OUT ADJUSTMENT }
```

---

## 26) WebhookEvent
Registro de webhooks recebidos (Mercado Pago/Stripe).

```ts
id          UUID (PK)
provider    PaymentProvider
eventType   String
externalId  String?
payload     Json
processed   Boolean
createdAt   DateTime
```

---

# ✅ Regras Importantes para Implementação

1. **Snapshot no pedido:** Endereço do pedido deve ser congelado em `OrderAddressSnapshot`.
2. **Preço capturado:** `CartItem.unitPrice` e `OrderItem.unitPrice` devem guardar o valor no momento da compra.
3. **Estoque:** Pode ser simples (`Product.stock`) ou por variante (`ProductVariant.stock`).
4. **Assinatura:** `SubscriptionCycle` facilita cobrança recorrente, reprocessamento e histórico.
5. **Integridade:** use `onDelete` e índices para performance (`slug`, `email`, `code`, `sku`).

---

# 🤖 Como usar este arquivo com GitHub Copilot

Recomendado colocar em:
- `/docs/DOMAIN_ENTITIES_HEADSHOP.md` **ou**
- raiz do projeto como `DOMAIN_ENTITIES_HEADSHOP.md`

O Copilot usará este conteúdo como contexto para:
- gerar `schema.prisma`
- criar migrations
- criar DTOs/types
- criar seeds e services
- estruturar endpoints

---

# 🔍 Revisão Final (antes de gerar schema.prisma)

Se você pretende suportar no MVP:
- **Produtos com variações** → manter `ProductVariant`
- **Carrinho persistente** → manter `Cart` e `CartItem`
- **Entrega e rastreio** → manter `Shipment`
- **Endereço congelado no pedido** → manter `OrderAddressSnapshot`
- **Assinatura com histórico** → manter `SubscriptionCycle`

Se não for usar algo agora, pode desativar opcionalmente (Coupon, Review, StockMovement, WebhookEvent).

---

**Fim do documento.**
