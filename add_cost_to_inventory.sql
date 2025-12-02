-- Add cost column to inventory table
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS cost numeric DEFAULT 0;

-- Update existing rows to have a default cost of 0 if null
UPDATE inventory SET cost = 0 WHERE cost IS NULL;
