-- 단계별 실행용 - 각 구문을 하나씩 실행하세요

-- 1단계: 댓글의 post_id 외래키 CASCADE 설정
ALTER TABLE public.community_comments 
DROP CONSTRAINT IF EXISTS community_comments_post_id_fkey;

ALTER TABLE public.community_comments 
ADD CONSTRAINT community_comments_post_id_fkey 
FOREIGN KEY (post_id) 
REFERENCES public.community_posts(id) 
ON DELETE CASCADE;

-- 2단계: 댓글의 author_id 외래키 CASCADE 설정
ALTER TABLE public.community_comments 
DROP CONSTRAINT IF EXISTS community_comments_author_id_fkey;

ALTER TABLE public.community_comments 
ADD CONSTRAINT community_comments_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;

-- 3단계: 댓글의 parent_id 외래키 CASCADE 설정
ALTER TABLE public.community_comments 
DROP CONSTRAINT IF EXISTS community_comments_parent_id_fkey;

ALTER TABLE public.community_comments 
ADD CONSTRAINT community_comments_parent_id_fkey 
FOREIGN KEY (parent_id) 
REFERENCES public.community_comments(id) 
ON DELETE CASCADE;

-- 4단계: 게시글의 author_id 외래키 CASCADE 설정
ALTER TABLE public.community_posts 
DROP CONSTRAINT IF EXISTS community_posts_author_id_fkey;

ALTER TABLE public.community_posts 
ADD CONSTRAINT community_posts_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;

-- 5단계: 게시글의 category_id 외래키 SET NULL 설정
ALTER TABLE public.community_posts 
DROP CONSTRAINT IF EXISTS community_posts_category_id_fkey;

ALTER TABLE public.community_posts 
ADD CONSTRAINT community_posts_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES public.community_categories(id) 
ON DELETE SET NULL;