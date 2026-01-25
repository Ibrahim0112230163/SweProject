-- Update industry_experts table to make email optional and company_name unique

-- Drop the email unique constraint if it exists
ALTER TABLE industry_experts DROP CONSTRAINT IF EXISTS industry_experts_email_key;

-- Make email nullable if it isn't already
ALTER TABLE industry_experts ALTER COLUMN email DROP NOT NULL;

-- Add unique constraint to company_name if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'industry_experts_company_name_key'
    ) THEN
        ALTER TABLE industry_experts ADD CONSTRAINT industry_experts_company_name_key UNIQUE (company_name);
    END IF;
END $$;
