-- Migration: Add crew_members table
-- Run this in Supabase SQL Editor

CREATE TABLE crew_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  title TEXT NOT NULL CHECK (title IN (
    'captain',
    'first_mate',
    'engineer',
    'mechanic',
    'deckhand',
    'chef',
    'steward',
    'stewardess',
    'bosun',
    'other'
  )),
  title_other TEXT,  -- If title is 'other', specify here
  
  -- Contact
  phone TEXT,
  email TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Documents (all optional)
  passport_url TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  passport_country TEXT,
  
  emirates_id_url TEXT,
  emirates_id_number TEXT,
  emirates_id_expiry DATE,
  
  marine_license_url TEXT,
  marine_license_number TEXT,
  marine_license_expiry DATE,
  marine_license_type TEXT,  -- e.g., "Master 200GT", "STCW", etc.
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  start_date DATE,
  end_date DATE,
  
  -- Notes
  notes TEXT,
  photo_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_crew_boat ON crew_members(boat_id);
CREATE INDEX idx_crew_status ON crew_members(status);
CREATE INDEX idx_crew_passport_expiry ON crew_members(passport_expiry) WHERE passport_expiry IS NOT NULL;
CREATE INDEX idx_crew_emirates_expiry ON crew_members(emirates_id_expiry) WHERE emirates_id_expiry IS NOT NULL;
CREATE INDEX idx_crew_license_expiry ON crew_members(marine_license_expiry) WHERE marine_license_expiry IS NOT NULL;

-- RLS
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;

-- Users can view crew for boats they own or have access to
CREATE POLICY "Users can view crew for accessible boats" ON crew_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM boats WHERE id = crew_members.boat_id AND (
      owner_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM boat_access WHERE boat_id = boats.id AND user_id = auth.uid() AND revoked_at IS NULL)
    ))
  );

-- Users can insert crew for boats they own
CREATE POLICY "Users can insert crew for owned boats" ON crew_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM boats WHERE id = crew_members.boat_id AND owner_id = auth.uid())
  );

-- Users can update crew for boats they own or have edit access
CREATE POLICY "Users can update crew for editable boats" ON crew_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM boats WHERE id = crew_members.boat_id AND (
      owner_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM boat_access WHERE boat_id = boats.id AND user_id = auth.uid() AND permission_level IN ('edit', 'admin') AND revoked_at IS NULL)
    ))
  );

-- Users can delete crew for boats they own
CREATE POLICY "Users can delete crew for owned boats" ON crew_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM boats WHERE id = crew_members.boat_id AND owner_id = auth.uid())
  );

-- Updated_at trigger
CREATE TRIGGER update_crew_members_updated_at 
  BEFORE UPDATE ON crew_members 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
