-- Migration: Add engine and generator fields to boats table
-- Run this in Supabase SQL Editor

-- Add number of engines (1-6)
ALTER TABLE boats ADD COLUMN IF NOT EXISTS number_of_engines INTEGER DEFAULT 2;

-- Add engines as JSONB array (stores brand/model for each engine)
-- Example: [{"brand": "Caterpillar", "model": "C12"}, {"brand": "Caterpillar", "model": "C12"}]
ALTER TABLE boats ADD COLUMN IF NOT EXISTS engines JSONB DEFAULT '[]'::jsonb;

-- Add generator brand and model
ALTER TABLE boats ADD COLUMN IF NOT EXISTS generator_brand TEXT;
ALTER TABLE boats ADD COLUMN IF NOT EXISTS generator_model TEXT;

-- Optional: Add constraint for number_of_engines
ALTER TABLE boats ADD CONSTRAINT check_engine_count 
  CHECK (number_of_engines >= 1 AND number_of_engines <= 6);
