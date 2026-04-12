import { supabase } from '@/lib/supabase/client'
import type { PrescriptionWithItems } from '@repo/shared'

export async function fetchDepartments(): Promise<string[]> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('department')
  if (error) throw error
  const departments = [...new Set((data || []).map((r: any) => r.department as string))].sort()
  return departments
}

export async function queryPrescriptions(
  startDate: string,
  endDate: string,
  department?: string
): Promise<PrescriptionWithItems[]> {
  let query = supabase
    .from('prescriptions')
    .select('*, prescription_items(*)')
    .gte('prescribe_date', `${startDate}T00:00:00`)
    .lte('prescribe_date', `${endDate}T23:59:59`)
    .order('prescribe_date', { ascending: false })

  if (department && department !== 'all') {
    query = query.eq('department', department)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []) as PrescriptionWithItems[]
}

export async function getPrescriptionWithItems(id: string): Promise<PrescriptionWithItems | null> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*, prescription_items(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as PrescriptionWithItems
}
