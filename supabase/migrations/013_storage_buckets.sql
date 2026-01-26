-- =====================================================
-- Migration 013: Storage Buckets para Documentos
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- Criar bucket para documentos de funcionarios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-documents',
  'employee-documents',
  false, -- Bucket privado
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- RLS Policies para Storage
-- =====================================================

-- Policy: Usuarios autenticados da mesma empresa podem fazer upload
CREATE POLICY "Users can upload documents for their company"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text FROM profiles WHERE id = auth.uid()
  )
);

-- Policy: Usuarios autenticados da mesma empresa podem visualizar
CREATE POLICY "Users can view documents from their company"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text FROM profiles WHERE id = auth.uid()
  )
);

-- Policy: Admins podem deletar documentos da empresa
CREATE POLICY "Admins can delete documents from their company"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text FROM profiles WHERE id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'hr')
  )
);

-- Policy: Admins podem atualizar documentos da empresa
CREATE POLICY "Admins can update documents from their company"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text FROM profiles WHERE id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'hr')
  )
);

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE storage.buckets IS 'Buckets de armazenamento do Supabase Storage';
