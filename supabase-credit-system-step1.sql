-- =====================================================
-- Content Maestro 크레딧 시스템 SQL 스키마 - 1단계
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1단계: 기본 테이블 생성 (외래키 없이)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    credits INTEGER DEFAULT 10 NOT NULL CHECK (credits >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')) NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.content_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL,
    content TEXT,
    keywords TEXT[],
    tone TEXT,
    credits_used INTEGER NOT NULL DEFAULT 1,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'draft', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_content_history_user_id ON public.content_history(user_id);
CREATE INDEX IF NOT EXISTS idx_content_history_created_at ON public.content_history(created_at);

-- =====================================================
-- 1단계 완료 후 확인사항:
-- Tables에서 profiles, credit_transactions, content_history 테이블 생성 확인
-- =====================================================
