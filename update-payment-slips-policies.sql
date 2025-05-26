-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own payment slips" ON payment_slips;
DROP POLICY IF EXISTS "Users can view all payment slips" ON payment_slips;
DROP POLICY IF EXISTS "Users can update their own payment slips" ON payment_slips;
DROP POLICY IF EXISTS "Users can delete their own payment slips" ON payment_slips;

-- Create more specific RLS policies

-- Policy for authenticated users to insert their own records
CREATE POLICY "Authenticated users can insert payment slips" ON payment_slips
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to view all payment slips (for admin purposes)
-- You can modify this to be more restrictive if needed
CREATE POLICY "Authenticated users can view all payment slips" ON payment_slips
FOR SELECT 
TO authenticated
USING (true);

-- Alternative: If you want users to only see their own uploads, use this instead:
-- CREATE POLICY "Users can view their own payment slips" ON payment_slips
-- FOR SELECT 
-- TO authenticated
-- USING (auth.uid() = user_id);

-- Policy for authenticated users to update their own records
CREATE POLICY "Users can update their own payment slips" ON payment_slips
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to delete their own records
CREATE POLICY "Users can delete their own payment slips" ON payment_slips
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'payment_slips';
