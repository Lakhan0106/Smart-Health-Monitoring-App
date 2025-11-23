export interface User {
  id: string;
  name: string;
  age: number;
  email: string;
  gender: string;
  phone: string;
  role: 'Patient' | 'Caretaker';
}

export interface SensorData {
  id: string;
  patient_id: string;
  bpm: number;
  rr_interval: number | null;
  temperature: number | null;
  spo2: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  latitude: number | null;
  longitude: number | null;
  sensor_fault: boolean;
  created_at: string;
}

export interface Alert {
  id: string;
  patient_id: string;
  alert_type: 'Manual' | 'Auto' | 'Sensor_Fault';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  message: string;
  is_read: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface CaretakerAssignment {
  id: string;
  caretaker_id: string;
  patient_id: string;
  assigned_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
