-- Supabase 데이터베이스 스키마

-- 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    credits INTEGER DEFAULT 10 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 크레딧 트랜잭션 테이블
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('purchase', 'usage', 'bonus')) NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 사용자 크레딧 요약 테이블
CREATE TABLE IF NOT EXISTS public.user_credit_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    total_credits INTEGER DEFAULT 0 NOT NULL,
    total_purchased INTEGER DEFAULT 0 NOT NULL,
    total_used INTEGER DEFAULT 0 NOT NULL,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    last_usage_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credit_summary ENABLE ROW LEVEL SECURITY;

-- 프로필 테이블 정책
DROP POLICY IF EXISTS "사용자는 자신의 프로필만 조회/수정 가능" ON public.profiles;
CREATE POLICY "사용자는 자신의 프로필만 조회/수정 가능" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- 서버 사이드에서 프로필 생성/수정을 위한 정책 (SECURITY DEFINER 함수용)
DROP POLICY IF EXISTS "서버에서 프로필 생성/수정 가능" ON public.profiles;
CREATE POLICY "서버에서 프로필 생성/수정 가능" ON public.profiles
    FOR ALL USING (true)
    WITH CHECK (true);

-- 크레딧 트랜잭션 테이블 정책
DROP POLICY IF EXISTS "사용자는 자신의 트랜잭션만 조회 가능" ON public.credit_transactions;
CREATE POLICY "사용자는 자신의 트랜잭션만 조회 가능" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "사용자는 자신의 트랜잭션만 생성 가능" ON public.credit_transactions;
CREATE POLICY "사용자는 자신의 트랜잭션만 생성 가능" ON public.credit_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 서버 사이드에서 트랜잭션 생성을 위한 정책
DROP POLICY IF EXISTS "서버에서 트랜잭션 생성 가능" ON public.credit_transactions;
CREATE POLICY "서버에서 트랜잭션 생성 가능" ON public.credit_transactions
    FOR INSERT WITH CHECK (true);

-- 사용자 크레딧 요약 테이블 정책
DROP POLICY IF EXISTS "사용자는 자신의 크레딧 요약만 조회 가능" ON public.user_credit_summary;
CREATE POLICY "사용자는 자신의 크레딧 요약만 조회 가능" ON public.user_credit_summary
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "사용자는 자신의 크레딧 요약만 생성/수정 가능" ON public.user_credit_summary;
CREATE POLICY "사용자는 자신의 크레딧 요약만 생성/수정 가능" ON public.user_credit_summary
    FOR ALL USING (auth.uid() = user_id);

-- 서버 사이드에서 크레딧 요약 생성/수정을 위한 정책
DROP POLICY IF EXISTS "서버에서 크레딧 요약 생성/수정 가능" ON public.user_credit_summary;
CREATE POLICY "서버에서 크레딧 요약 생성/수정 가능" ON public.user_credit_summary
    FOR ALL USING (true)
    WITH CHECK (true);

-- 인덱스 생성
DROP INDEX IF EXISTS idx_profiles_email;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

DROP INDEX IF EXISTS idx_credit_transactions_user_id;
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);

DROP INDEX IF EXISTS idx_credit_transactions_created_at;
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);

DROP INDEX IF EXISTS idx_user_credit_summary_user_id;
CREATE INDEX IF NOT EXISTS idx_user_credit_summary_user_id ON public.user_credit_summary(user_id);

-- 함수: 사용자 생성 시 자동으로 프로필 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 프로필 생성 (RLS 우회를 위해 SECURITY DEFINER 사용)
    INSERT INTO public.profiles (id, email, name, credits, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        10,
        NOW(),
        NOW()
    );
    
    -- 환영 보너스 크레딧 트랜잭션 추가 (RLS 우회)
    INSERT INTO public.credit_transactions (user_id, type, amount, description, created_at)
    VALUES (NEW.id, 'bonus', 10, '회원가입 환영 보너스', NOW());
    
    -- 크레딧 요약 생성 (RLS 우회)
    INSERT INTO public.user_credit_summary (user_id, total_credits, total_purchased, total_used, last_purchase_date, created_at, updated_at)
    VALUES (NEW.id, 10, 0, 0, NULL, NOW(), NOW());
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- 오류 발생 시 로그만 남기고 계속 진행 (사용자 생성은 성공)
        RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거: 새 사용자 생성 시 자동으로 프로필 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 함수: 크레딧 업데이트 시 updated_at 자동 업데이트
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

-- 트리거: 사용자 크레딧 요약 업데이트 시 updated_at 자동 업데이트
DROP TRIGGER IF EXISTS update_user_credit_summary_updated_at ON public.user_credit_summary;
CREATE TRIGGER update_user_credit_summary_updated_at
    BEFORE UPDATE ON public.user_credit_summary
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 서버 사이드에서 사용자 프로필을 생성/수정하는 함수 (RLS 우회)
CREATE OR REPLACE FUNCTION public.create_or_update_user_profile(
    p_user_id UUID,
    p_email TEXT,
    p_name TEXT,
    p_credits INTEGER DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 기존 프로필 확인
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
        -- 기존 프로필 업데이트
        UPDATE public.profiles 
        SET 
            email = p_email,
            name = p_name,
            credits = p_credits,
            updated_at = NOW()
        WHERE id = p_user_id;
    ELSE
        -- 새 프로필 생성
        INSERT INTO public.profiles (id, email, name, credits, created_at, updated_at)
        VALUES (p_user_id, p_email, p_name, p_credits, NOW(), NOW());
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in create_or_update_user_profile: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- 서버 사이드에서 크레딧을 추가하는 함수 (RLS 우회)
CREATE OR REPLACE FUNCTION public.add_user_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_credits INTEGER;
BEGIN
    -- 현재 크레딧 조회
    SELECT credits INTO v_current_credits 
    FROM public.profiles 
    WHERE id = p_user_id;
    
    IF v_current_credits IS NULL THEN
        RAISE EXCEPTION 'User profile not found: %', p_user_id;
    END IF;
    
    v_new_credits := v_current_credits + p_amount;
    
    -- 크레딧 업데이트
    UPDATE public.profiles 
    SET credits = v_new_credits, updated_at = NOW()
    WHERE id = p_user_id;
    
    -- 트랜잭션 기록
    INSERT INTO public.credit_transactions (user_id, type, amount, description, metadata, created_at)
    VALUES (p_user_id, 'purchase', p_amount, p_description, p_metadata, NOW());
    
    -- 크레딧 요약 업데이트
    INSERT INTO public.user_credit_summary (user_id, total_credits, total_purchased, total_used, last_purchase_date, created_at, updated_at)
    VALUES (p_user_id, v_new_credits, p_amount, 0, NOW(), NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        total_credits = v_new_credits,
        total_purchased = user_credit_summary.total_purchased + p_amount,
        last_purchase_date = NOW(),
        updated_at = NOW();
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in add_user_credits: %', SQLERRM;
        RETURN FALSE;
END;
$$;
