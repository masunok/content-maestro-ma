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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- 프로필 테이블 정책
CREATE POLICY "사용자는 자신의 프로필만 조회/수정 가능" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- 크레딧 트랜잭션 테이블 정책
CREATE POLICY "사용자는 자신의 트랜잭션만 조회 가능" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 트랜잭션만 생성 가능" ON public.credit_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);

-- 함수: 사용자 생성 시 자동으로 프로필 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, credits)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        10
    );
    
    -- 환영 보너스 크레딧 트랜잭션 추가
    INSERT INTO public.credit_transactions (user_id, type, amount, description)
    VALUES (NEW.id, 'bonus', 10, '회원가입 환영 보너스');
    
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
