/**
 * User Service
 * 
 * Handles business logic for user-related operations.
 * Used by dashboard, profile, and orders pages.
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Re-export Decimal type from Prisma for use in other files
type Decimal = Prisma.Decimal;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserDashboardData {
  user: {
    id: string;
    fullName: string;
    email: string;
    _count: {
      orders: number;
      subscriptions: number;
      addresses: number;
    };
  } | null;
  recentOrders: RecentOrder[];
  activeSubscriptions: ActiveSubscription[];
}

export interface RecentOrder {
  id: string;
  status: string;
  totalAmount: Decimal;
  createdAt: Date;
  payments: {
    id: string;
    status: string;
    provider: string;
  }[];
  shipments: {
    id: string;
    status: string;
    trackingCode: string | null;
  }[];
}

export interface ActiveSubscription {
  id: string;
  status: string;
  nextBillingAt: Date | null;
  plan: {
    id: string;
    name: string;
    price: Decimal;
    billingCycle: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  birthDate: Date | null;
  whatsapp: string | null;
  status: string;
  createdAt: Date;
  profile: {
    phone: string | null;
    document: string | null;
  } | null;
  preferences: {
    id: string;
  } | null;
  addresses: {
    id: string;
    label: string | null;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }[];
}

export interface UserOrder {
  id: string;
  status: string;
  totalAmount: Decimal;
  subtotalAmount: Decimal;
  shippingAmount: Decimal;
  discountAmount: Decimal;
  createdAt: Date;
  items: {
    id: string;
    quantity: number;
    unitPrice: Decimal;
    totalPrice: Decimal;
    product: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  payments: {
    id: string;
    status: string;
    provider: string;
    amount: Decimal;
  }[];
  shipments: {
    id: string;
    status: string;
    carrier: string | null;
    trackingCode: string | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
  }[];
  addressSnapshot: {
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get user dashboard data including stats, recent orders, and active subscriptions
 */
export async function getUserDashboardData(userId: string): Promise<UserDashboardData> {
  const [user, recentOrders, activeSubscriptions] = await Promise.all([
    // User with counts
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        _count: {
          select: {
            orders: true,
            subscriptions: true,
            addresses: true,
          },
        },
      },
    }),

    // Recent orders
    prisma.order.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        payments: {
          select: {
            id: true,
            status: true,
            provider: true,
          },
        },
        shipments: {
          select: {
            id: true,
            status: true,
            trackingCode: true,
          },
        },
      },
    }),

    // Active subscriptions
    prisma.subscription.findMany({
      where: {
        userId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        status: true,
        nextBillingAt: true,
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            billingCycle: true,
          },
        },
      },
    }),
  ]);

  return {
    user,
    recentOrders,
    activeSubscriptions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get user profile with addresses and preferences
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      birthDate: true,
      whatsapp: true,
      status: true,
      createdAt: true,
      profile: {
        select: {
          phone: true,
          document: true,
        },
      },
      preferences: {
        select: {
          id: true,
        },
      },
      addresses: {
        orderBy: { isDefault: "desc" },
        select: {
          id: true,
          label: true,
          street: true,
          number: true,
          complement: true,
          neighborhood: true,
          city: true,
          state: true,
          zipCode: true,
          isDefault: true,
        },
      },
    },
  });

  return user;
}

/**
 * Update user profile information
 */
export async function updateUserProfile(
  userId: string,
  data: {
    fullName?: string;
    whatsapp?: string;
    phone?: string;
  }
): Promise<UserProfile | null> {
  const { phone, ...userData } = data;

  // Update user and profile in transaction
  await prisma.$transaction(async (tx) => {
    if (userData.fullName || userData.whatsapp) {
      await tx.user.update({
        where: { id: userId },
        data: userData,
      });
    }

    if (phone !== undefined) {
      await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          phone,
        },
        update: { phone },
      });
    }
  });

  return getUserProfile(userId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Orders Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all user orders with full details
 */
export async function getUserOrders(userId: string): Promise<UserOrder[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      subtotalAmount: true,
      shippingAmount: true,
      discountAmount: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          status: true,
          provider: true,
          amount: true,
        },
      },
      shipments: {
        select: {
          id: true,
          status: true,
          carrier: true,
          trackingCode: true,
          shippedAt: true,
          deliveredAt: true,
        },
      },
      addressSnapshot: {
        select: {
          street: true,
          number: true,
          complement: true,
          neighborhood: true,
          city: true,
          state: true,
          zipCode: true,
        },
      },
    },
  });

  return orders;
}

/**
 * Get a single order by ID (with ownership validation)
 */
