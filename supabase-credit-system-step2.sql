-- =====================================================
-- Content Maestro 크레딧 시스템 SQL 스키마 - 2단계
-- 1단계 완료 후 실행하세요
-- =====================================================

-- 2단계: 외래키 제약 조건 추가
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_auth_users 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.credit_transactions 
ADD CONSTRAINT fk_credit_transactions_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.content_history 
ADD CONSTRAINT fk_content_history_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- RLS (Row Level Security) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;

-- 보안 정책 설정
CREATE POLICY "사용자는 자신의 프로필만 조회/수정 가능" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "사용자는 자신의 트랜잭션만 조회 가능" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 트랜잭션만 생성 가능" ON public.credit_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 콘텐츠만 조회/수정 가능" ON public.content_history
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 2단계 완료 후 확인사항:
-- 1. Tables에서 외래키 제약 조건 확인
-- 2. RLS가 활성화되었는지 확인
-- 3. Policies에서 정책들이 생성되었는지 확인
-- =====================================================
