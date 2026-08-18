-- ============================================================
-- AGUNG JASTIP — Manajemen Jasa Titip (Jastip)
-- Jalankan file ini di Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ============ TABEL: TRIPS ============
create table if not exists public.trips (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                            -- nama trip, mis. "Trip Jepang #3"
  destination   text not null,                            -- tujuan, mis. "Tokyo, Jepang"
  start_date    date not null,
  end_date      date not null,
  target_kurs   numeric(14,2) not null default 0,          -- kurs beli target (mis. 1 JPY = 11.200 IDR)
  status        text not null default 'Planning'
                check (status in ('Planning', 'On Trip', 'Completed', 'Cancelled')),
  created_at    timestamptz not null default now()
);

-- ============ TABEL: CUSTOMERS ============
create table if not exists public.customers (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  whatsapp_number  text not null,
  address          text,
  created_at       timestamptz not null default now()
);

-- ============ TABEL: ORDERS ============
create table if not exists public.orders (
  id                    uuid primary key default gen_random_uuid(),
  customer_id           uuid not null references public.customers(id) on delete restrict,
  trip_id               uuid references public.trips(id) on delete restrict,  -- boleh NULL: pesanan tanpa trip (jastip langsung)
  item_name             text not null,
  item_price_foreign    numeric(14,2) not null,            -- harga 1 item di mata uang asing
  foreign_currency      text not null default 'JPY',       -- mis. JPY, KRW, USD, SGD
  exchange_rate_used    numeric(14,2) not null,            -- kurs yang dipakai (1 satuan asing = X IDR)
  calculated_price_idr  numeric(14,2) not null,            -- harga jual 1 item dalam IDR
  quantity              integer not null default 1 check (quantity > 0),
  shipping_method       text not null default 'Handcarry'
                        check (shipping_method in ('Handcarry', 'Express', 'Cargo Laut')),
  status                text not null default 'Pending'
                        check (status in ('Pending', 'DP Paid', 'Full Paid', 'Out of Stock/Refund')),
  paid_amount_idr       numeric(14,2) not null default 0,  -- total nominal yang sudah dibayar customer
  payment_proof_url     text,                              -- link/URL bukti transfer
  notes                 text,
  created_at            timestamptz not null default now()
);

-- ============ TABEL: OPERATIONAL_COSTS ============
create table if not exists public.operational_costs (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  category    text not null
              check (category in ('Makan', 'Cargo', 'Transport', 'Akomodasi', 'Lainnya')),
  amount_idr  numeric(14,2) not null check (amount_idr >= 0),
  notes       text,
  created_at  timestamptz not null default now()
);

-- ============ INDEX ============
-- Migrasi dari versi lama: trip_id tadinya NOT NULL → jadikan nullable.
-- Aman dijalankan berulang kali (idempotent).
alter table public.orders alter column trip_id drop not null;

create index if not exists idx_orders_trip_id     on public.orders (trip_id);
create index if not exists idx_orders_customer_id on public.orders (customer_id);
create index if not exists idx_orders_status      on public.orders (status);
create index if not exists idx_costs_trip_id      on public.operational_costs (trip_id);
create index if not exists idx_trips_status       on public.trips (status);

-- ============ ROW LEVEL SECURITY ============
-- Aplikasi ini dipakai oleh satu orang pemilik usaha (single-user, tanpa login).
-- RLS dibuka penuh untuk anon key agar app langsung berfungsi setelah setup.
-- Jika nanti ingin proteksi: buat tabel profiles + Auth, lalu ganti policy di bawah
-- menjadi `auth.uid() = ...` sesuai kebutuhan.

alter table public.trips             enable row level security;
alter table public.customers         enable row level security;
alter table public.orders            enable row level security;
alter table public.operational_costs enable row level security;

drop policy if exists "trips anon all"             on public.trips;
drop policy if exists "customers anon all"         on public.customers;
drop policy if exists "orders anon all"            on public.orders;
drop policy if exists "operational_costs anon all" on public.operational_costs;

create policy "trips anon all"
  on public.trips for all to anon, authenticated
  using (true) with check (true);

create policy "customers anon all"
  on public.customers for all to anon, authenticated
  using (true) with check (true);

create policy "orders anon all"
  on public.orders for all to anon, authenticated
  using (true) with check (true);

create policy "operational_costs anon all"
  on public.operational_costs for all to anon, authenticated
  using (true) with check (true);

-- ============ CONTOH DATA AWAL (opsional — hapus jika tidak ingin) ============
-- insert into public.trips (name, destination, start_date, end_date, target_kurs, status)
-- values ('Trip Jepang #1', 'Tokyo & Osaka, Jepang', current_date, current_date + 7, 11200, 'Planning');
