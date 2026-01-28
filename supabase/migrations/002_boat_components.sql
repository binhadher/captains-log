-- Migration: Add boat_components table for system pillars
-- Run this in Supabase SQL Editor

-- Component types enum (for reference, stored as text)
-- engine, generator, shaft, propeller, hydraulic, bow_thruster, ac_chiller, ac_air_handler

CREATE TABLE boat_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  
  -- Component classification
  category TEXT NOT NULL CHECK (category IN ('propulsion', 'systems', 'hvac')),
  type TEXT NOT NULL CHECK (type IN (
    'engine', 
    'generator', 
    'shaft', 
    'propeller', 
    'hydraulic', 
    'bow_thruster', 
    'ac_chiller', 
    'ac_air_handler'
  )),
  
  -- Identification
  name TEXT NOT NULL,                    -- e.g., "Port Engine", "Master Bedroom AC"
  position TEXT,                         -- e.g., "port", "starboard", "center", "saloon"
  
  -- Specs
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  install_date DATE,
  
  -- For engines: track hours
  current_hours INTEGER DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_boat_components_boat ON boat_components(boat_id);
CREATE INDEX idx_boat_components_category ON boat_components(category);
CREATE INDEX idx_boat_components_type ON boat_components(type);

-- Updated_at trigger
CREATE TRIGGER update_boat_components_updated_at 
  BEFORE UPDATE ON boat_components 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update log_entries to link to components instead of just boats
ALTER TABLE log_entries ADD COLUMN IF NOT EXISTS component_id UUID REFERENCES boat_components(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_log_entries_component ON log_entries(component_id);

-- Update documents to optionally link to components
ALTER TABLE documents ADD COLUMN IF NOT EXISTS component_id UUID REFERENCES boat_components(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_documents_component ON documents(component_id);

-- RLS Policies for boat_components
ALTER TABLE boat_components ENABLE ROW LEVEL SECURITY;

-- Users can view components for boats they own or have access to
CREATE POLICY "Users can view components for accessible boats" ON boat_components
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM boats WHERE id = boat_components.boat_id AND (
      owner_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM boat_access WHERE boat_id = boats.id AND user_id = auth.uid() AND revoked_at IS NULL)
    ))
  );

-- Users can insert components for boats they own
CREATE POLICY "Users can insert components for owned boats" ON boat_components
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM boats WHERE id = boat_components.boat_id AND owner_id = auth.uid())
  );

-- Users can update components for boats they own or have edit access
CREATE POLICY "Users can update components for editable boats" ON boat_components
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM boats WHERE id = boat_components.boat_id AND (
      owner_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM boat_access WHERE boat_id = boats.id AND user_id = auth.uid() AND permission_level IN ('edit', 'admin') AND revoked_at IS NULL)
    ))
  );

-- Users can delete components for boats they own
CREATE POLICY "Users can delete components for owned boats" ON boat_components
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM boats WHERE id = boat_components.boat_id AND owner_id = auth.uid())
  );
