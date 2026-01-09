
# Domain Reference – Headshop E-commerce + Subscriptions

This document defines the business domain. Use it as a **source of truth** when generating Prisma schema, APIs and frontend logic.

## Core Concepts
- Direct e-commerce (no marketplace)
- Subscription-based personalized kits
- Strong user preferences driving product composition

## Entities Overview
USER: Authentication & legal identity  
USER_PROFILE: Complementary user info  
USER_PREFERENCES: Smoking & product preferences  
ADDRESS: Delivery addresses  
CATEGORY: Product classification  
PRODUCT: Sellable items  
SUBSCRIPTION_PLAN: Recurring plans  
USER_SUBSCRIPTION: Active user plans  
ORDER: Purchases  
PAYMENT: Financial transactions  
SHIPMENT: Logistics

## Important Rules
- Users must be 18+
- Preferences are enums or arrays
- Subscriptions have explicit end dates
- No duplicated user data

## Prisma Guidelines
- Use enums for preference fields
- Use relations with cascade where applicable
- Index user_id and foreign keys
- Prefer JSON/ARRAY for multi-select fields

This domain is optimized for scalability, analytics and future AI personalization.
