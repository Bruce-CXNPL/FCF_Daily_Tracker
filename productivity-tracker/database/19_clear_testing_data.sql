-- CLEAR ALL TESTING DATA FOR PRODUCTION ROLLOUT
-- This script removes all test data while preserving the database structure
-- Run this before rolling out to your team

-- WARNING: This will delete ALL existing data. Make sure this is what you want!

-- Clear all daily entry items (task counts)
DELETE FROM daily_entry_items;

-- Clear all daily entries (header records)
DELETE FROM daily_entries;

-- Clear all test users (KEEP YOUR ADMIN ACCOUNT)
-- Replace 'brucen@cxnpl.com' with your actual admin email if different
DELETE FROM users WHERE email != 'brucen@cxnpl.com';

-- Optional: Clear all staff records if you want to start fresh
-- Uncomment the next line if you want to remove all staff records too
-- DELETE FROM staff;

-- Optional: Reset task durations to defaults if you've been testing with different values
-- Uncomment the next section if you want to reset task durations

/*
UPDATE tasks SET expected_duration_minutes = 30 WHERE name = 'Manual reviews';
UPDATE tasks SET expected_duration_minutes = 25 WHERE name = 'Ownership reviews';
UPDATE tasks SET expected_duration_minutes = 15 WHERE name = 'Blocklist hits';
UPDATE tasks SET expected_duration_minutes = 45 WHERE name = 'ECDD';
UPDATE tasks SET expected_duration_minutes = 20 WHERE name = 'KYC refresh';
UPDATE tasks SET expected_duration_minutes = 35 WHERE name = 'Manual KYC Verification';
UPDATE tasks SET expected_duration_minutes = 20 WHERE name = 'Fraud queue - Card';
UPDATE tasks SET expected_duration_minutes = 25 WHERE name = 'Fraud queue - Transfer';
UPDATE tasks SET expected_duration_minutes = 30 WHERE name = 'Fraud Reports (in and out)';
UPDATE tasks SET expected_duration_minutes = 40 WHERE name = 'Indemnities';
UPDATE tasks SET expected_duration_minutes = 15 WHERE name = 'Feedzai Failure Reconciliation';
UPDATE tasks SET expected_duration_minutes = 10 WHERE name = 'AFCX Upload';
UPDATE tasks SET expected_duration_minutes = 25 WHERE name = 'Fraud hotline';
UPDATE tasks SET expected_duration_minutes = 20 WHERE name = 'UMR''s';
UPDATE tasks SET expected_duration_minutes = 30 WHERE name = 'MCL';
UPDATE tasks SET expected_duration_minutes = 25 WHERE name = 'Fraud';
UPDATE tasks SET expected_duration_minutes = 20 WHERE name = 'TM';
UPDATE tasks SET expected_duration_minutes = 35 WHERE name = 'Lending';
UPDATE tasks SET expected_duration_minutes = 30 WHERE name = 'Offboarding';
UPDATE tasks SET expected_duration_minutes = 25 WHERE name = 'QA';
UPDATE tasks SET expected_duration_minutes = 45 WHERE name = 'LEA/NTP';
UPDATE tasks SET expected_duration_minutes = 30 WHERE name = 'Transaction Monitoring';
UPDATE tasks SET expected_duration_minutes = 20 WHERE name = 'Ops support';
UPDATE tasks SET expected_duration_minutes = 60 WHERE name = 'Reporting (DFAT, FCC reports etc).';
UPDATE tasks SET expected_duration_minutes = 120 WHERE name = 'Project Work';
UPDATE tasks SET expected_duration_minutes = 40 WHERE name = 'Lending app review';
UPDATE tasks SET expected_duration_minutes = 30 WHERE name = 'Lending app QA';
*/

-- Verify what's left after cleanup
SELECT 'Users remaining:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Staff remaining:' as table_name, COUNT(*) as count FROM staff
UNION ALL
SELECT 'Daily entries remaining:' as table_name, COUNT(*) as count FROM daily_entries
UNION ALL
SELECT 'Daily entry items remaining:' as table_name, COUNT(*) as count FROM daily_entry_items
UNION ALL
SELECT 'Tasks available:' as table_name, COUNT(*) as count FROM tasks;
