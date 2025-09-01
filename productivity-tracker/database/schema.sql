-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Staff table
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table with categories
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  expected_duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily entries (header record for each staff/date combination)
CREATE TABLE daily_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id),
  entry_date DATE NOT NULL,
  total_calculated_time_minutes INTEGER DEFAULT 0,
  productivity_ratio DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, entry_date)
);

-- Daily entry items (line items for each task count)
CREATE TABLE daily_entry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_entry_id UUID NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id),
  count INTEGER NOT NULL DEFAULT 0,
  calculated_time_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(daily_entry_id, task_id)
);

-- Insert predefined tasks based on your categories
INSERT INTO tasks (name, category, expected_duration_minutes) VALUES
-- ONBOARDING
('Manual reviews', 'ONBOARDING', 30),
('Ownership reviews', 'ONBOARDING', 25),
('Blocklist hits', 'ONBOARDING', 15),
('ECDD', 'ONBOARDING', 45),
('KYC refresh', 'ONBOARDING', 20),
('Manual KYC Verification', 'ONBOARDING', 35),

-- FRAUD
('Fraud queue - Card', 'FRAUD', 20),
('Fraud queue - Transfer', 'FRAUD', 25),
('Fraud Reports (in and out)', 'FRAUD', 30),
('Indemnities', 'FRAUD', 40),
('Feedzai Failure Reconciliation', 'FRAUD', 15),
('AFCX Upload', 'FRAUD', 10),
('Fraud hotline', 'FRAUD', 25),
('UMR''s', 'FRAUD', 20),
('MCL', 'FRAUD', 30),
('Fraud', 'FRAUD', 25),
('TM', 'FRAUD', 20),
('Lending', 'FRAUD', 35),
('Offboarding', 'FRAUD', 30),
('QA', 'FRAUD', 25),
('LEA/NTP', 'FRAUD', 45),

-- TRANSACTION MONITORING
('Transaction Monitoring', 'TRANSACTION MONITORING', 30),

-- ADMIN
('Ops support', 'ADMIN', 20),
('Reporting (DFAT, FCC reports etc).', 'ADMIN', 60),
('Project Work', 'ADMIN', 120),

-- LENDING
('Lending app review', 'LENDING', 40),
('Lending app QA', 'LENDING', 30);

-- Create indexes for better performance
CREATE INDEX idx_daily_entries_staff_date ON daily_entries(staff_id, entry_date);
CREATE INDEX idx_daily_entry_items_entry_id ON daily_entry_items(daily_entry_id);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_staff_active ON staff(is_active);

-- Function to update daily entry totals
CREATE OR REPLACE FUNCTION update_daily_entry_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE daily_entries 
  SET 
    total_calculated_time_minutes = (
      SELECT COALESCE(SUM(calculated_time_minutes), 0)
      FROM daily_entry_items 
      WHERE daily_entry_id = COALESCE(NEW.daily_entry_id, OLD.daily_entry_id)
    ),
    productivity_ratio = ROUND(
      (SELECT COALESCE(SUM(calculated_time_minutes), 0)
       FROM daily_entry_items 
       WHERE daily_entry_id = COALESCE(NEW.daily_entry_id, OLD.daily_entry_id)
      ) / 450.0, 2  -- 7.5 hours = 450 minutes
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.daily_entry_id, OLD.daily_entry_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update totals when items change
CREATE TRIGGER trigger_update_daily_entry_totals
  AFTER INSERT OR UPDATE OR DELETE ON daily_entry_items
  FOR EACH ROW EXECUTE FUNCTION update_daily_entry_totals();

-- Function to recalculate all historical data when task durations change
CREATE OR REPLACE FUNCTION recalculate_historical_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Update calculated_time_minutes for all existing daily_entry_items with this task
  UPDATE daily_entry_items 
  SET calculated_time_minutes = count * NEW.expected_duration_minutes
  WHERE task_id = NEW.id;
  
  -- The trigger on daily_entry_items will automatically update the daily_entries totals
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate historical data when task duration changes
CREATE TRIGGER trigger_recalculate_historical_data
  AFTER UPDATE OF expected_duration_minutes ON tasks
  FOR EACH ROW EXECUTE FUNCTION recalculate_historical_data();
