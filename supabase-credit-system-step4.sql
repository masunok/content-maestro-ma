-- =====================================================
-- Content Maestro 크레딧 시스템 SQL 스키마 - 4단계 (최종)
-- 3단계 완료 후 실행하세요
-- =====================================================

-- 4단계: 나머지 기능 완성

-- 함수: 프로필 업데이트 시 updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 프로필 업데이트 시 updated_at 자동 업데이트
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 트리거: 콘텐츠 히스토리 업데이트 시 updated_at 자동 업데이트
DROP TRIGGER IF EXISTS update_content_history_updated_at ON public.content_history;
CREATE TRIGGER update_content_history_updated_at
    BEFORE UPDATE ON public.content_history
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 뷰: 사용자 크레딧 요약 정보
CREATE OR REPLACE VIEW public.user_credit_summary AS
SELECT 
    p.id,
    p.email,
    p.name,
    p.credits as current_credits,
    COUNT(ct.id) as total_transactions,
    SUM(CASE WHEN ct.type = 'purchase' THEN ct.amount ELSE 0 END) as total_purchased,
    SUM(CASE WHEN ct.type = 'usage' THEN ABS(ct.amount) ELSE 0 END) as total_used,
    SUM(CASE WHEN ct.type = 'bonus' THEN ct.amount ELSE 0 END) as total_bonus,
    p.created_at as member_since
FROM public.profiles p
LEFT JOIN public.credit_transactions ct ON p.id = ct.user_id
GROUP BY p.id, p.email, p.name, p.credits, p.created_at;

-- 샘플 데이터 (테스트용)
-- 이미 존재하는 사용자가 있다면 초기 크레딧 할당
INSERT INTO public.profiles (id, email, name, credits)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
    10
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 권한 설정
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- 🎉 모든 단계 완료! 확인사항:
-- 1. Tables: profiles, credit_transactions, content_history
-- 2. Functions: handle_new_user, deduct_credits, add_credits, get_user_credits, get_user_credit_history
-- 3. Triggers: on_auth_user_created, update_profiles_updated_at, update_content_history_updated_at
-- 4. Views: user_credit_summary
-- 5. Policies: 모든 테이블에 대한 RLS 정책
-- =====================================================
