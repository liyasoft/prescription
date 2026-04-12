export interface Prescription {
  id: string
  prescription_no: string
  prescribe_date: string
  dispense_date: string | null
  type: string
  patient_name: string
  gender: string | null
  age: string | null
  weight: string | null
  department: string
  diagnosis: string | null
  phone: string | null
  dispense_window: string | null
  prepare_window: string | null
  print_flag: string | null
  remark: string | null
  status: string | null
  created_at: string
}

export interface PrescriptionItem {
  id: string
  prescription_id: string
  drug_name: string
  drug_spec: string | null
  manufacturer: string | null
  batch_no: string | null
  expiry_date: string | null
  supplier: string | null
  dispense_qty: string | null
  prescription_doses: string | null
  single_dose: string | null
  single_dose_unit: string | null
  retail_price: number | null
  subtotal: number | null
  stock_qty: number | null
  trade_name: string | null
  insurance_level: string | null
  usage_method: string | null
  frequency: string | null
  skin_test: string | null
  doctor_advice: string | null
  created_at: string
}

export interface PrescriptionWithItems extends Prescription {
  prescription_items: PrescriptionItem[]
}
