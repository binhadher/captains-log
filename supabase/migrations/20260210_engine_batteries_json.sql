-- Migration: Add engine_batteries JSONB field for per-engine battery tracking
-- Date: 2026-02-10
-- Description: Stores battery details per engine position (port, starboard, etc.)

-- Add JSONB column for per-engine battery data
ALTER TABLE boat_components 
ADD COLUMN IF NOT EXISTS engine_batteries JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN boat_components.engine_batteries IS 'Array of battery info per engine: [{position, battery_count, battery_brand, battery_model, battery_type, battery_voltage, battery_capacity, install_date}]';
