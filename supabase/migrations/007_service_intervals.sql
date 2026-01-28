-- Migration: Add service interval tracking to components
-- Run this in Supabase SQL Editor

-- Add service interval fields to components
ALTER TABLE boat_components ADD COLUMN IF NOT EXISTS service_interval_days INTEGER;
ALTER TABLE boat_components ADD COLUMN IF NOT EXISTS service_interval_hours INTEGER;
ALTER TABLE boat_components ADD COLUMN IF NOT EXISTS last_service_date DATE;
ALTER TABLE boat_components ADD COLUMN IF NOT EXISTS last_service_hours INTEGER;
ALTER TABLE boat_components ADD COLUMN IF NOT EXISTS next_service_date DATE;
ALTER TABLE boat_components ADD COLUMN IF NOT EXISTS next_service_hours INTEGER;

-- Add expiry tracking to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reminder_days INTEGER DEFAULT 30;
