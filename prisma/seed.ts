/**
 * Database Seed Script
 *
 * Populates the database with sample categories, products, and subscription plans.
 * Run with: npx tsx prisma/seed.ts
 */

import 'dotenv/config';
import { PrismaClient, ProductStatus, BillingCycle } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

// Create Prisma client with Neon adapter
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.subscriptionPlan.deleteMany();

  // Create categories
  console.log('📂 Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Acessórios',
        slug: 'acessorios',
        description: 'Dichavadores, isqueiros, porta-fumo e mais',
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Piteiras',
        slug: 'piteiras',
        description: 'Piteiras de vidro, madeira e silicone',
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Bongs',
        slug: 'bongs',
        description: 'Bongs de vidro, acrílico e silicone',
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Sedas',
        slug: 'sedas',
        description: 'Sedas de todos os tamanhos e materiais',
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Vaporizadores',
        slug: 'vaporizadores',
        description: 'Vaporizadores portáteis e de mesa',
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Kits',
        slug: 'kits',
        description: 'Kits completos para presente ou uso pessoal',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create products
  console.log('📦 Creating products...');
  const products = [
    {
      name: 'Dichavador Premium Metal 4 Partes',
      slug: 'dichavador-premium-metal-4-partes',
      description: '<p>Dichavador de metal de alta qualidade com 4 partes separáveis. Possui tela fina para coletar kief e design ergonômico para fácil manuseio.</p><ul><li>Material: Liga de zinco</li><li>Diâmetro: 55mm</li><li>Altura: 45mm</li><li>Dentes afiados em formato de diamante</li></ul>',
      basePrice: 89.90,
      stock: 25,
      lowStockAlert: 5,
      loyaltyPoints: 0, // FEATURE DISABLED: Will be implemented in the future
      categorySlug: 'acessorios',
      images: [
        { url: 'https://images.unsplash.com/photo-1587556930799-8dca77f1d59a?w=500', isPrimary: true },
      ],
    },
    {
      name: 'Piteira de Vidro Artesanal',
      slug: 'piteira-vidro-artesanal',
      description: '<p>Piteira artesanal feita em vidro borossilicato resistente ao calor. Design exclusivo com espiral interna que resfria a fumaça.</p>',
      basePrice: 45.00,
      stock: 42,
      lowStockAlert: 10,
      loyaltyPoints: 0, // FEATURE DISABLED: Will be implemented in the future
      categorySlug: 'piteiras',
      images: [
        { url: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500', isPrimary: true },
      ],
    },
    {
      name: 'Bong de Vidro 30cm com Percolador',
      slug: 'bong-vidro-30cm-percolador',
      description: '<p>Bong de vidro borossilicato de 30cm com percolador tipo árvore para máxima filtragem. Base larga para estabilidade.</p><ul><li>Altura: 30cm</li><li>Espessura: 5mm</li><li>Ice catcher incluído</li><li>Encaixe 18.8mm</li></ul>',
      basePrice: 189.90,
      stock: 8,
      lowStockAlert: 3,
      loyaltyPoints: 0, // FEATURE DISABLED: Will be implemented in the future
      categorySlug: 'bongs',
      images: [
        { url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=500', isPrimary: true },
      ],
    },
    {
      name: 'Seda King Size Slim - Caixa 50un',
      slug: 'seda-king-size-slim-caixa-50',
      description: '<p>Caixa com 50 livros de seda King Size Slim. Papel ultrafino de queima lenta e uniforme. Certificação FSC.</p>',
      basePrice: 89.00,
      stock: 100,
      lowStockAlert: 20,
      loyaltyPoints: 0, // FEATURE DISABLED: Will be implemented in the future
      categorySlug: 'sedas',
      images: [
        { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', isPrimary: true },
      ],
    },
    {
      name: 'Vaporizador Portátil Ervas',
      slug: 'vaporizador-portatil-ervas',
      description: '<p>Vaporizador portátil para ervas secas com controle de temperatura. Bateria de longa duração e design compacto.</p><ul><li>Temperatura: 180-220°C</li><li>Bateria: 2200mAh</li><li>Tempo de aquecimento: 30s</li><li>Câmara em cerâmica</li></ul>',
      basePrice: 299.90,
      stock: 12,
      lowStockAlert: 3,
      loyaltyPoints: 0, // FEATURE DISABLED: Will be implemented in the future
      categorySlug: 'vaporizadores',
      images: [
        { url: 'https://images.unsplash.com/photo-1559056199-5e9d42b5f99a?w=500', isPrimary: true },
      ],
    },
    {
      name: 'Kit Iniciante Completo',
      slug: 'kit-iniciante-completo',
      description: '<p>Kit perfeito para quem está começando. Inclui:</p><ul><li>1x Dichavador de metal 2 partes</li><li>1x Piteira de vidro</li><li>5x Livros de seda</li><li>1x Isqueiro recarregável</li><li>1x Porta-fumo de metal</li></ul>',
      basePrice: 129.90,
      stock: 15,
      lowStockAlert: 5,
      loyaltyPoints: 0, // FEATURE DISABLED: Will be implemented in the future
      categorySlug: 'kits',
      images: [
        { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500', isPrimary: true },
      ],
    },
    {
      name: 'Dichavador de Madeira Premium',
      slug: 'dichavador-madeira-premium',
      description: '<p>Dichavador de madeira nobre com acabamento artesanal. Design clássico e durável.</p>',
      basePrice: 69.90,
      stock: 18,
      lowStockAlert: 5,
      loyaltyPoints: 0, // FEATURE DISABLED: Will be implemented in the future
      categorySlug: 'acessorios',
      images: [
        { url: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=500', isPrimary: true },
      ],
    },
    {
      name: 'Pack Piteiras Coloridas 10un',
      slug: 'pack-piteiras-coloridas-10un',
      description: '<p>Pack com 10 piteiras de vidro em cores variadas. Cada piteira é única!</p>',
      basePrice: 79.90,
      stock: 2,
      lowStockAlert: 5,
      loyaltyPoints: 0, // FEATURE DISABLED: Will be implemented in the future
      categorySlug: 'piteiras',
      images: [
        { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', isPrimary: true },
      ],
    },
  ];

  // Create each product with its relations
  for (const productData of products) {
    const { categorySlug, images, ...productFields } = productData;

    // Find category
    const category = categories.find((c) => c.slug === categorySlug);
    if (!category) continue;

    // Create product with 1:N relation to category
    const product = await prisma.product.create({
      data: {
        name: productFields.name,
        slug: productFields.slug,
        description: productFields.description,
        basePrice: productFields.basePrice,
        stock: productFields.stock,
        lowStockAlert: productFields.lowStockAlert,
        loyaltyPoints: productFields.loyaltyPoints,
        status: ProductStatus.ACTIVE,
        isPublished: true,
        categoryId: category.id,
        images: {
          create: images.map((img, index) => ({
            url: img.url,
            altText: productFields.name,
            isPrimary: img.isPrimary,
            displayOrder: index,
          })),
        },
      },
    });

    console.log(`  ✅ Created: ${product.name}`);
  }

  console.log(`\n✅ Created ${products.length} products.`);

  // Create subscription plans
  console.log('\n💳 Creating subscription plans...');
  const subscriptionPlans = [
    {
      name: 'Doende X',
      slug: 'doende-x',
      description: 'Plano inicial com 5% de desconto permanente e 200 pontos mensais',
      price: 29.90,
      discountPercent: 5,
      billingCycle: BillingCycle.MONTHLY,
      active: true,
    },
    {
      name: 'Doende Bronze',
      slug: 'doende-bronze',
      description: 'O plano mais popular! 15% de desconto e 350 pontos mensais',
      price: 49.90,
      discountPercent: 15,
      billingCycle: BillingCycle.MONTHLY,
      active: true,
      isFeatured: true,
    },
    {
      name: 'Doende Prata',
      slug: 'doende-prata',
      description: 'Experiência premium com 20% de desconto e 500 pontos mensais',
      price: 79.90,
      discountPercent: 20,
      billingCycle: BillingCycle.MONTHLY,
      active: true,
    },
  ];

  const createdPlans: Array<{ id: string; slug: string }> = [];
  for (const planData of subscriptionPlans) {
    const plan = await prisma.subscriptionPlan.create({
      data: planData,
    });
    createdPlans.push({ id: plan.id, slug: plan.slug });
    console.log(`  ✅ Created plan: ${planData.name}`);
  }

  // Create benefits
  console.log('\n🎁 Creating subscription benefits...');
  
  // First, clean existing benefits
  await prisma.planBenefit.deleteMany();
  await prisma.benefit.deleteMany();
  
  const benefitsData = [
    {
      name: 'Frete Grátis',
      slug: 'frete-gratis',
      description: 'Frete grátis em todos os pedidos acima de R$ 50',
      icon: 'Truck',
      displayOrder: 1,
    },
    {
      name: 'Desconto em Produtos',
      slug: 'desconto-produtos',
      description: 'Desconto percentual exclusivo em todos os produtos da loja',
      icon: 'Percent',
      displayOrder: 2,
    },
    {
      name: 'Brinde Mensal',
      slug: 'brinde-mensal',
      description: 'Receba um brinde surpresa todo mês junto com seu kit',
      icon: 'Gift',
      displayOrder: 3,
    },
    {
      name: 'Acesso Antecipado',
      slug: 'acesso-antecipado',
      description: 'Seja o primeiro a ter acesso a novos produtos e lançamentos',
      icon: 'Zap',
      displayOrder: 4,
    },
    {
      name: 'Suporte Prioritário',
      slug: 'suporte-prioritario',
      description: 'Atendimento preferencial via WhatsApp e email',
      icon: 'Headset',
      displayOrder: 5,
    },
    {
      name: 'Pontos em Dobro',
      slug: 'pontos-dobro',
      description: 'Ganhe o dobro de pontos de fidelidade em todas as compras',
      icon: 'Star',
      displayOrder: 6,
    },
  ];

  const createdBenefits: Array<{ id: string; slug: string }> = [];
  for (const benefitData of benefitsData) {
    const benefit = await prisma.benefit.create({
      data: benefitData,
    });
    createdBenefits.push({ id: benefit.id, slug: benefit.slug });
    console.log(`  ✅ Created benefit: ${benefitData.name}`);
  }

  // Create plan-benefit relationships
  console.log('\n🔗 Linking benefits to plans...');
  
  // Helper to get benefit id by slug
  const getBenefitId = (slug: string) => createdBenefits.find(b => b.slug === slug)?.id;
  const getPlanId = (slug: string) => createdPlans.find(p => p.slug === slug)?.id;

  // Doende X benefits (basic plan)
  const doendeXBenefits = [
    { benefitSlug: 'desconto-produtos', enabled: true, customValue: '5%' },
    { benefitSlug: 'frete-gratis', enabled: false },
    { benefitSlug: 'brinde-mensal', enabled: false },
    { benefitSlug: 'acesso-antecipado', enabled: false },
    { benefitSlug: 'suporte-prioritario', enabled: false },
    { benefitSlug: 'pontos-dobro', enabled: false },
  ];

  // Doende Bronze benefits (popular plan)
  const doendeBronzeBenefits = [
    { benefitSlug: 'desconto-produtos', enabled: true, customValue: '15%' },
    { benefitSlug: 'frete-gratis', enabled: true, customValue: 'Acima de R$ 100' },
    { benefitSlug: 'brinde-mensal', enabled: true },
    { benefitSlug: 'acesso-antecipado', enabled: false },
    { benefitSlug: 'suporte-prioritario', enabled: false },
    { benefitSlug: 'pontos-dobro', enabled: false },
  ];

  // Doende Prata benefits (premium plan)
  const doendePrataBenefits = [
    { benefitSlug: 'desconto-produtos', enabled: true, customValue: '20%' },
    { benefitSlug: 'frete-gratis', enabled: true, customValue: 'Sempre grátis' },
    { benefitSlug: 'brinde-mensal', enabled: true },
    { benefitSlug: 'acesso-antecipado', enabled: true },
    { benefitSlug: 'suporte-prioritario', enabled: true },
    { benefitSlug: 'pontos-dobro', enabled: true },
  ];

  const planBenefitsMap = [
    { planSlug: 'doende-x', benefits: doendeXBenefits },
    { planSlug: 'doende-bronze', benefits: doendeBronzeBenefits },
    { planSlug: 'doende-prata', benefits: doendePrataBenefits },
  ];

  for (const { planSlug, benefits } of planBenefitsMap) {
    const planId = getPlanId(planSlug);
    if (!planId) continue;

    for (const { benefitSlug, enabled, customValue } of benefits) {
      const benefitId = getBenefitId(benefitSlug);
      if (!benefitId) continue;

      await prisma.planBenefit.create({
        data: {
          planId,
          benefitId,
          enabled,
          customValue: customValue || null,
        },
      });
    }
    console.log(`  ✅ Linked benefits to: ${planSlug}`);
  }

  console.log(`\n✅ Seed completed!`);
  console.log(`   - ${categories.length} categories`);
  console.log(`   - ${products.length} products`);
  console.log(`   - ${subscriptionPlans.length} subscription plans`);
  console.log(`   - ${benefitsData.length} benefits`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
