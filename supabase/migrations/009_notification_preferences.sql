-- Migration: Add notification preferences for users
-- Run this in Supabase SQL Editor

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Email notifications
  email_enabled BOOLEAN DEFAULT false,
  email_address TEXT,  -- Can override the default user email
  
  -- Push notifications (browser)
  push_enabled BOOLEAN DEFAULT false,
  push_subscription JSONB,  -- Web Push subscription object
  
  -- What to notify about
  notify_document_expiry BOOLEAN DEFAULT true,
  notify_maintenance_due BOOLEAN DEFAULT true,
  notify_hours_threshold BOOLEAN DEFAULT true,
  
  -- Timing
  advance_notice_days INTEGER DEFAULT 14,  -- How many days before due date
  
  -- Frequency
  digest_mode TEXT DEFAULT 'immediate' CHECK (digest_mode IN ('immediate', 'daily', 'weekly')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own preferences
CREATE POLICY "Users can view own preferences" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences" ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add last_notified tracking to alerts table
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS notification_count INTEGER DEFAULT 0;
