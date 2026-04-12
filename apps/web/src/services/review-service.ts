import { supabase } from '@/lib/supabase/client'
import type { ReviewSession, ReviewRecord, ReviewRecordWithPrescription, SessionStatus, ReviewResult } from '@repo/shared'

export async function createSession(params: {
  reviewerName: string
  targetCount: number
  filterStartDate: string | null
  filterEndDate: string | null
  filterDepartment: string | null
}): Promise<ReviewSession> {
  const { data, error } = await supabase
    .from('review_sessions')
    .insert({
      reviewer_name: params.reviewerName,
      target_count: params.targetCount,
      filter_start_date: params.filterStartDate,
      filter_end_date: params.filterEndDate,
      filter_department: params.filterDepartment,
    })
    .select()
    .single()
  if (error) throw error
  return data as ReviewSession
}

export async function getInProgressSession(): Promise<ReviewSession | null> {
  const { data, error } = await supabase
    .from('review_sessions')
    .select('*')
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as ReviewSession | null
}

export async function addReviewRecord(
  sessionId: string,
  prescriptionId: string,
  result: ReviewResult,
  failReason?: string
): Promise<ReviewRecord> {
  const { data, error } = await supabase
    .from('review_records')
    .insert({
      session_id: sessionId,
      prescription_id: prescriptionId,
      result,
      fail_reason: failReason || null,
    })
    .select()
    .single()
  if (error) throw error

  // Update session counts
  const { data: session } = await supabase
    .from('review_sessions')
    .select('actual_count, pass_count, fail_count')
    .eq('id', sessionId)
    .single()
  if (session) {
    await supabase
      .from('review_sessions')
      .update({
        actual_count: session.actual_count + 1,
        pass_count: result === 'pass' ? session.pass_count + 1 : session.pass_count,
        fail_count: result === 'fail' ? session.fail_count + 1 : session.fail_count,
      })
      .eq('id', sessionId)
  }

  return data as ReviewRecord
}

export async function finishSession(sessionId: string, status: SessionStatus): Promise<void> {
  const { error } = await supabase
    .from('review_sessions')
    .update({
      status,
      finished_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
  if (error) throw error
}

export async function getReviewedPrescriptionIds(sessionId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('review_records')
    .select('prescription_id')
    .eq('session_id', sessionId)
  if (error) throw error
  return (data || []).map((r) => r.prescription_id)
}

export async function getSessionWithRecords(sessionId: string): Promise<{
  session: ReviewSession
  records: ReviewRecordWithPrescription[]
}> {
  const { data: session, error: sessionError } = await supabase
    .from('review_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
  if (sessionError) throw sessionError

  const { data: records, error: recordsError } = await supabase
    .from('review_records')
    .select(`
      *,
      prescriptions (
        id, prescription_no, prescribe_date, patient_name,
        gender, age, department, diagnosis,
        prescription_items (drug_name, dispense_qty)
      )
    `)
    .eq('session_id', sessionId)
    .order('reviewed_at', { ascending: true })
  if (recordsError) throw recordsError

  return {
    session: session as ReviewSession,
    records: (records || []) as ReviewRecordWithPrescription[],
  }
}

export async function getHistorySessions(): Promise<ReviewSession[]> {
  const { data, error } = await supabase
    .from('review_sessions')
    .select('*')
    .in('status', ['completed', 'terminated'])
    .order('started_at', { ascending: false })
  if (error) throw error
  return (data || []) as ReviewSession[]
}
