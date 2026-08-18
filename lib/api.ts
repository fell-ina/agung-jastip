'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- TYPES ---
export type CostInput = Record<string, unknown>
export type OrderInput = Record<string, unknown>

// --- CUSTOMERS ---
export async function fetchCustomers() {
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createCustomer(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('customers').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateCustomer(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('customers').update(payload).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}

// --- TRIPS ---
export async function fetchTrips() {
  const { data, error } = await supabase.from('trips').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createTrip(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('trips').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateTrip(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('trips').update(payload).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteTrip(id: string) {
  const { error } = await supabase.from('trips').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}

// --- ORDERS ---
export async function fetchOrders() {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createOrder(payload: OrderInput) {
  const { data, error } = await supabase.from('orders').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateOrder(id: string, payload: OrderInput) {
  const { data, error } = await supabase.from('orders').update(payload).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteOrder(id: string) {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}

// --- OPERATIONAL COSTS ---
export async function fetchCosts() {
  const { data, error } = await supabase.from('operational_costs').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createCost(payload: CostInput) {
  const { data, error } = await supabase.from('operational_costs').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateCost(id: string, payload: CostInput) {
  const { data, error } = await supabase.from('operational_costs').update(payload).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteCost(id: string) {
  const { error } = await supabase.from('operational_costs').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}