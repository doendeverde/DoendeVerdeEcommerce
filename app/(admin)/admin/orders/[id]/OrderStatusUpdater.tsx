"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
  { value: "PENDING", label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { value: "PAID", label: "Pago", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "SHIPPED", label: "Enviado", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "DELIVERED", label: "Entregue", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  { value: "CANCELED", label: "Cancelado", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
];

/**
 * Componente para atualizar status do pedido
 */
export function OrderStatusUpdater({ orderId, currentStatus }: OrderStatusUpdaterProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentOption = statusOptions.find((s) => s.value === currentStatus);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Erro ao atualizar status");
      }

      router.refresh();
    } catch (error) {
      alert("Erro ao atualizar status do pedido");
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
          currentOption?.color || "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
        )}
      >
        {isUpdating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <span>{currentOption?.label || currentStatus}</span>
            <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-lg border border-default z-20 overflow-hidden">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm hover:bg-gray-bg transition-colors",
                  option.value === currentStatus && "bg-gray-bg font-medium"
                )}
              >
                <span className={cn("px-2 py-0.5 rounded-full text-xs", option.color)}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
