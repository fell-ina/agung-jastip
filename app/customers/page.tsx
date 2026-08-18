"use client";

import { useMemo, useState } from "react";
import {
  MessageCircle,
  Pencil,
  Phone,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingRows } from "@/components/shared/data-state";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerFormDialog } from "@/components/customers/customer-form";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchCustomersAction,
  fetchOrdersAction,
  deleteCustomerAction,
} from "../actions/customers";
import { formatDate, normalizePhone } from "@/lib/format";
import type { Customer } from "@/lib/types";
import { useLoad } from "@/hooks/use-load";

async function loadCustomersPage() {
  const [customers, orders] = await Promise.all([
    fetchCustomersAction(),
    fetchOrdersAction(),
  ]);
  return { customers, orders };
}

export default function CustomersPage() {
  const { data, loading, error, reload } = useLoad(loadCustomersPage);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const orderCounts = useMemo(() => {
    const map = new Map<string, number>();
    data?.orders.forEach((o: { customer_id: string }) => {
      map.set(o.customer_id, (map.get(o.customer_id) ?? 0) + 1);
    });
    return map;
  }, [data]);

  const deleteCustomerRow = deleteId ? data?.customers.find((c: Customer) => c.id === deleteId) : null;

  return (
    <div>
      <PageHeader
        title="Customer"
        description="Daftar customer jastip beserta kontak WhatsApp dan alamat pengiriman."
      >
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <UserPlus /> Customer Baru
        </Button>
      </PageHeader>

      {error && <div className="mb-4"><ErrorState message={error} onRetry={reload} /></div>}

      {loading && <LoadingRows rows={5} height="h-12" />}

      {!loading && data && data.customers.length === 0 && (
        <EmptyState
          icon={Users}
          title="Belum ada customer"
          description="Tambahkan customer pertama untuk mulai mencatat pesanan."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <UserPlus /> Tambah Customer
            </Button>
          }
        />
      )}

      {!loading && data && data.customers.length > 0 && (
        <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nama</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead className="text-center">Jumlah Pesanan</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.customers.map((customer: Customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <a
                      href={`https://wa.me/${normalizePhone(customer.whatsapp_number)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      <Phone className="size-3.5" />
                      {customer.whatsapp_number}
                    </a>
                  </TableCell>
                  <TableCell className="max-w-72">
                    <span className="line-clamp-2 whitespace-normal text-sm text-muted-foreground">
                      {customer.address ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {orderCounts.get(customer.id) ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(customer.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        title="Chat WhatsApp"
                        onClick={() => {
                          const msg = `Halo Kak *${customer.name}*! 👋\nIni *Agung* dari *Agung Jastip* 😊`;
                          window.open(`https://wa.me/${normalizePhone(customer.whatsapp_number)}?text=${encodeURIComponent(msg)}`, "_blank");
                        }}
                      >
                        <MessageCircle />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        title="Edit"
                        onClick={() => {
                          setEditing(customer);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        title="Hapus"
                        onClick={() => setDeleteId(customer.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editing}
        onSaved={reload}
      />

      <ConfirmDelete
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Hapus customer ini?"
        description={
          deleteCustomerRow
            ? `"${deleteCustomerRow.name}" akan dihapus permanen${(orderCounts.get(deleteCustomerRow.id) ?? 0) > 0 ? " — catatan: hapus pesanannya terlebih dahulu jika masih ada" : ""}.`
            : "Customer akan dihapus permanen."
        }
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteCustomerAction(deleteId);
            toast.success("Customer dihapus");
            setDeleteId(null);
            reload();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Gagal menghapus");
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
}