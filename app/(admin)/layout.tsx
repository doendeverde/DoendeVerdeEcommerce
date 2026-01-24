import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export const metadata = {
  title: "Área Administrativa | Doende HeadShop",
  description: "Painel administrativo do Doende HeadShop",
};

/**
 * Layout para área administrativa
 * Verifica se o usuário é ADMIN antes de renderizar
 * Inclui sidebar fixa e header com breadcrumbs
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Verifica autenticação
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  // Verifica se é admin
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Sidebar fixa */}
      <AdminSidebar user={session.user} />

      {/* Conteúdo principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <AdminHeader user={session.user} />

        {/* Main content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
