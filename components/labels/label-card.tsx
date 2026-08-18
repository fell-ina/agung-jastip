import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { formatDate, formatForeign, formatIDR, formatRate, orderTotal } from "@/lib/format";
import type { OrderWithRelations } from "@/lib/types";

/**
 * Kartu label resi — didesain untuk printer thermal 80mm.
 * Gunakan hanya di halaman /labels/print agar @media print bekerja maksimal.
 */
export function LabelCard({ order }: { order: OrderWithRelations }) {
  const ref = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="mx-auto w-[72mm] break-inside-avoid border border-dashed border-zinc-700 bg-white px-[4mm] py-[3.5mm] text-black">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-zinc-400 pb-1.5">
        <div>
          <div className="text-[13px] leading-tight font-extrabold tracking-wide">
            {APP_NAME.toUpperCase()}
          </div>
          <div className="text-[8px] tracking-widest text-zinc-600">{APP_TAGLINE.toUpperCase()}</div>
        </div>
        <div className="text-right">
          <div className="text-[8px] text-zinc-600">Trip</div>
          <div className="max-w-[40mm] truncate text-[9px] font-semibold">{order.trip.name}</div>
        </div>
      </div>

      {/* Penerima */}
      <div className="border-b border-zinc-300 py-1.5">
        <div className="text-[7px] tracking-widest text-zinc-500">PENERIMA</div>
        <div className="text-[11px] font-bold">{order.customer.name}</div>
        <div className="text-[9px] text-zinc-700">WA: {order.customer.whatsapp_number}</div>
        <div className="mt-0.5 text-[8.5px] leading-snug text-zinc-800">
          {order.customer.address ?? "Alamat menyusul"}
        </div>
      </div>

      {/* Barang */}
      <div className="border-b border-zinc-300 py-1.5">
        <div className="text-[7px] tracking-widest text-zinc-500">ISI PAKET</div>
        <div className="text-[10px] leading-snug font-semibold">
          {order.item_name} × {order.quantity}
        </div>
        <div className="text-[8px] text-zinc-600">
          {formatForeign(order.item_price_foreign, order.foreign_currency)} × {order.quantity} · kurs{" "}
          {formatRate(order.exchange_rate_used)}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-end justify-between pt-1.5">
        <div>
          <div className="text-[7px] tracking-widest text-zinc-500">PENGIRIMAN</div>
          <div className="text-[10px] font-bold uppercase">{order.shipping_method}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-semibold tabular-nums">{formatIDR(orderTotal(order))}</div>
          <div className="text-[7px] text-zinc-500">{formatDate(new Date().toISOString())} · {ref}</div>
        </div>
      </div>
    </div>
  );
}
