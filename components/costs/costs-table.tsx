"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";

import { ConfirmDelete } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingRows } from "@/components/shared/data-state";
import { CostCategoryBadge } from "@/components/shared/status-badges";
import { CostFormDialog } from "@/components/costs/cost-form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteCost } from "@/lib/api";
import { COST_CATEGORIES } from "@/lib/constants";
import { formatDateTime, formatIDR } from "@/lib/format";
import type { CostWithTrip, OperationalCost, Trip } from "@/lib/types";

export function CostsTable({
  costs,
  trips,
  loading,
  error,
  reload,
  tripFilter,
  showTitleActions = true,
}: {
  costs: CostWithTrip[] | null;
  trips: Trip[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  tripFilter?: string;
  showTitleActions?: boolean;
}) {
  const [tripFilterState, setTripFilterState] = useState<string>(tripFilter ?? "all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OperationalCost | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = costs ?? [];
    if (tripFilterState !== "all") list = list.filter((c) => c.trip_id === tripFilterState);
    if (categoryFilter !== "all") list = list.filter((c) => c.category === categoryFilter);
    return list;
  }, [costs, tripFilterState, categoryFilter]);

  const total = useMemo(() => filtered.reduce((s, c) => s + c.amount_idr, 0), [filtered]);

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((c) => map.set(c.category, (map.get(c.category) ?? 0) + c.amount_idr));
    return map;
  }, [filtered]);

  const deleting = deleteId ? costs?.find((c) => c.id === deleteId) : null;

  return (
    <div>
      {/* Ringkasan per kategori */}
      {filtered.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {COST_CATEGORIES.filter((c) => categoryTotals.has(c)).map((cat) => (
            <div key={cat} className="rounded-lg border px-3 py-2">
              <div className="text-xs text-muted-foreground">{cat}</div>
              <div className="text-sm font-semibold tabular-nums">{formatIDR(categoryTotals.get(cat) ?? 0)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={tripFilterState} onValueChange={(v) => setTripFilterState(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Semua trip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua trip</SelectItem>
              {trips.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Semua kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kategori</SelectItem>
              {COST_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{formatIDR(total)}</span>
          </span>
        </div>
        {showTitleActions && (
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} disabled={trips.length === 0}>
            <Plus /> Catat Biaya
          </Button>
        )}
      </div>

      {error && <div className="mb-4"><ErrorState message={error} onRetry={reload} /></div>}

      {loading && <LoadingRows rows={4} height="h-12" />}

      {!loading && costs && filtered.length === 0 && (
        <EmptyState
          icon={Wallet}
          title="Belum ada biaya operasional"
          description="Catat pengeluaran selama trip agar estimasi keuntungan akurat."
          action={
            showTitleActions ? (
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus /> Catat Biaya
              </Button>
            ) : undefined
          }
        />
      )}

      {!loading && costs && filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Trip</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Nominal (IDR)</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Dicatat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell className="font-medium">{cost.trip.name}</TableCell>
                  <TableCell>
                    <CostCategoryBadge category={cost.category} />
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatIDR(cost.amount_idr)}
                  </TableCell>
                  <TableCell className="max-w-64">
                    <span className="line-clamp-2 whitespace-normal text-sm text-muted-foreground">
                      {cost.notes ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(cost.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        title="Edit"
                        onClick={() => { setEditing(cost); setFormOpen(true); }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        title="Hapus"
                        onClick={() => setDeleteId(cost.id)}
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

      <CostFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        cost={editing}
        trips={trips}
        defaultTripId={tripFilter !== "all" && tripFilter ? tripFilter : undefined}
        onSaved={reload}
      />

      <ConfirmDelete
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Hapus biaya ini?"
        description={deleting ? `"${deleting.category} — ${formatIDR(deleting.amount_idr)}" akan dihapus permanen.` : "Biaya akan dihapus permanen."}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteCost(deleteId);
          setDeleteId(null);
          reload();
        }}
      />
    </div>
  );
}
