"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createOrder, updateOrder, type OrderInput } from "@/lib/api";
import { CURRENCIES, DEFAULT_FOREIGN_CURRENCY, ORDER_STATUSES, SHIPPING_METHODS } from "@/lib/constants";
import { calculateIdr, getExchangeRate, type ExchangeSource } from "@/lib/exchange";
import { formatIDR } from "@/lib/format";
import type { Customer, Order, OrderStatus, ShippingMethod, Trip } from "@/lib/types";

const sourceBadge: Record<ExchangeSource, string> = {
  live: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  manual: "bg-sky-500/10 text-sky-700 border-sky-500/30",
  fallback: "bg-amber-500/10 text-amber-700 border-amber-500/30",
};

const sourceLabel: Record<ExchangeSource, string> = {
  live: "Kurs live",
  manual: "Kurs manual",
  fallback: "Kurs cadangan",
};

export function OrderFormDialog({
  open,
  onOpenChange,
  order,
  trips,
  customers,
  defaultTripId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  trips: Trip[];
  customers: Customer[];
  /** Trip yang otomatis terpilih saat membuat pesanan baru. */
  defaultTripId?: string;
  onSaved: () => void;
}) {
  // Konten dialog ter-unmount saat ditutup (Base UI) → state terinisialisasi ulang.
  const [customerId, setCustomerId] = useState(order?.customer_id ?? "");
  // "none" = tanpa trip (trip opsional)
  const [tripId, setTripId] = useState<string>(
    order ? (order.trip_id ?? "none") : (defaultTripId ?? "none"),
  );
  const [itemName, setItemName] = useState(order?.item_name ?? "");
  const [priceForeign, setPriceForeign] = useState(order ? String(order.item_price_foreign) : "");
  const [currency, setCurrency] = useState(order?.foreign_currency ?? DEFAULT_FOREIGN_CURRENCY);
  const [rate, setRate] = useState(order ? String(order.exchange_rate_used) : "");
  const [rateSource, setRateSource] = useState<ExchangeSource | null>(null);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [qty, setQty] = useState(order ? String(order.quantity) : "1");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(
    order?.shipping_method ?? "Handcarry",
  );
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "Pending");
  const [paidAmount, setPaidAmount] = useState(order ? String(order.paid_amount_idr) : "");
  const [proofUrl, setProofUrl] = useState(order?.payment_proof_url ?? "");
  const [notes, setNotes] = useState(order?.notes ?? "");
  const [busy, setBusy] = useState(false);

  // Auto-isi kurs live saat membuat pesanan baru (bukan mode edit)
  useEffect(() => {
    if (!open || order || fetchingRate) return;
    if (!rate) void autoFetchRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order, currency]);

  async function autoFetchRate() {
    if (!currency) return;
    setFetchingRate(true);
    try {
      const result = await getExchangeRate(currency, "IDR");
      setRate(String(result.rate));
      setRateSource(result.source);
    } catch {
      setRateSource("fallback");
    } finally {
      setFetchingRate(false);
    }
  }

  const priceForeignNum = parseFloat(priceForeign.replace(",", "."));
  const rateNum = parseFloat(rate.replace(",", "."));
  const qtyNum = parseInt(qty, 10);
  const idrPreview = useMemo(() => {
    if (!Number.isFinite(priceForeignNum) || !Number.isFinite(rateNum)) return 0;
    return calculateIdr(priceForeignNum, rateNum) * (Number.isFinite(qtyNum) && qtyNum > 0 ? qtyNum : 1);
  }, [priceForeignNum, rateNum, qtyNum]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return toast.error("Pilih customer terlebih dahulu");
    if (!itemName.trim()) return toast.error("Nama barang wajib diisi");
    if (!Number.isFinite(priceForeignNum) || priceForeignNum <= 0)
      return toast.error("Harga barang asing tidak valid");
    if (!Number.isFinite(rateNum) || rateNum <= 0)
      return toast.error("Kurs tidak valid — isi manual atau tekan tombol Auto");
    if (!Number.isFinite(qtyNum) || qtyNum < 1) return toast.error("Jumlah minimal 1");

    const payload: OrderInput = {
      customer_id: customerId,
      trip_id: tripId === "none" ? null : tripId,
      item_name: itemName.trim(),
      item_price_foreign: priceForeignNum,
      foreign_currency: currency,
      exchange_rate_used: rateNum,
      calculated_price_idr: calculateIdr(priceForeignNum, rateNum),
      quantity: qtyNum,
      shipping_method: shippingMethod,
      status,
      paid_amount_idr: Number.isFinite(parseFloat(paidAmount.replace(",", ".")))
        ? parseFloat(paidAmount.replace(",", "."))
        : 0,
      payment_proof_url: proofUrl.trim() || null,
      notes: notes.trim() || null,
    };

    setBusy(true);
    try {
      if (order) {
        await updateOrder(order.id, payload);
        toast.success("Pesanan berhasil diperbarui");
      } else {
        await createOrder(payload);
        toast.success("Pesanan berhasil ditambahkan");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pesanan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{order ? "Edit Pesanan" : "Pesanan Baru"}</DialogTitle>
          <DialogDescription>
            Harga jual IDR dihitung otomatis dari kurs. Kurs bisa diambil live atau diisi manual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="order-customer">Customer</Label>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
                <SelectTrigger id="order-customer" className="w-full">
                  <SelectValue placeholder="Pilih customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Belum ada customer — buat dulu di menu Customer.
                    </div>
                  )}
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} · {c.whatsapp_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order-trip">Trip (opsional)</Label>
              <Select value={tripId} onValueChange={(v) => setTripId(v ?? "none")}>
                <SelectTrigger id="order-trip" className="w-full">
                  <SelectValue placeholder="Tanpa Trip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Trip</SelectItem>
                  {trips.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} · {t.destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="order-item">Nama Barang</Label>
            <Input
              id="order-item"
              placeholder="mis. Matcha KitKat, Skincare, Sneakers..."
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="order-price">Harga ({currency})</Label>
              <Input
                id="order-price"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="mis. 1200"
                value={priceForeign}
                onChange={(e) => setPriceForeign(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order-currency">Mata Uang</Label>
              <Select value={currency} onValueChange={(v) => { setCurrency(v ?? DEFAULT_FOREIGN_CURRENCY); setRate(""); }}>
                <SelectTrigger id="order-currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="order-rate">Kurs (1 {currency} = ? IDR)</Label>
              {rateSource && (
                <Badge variant="outline" className={sourceBadge[rateSource]}>
                  {sourceLabel[rateSource]}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                id="order-rate"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="mis. 11200"
                value={rate}
                onChange={(e) => { setRate(e.target.value); setRateSource(null); }}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void autoFetchRate()}
                disabled={fetchingRate}
              >
                {fetchingRate ? <Loader2 className="animate-spin" /> : <Zap />}
                Auto
              </Button>
            </div>
            {idrPreview > 0 && (
              <p className="text-xs text-muted-foreground">
                Total harga jual:{" "}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatIDR(idrPreview)}
                </span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="order-qty">Jumlah</Label>
              <Input
                id="order-qty"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order-shipping">Pengiriman</Label>
              <Select value={shippingMethod} onValueChange={(v) => setShippingMethod(v as ShippingMethod)}>
                <SelectTrigger id="order-shipping" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIPPING_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                <SelectTrigger id="order-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="order-paid">Sudah Dibayar (IDR)</Label>
            <Input
              id="order-paid"
              type="number"
              min="0"
              step="any"
              inputMode="numeric"
              placeholder="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
            />
            {order && (
              <p className="text-xs text-muted-foreground">
                Total pesanan: {formatIDR(order.calculated_price_idr * order.quantity)} · Sisa:{" "}
                {formatIDR(Math.max(0, order.calculated_price_idr * order.quantity - (parseFloat(paidAmount) || 0)))}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="order-proof">Link Bukti Transfer (opsional)</Label>
            <Input
              id="order-proof"
              placeholder="https://... (foto/URL bukti pembayaran)"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="order-notes">Catatan (opsional)</Label>
            <Textarea
              id="order-notes"
              placeholder="mis. warna hitam, ukuran L..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan..." : order ? "Simpan Perubahan" : "Tambah Pesanan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
