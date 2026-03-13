-- Storage: Políticas para buckets de imágenes
-- 1. Crear buckets en Dashboard > Storage: ear-tag-photos y receipt-photos (públicos)
-- 2. Ejecutar este SQL en SQL Editor

-- Políticas de storage.objects
DROP POLICY IF EXISTS "Public read ear-tag-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public upload ear-tag-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read receipt-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public upload receipt-photos" ON storage.objects;

CREATE POLICY "Public read ear-tag-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'ear-tag-photos');

CREATE POLICY "Public upload ear-tag-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ear-tag-photos');

CREATE POLICY "Public read receipt-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipt-photos');

CREATE POLICY "Public upload receipt-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipt-photos');