export async function getUserOrderById(
  userId: string,
  orderId: string
): Promise<UserOrder | null> {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId, // Ensures user owns this order
    },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      subtotalAmount: true,
      shippingAmount: true,
      discountAmount: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          status: true,
          provider: true,
          amount: true,
        },
      },
      shipments: {
        select: {
          id: true,
          status: true,
          carrier: true,
          trackingCode: true,
          shippedAt: true,
          deliveredAt: true,
        },
      },
      addressSnapshot: {
        select: {
          street: true,
          number: true,
          complement: true,
          neighborhood: true,
          city: true,
          state: true,
          zipCode: true,
        },
      },
    },
  });

  return order;
}

// ─────────────────────────────────────────────────────────────────────────────
// Full Profile with Preferences (for profile page)
// ─────────────────────────────────────────────────────────────────────────────

export interface FullUserProfile extends UserProfile {
  preferences: {
    id: string;
    yearsSmoking: number | null;
    favoritePaperType: string | null;
    favoritePaperSize: string | null;
    paperFilterSize: string | null;
    glassFilterSize: string | null;
    glassFilterThickness: string | null;
    favoriteColors: string[];
    tobaccoUsage: string | null;
    consumptionFrequency: string | null;
    consumptionMoment: string[];
    consumesFlower: boolean;
    consumesSkunk: boolean;
    consumesHash: boolean;
    consumesExtracts: boolean;
    consumesOilEdibles: boolean;
    likesAccessories: boolean;
    likesCollectibles: boolean;
    likesPremiumItems: boolean;
    notes: string | null;
  } | null;
  activeSubscription: {
    id: string;
    plan: {
      name: string;
    };
  } | null;
}

/**
 * Get user full profile with preferences, addresses and active subscription
 */
export async function getUserFullProfile(userId: string): Promise<FullUserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      birthDate: true,
      whatsapp: true,
      status: true,
      createdAt: true,
      profile: {
        select: {
          phone: true,
          document: true,
        },
      },
      preferences: {
        select: {
          id: true,
          yearsSmoking: true,
          favoritePaperType: true,
          favoritePaperSize: true,
          paperFilterSize: true,
          glassFilterSize: true,
          glassFilterThickness: true,
          favoriteColors: true,
          tobaccoUsage: true,
          consumptionFrequency: true,
          consumptionMoment: true,
          consumesFlower: true,
          consumesSkunk: true,
          consumesHash: true,
          consumesExtracts: true,
          consumesOilEdibles: true,
          likesAccessories: true,
          likesCollectibles: true,
          likesPremiumItems: true,
          notes: true,
        },
      },
      addresses: {
        orderBy: { isDefault: "desc" },
        select: {
          id: true,
          label: true,
          street: true,
          number: true,
          complement: true,
          neighborhood: true,
          city: true,
          state: true,
          zipCode: true,
          isDefault: true,
        },
      },
      subscriptions: {
        where: { status: "ACTIVE" },
        take: 1,
        select: {
          id: true,
          plan: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  return {
    ...user,
    activeSubscription: user.subscriptions[0] || null,
  };
}

/**
 * Get user orders with product images
 */
export async function getUserOrdersWithImages(userId: string): Promise<UserOrderWithImages[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      subtotalAmount: true,
      shippingAmount: true,
      discountAmount: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                take: 1,
                select: {
                  url: true,
                },
              },
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          status: true,
          provider: true,
          amount: true,
          transactionId: true,
          pixQrCode: true,
          pixQrCodeBase64: true,
          pixTicketUrl: true,
          pixExpiresAt: true,
        },
      },
      shipments: {
        select: {
          id: true,
          status: true,
          carrier: true,
          trackingCode: true,
          shippedAt: true,
          deliveredAt: true,
        },
      },
      addressSnapshot: {
        select: {
          street: true,
          number: true,
          complement: true,
          neighborhood: true,
          city: true,
          state: true,
          zipCode: true,
        },
      },
    },
  });

  return orders;
}

export interface UserOrderWithImages {
  id: string;
  status: string;
  totalAmount: Decimal;
  subtotalAmount: Decimal;
  shippingAmount: Decimal;
  discountAmount: Decimal;
  createdAt: Date;
  items: {
    id: string;
    quantity: number;
    unitPrice: Decimal;
    totalPrice: Decimal;
    product: {
      id: string;
      name: string;
      slug: string;
      images: { url: string }[];
    };
  }[];
  payments: {
    id: string;
    status: string;
    provider: string;
    amount: Decimal;
    transactionId: string | null;
    pixQrCode: string | null;
    pixQrCodeBase64: string | null;
    pixTicketUrl: string | null;
    pixExpiresAt: Date | null;
  }[];
  shipments: {
    id: string;
    status: string;
    carrier: string | null;
    trackingCode: string | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
  }[];
  addressSnapshot: {
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Export service object for convenient imports
// ─────────────────────────────────────────────────────────────────────────────

export const userService = {
  // Dashboard
  getUserDashboardData,
  
  // Profile
  getUserProfile,
  getUserFullProfile,
  updateUserProfile,
  
  // Orders
  getUserOrders,
  getUserOrderById,
  getUserOrdersWithImages,
};
