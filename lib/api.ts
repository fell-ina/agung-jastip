'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function fetchCustomers() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Environment variables NEXT_PUBLIC_SUPABASE_URL / ANON_KEY belum diset di Vercel')
  }
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
  if (error) {
    throw new Error(`[Supabase Error] ${error.message} (Code: ${error.code})`)
  }
  return JSON.parse(JSON.stringify(data ?? []))
}

export async function fetchOrders() {
  if (!supabaseUrl || !supabaseAnonKey) return []
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (error) {
    throw new Error(`[Supabase Error] ${error.message} (Code: ${error.code})`)
  }
  return JSON.parse(JSON.stringify(data ?? []))
}

export async function fetchTrips() {
  if (!supabaseUrl || !supabaseAnonKey) return []
  const { data, error } = await supabase.from('trips').select('*').order('created_at', { ascending: false })
  if (error) {
    throw new Error(`[Supabase Error] ${error.message} (Code: ${error.code})`)
  }
  return JSON.parse(JSON.stringify(data ?? []))
}

export async function fetchCosts() {
  if (!supabaseUrl || !supabaseAnonKey) return []
  const { data, error } = await supabase.from('operational_costs').select('*').order('created_at', { ascending: false })
  if (error) {
    throw new Error(`[Supabase Error] ${error.message} (Code: ${error.code})`)
  }
  return JSON.parse(JSON.stringify(data ?? []))
}

export async function createCustomer(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('customers').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data))
}

export async function updateCustomer(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('customers').update(payload).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data))
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}

export async function createTrip(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('trips').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data))
}

export async function updateTrip(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('trips').update(payload).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data))
}

export async function deleteTrip(id: string) {
  const { error } = await supabase.from('trips').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}

export async function createOrder(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('orders').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data))
}

export async function updateOrder(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('orders').update(payload).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data))
}

export async function deleteOrder(id: string) {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}

export async function createCost(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('operational_costs').insert([payload]).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data))
}

export async function updateCost(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('operational_costs').update(payload).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return JSON.parse(JSON.stringify(data))
}

export async function deleteCost(id: string) {
  const { error } = await supabase.from('operational_costs').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}