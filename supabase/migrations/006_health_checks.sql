-- Migration: Add health_checks table for ongoing operational checks
-- Run this in Supabase SQL Editor

CREATE TABLE health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  component_id UUID REFERENCES boat_components(id) ON DELETE SET NULL,
  
  -- Check details
  check_type TEXT NOT NULL, -- oil_level, fluid_level, grease, visual, other
  title TEXT NOT NULL,
  quantity TEXT, -- e.g., "0.5L", "200ml"
  notes TEXT,
  
  -- When
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Who
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_health_checks_boat ON health_checks(boat_id);
CREATE INDEX idx_health_checks_component ON health_checks(component_id);
CREATE INDEX idx_health_checks_date ON health_checks(date DESC);
