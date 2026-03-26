"use client";

import { startTransition } from "react";
import type { OrderPublicView } from "../../lib/trade-routes/types";
import { OrderCard } from "./order-card";

export function OrderList({
  orders,
  walletConnected,
  onAccept,
}: {
  orders: OrderPublicView[];
  walletConnected: boolean;
  onAccept(order: OrderPublicView): void;
}) {
  return (
    <div className="order-stack">
      {orders.map((order) => (
        <OrderCard
          key={order.orderId}
          order={order}
          walletConnected={walletConnected}
          onAccept={(nextOrder) => {
            startTransition(() => onAccept(nextOrder));
          }}
        />
      ))}
    </div>
  );
}
