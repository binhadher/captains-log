-- Migration: Add maintenance_item field to log_entries
-- Run this in Supabase SQL Editor

-- Add maintenance_item column to track which specific item was serviced
ALTER TABLE log_entries ADD COLUMN IF NOT EXISTS maintenance_item TEXT;

-- Add hours_at_service to track component hours when service was done
ALTER TABLE log_entries ADD COLUMN IF NOT EXISTS hours_at_service INTEGER;

-- Make sure component_id exists (should already from previous migration)
-- ALTER TABLE log_entries ADD COLUMN IF NOT EXISTS component_id UUID REFERENCES boat_components(id) ON DELETE CASCADE;

-- Index for faster queries by maintenance item
CREATE INDEX IF NOT EXISTS idx_log_entries_maintenance_item ON log_entries(maintenance_item);
