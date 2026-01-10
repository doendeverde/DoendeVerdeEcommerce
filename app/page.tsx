import { prisma } from "@/lib/prisma";

export default async function Home() {
  // Conta quantos registros existem em cada tabela principal
  const [
    userCount,
    categoryCount,
    productCount,
    orderCount,
    subscriptionPlanCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.subscriptionPlan.count(),
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center gap-8 py-16 px-8 bg-white dark:bg-black">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-2">
            🌿 Doende Verde
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Headshop E-commerce Platform
          </p>
        </div>

        {/* Status do Banco */}
        <div className="w-full p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h2 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
            ✅ Banco de dados conectado!
          </h2>
          <p className="text-sm text-green-700 dark:text-green-500">
            PostgreSQL via Neon Cloud
          </p>
        </div>

        {/* Contagem das tabelas */}
        <div className="w-full">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
            📊 Status das Tabelas
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <TableCard title="Usuários" count={userCount} emoji="👥" />
            <TableCard title="Categorias" count={categoryCount} emoji="📁" />
            <TableCard title="Produtos" count={productCount} emoji="📦" />
            <TableCard title="Pedidos" count={orderCount} emoji="🛒" />
            <TableCard title="Planos" count={subscriptionPlanCount} emoji="💳" />
          </div>
        </div>

        {/* Próximos passos */}
        <div className="w-full p-6 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
          <h3 className="text-lg font-semibold text-black dark:text-white mb-3">
            🚀 Próximos Passos
          </h3>
          <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            <li>1. Criar dados de seed (categorias, produtos)</li>
            <li>2. Implementar autenticação</li>
            <li>3. Construir páginas de catálogo</li>
            <li>4. Implementar carrinho de compras</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

function TableCard({
  title,
  count,
  emoji,
}: {
  title: string;
  count: number;
  emoji: string;
}) {
  return (
    <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-2xl font-bold text-black dark:text-white">
        {count}
      </div>
      <div className="text-xs text-zinc-600 dark:text-zinc-400">{title}</div>
    </div>
  );
}

