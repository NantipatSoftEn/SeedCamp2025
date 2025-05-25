-- สร้าง bucket สำหรับเก็บ payment slips
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-slips', 'payment-slips', true);

-- สร้าง policy สำหรับการอ่านไฟล์ (public read)
CREATE POLICY "Public read access for payment slips" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-slips');

-- สร้าง policy สำหรับการอัปโหลดไฟล์ (authenticated users)
CREATE POLICY "Authenticated users can upload payment slips" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'payment-slips');

-- สร้าง policy สำหรับการลบไฟล์ (authenticated users)
CREATE POLICY "Authenticated users can delete payment slips" ON storage.objects
FOR DELETE USING (bucket_id = 'payment-slips');

-- สร้าง policy สำหรับการอัปเดตไฟล์ (authenticated users)
CREATE POLICY "Authenticated users can update payment slips" ON storage.objects
FOR UPDATE USING (bucket_id = 'payment-slips');
