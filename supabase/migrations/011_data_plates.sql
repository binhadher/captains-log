-- Add generator data plate field to boats table
ALTER TABLE boats ADD COLUMN IF NOT EXISTS generator_data_plate TEXT;

-- Note: Engine data plates are stored in the engines JSONB array
-- Each engine object can have a data_plate_url field
