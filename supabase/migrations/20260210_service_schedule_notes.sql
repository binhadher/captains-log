-- Migration: Add notes and document fields for service schedule planning
-- Date: 2026-02-10
-- Description: Allows adding notes and a reference document when scheduling service

ALTER TABLE boat_components 
ADD COLUMN IF NOT EXISTS service_schedule_notes TEXT,
ADD COLUMN IF NOT EXISTS service_schedule_doc_url TEXT;

COMMENT ON COLUMN boat_components.service_schedule_notes IS 'Notes for planned service (e.g., "Use Optima batteries next time")';
COMMENT ON COLUMN boat_components.service_schedule_doc_url IS 'URL to reference document/photo for planned service';
