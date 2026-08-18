'use server'

import { createClient } from '@supabase/supabase-js'
import type { CostWithTrip, Customer, OperationalCost, Order, OrderWithRelations, Trip } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- EXPORT TYPES ---
export type CostInput = Record<string, unknown>
export type OrderInput = Record<string, unknown>

// --- CUSTOMERS ---
export async function fetchCustomers(): Promise<Customer[]> {
  if (!supabaseUrl || !supabaseAnonKey) return []
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(`[Supabase Error] ${error.message}`)
  return JSON.parse(JSON.stringify(data ?? [])) as Customer[]
}

export async function createCustomer(payload: Record<string, unknown>): Promise<Customer> {
  const { data, error } = await supabase.from('customers').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data)) as Customer
}

export async function updateCustomer(id: string, payload: Record<string, unknown>): Promise<Customer> {
  const { data, error } = await supabase.from('customers').update(payload).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data)) as Customer
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}

// --- TRIPS ---
export async function fetchTrips(): Promise<Trip[]> {
  if (!supabaseUrl || !supabaseAnonKey) return []
  const { data, error } = await supabase.from('trips').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(`[Supabase Error] ${error.message}`)
  return JSON.parse(JSON.stringify(data ?? [])) as Trip[]
}

export async function createTrip(payload: Record<string, unknown>): Promise<Trip> {
  const { data, error } = await supabase.from('trips').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data)) as Trip
}

export async function updateTrip(id: string, payload: Record<string, unknown>): Promise<Trip> {
  const { data, error } = await supabase.from('trips').update(payload).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data)) as Trip
}

export async function deleteTrip(id: string): Promise<boolean> {
  const { error } = await supabase.from('trips').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}

// --- ORDERS (DENGAN RELASI CUSTOMER & TRIP) ---
export async function fetchOrders(): Promise<OrderWithRelations[]> {
  if (!supabaseUrl || !supabaseAnonKey) return []
  const { data, error } = await supabase
    .from('orders')
    .select('*, customer:customers(*), trip:trips(*)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`[Supabase Error] ${error.message}`)
  return JSON.parse(JSON.stringify(data ?? [])) as OrderWithRelations[]
}

export async function createOrder(payload: OrderInput): Promise<Order> {
  const { data, error } = await supabase.from('orders').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data)) as Order
}

export async function updateOrder(id: string, payload: OrderInput): Promise<Order> {
  const { data, error } = await supabase.from('orders').update(payload).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data)) as Order
}

export async function deleteOrder(id: string): Promise<boolean> {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}

// --- OPERATIONAL COSTS (DENGAN RELASI TRIP) ---
export async function fetchCosts(): Promise<CostWithTrip[]> {
  if (!supabaseUrl || !supabaseAnonKey) return []
  const { data, error } = await supabase
    .from('operational_costs')
    .select('*, trip:trips(*)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`[Supabase Error] ${error.message}`)
  return JSON.parse(JSON.stringify(data ?? [])) as CostWithTrip[]
}

export async function createCost(payload: CostInput): Promise<OperationalCost> {
  const { data, error } = await supabase.from('operational_costs').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data)) as OperationalCost
}

export async function updateCost(id: string, payload: CostInput): Promise<OperationalCost> {
  const { data, error } = await supabase.from('operational_costs').update(payload).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data)) as OperationalCost
}

export async function deleteCost(id: string): Promise<boolean> {
  const { error } = await supabase.from('operational_costs').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}