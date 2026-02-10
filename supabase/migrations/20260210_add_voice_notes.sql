-- Add voice_note_url and photo_url fields to parts, safety_equipment, and health_checks tables

-- Parts table
ALTER TABLE parts ADD COLUMN IF NOT EXISTS voice_note_url TEXT;

-- Safety equipment table  
ALTER TABLE safety_equipment ADD COLUMN IF NOT EXISTS voice_note_url TEXT;

-- Health checks table
ALTER TABLE health_checks ADD COLUMN IF NOT EXISTS voice_note_url TEXT;
ALTER TABLE health_checks ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Maintenance logs table (if not already present)
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS voice_note_url TEXT;
