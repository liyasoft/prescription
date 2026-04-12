export interface Database {
  public: {
    Tables: {
      prescriptions: {
        Row: {
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
        Insert: {
          id?: string
          prescription_no: string
          prescribe_date: string
          dispense_date?: string | null
          type: string
          patient_name: string
          gender?: string | null
          age?: string | null
          weight?: string | null
          department: string
          diagnosis?: string | null
          phone?: string | null
          dispense_window?: string | null
          prepare_window?: string | null
          print_flag?: string | null
          remark?: string | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          prescription_no?: string
          prescribe_date?: string
          dispense_date?: string | null
          type?: string
          patient_name?: string
          gender?: string | null
          age?: string | null
          weight?: string | null
          department?: string
          diagnosis?: string | null
          phone?: string | null
          dispense_window?: string | null
          prepare_window?: string | null
          print_flag?: string | null
          remark?: string | null
          status?: string | null
          created_at?: string
        }
        Relationships: [{
          foreignKeyName: ""
          columns: []
          isOneToOne: false
          referencedRelation: ""
          referencedColumns: []
        }]
      }
      prescription_items: {
        Row: {
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
        Insert: {
          id?: string
          prescription_id: string
          drug_name: string
          drug_spec?: string | null
          manufacturer?: string | null
          batch_no?: string | null
          expiry_date?: string | null
          supplier?: string | null
          dispense_qty?: string | null
          prescription_doses?: string | null
          single_dose?: string | null
          single_dose_unit?: string | null
          retail_price?: number | null
          subtotal?: number | null
          stock_qty?: number | null
          trade_name?: string | null
          insurance_level?: string | null
          usage_method?: string | null
          frequency?: string | null
          skin_test?: string | null
          doctor_advice?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          prescription_id?: string
          drug_name?: string
          drug_spec?: string | null
          manufacturer?: string | null
          batch_no?: string | null
          expiry_date?: string | null
          supplier?: string | null
          dispense_qty?: string | null
          prescription_doses?: string | null
          single_dose?: string | null
          single_dose_unit?: string | null
          retail_price?: number | null
          subtotal?: number | null
          stock_qty?: number | null
          trade_name?: string | null
          insurance_level?: string | null
          usage_method?: string | null
          frequency?: string | null
          skin_test?: string | null
          doctor_advice?: string | null
          created_at?: string
        }
        Relationships: [{
          foreignKeyName: "prescription_items_prescription_id_fkey"
          columns: ["prescription_id"]
          isOneToOne: false
          referencedRelation: "prescriptions"
          referencedColumns: ["id"]
        }]
      }
      review_sessions: {
        Row: {
          id: string
          reviewer_name: string
          target_count: number
          actual_count: number
          pass_count: number
          fail_count: number
          filter_start_date: string | null
          filter_end_date: string | null
          filter_department: string | null
          status: string
          started_at: string
          finished_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reviewer_name: string
          target_count: number
          actual_count?: number
          pass_count?: number
          fail_count?: number
          filter_start_date?: string | null
          filter_end_date?: string | null
          filter_department?: string | null
          status?: string
          started_at?: string
          finished_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reviewer_name?: string
          target_count?: number
          actual_count?: number
          pass_count?: number
          fail_count?: number
          filter_start_date?: string | null
          filter_end_date?: string | null
          filter_department?: string | null
          status?: string
          started_at?: string
          finished_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      review_records: {
        Row: {
          id: string
          session_id: string
          prescription_id: string
          result: string
          fail_reason: string | null
          reviewed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          prescription_id: string
          result: string
          fail_reason?: string | null
          reviewed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          prescription_id?: string
          result?: string
          fail_reason?: string | null
          reviewed_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "review_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_records_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
