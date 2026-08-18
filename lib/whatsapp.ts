"use client";

import { APP_NAME, NO_TRIP_LABEL } from "@/lib/constants";
import { currencySymbol, formatIDR, formatNumber, normalizePhone } from "@/lib/format";

/** Identitas pemilik — sesuaikan dengan data rekening asli. */
export const OWNER_NAME = "Agung";
export const BANK_NAME = "BCA";
export const ACCOUNT_NUMBER = "0000-0000-0000-0000";
export const ACCOUNT_NAME = "AGUNG";

export function buildWaLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

interface InvoiceInput {
  customerName: string;
  itemName: string;
  quantity: number;
  currency: string;
  priceForeign: number;
  rate: number;
  totalIdr: number;
  paidIdr: number;
  shippingMethod: string;
  tripName: string;
}

/** Narasi tagihan (sisa tagihan + rincian + instruksi transfer). */
export function buildInvoiceMessage(input: InvoiceInput): string {
  const {
    customerName,
    itemName,
    quantity,
    currency,
    priceForeign,
    rate,
    totalIdr,
    paidIdr,
    shippingMethod,
    tripName,
  } = input;
  const remaining = Math.max(0, totalIdr - paidIdr);
  const symbol = currencySymbol(currency);
  const subtotal = priceForeign * quantity;
  const hasTrip = Boolean(tripName && tripName !== NO_TRIP_LABEL);

  const lines = [
    `Halo Kak *${customerName}*! 👋`,
    `Ini *${OWNER_NAME}* dari *${APP_NAME}* 😊`,
    "",
    "Kak, berikut rincian pesanan Kakak:",
    "",
    `📦 *Barang:* ${itemName}`,
    `🔢 *Jumlah:* ${quantity} pcs`,
    `🌍 *Harga:* ${symbol}${formatNumber(subtotal)} (${symbol}${formatNumber(priceForeign)}/pcs)`,
    `💱 *Kurs:* 1 ${currency} = Rp ${formatNumber(rate)}`,
    `💰 *Total:* ${formatIDR(totalIdr)}`,
    `✅ *Sudah dibayar:* ${formatIDR(paidIdr)}`,
    `⏳ *Sisa tagihan:* *${formatIDR(remaining)}*`,
    `📬 *Pengiriman:* ${shippingMethod}`,
    ...(hasTrip ? [`🧳 *Trip:* ${tripName}`] : []),
    "",
    "Untuk pelunasan, silakan transfer ke:",
    `🏦 *${BANK_NAME}*`,
    `🔢 *${ACCOUNT_NUMBER}*`,
    `👤 *a.n. ${ACCOUNT_NAME}*`,
    "",
    "Setelah transfer, mohon kirim *bukti transfer* ke nomor ini ya, Kak 🙏",
    "Terima kasih sudah jastip di Agung Jastip! 🛍️✨",
  ];

  return lines.join("\n");
}

interface RefundInput {
  customerName: string;
  itemName: string;
  quantity: number;
  totalIdr: number;
}

/** Narasi pemberitahuan barang habis + konfirmasi rekening refund. */
export function buildRefundMessage(input: RefundInput): string {
  const { customerName, itemName, quantity, totalIdr } = input;

  const lines = [
    `Halo Kak *${customerName}*! 👋`,
    `Ini *${OWNER_NAME}* dari *${APP_NAME}* 😊`,
    "",
    "Kak, mohon maaf banget 🙏",
    "Untuk pesanan berikut ini:",
    "",
    `📦 *Barang:* ${itemName}`,
    `🔢 *Jumlah:* ${quantity} pcs`,
    `💰 *Nilai pesanan:* ${formatIDR(totalIdr)}`,
    "",
    "Barangnya ternyata *habis / tidak tersedia* di tempat tujuan, sehingga kami akan mengembalikan dana (*refund 100%*) kepada Kakak.",
    "",
    "Mohon konfirmasikan *nomor rekening tujuan refund* Kakak ya:",
    "- Nama bank:",
    "- No. rekening:",
    "- a.n.:",
    "",
    "Terima kasih atas pengertiannya, Kak 🙏",
  ];

  return lines.join("\n");
}
