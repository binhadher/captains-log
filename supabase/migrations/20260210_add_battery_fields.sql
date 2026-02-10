-- Migration: Add battery fields to boat_components
-- Date: 2026-02-10 (intentionally future-dated per project convention)
-- Description: Adds battery-specific fields for battery components and thruster battery tracking

-- Battery fields for battery components (house_battery, engine_battery, generator_battery, thruster_battery)
ALTER TABLE boat_components 
ADD COLUMN IF NOT EXISTS battery_count INTEGER,
ADD COLUMN IF NOT EXISTS battery_type TEXT,
ADD COLUMN IF NOT EXISTS battery_voltage TEXT,
ADD COLUMN IF NOT EXISTS battery_capacity TEXT;

-- Thruster battery fields for bow_thruster and stern_thruster components
ALTER TABLE boat_components 
ADD COLUMN IF NOT EXISTS thruster_battery_count INTEGER,
ADD COLUMN IF NOT EXISTS thruster_battery_brand TEXT,
ADD COLUMN IF NOT EXISTS thruster_battery_model TEXT,
ADD COLUMN IF NOT EXISTS thruster_battery_install_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN boat_components.battery_count IS 'Number of batteries in this bank';
COMMENT ON COLUMN boat_components.battery_type IS 'Battery chemistry type (AGM, Lithium, Lead Acid, Gel)';
COMMENT ON COLUMN boat_components.battery_voltage IS 'Battery voltage (12V, 24V, 48V)';
COMMENT ON COLUMN boat_components.battery_capacity IS 'Capacity per battery (e.g., 100Ah)';
COMMENT ON COLUMN boat_components.thruster_battery_count IS 'Number of batteries dedicated to this thruster';
COMMENT ON COLUMN boat_components.thruster_battery_brand IS 'Brand of thruster batteries';
COMMENT ON COLUMN boat_components.thruster_battery_model IS 'Model of thruster batteries';
COMMENT ON COLUMN boat_components.thruster_battery_install_date IS 'When thruster batteries were installed';
