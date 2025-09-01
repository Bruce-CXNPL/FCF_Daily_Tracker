-- Seed script for productivity tracker database
-- This script populates the database with initial data

-- Insert staff members
INSERT INTO staff (name, is_active) VALUES
  ('John Smith', true),
  ('Sarah Johnson', true),
  ('Mike Chen', true),
  ('Emma Wilson', true),
  ('David Brown', true),
  ('Lisa Anderson', false); -- Inactive staff member for testing

-- Insert task categories and tasks
-- ONBOARDING
INSERT INTO tasks (name, category, expected_duration_minutes) VALUES
  ('Manual reviews', 'ONBOARDING', 30),
  ('Ownership reviews', 'ONBOARDING', 25),
  ('Blocklist hits', 'ONBOARDING', 15),
  ('ECDD', 'ONBOARDING', 45),
  ('KYC refresh', 'ONBOARDING', 20),
  ('Manual KYC Verification', 'ONBOARDING', 35);

-- FRAUD
INSERT INTO tasks (name, category, expected_duration_minutes) VALUES
  ('Fraud queue - Card', 'FRAUD', 20),
  ('Fraud queue - Transfer', 'FRAUD', 25),
  ('Fraud Reports (in and out)', 'FRAUD', 30),
  ('Indemnities', 'FRAUD', 40),
  ('Feedzai Failure Reconciliation', 'FRAUD', 15),
  ('AFCX Upload', 'FRAUD', 10),
  ('Fraud hotline', 'FRAUD', 25);

-- UMR'S
INSERT INTO tasks (name, category, expected_duration_minutes) VALUES
  ('UMR Processing', 'UMR''S', 20),
  ('UMR Review', 'UMR''S', 25),
  ('UMR Escalations', 'UMR''S', 30);

-- TRANSACTION MONITORING
INSERT INTO tasks (name, category, expected_duration_minutes) VALUES
  ('Transaction Monitoring', 'TRANSACTION MONITORING', 30),
  ('Alert Review', 'TRANSACTION MONITORING', 25),
  ('SAR Filing', 'TRANSACTION MONITORING', 45);

-- ADMIN
INSERT INTO tasks (name, category, expected_duration_minutes) VALUES
  ('Ops support', 'ADMIN', 20),
  ('Reporting (DFAT, FCC reports etc)', 'ADMIN', 60),
  ('Project Work', 'ADMIN', 120),
  ('Team Meetings', 'ADMIN', 30),
  ('Training', 'ADMIN', 60);

-- LENDING
INSERT INTO tasks (name, category, expected_duration_minutes) VALUES
  ('Lending app review', 'LENDING', 40),
  ('Lending app QA', 'LENDING', 30),
  ('Lending documentation', 'LENDING', 25),
  ('Lending escalations', 'LENDING', 35);

-- Note: Daily entries will be created by users through the application
-- You can add sample daily entries here for testing if needed

-- Example daily entries (optional - uncomment to add sample data)
/*
-- Get staff and task IDs (this assumes the IDs from the inserts above)
WITH staff_ids AS (
  SELECT id, name FROM staff WHERE name IN ('John Smith', 'Sarah Johnson')
),
task_ids AS (
  SELECT id, name FROM tasks
)
-- Insert sample daily entries for yesterday
INSERT INTO daily_entries (staff_id, date, total_minutes)
SELECT 
  s.id,
  CURRENT_DATE - INTERVAL '1 day',
  420 -- 7 hours
FROM staff_ids s
WHERE s.name = 'John Smith';

-- Insert sample daily entry items
INSERT INTO daily_entry_items (daily_entry_id, task_id, count)
SELECT 
  de.id,
  t.id,
  CASE 
    WHEN t.name = 'Manual reviews' THEN 5
    WHEN t.name = 'Fraud queue - Card' THEN 8
    WHEN t.name = 'Transaction Monitoring' THEN 3
    ELSE 0
  END
FROM daily_entries de
CROSS JOIN task_ids t
WHERE de.date = CURRENT_DATE - INTERVAL '1 day'
  AND de.staff_id = (SELECT id FROM staff WHERE name = 'John Smith')
  AND t.name IN ('Manual reviews', 'Fraud queue - Card', 'Transaction Monitoring');
*/
