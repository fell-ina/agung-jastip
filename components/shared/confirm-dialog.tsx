"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function ConfirmDelete({
  title,
  description,
  confirmLabel = "Hapus",
  successMessage = "Data berhasil dihapus",
  onConfirm,
  trigger,
  open,
  onOpenChange,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  successMessage?: string;
  onConfirm: () => Promise<void>;
  /** Bila tidak diisi, tombol hapus kecil akan dirender sebagai trigger. */
  trigger?: React.ReactNode;
  /** Mode terkontrol — pasang bersama onOpenChange bila trigger dipicu dari luar. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled && onOpenChange) onOpenChange(value);
    else setInternalOpen(value);
  };

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
      toast.success(successMessage);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={currentOpen} onOpenChange={setOpen}>
      {!isControlled && (
        <AlertDialogTrigger
          render={
            trigger ? (
              (trigger as React.ReactElement)
            ) : (
              <Button variant="ghost" size="icon-sm" aria-label="Hapus" />
            )
          }
        >
          {trigger ? null : <Trash2 />}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)}>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? "Menghapus..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
