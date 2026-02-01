-- Add user consent tracking
-- This migration adds fields to track user acceptance of Terms and Privacy Policy

-- Add consent columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS privacy_version TEXT DEFAULT '1.0';

-- Create consent history table for audit trail
CREATE TABLE IF NOT EXISTS user_consent_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms', 'privacy')),
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_consent_history_user_id ON user_consent_history(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_history_type ON user_consent_history(consent_type);

-- RLS policies for consent history
ALTER TABLE user_consent_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own consent history
CREATE POLICY "Users can view own consent history" ON user_consent_history
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
  ));

-- Users can insert their own consent records
CREATE POLICY "Users can insert own consent" ON user_consent_history
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
  ));

-- Comment for documentation
COMMENT ON TABLE user_consent_history IS 'Audit trail of user consent to Terms of Service and Privacy Policy';
COMMENT ON COLUMN users.terms_accepted_at IS 'Timestamp when user last accepted Terms of Service';
COMMENT ON COLUMN users.privacy_accepted_at IS 'Timestamp when user last accepted Privacy Policy';
