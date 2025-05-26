-- First, let's check the current state
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'payment_slips';

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert their own payment slips" ON payment_slips;
DROP POLICY IF EXISTS "Authenticated users can insert payment slips" ON payment_slips;
DROP POLICY IF EXISTS "Users can view all payment slips" ON payment_slips;
DROP POLICY IF EXISTS "Authenticated users can view all payment slips" ON payment_slips;
DROP POLICY IF EXISTS "Users can view their own payment slips" ON payment_slips;
DROP POLICY IF EXISTS "Users can update their own payment slips" ON payment_slips;
DROP POLICY IF EXISTS "Users can delete their own payment slips" ON payment_slips;

-- Ensure RLS is enabled
ALTER TABLE payment_slips ENABLE ROW LEVEL SECURITY;

-- Create new, more permissive policies for testing
-- Policy 1: Allow authenticated users to insert payment slips
CREATE POLICY "Allow authenticated insert" ON payment_slips
FOR INSERT 
TO authenticated
WITH CHECK (true);  -- Allow any authenticated user to insert

-- Policy 2: Allow authenticated users to view all payment slips
CREATE POLICY "Allow authenticated select" ON payment_slips
FOR SELECT 
TO authenticated
USING (true);  -- Allow any authenticated user to view all records

-- Policy 3: Allow authenticated users to update payment slips
CREATE POLICY "Allow authenticated update" ON payment_slips
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);  -- Allow any authenticated user to update

-- Policy 4: Allow authenticated users to delete payment slips
CREATE POLICY "Allow authenticated delete" ON payment_slips
FOR DELETE 
TO authenticated
USING (true);  -- Allow any authenticated user to delete

-- Grant necessary permissions to authenticated role
GRANT ALL ON payment_slips TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'payment_slips';

-- Test if we can insert a record (run this manually to test)
-- INSERT INTO payment_slips (user_id, person_id, path, original_name, file_size, mime_type)
-- VALUES (auth.uid(), 'test-person', 'test/path.jpg', 'test.jpg', 1024, 'image/jpeg');
