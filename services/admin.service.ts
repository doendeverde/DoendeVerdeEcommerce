import { prisma } from "@/lib/prisma";
import { OrderStatus, ProductStatus, UserStatus, PaymentStatus } from "@prisma/client";

// ===============================
// TYPES
// ===============================

export interface DashboardStats {
  totalOrders: number;
  ordersThisMonth: number;
  ordersLastMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalUsers: number;
  usersThisMonth: number;
  usersLastMonth: number;
}

export interface RecentOrder {
  id: string;
  createdAt: Date;
  status: OrderStatus;
  totalAmount: number;
  user: {
    fullName: string;
    email: string;
  };
  itemCount: number;
}

export interface TopProduct {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  totalSold: number;
  totalRevenue: number;
}

export interface AdminProductFilters {
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  page?: number;
  pageSize?: number;
}

export interface AdminOrderFilters {
  search?: string;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface AdminUserFilters {
  search?: string;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}

// ===============================
// DASHBOARD STATS
// ===============================

async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Parallel queries for performance
  const [
    totalOrders,
    ordersThisMonth,
    ordersLastMonth,
    revenueThisMonth,
    revenueLastMonth,
    totalProducts,
    activeProducts,
    lowStockProducts,
    totalUsers,
    usersThisMonth,
    usersLastMonth,
    totalRevenueResult,
  ] = await Promise.all([
    // Total orders (paid or delivered)
    prisma.order.count({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
      },
    }),
    // Orders this month
    prisma.order.count({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        createdAt: { gte: firstDayThisMonth },
      },
    }),
    // Orders last month
    prisma.order.count({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        createdAt: {
          gte: firstDayLastMonth,
          lte: lastDayLastMonth,
        },
      },
    }),
    // Revenue this month
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        createdAt: { gte: firstDayThisMonth },
      },
    }),
    // Revenue last month
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        createdAt: {
          gte: firstDayLastMonth,
          lte: lastDayLastMonth,
        },
      },
    }),
    // Total products
    prisma.product.count(),
    // Active products
    prisma.product.count({
      where: {
        status: ProductStatus.ACTIVE,
        isPublished: true,
      },
    }),
    // Low stock products (using raw query for field comparison)
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM "Product" 
      WHERE status = 'ACTIVE' 
      AND stock <= "lowStockAlert"
    `.then(result => Number(result[0]?.count || 0)).catch(() => 0),
    // Total users
    prisma.user.count(),
    // Users this month
    prisma.user.count({
      where: {
        createdAt: { gte: firstDayThisMonth },
      },
    }),
    // Users last month
    prisma.user.count({
      where: {
        createdAt: {
          gte: firstDayLastMonth,
          lte: lastDayLastMonth,
        },
      },
    }),
    // Total revenue
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
      },
    }),
  ]);

  return {
    totalOrders,
    ordersThisMonth,
    ordersLastMonth,
    totalRevenue: totalRevenueResult._sum?.totalAmount?.toNumber() ?? 0,
    revenueThisMonth: revenueThisMonth._sum?.totalAmount?.toNumber() ?? 0,
    revenueLastMonth: revenueLastMonth._sum?.totalAmount?.toNumber() ?? 0,
    totalProducts,
    activeProducts,
    lowStockProducts: typeof lowStockProducts === 'number' ? lowStockProducts : 0,
    totalUsers,
    usersThisMonth,
    usersLastMonth,
  };
}

// ===============================
// RECENT ORDERS
// ===============================

async function getRecentOrders(limit = 10): Promise<RecentOrder[]> {
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      createdAt: true,
      status: true,
      totalAmount: true,
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return orders.map((order) => ({
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    totalAmount: order.totalAmount.toNumber(),
    user: order.user,
    itemCount: order._count.items,
  }));
}

// ===============================
// TOP PRODUCTS
// ===============================

async function getTopProducts(limit = 5): Promise<TopProduct[]> {
  const result = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: {
      quantity: true,
      totalPrice: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: limit,
  });

  const productIds = result.map((r) => r.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      images: {
        select: { url: true },
        take: 1,
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  return result.map((r) => {
    const product = productMap.get(r.productId);
    return {
      id: r.productId,
      name: product?.name || "Produto removido",
      slug: product?.slug || "",
      imageUrl: product?.images[0]?.url || null,
      totalSold: r._sum.quantity || 0,
      totalRevenue: r._sum.totalPrice?.toNumber() || 0,
    };
  });
}

// ===============================
// PRODUCTS CRUD
// ===============================

interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  basePrice: number;
  stock: number;
  lowStockAlert: number;
  isLowStock: boolean;
  categoryId: string;
  categoryName: string;
  imageUrl: string | null;
  createdAt: Date;
}

interface ProductsPaginated {
  products: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function getProducts(filters: AdminProductFilters = {}): Promise<ProductsPaginated> {
  const { search, categoryId, status, page = 1, pageSize = 20 } = filters;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (status) {
    where.status = status;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        basePrice: true,
        stock: true,
        lowStockAlert: true,
        categoryId: true,
        category: {
          select: { name: true },
        },
        images: {
          select: { url: true },
          take: 1,
          orderBy: { displayOrder: "asc" },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      basePrice: p.basePrice.toNumber(),
      stock: p.stock,
      lowStockAlert: p.lowStockAlert,
      isLowStock: p.stock <= p.lowStockAlert,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      imageUrl: p.images[0]?.url || null,
      createdAt: p.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  displayOrder: number;
  isPrimary: boolean;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockAlert: number;
  status: ProductStatus;
  isPublished: boolean;
  categoryId: string;
  loyaltyPoints: number;
  images: ProductImage[];
  createdAt: Date;
  updatedAt: Date;
}

async function getProductById(id: string): Promise<ProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: product.basePrice.toNumber(),
    compareAtPrice: product.compareAtPrice?.toNumber() ?? null,
    stock: product.stock,
    lowStockAlert: product.lowStockAlert,
    status: product.status,
    isPublished: product.isPublished,
    categoryId: product.categoryId,
    loyaltyPoints: product.loyaltyPoints,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      displayOrder: img.displayOrder,
      isPrimary: img.isPrimary,
    })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

interface CreateProductInput {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number;
  stock: number;
  lowStockAlert?: number;
  status?: ProductStatus;
  isPublished?: boolean;
  categoryId: string;
  loyaltyPoints?: number;
  images?: { url: string; altText?: string }[];
}

async function createProduct(data: CreateProductInput): Promise<ProductDetail> {
  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      basePrice: data.basePrice,
      compareAtPrice: data.compareAtPrice,
      stock: data.stock,
      lowStockAlert: data.lowStockAlert ?? 5,
      status: data.status ?? ProductStatus.DRAFT,
      isPublished: data.isPublished ?? false,
      categoryId: data.categoryId,
      loyaltyPoints: data.loyaltyPoints ?? 0,
      images: data.images
        ? {
            create: data.images.map((img, index) => ({
              url: img.url,
              altText: img.altText,
              displayOrder: index,
            })),
          }
        : undefined,
    },
    include: {
      images: true,
    },
  });

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: product.basePrice.toNumber(),
    compareAtPrice: product.compareAtPrice?.toNumber() ?? null,
    stock: product.stock,
    lowStockAlert: product.lowStockAlert,
    status: product.status,
    isPublished: product.isPublished,
    categoryId: product.categoryId,
    loyaltyPoints: product.loyaltyPoints,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      displayOrder: img.displayOrder,
      isPrimary: img.isPrimary,
    })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

interface UpdateProductInput {
  name?: string;
  slug?: string;
  description?: string;
  basePrice?: number;
  compareAtPrice?: number | null;
  stock?: number;
  lowStockAlert?: number;
  status?: ProductStatus;
  isPublished?: boolean;
  categoryId?: string;
  loyaltyPoints?: number;
  images?: { url: string; altText?: string }[];
}

async function updateProduct(id: string, data: UpdateProductInput): Promise<ProductDetail | null> {
  // Check if product exists
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return null;

  // Update product with images replacement if provided
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      basePrice: data.basePrice,
      compareAtPrice: data.compareAtPrice,
      stock: data.stock,
      lowStockAlert: data.lowStockAlert,
      status: data.status,
      isPublished: data.isPublished,
      categoryId: data.categoryId,
      loyaltyPoints: data.loyaltyPoints,
      ...(data.images && {
        images: {
          deleteMany: {},
          create: data.images.map((img, index) => ({
            url: img.url,
            altText: img.altText,
            displayOrder: index,
          })),
        },
      }),
    },
    include: {
      images: true,
    },
  });

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: product.basePrice.toNumber(),
    compareAtPrice: product.compareAtPrice?.toNumber() ?? null,
    stock: product.stock,
    lowStockAlert: product.lowStockAlert,
    status: product.status,
    isPublished: product.isPublished,
    categoryId: product.categoryId,
    loyaltyPoints: product.loyaltyPoints,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      displayOrder: img.displayOrder,
      isPrimary: img.isPrimary,
    })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

async function deleteProduct(id: string): Promise<boolean> {
  // Check if product exists
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return false;

  // Hard delete the product and related images (cascade)
  await prisma.product.delete({ where: { id } });

  return true;
}

// ===============================
// ORDERS
// ===============================

interface OrderListItem {
  id: string;
  createdAt: Date;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface OrdersPaginated {
  orders: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function getOrders(filters: AdminOrderFilters = {}): Promise<OrdersPaginated> {
  const { search, status, startDate, endDate, page = 1, pageSize = 20 } = filters;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (search) {
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { user: { fullName: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: startDate };
  }

  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: endDate };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        status: true,
        totalAmount: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      status: o.status,
      totalAmount: o.totalAmount.toNumber(),
      itemCount: o._count.items,
      user: o.user,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

interface OrderItemDetail {
  id: string;
  title: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string | null;
  product: {
    name: string;
    slug: string;
  };
}

interface PaymentDetail {
  id: string;
  status: PaymentStatus;
  provider: string;
  transactionId: string | null;
  amount: number;
}

interface ShipmentDetail {
  id: string;
  status: string;
  carrier: string | null;
  trackingCode: string | null;
}

interface OrderDetail {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: OrderStatus;
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  currency: string;
  notes: string | null;
  user: {
    id: string;
    fullName: string;
    email: string;
    whatsapp: string | null;
  };
  addressSnapshot: {
    fullName: string;
    whatsapp: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | null;
  items: OrderItemDetail[];
  payments: PaymentDetail[];
  shipments: ShipmentDetail[];
}

async function getOrderById(id: string): Promise<OrderDetail | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          whatsapp: true,
        },
      },
      addressSnapshot: true,
      items: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              images: {
                take: 1,
                orderBy: { displayOrder: "asc" },
              },
            },
          },
        },
      },
      payments: true,
      shipments: true,
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    status: order.status,
    subtotalAmount: order.subtotalAmount.toNumber(),
    discountAmount: order.discountAmount.toNumber(),
    shippingAmount: order.shippingAmount.toNumber(),
    totalAmount: order.totalAmount.toNumber(),
    currency: order.currency,
    notes: order.notes,
    user: order.user,
    addressSnapshot: order.addressSnapshot
      ? {
          fullName: order.addressSnapshot.fullName,
          whatsapp: order.addressSnapshot.whatsapp,
          street: order.addressSnapshot.street,
          number: order.addressSnapshot.number,
          complement: order.addressSnapshot.complement,
          neighborhood: order.addressSnapshot.neighborhood,
          city: order.addressSnapshot.city,
          state: order.addressSnapshot.state,
          zipCode: order.addressSnapshot.zipCode,
          country: order.addressSnapshot.country,
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      title: item.title,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
      totalPrice: item.totalPrice.toNumber(),
      imageUrl: item.product?.images[0]?.url ?? null,
      product: {
        name: item.product?.name ?? "Produto removido",
        slug: item.product?.slug ?? "",
      },
    })),
    payments: order.payments.map((p) => ({
      id: p.id,
      status: p.status,
      provider: p.provider,
      transactionId: p.transactionId,
      amount: p.amount.toNumber(),
    })),
    shipments: order.shipments.map((s) => ({
      id: s.id,
      status: s.status,
      carrier: s.carrier,
      trackingCode: s.trackingCode,
    })),
  };
}

async function updateOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return false;

  await prisma.order.update({
    where: { id },
    data: { status },
  });

  return true;
}

// ===============================
// USERS
// ===============================

interface UserListItem {
  id: string;
  fullName: string;
  email: string;
  status: UserStatus;
  role: string;
  createdAt: Date;
  ordersCount: number;
  totalSpent: number;
}

interface UsersPaginated {
  users: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function getUsers(filters: AdminUserFilters = {}): Promise<UsersPaginated> {
  const { search, status, page = 1, pageSize = 20 } = filters;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        role: true,
        createdAt: true,
        orders: {
          where: {
            status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
          },
          select: {
            totalAmount: true,
          },
        },
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      status: u.status,
      role: u.role,
      createdAt: u.createdAt,
      ordersCount: u._count.orders,
      totalSpent: u.orders.reduce((sum, o) => sum + o.totalAmount.toNumber(), 0),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  status: UserStatus;
  role: string;
  birthDate: Date | null;
  whatsapp: string | null;
  createdAt: Date;
}

async function getUserById(id: string): Promise<UserDetail | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      role: true,
      birthDate: true,
      whatsapp: true,
      createdAt: true,
    },
  });

  return user;
}

interface UserFullDetail {
  id: string;
  fullName: string;
  email: string;
  status: UserStatus;
  role: string;
  birthDate: Date | null;
  whatsapp: string | null;
  createdAt: Date;
  updatedAt: Date;
  orders: {
    id: string;
    createdAt: Date;
    status: OrderStatus;
    totalAmount: number;
    itemsCount: number;
  }[];
  subscriptions: {
    id: string;
    status: string;
    startedAt: Date;
    canceledAt: Date | null;
    nextBillingAt: Date | null;
    plan: {
      id: string;
      name: string;
      price: number;
    };
  }[];
  addresses: {
    id: string;
    label: string | null;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }[];
  totals: {
    ordersCount: number;
    totalSpent: number;
    subscriptionsCount: number;
  };
}

async function getUserFullDetails(id: string): Promise<UserFullDetail | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      role: true,
      birthDate: true,
      whatsapp: true,
      createdAt: true,
      updatedAt: true,
      orders: {
        select: {
          id: true,
          createdAt: true,
          status: true,
          totalAmount: true,
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      subscriptions: {
        select: {
          id: true,
          status: true,
          startedAt: true,
          canceledAt: true,
          nextBillingAt: true,
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
        orderBy: { startedAt: "desc" },
      },
      addresses: {
        select: {
          id: true,
          label: true,
          street: true,
          number: true,
          neighborhood: true,
          city: true,
          state: true,
          zipCode: true,
          isDefault: true,
        },
      },
      _count: {
        select: {
          orders: true,
          subscriptions: true,
        },
      },
    },
  });

  if (!user) return null;

  const totalSpent = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: {
      userId: id,
      status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
    },
  });

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    status: user.status,
    role: user.role,
    birthDate: user.birthDate,
    whatsapp: user.whatsapp,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    orders: user.orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      status: o.status,
      totalAmount: o.totalAmount.toNumber(),
      itemsCount: o._count.items,
    })),
    subscriptions: user.subscriptions.map((s) => ({
      id: s.id,
      status: s.status,
      startedAt: s.startedAt,
      canceledAt: s.canceledAt,
      nextBillingAt: s.nextBillingAt,
      plan: {
        id: s.plan.id,
        name: s.plan.name,
        price: s.plan.price.toNumber(),
      },
    })),
    addresses: user.addresses,
    totals: {
      ordersCount: user._count.orders,
      totalSpent: totalSpent._sum?.totalAmount?.toNumber() ?? 0,
      subscriptionsCount: user._count.subscriptions,
    },
  };
}

async function updateUserRole(id: string, role: "CUSTOMER" | "ADMIN"): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return false;

  await prisma.user.update({
    where: { id },
    data: { role },
  });

  return true;
}

async function updateUserStatus(id: string, status: UserStatus): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return false;

  await prisma.user.update({
    where: { id },
    data: { status },
  });

  return true;
}

// ===============================
// CATEGORIES
// ===============================

interface CategoryListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  productsCount: number;
}

async function getCategories(): Promise<CategoryListItem[]> {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      isActive: true,
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    isActive: c.isActive,
    productsCount: c._count.products,
  }));
}

// ===============================
// CHARTS DATA
// ===============================

interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface OrderStatusDataPoint {
  name: string;
  value: number;
  color: string;
}

interface TopProductDataPoint {
  name: string;
  sales: number;
  revenue: number;
}

interface UsersGrowthDataPoint {
  month: string;
  users: number;
  cumulative: number;
}

/**
 * Get revenue data for the last 30 days
 */
async function getRevenueChartData(): Promise<RevenueDataPoint[]> {
  const days = 30;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const orders = await prisma.order.findMany({
    where: {
      status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
  });

  // Group by date
  const dataMap = new Map<string, { revenue: number; orders: number }>();
  
  // Initialize all days with zero
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    dataMap.set(dateStr, { revenue: 0, orders: 0 });
  }

  // Fill with actual data
  orders.forEach((order) => {
    const dateStr = order.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const current = dataMap.get(dateStr) || { revenue: 0, orders: 0 };
    dataMap.set(dateStr, {
      revenue: current.revenue + Number(order.totalAmount),
      orders: current.orders + 1,
    });
  });

  return Array.from(dataMap.entries()).map(([date, data]) => ({
    date,
    revenue: data.revenue,
    orders: data.orders,
  }));
}

/**
 * Get orders by status for pie chart
 */
async function getOrdersStatusChartData(): Promise<OrderStatusDataPoint[]> {
  const statusCounts = await prisma.order.groupBy({
    by: ["status"],
    _count: true,
  });

  const statusConfig: Record<OrderStatus, { name: string; color: string }> = {
    PENDING: { name: "Pendente", color: "#F59E0B" },
    PAID: { name: "Pago", color: "#22C55E" },
    SHIPPED: { name: "Enviado", color: "#06B6D4" },
    DELIVERED: { name: "Entregue", color: "#10B981" },
    CANCELED: { name: "Cancelado", color: "#EF4444" },
  };

  return statusCounts.map((item) => ({
    name: statusConfig[item.status]?.name || item.status,
    value: item._count,
    color: statusConfig[item.status]?.color || "#6B7280",
  }));
}

/**
 * Get top selling products for bar chart
 */
async function getTopProductsChartData(limit: number = 10): Promise<TopProductDataPoint[]> {
  const topProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: {
      quantity: true,
      totalPrice: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: limit,
  });

  const productIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p.name]));

  return topProducts.map((item) => ({
    name: productMap.get(item.productId) || "Produto desconhecido",
    sales: item._sum.quantity || 0,
    revenue: Number(item._sum.totalPrice || 0),
  }));
}

/**
 * Get users growth data for the last 6 months
 */
async function getUsersGrowthChartData(): Promise<UsersGrowthDataPoint[]> {
  const months = 6;
  const data: UsersGrowthDataPoint[] = [];
  let cumulative = 0;

  // Get total users before the period
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);

  const usersBefore = await prisma.user.count({
    where: { createdAt: { lt: startDate } },
  });
  cumulative = usersBefore;

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - i);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    monthEnd.setHours(23, 59, 59, 999);

    const usersInMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    cumulative += usersInMonth;

    data.push({
      month: monthStart.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      users: usersInMonth,
      cumulative,
    });
  }

  return data;
}

// ===============================
// CATEGORIES CRUD
// ===============================

interface CategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
}

async function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } },
    },
  });
}

async function createCategory(data: CategoryInput) {
  const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  
  return prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      imageUrl: data.imageUrl,
      isActive: data.isActive ?? true,
    },
  });
}

async function updateCategory(id: string, data: Partial<CategoryInput>) {
  const updateData: Record<string, unknown> = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  return prisma.category.update({
    where: { id },
    data: updateData,
  });
}

async function deleteCategory(id: string) {
  // Check if category has products
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  
  if (!category) {
    throw new Error("Categoria não encontrada");
  }
  
  if (category._count.products > 0) {
    throw new Error("Não é possível excluir uma categoria com produtos associados");
  }
  
  return prisma.category.delete({ where: { id } });
}

// ===============================
// SUBSCRIPTION PLANS CRUD
// ===============================

interface SubscriptionPlanInput {
  name: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  price: number;
  billingCycle?: "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";
  features?: string[];
  imageUrl?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
}

async function getSubscriptionPlans() {
  const plans = await prisma.subscriptionPlan.findMany({
    include: {
      _count: { select: { subscriptions: true } },
    },
    orderBy: { price: "asc" },
  });

  // Map to expected format
  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    shortDescription: plan.shortDescription,
    price: plan.price.toNumber(),
    billingCycle: plan.billingCycle,
    features: plan.features,
    imageUrl: plan.imageUrl,
    isActive: plan.active,
    isFeatured: plan.isFeatured,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    subscribersCount: plan._count.subscriptions,
  }));
}

async function getSubscriptionPlanById(id: string) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id },
    include: {
      _count: { select: { subscriptions: true } },
      products: {
        include: { product: true },
      },
    },
  });

  if (!plan) return null;

  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    shortDescription: plan.shortDescription,
    price: plan.price.toNumber(),
    billingCycle: plan.billingCycle,
    features: plan.features,
    imageUrl: plan.imageUrl,
    isActive: plan.active,
    isFeatured: plan.isFeatured,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    _count: { userSubscriptions: plan._count.subscriptions },
    products: plan.products,
  };
}

async function createSubscriptionPlan(data: SubscriptionPlanInput) {
  const slug = data.slug || data.name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  
  return prisma.subscriptionPlan.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      shortDescription: data.shortDescription,
      price: data.price,
      billingCycle: data.billingCycle || "MONTHLY",
      features: data.features || [],
      imageUrl: data.imageUrl,
      active: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
    },
  });
}

async function updateSubscriptionPlan(id: string, data: Partial<SubscriptionPlanInput>) {
  const updateData: Record<string, unknown> = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.billingCycle !== undefined) updateData.billingCycle = data.billingCycle;
  if (data.features !== undefined) updateData.features = data.features;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.isActive !== undefined) updateData.active = data.isActive;
  if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
  
  return prisma.subscriptionPlan.update({
    where: { id },
    data: updateData,
  });
}

async function deleteSubscriptionPlan(id: string) {
  // Check if plan has subscriptions
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id },
    include: { _count: { select: { subscriptions: true } } },
  });
  
  if (!plan) {
    throw new Error("Plano não encontrado");
  }
  
  if (plan._count.subscriptions > 0) {
    throw new Error("Não é possível excluir um plano com assinaturas ativas");
  }
  
  return prisma.subscriptionPlan.delete({ where: { id } });
}

// ===============================
// USER SUBSCRIPTIONS MANAGEMENT
// ===============================

interface UserSubscriptionFilters {
  status?: string;
  planId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

async function getUserSubscriptions(filters: UserSubscriptionFilters = {}) {
  const { status, planId, search, page = 1, pageSize = 20 } = filters;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  
  if (status) where.status = status;
  if (planId) where.planId = planId;
  if (search) {
    where.user = {
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  }
  
  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        plan: { select: { id: true, name: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.subscription.count({ where }),
  ]);
  
  return {
    subscriptions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

async function updateUserSubscriptionStatus(id: string, status: string) {
  return prisma.subscription.update({
    where: { id },
    data: { 
      status: status as "ACTIVE" | "PAUSED" | "CANCELED",
      ...(status === "CANCELED" ? { canceledAt: new Date() } : {}),
    },
  });
}

// ===============================
// EXPORT SERVICE
// ===============================

export const adminService = {
  // Dashboard
  getDashboardStats,
  getRecentOrders,
  getTopProducts,

  // Charts
  getRevenueChartData,
  getOrdersStatusChartData,
  getTopProductsChartData,
  getUsersGrowthChartData,

  // Products
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,

  // Orders
  getOrders,
  getOrderById,
  updateOrderStatus,

  // Users
  getUsers,
  getUserById,
  getUserFullDetails,
  updateUserStatus,
  updateUserRole,

  // Categories
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,

  // Subscription Plans
  getSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,

  // User Subscriptions
  getUserSubscriptions,
  updateUserSubscriptionStatus,
};
