"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { createCustomer, updateCustomer } from "@/lib/api";
import type { Customer } from "@/lib/types";

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSaved: () => void;
}) {
  // Konten dialog ter-unmount saat ditutup (Base UI) → state terinisialisasi ulang.
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.whatsapp_number ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      toast.error("Nomor WhatsApp tidak valid (minimal 9 digit)");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        whatsapp_number: phone.trim(),
        address: address.trim() || null,
      };
      if (customer) {
        await updateCustomer(customer.id, payload);
        toast.success("Customer berhasil diperbarui");
      } else {
        await createCustomer(payload);
        toast.success("Customer baru ditambahkan");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan customer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Customer Baru"}</DialogTitle>
          <DialogDescription>
            Data ini dipakai untuk tagihan WhatsApp dan label resi pengiriman.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="customer-name">Nama Lengkap</Label>
            <Input
              id="customer-name"
              placeholder="mis. Budi Santoso"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer-phone">Nomor WhatsApp</Label>
            <Input
              id="customer-phone"
              placeholder="mis. 0812-3456-7890"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Format bebas (08xx / +62 / 62xx) — otomatis dinormalisasi untuk link wa.me.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer-address">Alamat Lengkap</Label>
            <Textarea
              id="customer-address"
              placeholder="Jalan, RT/RW, kelurahan, kecamatan, kota, kode pos..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan..." : customer ? "Simpan Perubahan" : "Tambah Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
