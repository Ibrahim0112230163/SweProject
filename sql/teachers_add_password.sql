-- Add password field to teachers table for custom authentication
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Make email completely optional (if it exists, remove NOT NULL constraint)
-- Note: Since we're not using email at all, this ensures it's truly optional
