-- Migration: Add parts catalog table
-- Run this in Supabase SQL Editor

CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  component_id UUID REFERENCES boat_components(id) ON DELETE SET NULL,
  
  -- Part details
  name TEXT NOT NULL,
  brand TEXT,
  part_number TEXT,
  size_specs TEXT,
  supplier TEXT,
  notes TEXT,
  
  -- Photo
  photo_url TEXT,
  
  -- Timestamps
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_parts_boat ON parts(boat_id);
CREATE INDEX idx_parts_component ON parts(component_id);

-- Updated_at trigger
CREATE TRIGGER update_parts_updated_at 
  BEFORE UPDATE ON parts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
