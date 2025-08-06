-- 커뮤니티 게시글 삭제 시 모든 관련 데이터를 CASCADE 삭제하도록 설정
-- 이 스크립트는 Supabase SQL Editor에서 실행해주세요

-- 1. 기존 외래키 제약조건 확인 및 수정
-- community_comments 테이블의 post_id 외래키를 CASCADE DELETE로 수정

-- 기존 제약조건이 있다면 삭제 후 재생성
ALTER TABLE public.community_comments 
DROP CONSTRAINT IF EXISTS community_comments_post_id_fkey;

-- post_id 외래키를 CASCADE DELETE로 생성
ALTER TABLE public.community_comments 
ADD CONSTRAINT community_comments_post_id_fkey 
FOREIGN KEY (post_id) 
REFERENCES public.community_posts(id) 
ON DELETE CASCADE;

-- author_id 외래키도 CASCADE DELETE로 설정 (사용자 삭제 시 댓글도 삭제)
ALTER TABLE public.community_comments 
DROP CONSTRAINT IF EXISTS community_comments_author_id_fkey;

ALTER TABLE public.community_comments 
ADD CONSTRAINT community_comments_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;

-- parent_id 외래키도 CASCADE DELETE로 설정 (부모 댓글 삭제 시 대댓글도 삭제)
ALTER TABLE public.community_comments 
DROP CONSTRAINT IF EXISTS community_comments_parent_id_fkey;

ALTER TABLE public.community_comments 
ADD CONSTRAINT community_comments_parent_id_fkey 
FOREIGN KEY (parent_id) 
REFERENCES public.community_comments(id) 
ON DELETE CASCADE;

-- 2. community_posts 테이블의 author_id도 CASCADE DELETE로 설정
ALTER TABLE public.community_posts 
DROP CONSTRAINT IF EXISTS community_posts_author_id_fkey;

ALTER TABLE public.community_posts 
ADD CONSTRAINT community_posts_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;

-- 3. category_id는 SET NULL로 설정 (카테고리 삭제 시 게시글은 유지)
ALTER TABLE public.community_posts 
DROP CONSTRAINT IF EXISTS community_posts_category_id_fkey;

ALTER TABLE public.community_posts 
ADD CONSTRAINT community_posts_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES public.community_categories(id) 
ON DELETE SET NULL;

-- 4. Storage Policy 확인 및 설정 (이미지 삭제 권한)
-- 기존 정책이 있다면 삭제 후 재생성
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- 사용자가 본인이 업로드한 이미지만 삭제할 수 있도록 설정
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 정책 확인을 위한 쿼리 (실행 결과로 설정 상태 확인)
SELECT 
  schemaname, 
  tablename, 
  constraintname, 
  constrainttype 
FROM pg_constraint 
JOIN pg_class ON pg_constraint.conrelid = pg_class.oid 
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid 
WHERE schemaname = 'public' 
  AND tablename IN ('community_posts', 'community_comments')
  AND constrainttype = 'f';

-- 실행 완료 메시지
SELECT 'CASCADE DELETE 설정이 완료되었습니다. 이제 게시글 삭제 시 모든 관련 데이터가 자동으로 삭제됩니다.' as result;