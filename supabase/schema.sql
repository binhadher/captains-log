-- Captain's Log Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced from Clerk)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boats table
CREATE TABLE boats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  length DECIMAL,
  hull_id TEXT,
  registration_number TEXT,
  home_port TEXT,
  photo_url TEXT,
  current_engine_hours INTEGER DEFAULT 0,
  current_generator_hours INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log types (admin-configurable)
CREATE TABLE log_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT,
  tracks_hours BOOLEAN DEFAULT false,
  default_interval_days INTEGER,
  default_interval_hours INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default log types
INSERT INTO log_types (name, icon, tracks_hours, default_interval_days, default_interval_hours, sort_order) VALUES
  ('General Maintenance', '🔧', false, NULL, NULL, 1),
  ('Engine Service (Port)', '⚙️', true, 365, 250, 2),
  ('Engine Service (Starboard)', '⚙️', true, 365, 250, 3),
  ('Generator Service', '🔋', true, 365, 500, 4),
  ('A/C Service', '❄️', false, 180, NULL, 5),
  ('House Batteries', '🔌', false, 365, NULL, 6),
  ('Dry Docking', '🏗️', false, 365, NULL, 7),
  ('Hull Cleaning', '🧹', false, 90, NULL, 8),
  ('Electronics', '📡', false, NULL, NULL, 9),
  ('Safety Equipment', '🦺', false, 365, NULL, 10);

-- Log entries
CREATE TABLE log_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  log_type_id UUID REFERENCES log_types(id),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  cost DECIMAL,
  currency TEXT DEFAULT 'AED' CHECK (currency IN ('AED', 'USD', 'EUR')),
  vendor_id UUID,
  engine_hours_at_service INTEGER,
  generator_hours_at_service INTEGER,
  parts_replaced TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('registration', 'insurance', 'berth', 'warranty', 'invoice', 'manual', 'other')),
  subcategory TEXT,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  expiry_date DATE,
  linked_log_entry_id UUID REFERENCES log_entries(id),
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Service providers
CREATE TABLE service_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  services_offered TEXT[],
  personal_rating INTEGER CHECK (personal_rating >= 1 AND personal_rating <= 5),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to log_entries for vendor
ALTER TABLE log_entries ADD CONSTRAINT fk_vendor FOREIGN KEY (vendor_id) REFERENCES service_providers(id);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('document_expiry', 'maintenance_due_date', 'maintenance_due_hours')),
  reference_id UUID NOT NULL,
  due_date DATE,
  due_hours INTEGER,
  reminder_days_before INTEGER DEFAULT 30,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boat access (sharing)
CREATE TABLE boat_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'edit', 'admin')),
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE(boat_id, user_id)
);

-- Row Level Security (RLS) Policies
ALTER TABLE boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE boat_access ENABLE ROW LEVEL SECURITY;

-- Boats: owner can do everything, shared users based on permission
CREATE POLICY "Users can view their own boats" ON boats
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM boat_access WHERE boat_id = boats.id AND user_id = auth.uid() AND revoked_at IS NULL)
  );

CREATE POLICY "Users can insert their own boats" ON boats
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own boats" ON boats
  FOR UPDATE USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM boat_access WHERE boat_id = boats.id AND user_id = auth.uid() AND permission_level IN ('edit', 'admin') AND revoked_at IS NULL)
  );

CREATE POLICY "Users can delete their own boats" ON boats
  FOR DELETE USING (owner_id = auth.uid());

-- Log entries: based on boat access
CREATE POLICY "Users can view log entries for accessible boats" ON log_entries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM boats WHERE id = log_entries.boat_id AND (
      owner_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM boat_access WHERE boat_id = boats.id AND user_id = auth.uid() AND revoked_at IS NULL)
    ))
  );

CREATE POLICY "Users can insert log entries for editable boats" ON log_entries
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM boats WHERE id = log_entries.boat_id AND (
      owner_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM boat_access WHERE boat_id = boats.id AND user_id = auth.uid() AND permission_level IN ('edit', 'admin') AND revoked_at IS NULL)
    ))
  );

-- Documents: based on boat access  
CREATE POLICY "Users can view documents for accessible boats" ON documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM boats WHERE id = documents.boat_id AND (
      owner_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM boat_access WHERE boat_id = boats.id AND user_id = auth.uid() AND revoked_at IS NULL)
    ))
  );

-- Indexes for performance
CREATE INDEX idx_boats_owner ON boats(owner_id);
CREATE INDEX idx_log_entries_boat ON log_entries(boat_id);
CREATE INDEX idx_log_entries_date ON log_entries(date DESC);
CREATE INDEX idx_documents_boat ON documents(boat_id);
CREATE INDEX idx_documents_expiry ON documents(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_alerts_boat ON alerts(boat_id);
CREATE INDEX idx_alerts_status ON alerts(status) WHERE status = 'pending';
CREATE INDEX idx_boat_access_boat ON boat_access(boat_id);
CREATE INDEX idx_boat_access_user ON boat_access(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_boats_updated_at BEFORE UPDATE ON boats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_log_entries_updated_at BEFORE UPDATE ON log_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_providers_updated_at BEFORE UPDATE ON service_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
