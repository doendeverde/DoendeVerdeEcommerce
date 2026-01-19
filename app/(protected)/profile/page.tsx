import { auth } from "@/lib/auth";
import { userService } from "@/services";

export const metadata = {
  title: "Meu Perfil | Headshop",
  description: "Informações do perfil do usuário",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    return null;
  }

  // Use service layer instead of direct Prisma calls
  const user = await userService.getUserProfile(session.user.id);

  if (!user) {
    return <div>Usuário não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600 mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Informações Básicas */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Informações Básicas
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Nome Completo</label>
            <p className="text-gray-900 mt-1">{user.fullName}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900 mt-1">{user.email}</p>
          </div>

          {user.birthDate && (
            <div>
              <label className="text-sm font-medium text-gray-500">Data de Nascimento</label>
              <p className="text-gray-900 mt-1">
                {new Date(user.birthDate).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}

          {user.whatsapp && (
            <div>
              <label className="text-sm font-medium text-gray-500">WhatsApp</label>
              <p className="text-gray-900 mt-1">{user.whatsapp}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-500">Status da Conta</label>
            <p className="text-gray-900 mt-1">
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.status === "ACTIVE"
                  ? "bg-green-100 text-green-800"
                  : user.status === "BLOCKED"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                  }`}
              >
                {user.status}
              </span>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">
              Membro desde
            </label>
            <p className="text-gray-900 mt-1">
              {new Date(user.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      {/* Preferências */}
      {user.preferences && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Minhas Preferências
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600">Preferências de consumo configuradas.</p>
          </div>
        </div>
      )}

      {/* Endereços */}
      {user.addresses.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Endereços Salvos
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {user.addresses.map((address) => (
                <div key={address.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{address.label}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {address.street}, {address.number}
                        {address.complement && ` - ${address.complement}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.neighborhood} - {address.city}/{address.state}
                      </p>
                      <p className="text-sm text-gray-600">CEP: {address.zipCode}</p>
                    </div>
                    {address.isDefault && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                        Padrão
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
