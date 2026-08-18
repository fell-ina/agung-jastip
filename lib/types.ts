export type TripStatus = "Planning" | "On Trip" | "Completed" | "Cancelled";

export type ShippingMethod = "Handcarry" | "Express" | "Cargo Laut";

export type OrderStatus =
  | "Pending"
  | "DP Paid"
  | "Full Paid"
  | "Out of Stock/Refund";

export type CostCategory =
  | "Makan"
  | "Cargo"
  | "Transport"
  | "Akomodasi"
  | "Lainnya";

export interface Trip {
  id: string;
  name: string;
  destination: string;
  /** YYYY-MM-DD */
  start_date: string;
  /** YYYY-MM-DD */
  end_date: string;
  /** 1 satuan mata uang asing = target_kurs IDR */
  target_kurs: number;
  status: TripStatus;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  whatsapp_number: string;
  address: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  /** null = pesanan tanpa trip (jastip langsung) */
  trip_id: string | null;
  item_name: string;
  /** harga 1 item dalam mata uang asing */
  item_price_foreign: number;
  foreign_currency: string;
  /** 1 satuan asing = exchange_rate_used IDR */
  exchange_rate_used: number;
  /** harga jual 1 item dalam IDR */
  calculated_price_idr: number;
  quantity: number;
  shipping_method: ShippingMethod;
  status: OrderStatus;
  /** total nominal yang sudah dibayar customer (IDR) */
  paid_amount_idr: number;
  payment_proof_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface OrderWithRelations extends Order {
  customer: Customer;
  trip: Trip;
}

export interface OperationalCost {
  id: string;
  trip_id: string;
  category: CostCategory;
  amount_idr: number;
  notes: string | null;
  created_at: string;
}

export interface CostWithTrip extends OperationalCost {
  trip: Trip;
}
