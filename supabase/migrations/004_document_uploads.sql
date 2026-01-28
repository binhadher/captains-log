-- Migration: Add log_entry_id to documents for attaching files to maintenance logs
-- Run this in Supabase SQL Editor

-- Add log_entry_id to link documents to specific maintenance logs
ALTER TABLE documents ADD COLUMN IF NOT EXISTS log_entry_id UUID REFERENCES log_entries(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_documents_log_entry ON documents(log_entry_id);

-- Make boat_id nullable (documents can be attached to components or logs instead)
ALTER TABLE documents ALTER COLUMN boat_id DROP NOT NULL;

-- Note: You also need to create a storage bucket in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket called "documents"
-- 3. Set it to private (we'll use signed URLs)
