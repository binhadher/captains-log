-- Add engine_type to boats table
ALTER TABLE boats ADD COLUMN IF NOT EXISTS engine_type TEXT CHECK (engine_type IN ('inboard', 'outboard', 'sterndrive', 'pod_drive'));

-- Create safety_equipment table
CREATE TABLE IF NOT EXISTS safety_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'fire_extinguisher',
    'engine_room_fire_system',
    'life_jacket',
    'life_raft',
    'flares',
    'epirb',
    'first_aid_kit',
    'life_ring',
    'fire_blanket',
    'other'
  )),
  type_other TEXT, -- Custom name when type is 'other'
  quantity INTEGER NOT NULL DEFAULT 1,
  expiry_date DATE,
  last_service_date DATE,
  service_interval_months INTEGER,
  next_service_date DATE,
  certification_number TEXT,
  notes TEXT,
  photo_url TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_safety_equipment_boat_id ON safety_equipment(boat_id);
CREATE INDEX IF NOT EXISTS idx_safety_equipment_expiry ON safety_equipment(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_safety_equipment_next_service ON safety_equipment(next_service_date) WHERE next_service_date IS NOT NULL;

-- Enable RLS
ALTER TABLE safety_equipment ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only see safety equipment for their boats
CREATE POLICY "Users can view their boat's safety equipment"
  ON safety_equipment FOR SELECT
  USING (
    boat_id IN (
      SELECT id FROM boats WHERE owner_id = (
        SELECT id FROM users WHERE clerk_id = auth.uid()::text
      )
    )
  );

-- RLS policy: users can insert safety equipment for their boats
CREATE POLICY "Users can insert safety equipment for their boats"
  ON safety_equipment FOR INSERT
  WITH CHECK (
    boat_id IN (
      SELECT id FROM boats WHERE owner_id = (
        SELECT id FROM users WHERE clerk_id = auth.uid()::text
      )
    )
  );

-- RLS policy: users can update their boat's safety equipment
CREATE POLICY "Users can update their boat's safety equipment"
  ON safety_equipment FOR UPDATE
  USING (
    boat_id IN (
      SELECT id FROM boats WHERE owner_id = (
        SELECT id FROM users WHERE clerk_id = auth.uid()::text
      )
    )
  );

-- RLS policy: users can delete their boat's safety equipment
CREATE POLICY "Users can delete their boat's safety equipment"
  ON safety_equipment FOR DELETE
  USING (
    boat_id IN (
      SELECT id FROM boats WHERE owner_id = (
        SELECT id FROM users WHERE clerk_id = auth.uid()::text
      )
    )
  );
