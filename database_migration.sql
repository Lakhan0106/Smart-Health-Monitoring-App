-- Migration: Add locations table and missing caretaker assignment policies for caretaker-patient assignment system
-- This migration adds support for real-time location tracking and ensures proper caretaker-patient relationships

-- Create locations table for storing live GPS updates from patient devices
CREATE TABLE IF NOT EXISTS locations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy FLOAT,
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on locations table
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_locations_user_created_at ON locations(user_id, created_at DESC);

-- Note: caretaker_assignments table already exists in the main schema with UUID primary keys
-- We're only adding the locations table and ensuring proper policies exist

-- RLS POLICIES

-- Note: The existing profiles table already has proper policies in the main schema:
-- - Users can view their own profile (auth.uid() = id)
-- - Caretakers can view assigned patients' profiles (via caretaker_assignments table)
-- We need to ensure these policies exist and are working correctly

-- Drop any conflicting policies that might cause infinite recursion
DROP POLICY IF EXISTS "caretaker_can_list_patients" ON profiles;

-- Ensure the basic user profile access policy exists
-- This should allow users to access their own profile
CREATE POLICY IF NOT EXISTS "users_can_access_own_profile" ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Policies for locations table:

-- Policy: Patients can insert their own location
CREATE POLICY IF NOT EXISTS "patient_insert_location" ON locations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Patients can view their own locations
CREATE POLICY IF NOT EXISTS "patient_select_own_locations" ON locations
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Caretakers can view locations of patients assigned to them
CREATE POLICY IF NOT EXISTS "caretaker_view_assigned_locations" ON locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM caretaker_assignments ca
    WHERE ca.caretaker_id = auth.uid() AND ca.patient_id = locations.user_id
  )
  OR auth.uid() = user_id
);

-- Note: The caretaker_assignments table already has proper policies in the main schema:
-- - Caretakers can view their assignments
-- - Caretakers can create assignments
-- - Caretakers can delete their assignments
-- - Patients can view who is monitoring them

-- Migration: Add emergency alert system with guardians and alerts_log tables
-- This migration adds support for manual emergency alerts and guardian management

-- Create guardians table for storing patient emergency contacts (updated for email)
CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create alerts_log table for tracking sent emergency alerts
CREATE TABLE IF NOT EXISTS alerts_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id),
  guardian_id UUID REFERENCES guardians(id),
  message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts_log ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_guardians_patient_id ON guardians(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_log_patient_id ON alerts_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_log_guardian_id ON alerts_log(guardian_id);
CREATE INDEX IF NOT EXISTS idx_alerts_log_sent_at ON alerts_log(sent_at DESC);

-- RLS POLICIES for guardians table

-- Policy: Patients can view their own guardians
CREATE POLICY IF NOT EXISTS "patients_can_view_own_guardians" ON guardians
FOR SELECT
USING (auth.uid() = patient_id);

-- Policy: Patients can insert their own guardians
CREATE POLICY IF NOT EXISTS "patients_can_insert_own_guardians" ON guardians
FOR INSERT
WITH CHECK (auth.uid() = patient_id);

-- Policy: Patients can update their own guardians
CREATE POLICY IF NOT EXISTS "patients_can_update_own_guardians" ON guardians
FOR UPDATE
USING (auth.uid() = patient_id);

-- Policy: Patients can delete their own guardians
CREATE POLICY IF NOT EXISTS "patients_can_delete_own_guardians" ON guardians
FOR DELETE
USING (auth.uid() = patient_id);

-- RLS POLICIES for alerts_log table

-- Policy: Patients can view their own alert logs
CREATE POLICY IF NOT EXISTS "patients_can_view_own_alerts_log" ON alerts_log
FOR SELECT
USING (auth.uid() = patient_id);

-- Policy: Patients can insert their own alert logs
CREATE POLICY IF NOT EXISTS "patients_can_insert_own_alerts_log" ON alerts_log
FOR INSERT
WITH CHECK (auth.uid() = patient_id);

-- Policy: Guardians can view alert logs (for future guardian dashboard feature)
CREATE POLICY IF NOT EXISTS "guardians_can_view_alerts_log" ON alerts_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM guardians g
    WHERE g.id = alerts_log.guardian_id
    AND g.patient_id = auth.uid()
  )
);

-- Note: The existing alerts table already has policies for manual alerts
-- The new alerts_log table is specifically for tracking SMS alert deliveries
