-- =====================================================
-- 트리거 임시 비활성화 (문제 해결용)
-- =====================================================

-- 트리거 비활성화
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 기존 사용자들을 위한 프로필 수동 생성 (필요시)
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

-- =====================================================
-- 이제 회원가입이 정상적으로 작동할 것입니다
-- 나중에 트리거를 다시 활성화하려면 3단계 SQL을 실행하세요
-- =====================================================
