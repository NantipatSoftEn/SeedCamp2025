-- Create payment_slips table to track uploaded files
CREATE TABLE IF NOT EXISTS payment_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  person_id uuid NOT NULL,  -- Reference to seedcamp_people.id (but no foreign key constraint for flexibility)
  path text NOT NULL,             -- path ใน storage เช่น "public/seedcamp2025/abc.jpg"
  original_name text NOT NULL,    -- ชื่อไฟล์ต้นฉบับ
  file_size bigint,              -- ขนาดไฟล์ในไบต์
  mime_type text,                -- ประเภทไฟล์ เช่น "image/jpeg"
  uploaded_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_slips_person_id ON payment_slips(person_id);
CREATE INDEX IF NOT EXISTS idx_payment_slips_user_id ON payment_slips(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_slips_uploaded_at ON payment_slips(uploaded_at);

-- Add RLS policies
ALTER TABLE payment_slips ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own payment slips" ON payment_slips;
DROP POLICY IF EXISTS "Users can view all payment slips" ON payment_slips;
DROP POLICY IF EXISTS "Users can update their own payment slips" ON payment_slips;
DROP POLICY IF EXISTS "Users can delete their own payment slips" ON payment_slips;

-- Policy for authenticated users to insert their own records
CREATE POLICY "Users can insert their own payment slips" ON payment_slips
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to view all payment slips (for admin purposes)
CREATE POLICY "Users can view all payment slips" ON payment_slips
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy for authenticated users to update their own records
CREATE POLICY "Users can update their own payment slips" ON payment_slips
FOR UPDATE USING (auth.uid() = user_id);

-- Policy for authenticated users to delete their own records
CREATE POLICY "Users can delete their own payment slips" ON payment_slips
FOR DELETE USING (auth.uid() = user_id);
