-- Fix payment_slips table structure
-- This script will add the person_id column if it doesn't exist

-- Check if person_id column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_slips' 
        AND column_name = 'person_id'
    ) THEN
        ALTER TABLE payment_slips ADD COLUMN person_id uuid NOT NULL DEFAULT gen_random_uuid();
        
        -- Create index for the new column
        CREATE INDEX IF NOT EXISTS idx_payment_slips_person_id ON payment_slips(person_id);
        
        RAISE NOTICE 'Added person_id column to payment_slips table';
    ELSE
        RAISE NOTICE 'person_id column already exists in payment_slips table';
    END IF;
END $$;

-- Update RLS policies to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can view all payment slips" ON payment_slips;

CREATE POLICY "Users can view all payment slips" ON payment_slips
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payment_slips' 
ORDER BY ordinal_position;
