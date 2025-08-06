-- Storage Policy 설정 (별도 실행)
-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- 새 정책 생성
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);