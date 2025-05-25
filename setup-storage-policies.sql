-- ตรวจสอบว่า bucket payment-slips มีอยู่หรือไม่
SELECT id, name, public FROM storage.buckets WHERE id = 'payment-slips';

-- ถ้าไม่มี bucket จะต้องสร้างผ่าน Supabase Dashboard หรือ API
-- เพราะ SQL ไม่สามารถสร้าง bucket ได้โดยตรง

-- สร้าง RLS policies สำหรับ storage objects (ถ้า bucket มีอยู่แล้ว)
-- Policy สำหรับการอ่านไฟล์ (public read)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'payment-slips') THEN
    -- ลบ policy เก่าถ้ามี
    DROP POLICY IF EXISTS "Public read access for payment slips" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload payment slips" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can delete payment slips" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can update payment slips" ON storage.objects;

    -- สร้าง policy ใหม่
    CREATE POLICY "Public read access for payment slips" ON storage.objects
    FOR SELECT USING (bucket_id = 'payment-slips');

    CREATE POLICY "Authenticated users can upload payment slips" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'payment-slips');

    CREATE POLICY "Authenticated users can delete payment slips" ON storage.objects
    FOR DELETE USING (bucket_id = 'payment-slips');

    CREATE POLICY "Authenticated users can update payment slips" ON storage.objects
    FOR UPDATE USING (bucket_id = 'payment-slips');

    RAISE NOTICE 'Storage policies created successfully for payment-slips bucket';
  ELSE
    RAISE NOTICE 'Bucket payment-slips does not exist. It will be created automatically by the application.';
  END IF;
END $$;
