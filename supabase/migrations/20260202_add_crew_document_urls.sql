-- Add document URL columns to crew_members table (if they don't exist)
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS passport_url TEXT;
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS emirates_id_url TEXT;
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS marine_license_url TEXT;

-- Also ensure other document fields exist
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS passport_number TEXT;
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS passport_country TEXT;
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS emirates_id_number TEXT;
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS marine_license_number TEXT;
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS marine_license_type TEXT;
ALTER TABLE crew_members ADD COLUMN IF NOT EXISTS notes TEXT;
