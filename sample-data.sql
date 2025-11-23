-- Sample data insertion script for testing Live Heart Dashboard
-- This script adds realistic sensor data to the sensordata table

-- Insert sample sensor data for testing (100 records)
INSERT INTO sensordata (rr_interval, bpm, accel_x, accel_y, accel_z, raw_values)
SELECT
  -- R-R interval (700-900 ms, normal range)
  (700 + (random() * 200))::FLOAT AS rr_interval,

  -- BPM (50-70 BPM, normal resting range)
  (50 + (random() * 20))::FLOAT AS bpm,

  -- Accelerometer X-axis (-1.0 to +1.0)
  (random() * 2 - 1)::FLOAT AS accel_x,

  -- Accelerometer Y-axis (-1.0 to +1.0)
  (random() * 2 - 1)::FLOAT AS accel_y,

  -- Accelerometer Z-axis (around 9.8 m/s²)
  (9.6 + random() * 0.4)::FLOAT AS accel_z,

  -- Raw ECG values (50 comma-separated values)
  array_to_string(
    ARRAY(
      SELECT to_char((random() * 2 - 1) * 1000, 'FM999999.000')
      FROM generate_series(1, 50)
    ), ','
  ) AS raw_values
FROM generate_series(1, 100);

-- Insert some abnormal readings for testing alerts
-- High BPM (120+ BPM)
INSERT INTO sensordata (rr_interval, bpm, accel_x, accel_y, accel_z, raw_values)
SELECT
  (400 + (random() * 100))::FLOAT AS rr_interval,  -- Faster heart rate
  (110 + (random() * 20))::FLOAT AS bpm,           -- High BPM
  (random() * 2 - 1)::FLOAT AS accel_x,
  (random() * 2 - 1)::FLOAT AS accel_y,
  (9.6 + random() * 0.4)::FLOAT AS accel_z,
  array_to_string(
    ARRAY(
      SELECT to_char((random() * 2 - 1) * 1000, 'FM999999.000')
      FROM generate_series(1, 50)
    ), ','
  ) AS raw_values
FROM generate_series(1, 5);

-- Insert some low BPM readings
INSERT INTO sensordata (rr_interval, bpm, accel_x, accel_y, accel_z, raw_values)
SELECT
  (1200 + (random() * 200))::FLOAT AS rr_interval,  -- Slower heart rate
  (45 + (random() * 10))::FLOAT AS bpm,             -- Low BPM
  (random() * 2 - 1)::FLOAT AS accel_x,
  (random() * 2 - 1)::FLOAT AS accel_y,
  (9.6 + random() * 0.4)::FLOAT AS accel_z,
  array_to_string(
    ARRAY(
      SELECT to_char((random() * 2 - 1) * 1000, 'FM999999.000')
      FROM generate_series(1, 50)
    ), ','
  ) AS raw_values
FROM generate_series(1, 3);

-- Insert some critical BPM readings
INSERT INTO sensordata (rr_interval, bpm, accel_x, accel_y, accel_z, raw_values)
SELECT
  (300 + (random() * 100))::FLOAT AS rr_interval,   -- Very fast heart rate
  (140 + (random() * 20))::FLOAT AS bpm,            -- Critical high BPM
  (random() * 2 - 1)::FLOAT AS accel_x,
  (random() * 2 - 1)::FLOAT AS accel_y,
  (9.6 + random() * 0.4)::FLOAT AS accel_z,
  array_to_string(
    ARRAY(
      SELECT to_char((random() * 2 - 1) * 1000, 'FM999999.000')
      FROM generate_series(1, 50)
    ), ','
  ) AS raw_values
FROM generate_series(1, 2);

-- Insert sample location data for testing the map
-- These are realistic coordinates for testing (various locations in India)
INSERT INTO locations (user_id, latitude, longitude, accuracy, provider) VALUES
-- Patient 1: Delhi area
((SELECT id FROM profiles WHERE role = 'Patient' LIMIT 1), 28.6139, 77.2090, 10.5, 'gps'),

-- Patient 2: Mumbai area (if exists)
((SELECT id FROM profiles WHERE role = 'Patient' LIMIT 1 OFFSET 1), 19.0760, 72.8777, 8.2, 'gps'),

-- Patient 3: Bangalore area (if exists)
((SELECT id FROM profiles WHERE role = 'Patient' LIMIT 1 OFFSET 2), 12.9716, 77.5946, 12.1, 'gps'),

-- Patient 4: Chennai area (if exists)
((SELECT id FROM profiles WHERE role = 'Patient' LIMIT 1 OFFSET 3), 13.0827, 80.2707, 9.8, 'gps'),

-- Patient 5: Kolkata area (if exists)
((SELECT id FROM profiles WHERE role = 'Patient' LIMIT 1 OFFSET 4), 22.5726, 88.3639, 11.3, 'gps');

-- Add some recent location updates (within last hour)
INSERT INTO locations (user_id, latitude, longitude, accuracy, provider)
SELECT
  p.id,
  -- Slightly different coordinates for recent updates
  CASE
    WHEN p.id = (SELECT id FROM profiles WHERE role = 'Patient' LIMIT 1) THEN 28.6145
    WHEN p.id = (SELECT id FROM profiles WHERE role = 'Patient' LIMIT 1 OFFSET 1) THEN 19.0765
    WHEN p.id = (SELECT id FROM profiles WHERE role = 'Patient' LIMIT 1 OFFSET 2) THEN 12.9720
    WHEN p.id = (SELECT id FROM profiles WHERE role = 'Patient' LIMIT 1 OFFSET 3) THEN 13.0830
    ELSE 22.5730
  END as lat,
  CASE
    WHEN p.id = (SELECT id FROM profiles WHERE role = 'Patient' LIMIT 1) THEN 77.2095
    WHEN p.id = (SELECT id FROM profiles WHERE role = 'Patient' LIMIT 1 OFFSET 1) THEN 72.8780
    WHEN p.id = (SELECT id FROM profiles WHERE role = 'Patient' LIMIT 1 OFFSET 2) THEN 77.5950
    WHEN p.id = (SELECT id FROM profiles WHERE role = 'Patient' LIMIT 1 OFFSET 3) THEN 80.2710
    ELSE 88.3645
  END as lng,
  (random() * 15 + 5)::FLOAT as accuracy,
  'gps' as provider
FROM profiles p
WHERE p.role = 'Patient'
  AND p.id IN (SELECT user_id FROM locations) -- Only for patients who already have location data
  AND random() > 0.5; -- Randomly add recent updates for some patients

SELECT 'Sample location data inserted successfully' as status;
