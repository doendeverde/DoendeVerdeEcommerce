import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Settings, Store, CreditCard, Truck, Bell, Lock } from "lucide-react";

/**
 * Página de configurações (Admin)
 * Placeholder para futuras configurações
 */
export default function AdminSettingsPage() {
  const settingsSections = [
    {
      title: "Loja",
      description: "Configurações gerais da loja",
      icon: Store,
      items: ["Nome da loja", "Logo", "Moeda", "Idioma"],
    },
    {
      title: "Pagamentos",
      description: "Gateways e métodos de pagamento",
      icon: CreditCard,
      items: ["Mercado Pago", "PIX", "Cartão de crédito"],
    },
    {
      title: "Envio",
      description: "Transportadoras e frete",
      icon: Truck,
      items: ["Correios", "Frete grátis", "Retirada local"],
    },
    {
      title: "Notificações",
      description: "Emails e alertas",
      icon: Bell,
      items: ["Email de pedido", "Estoque baixo", "Novos cadastros"],
    },
    {
      title: "Segurança",
      description: "Acesso e permissões",
      icon: Lock,
      items: ["Administradores", "Logs de acesso", "Backup"],
    },
  ];

  return (
    <div className="page-content">
      <AdminPageHeader
        title="Configurações"
        description="Gerencie as configurações do sistema"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="bg-surface rounded-xl border border-default p-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary-purple/10">
                  <Icon className="w-6 h-6 text-primary-purple" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary">
                    {section.title}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {section.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-text-secondary"
                      >
                        <span className="w-1.5 h-1.5 bg-gray-border rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
        <strong>Nota:</strong> As configurações serão implementadas em fases posteriores.
        Esta página serve como preview das funcionalidades planejadas.
      </div>
    </div>
  );
}
