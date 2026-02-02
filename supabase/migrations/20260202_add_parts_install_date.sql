-- Add install_date column to parts table
ALTER TABLE parts ADD COLUMN IF NOT EXISTS install_date DATE;

-- Add comment
COMMENT ON COLUMN parts.install_date IS 'Date when the part was installed';
