"use client";

import { startTransition } from "react";
import type { OrderPublicView } from "../../lib/trade-routes/types";
import { OrderCard } from "./order-card";

export function OrderList({
  orders,
  walletConnected,
  locale = "en",
  onAccept,
}: {
  orders: OrderPublicView[];
  walletConnected: boolean;
  locale?: "en" | "zh";
  onAccept(order: OrderPublicView): void;
}) {
  return (
    <div className="order-stack">
      {orders.map((order) => (
        <OrderCard
          key={order.orderId}
          order={order}
          walletConnected={walletConnected}
          locale={locale}
          onAccept={(nextOrder) => {
            startTransition(() => onAccept(nextOrder));
          }}
        />
      ))}
    </div>
  );
}
