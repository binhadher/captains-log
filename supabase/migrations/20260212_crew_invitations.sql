-- Captain's Log - Crew Invitations & Multi-User Access
-- Migration: 2026-02-12

-- =============================================================================
-- BOAT_USERS: Links Clerk users to boats with roles
-- =============================================================================
CREATE TABLE IF NOT EXISTS boat_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,  -- Clerk user ID
  crew_member_id UUID REFERENCES crew_members(id) ON DELETE SET NULL,  -- Optional link to crew profile
  role TEXT NOT NULL DEFAULT 'crew' CHECK (role IN ('owner', 'captain', 'crew')),
  invited_by TEXT,  -- Clerk user ID of who invited them
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boat_id, user_id)  -- One role per user per boat
);

-- Index for fast lookups
CREATE INDEX idx_boat_users_user_id ON boat_users(user_id);
CREATE INDEX idx_boat_users_boat_id ON boat_users(boat_id);

-- =============================================================================
-- INVITATIONS: Pending invites with secure tokens
-- =============================================================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  crew_member_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,  -- Link to existing crew profile
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'crew' CHECK (role IN ('captain', 'crew')),
  token TEXT NOT NULL UNIQUE,  -- Secure random token for invite link
  invited_by TEXT NOT NULL,  -- Clerk user ID
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boat_id, email)  -- One invite per email per boat
);

-- Index for token lookups
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- =============================================================================
-- AUDIT_LOG: Track all changes (Phase 3 prep)
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,  -- Clerk user ID
  user_name TEXT,  -- Cached for display
  action TEXT NOT NULL,  -- 'create', 'update', 'delete'
  table_name TEXT NOT NULL,
  record_id UUID,
  changes JSONB,  -- { field: { old: x, new: y } }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for boat activity feed
CREATE INDEX idx_audit_log_boat_id ON audit_log(boat_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- =============================================================================
-- UPDATE CREW_MEMBERS: Add user_id column for linked accounts
-- =============================================================================
ALTER TABLE crew_members 
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS invitation_status TEXT DEFAULT 'not_invited' 
  CHECK (invitation_status IN ('not_invited', 'pending', 'accepted'));

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_crew_members_user_id ON crew_members(user_id);

-- =============================================================================
-- HELPER FUNCTION: Check if user has access to boat
-- =============================================================================
CREATE OR REPLACE FUNCTION user_has_boat_access(p_user_id TEXT, p_boat_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is the boat owner
  IF EXISTS (SELECT 1 FROM boats WHERE id = p_boat_id AND owner_id = p_user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has explicit access via boat_users
  IF EXISTS (SELECT 1 FROM boat_users WHERE boat_id = p_boat_id AND user_id = p_user_id) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Get user's role for a boat
-- =============================================================================
CREATE OR REPLACE FUNCTION get_user_boat_role(p_user_id TEXT, p_boat_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check if user is the boat owner
  IF EXISTS (SELECT 1 FROM boats WHERE id = p_boat_id AND owner_id = p_user_id) THEN
    RETURN 'owner';
  END IF;
  
  -- Get role from boat_users
  SELECT role INTO v_role FROM boat_users WHERE boat_id = p_boat_id AND user_id = p_user_id;
  
  RETURN v_role;  -- Returns NULL if no access
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
