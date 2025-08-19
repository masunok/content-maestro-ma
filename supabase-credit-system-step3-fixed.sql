-- =====================================================
-- Content Maestro 크레딧 시스템 SQL 스키마 - 3단계 (수정된 버전)
-- 2단계 완료 후 실행하세요
-- =====================================================

-- 3단계: 함수 및 트리거 생성 (오류 방지 버전)

-- 함수: 사용자 생성 시 자동으로 프로필 생성 및 초기 크레딧 할당
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 사용자 프로필 생성 (오류 처리 포함)
    BEGIN
        INSERT INTO public.profiles (id, email, name, credits)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
            10
        );
    EXCEPTION WHEN OTHERS THEN
        -- 오류 발생 시 로그 기록 (선택사항)
        RAISE LOG '프로필 생성 실패: %', SQLERRM;
        RETURN NEW; -- 계속 진행
    END;
    
    -- 초기 크레딧 보너스 트랜잭션 생성 (오류 처리 포함)
    BEGIN
        INSERT INTO public.credit_transactions (user_id, type, amount, description, metadata)
        VALUES (
            NEW.id, 
            'bonus', 
            10, 
            '회원가입 환영 보너스',
            jsonb_build_object('source', 'signup', 'welcome_bonus', true)
        );
    EXCEPTION WHEN OTHERS THEN
        -- 오류 발생 시 로그 기록 (선택사항)
        RAISE LOG '크레딧 트랜잭션 생성 실패: %', SQLERRM;
        RETURN NEW; -- 계속 진행
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거: 새 사용자 생성 시 자동으로 프로필 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 함수: 크레딧 차감 (콘텐츠 생성 시)
CREATE OR REPLACE FUNCTION public.deduct_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- 현재 크레딧 잔액 확인
    SELECT credits INTO current_credits 
    FROM public.profiles 
    WHERE id = p_user_id;
    
    -- 크레딧이 부족한 경우
    IF current_credits < p_amount THEN
        RETURN FALSE;
    END IF;
    
    -- 크레딧 차감
    UPDATE public.profiles 
    SET credits = credits - p_amount, updated_at = NOW()
    WHERE id = p_user_id;
    
    -- 트랜잭션 기록
    INSERT INTO public.credit_transactions (user_id, type, amount, description, metadata)
    VALUES (p_user_id, 'usage', -p_amount, p_description, p_metadata);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: 크레딧 추가 (구매, 보너스 등)
CREATE OR REPLACE FUNCTION public.add_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT,
    p_type TEXT DEFAULT 'bonus',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    -- 크레딧 추가
    UPDATE public.profiles 
    SET credits = credits + p_amount, updated_at = NOW()
    WHERE id = p_user_id;
    
    -- 트랜잭션 기록
    INSERT INTO public.credit_transactions (user_id, type, amount, description, metadata)
    VALUES (p_user_id, p_type, p_amount, p_description, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: 크레딧 잔액 확인
CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_credits INTEGER;
BEGIN
    SELECT credits INTO user_credits 
    FROM public.profiles 
    WHERE id = p_user_id;
    
    RETURN COALESCE(user_credits, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: 크레딧 트랜잭션 히스토리 조회
CREATE OR REPLACE FUNCTION public.get_user_credit_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    amount INTEGER,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ct.id,
        ct.type,
        ct.amount,
        ct.description,
        ct.metadata,
        ct.created_at
    FROM public.credit_transactions ct
    WHERE ct.user_id = p_user_id
    ORDER BY ct.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3단계 완료 후 확인사항:
-- 1. Functions에서 handle_new_user, deduct_credits, add_credits 함수 생성 확인
-- 2. Triggers에서 on_auth_user_created 트리거 생성 확인
-- =====================================================
