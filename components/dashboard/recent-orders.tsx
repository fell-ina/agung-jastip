"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle, ShoppingBag } from "lucide-react";

import { OrderStatusBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR, orderTotal } from "@/lib/format";
import { buildInvoiceMessage, buildWaLink } from "@/lib/whatsapp";
import type { OrderWithRelations } from "@/lib/types";

export function RecentOrders({ orders }: { orders: OrderWithRelations[] }) {
  const recent = orders.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="size-4 text-emerald-500" /> Pesanan Terbaru
          </CardTitle>
          <Button size="sm" variant="ghost" render={<Link href="/orders" />}>
            Semua <ArrowRight />
          </Button>
        </div>
        <CardDescription>5 pesanan terakhir yang dicatat</CardDescription>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Belum ada pesanan — mulai dari menu <span className="font-medium">Pesanan</span>.
          </p>
        ) : (
          <div className="space-y-2">
            {recent.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{order.item_name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {order.customer.name} · {order.trip.name}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">
                      {formatIDR(orderTotal(order))}
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    title="Kirim tagihan WhatsApp"
                    onClick={() => {
                      const msg = buildInvoiceMessage({
                        customerName: order.customer.name,
                        itemName: order.item_name,
                        quantity: order.quantity,
                        currency: order.foreign_currency,
                        priceForeign: order.item_price_foreign,
                        rate: order.exchange_rate_used,
                        totalIdr: orderTotal(order),
                        paidIdr: order.paid_amount_idr,
                        shippingMethod: order.shipping_method,
                        tripName: order.trip.name,
                      });
                      window.open(buildWaLink(order.customer.whatsapp_number, msg), "_blank");
                    }}
                  >
                    <MessageCircle />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
