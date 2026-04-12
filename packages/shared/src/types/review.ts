export type ReviewResult = 'pass' | 'fail'
export type SessionStatus = 'in_progress' | 'completed' | 'terminated'

export interface ReviewSession {
  id: string
  reviewer_name: string
  target_count: number
  actual_count: number
  pass_count: number
  fail_count: number
  filter_start_date: string | null
  filter_end_date: string | null
  filter_department: string | null
  status: SessionStatus
  started_at: string
  finished_at: string | null
  created_at: string
}

export interface ReviewRecord {
  id: string
  session_id: string
  prescription_id: string
  result: ReviewResult
  fail_reason: string | null
  reviewed_at: string
  created_at: string
}

export interface ReviewRecordWithPrescription extends ReviewRecord {
  prescriptions: {
    id: string
    prescription_no: string
    prescribe_date: string
    patient_name: string
    gender: string | null
    age: string | null
    department: string
    diagnosis: string | null
    prescription_items: {
      drug_name: string
      dispense_qty: string | null
    }[]
  }
}

export interface DepartmentStats {
  department: string
  total: number
  pass: number
  fail: number
}

export interface ReviewReport {
  session: ReviewSession
  departmentStats: DepartmentStats[]
  failedRecords: ReviewRecordWithPrescription[]
}
