-- Smart Health Monitoring App - Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles Table (User Details)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  email TEXT UNIQUE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Patient', 'Caretaker')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sensor Data Table (Health Metrics)
CREATE TABLE sensor_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bpm INTEGER NOT NULL,
  rr_interval INTEGER,
  temperature DECIMAL(4, 2),
  spo2 INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  sensor_fault BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts Table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('Manual', 'Auto', 'Sensor_Fault')),
  severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Caretaker Assignments Table
CREATE TABLE caretaker_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caretaker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(caretaker_id, patient_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE caretaker_assignments ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Caretakers can view assigned patients' profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM caretaker_assignments
      WHERE caretaker_id = auth.uid() AND patient_id = profiles.id
    )
  );

-- Sensor Data Policies
CREATE POLICY "Patients can view their own sensor data" ON sensor_data
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert their own sensor data" ON sensor_data
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Caretakers can view assigned patients' sensor data" ON sensor_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM caretaker_assignments
      WHERE caretaker_id = auth.uid() AND patient_id = sensor_data.patient_id
    )
  );

-- Alerts Policies
CREATE POLICY "Patients can view their own alerts" ON alerts
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert their own alerts" ON alerts
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Caretakers can view assigned patients' alerts" ON alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM caretaker_assignments
      WHERE caretaker_id = auth.uid() AND patient_id = alerts.patient_id
    )
  );

CREATE POLICY "Caretakers can update alert read status" ON alerts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM caretaker_assignments
      WHERE caretaker_id = auth.uid() AND patient_id = alerts.patient_id
    )
  );

-- Caretaker Assignments Policies
CREATE POLICY "Caretakers can view their assignments" ON caretaker_assignments
  FOR SELECT USING (auth.uid() = caretaker_id);

CREATE POLICY "Caretakers can create assignments" ON caretaker_assignments
  FOR INSERT WITH CHECK (auth.uid() = caretaker_id);

CREATE POLICY "Caretakers can delete their assignments" ON caretaker_assignments
  FOR DELETE USING (auth.uid() = caretaker_id);

CREATE POLICY "Patients can view who is monitoring them" ON caretaker_assignments
  FOR SELECT USING (auth.uid() = patient_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX idx_sensor_data_patient_id ON sensor_data(patient_id);
CREATE INDEX idx_sensor_data_created_at ON sensor_data(created_at DESC);
CREATE INDEX idx_alerts_patient_id ON alerts(patient_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_caretaker_assignments_caretaker_id ON caretaker_assignments(caretaker_id);
CREATE INDEX idx_caretaker_assignments_patient_id ON caretaker_assignments(patient_id);
