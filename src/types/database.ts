export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          age: number
          email: string
          gender: string
          phone: string
          role: 'Patient' | 'Caretaker'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          age: number
          email: string
          gender: string
          phone: string
          role: 'Patient' | 'Caretaker'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          age?: number
          email?: string
          gender?: string
          phone?: string
          role?: 'Patient' | 'Caretaker'
          created_at?: string
          updated_at?: string
        }
      }
      sensor_data: {
        Row: {
          id: number
          created_at: string
          rr_interval: number | null
          bpm: number | null
          accel_x: number | null
          accel_y: number | null
          accel_z: number | null
          raw_values: string | null
          patient_id?: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          rr_interval?: number | null
          bpm?: number | null
          accel_x?: number | null
          accel_y?: number | null
          accel_z?: number | null
          raw_values?: string | null
          patient_id?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          rr_interval?: number | null
          bpm?: number | null
          accel_x?: number | null
          accel_y?: number | null
          accel_z?: number | null
          raw_values?: string | null
          patient_id?: string | null
        }
      }
      alerts: {
        Row: {
          id: string
          patient_id: string
          alert_type: 'Manual' | 'Auto' | 'Sensor_Fault'
          severity: 'Low' | 'Medium' | 'High' | 'Critical'
          message: string
          is_read: boolean
          latitude: number | null
          longitude: number | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          alert_type: 'Manual' | 'Auto' | 'Sensor_Fault'
          severity: 'Low' | 'Medium' | 'High' | 'Critical'
          message: string
          is_read?: boolean
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          alert_type?: 'Manual' | 'Auto' | 'Sensor_Fault'
          severity?: 'Low' | 'Medium' | 'High' | 'Critical'
          message?: string
          is_read?: boolean
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
      }
      caretaker_assignments: {
        Row: {
          id: string
          caretaker_id: string
          patient_id: string
          assigned_at: string
        }
        Insert: {
          id?: string
          caretaker_id: string
          patient_id: string
          assigned_at?: string
        }
        Update: {
          id?: string
          caretaker_id?: string
          patient_id?: string
          assigned_at?: string
        }
      }
      locations: {
        Row: {
          id: number
          user_id: string
          latitude: number
          longitude: number
          accuracy: number | null
          provider: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          latitude: number
          longitude: number
          accuracy?: number | null
          provider?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          latitude?: number
          longitude?: number
          accuracy?: number | null
          provider?: string | null
          created_at?: string
        }
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
  }
}
