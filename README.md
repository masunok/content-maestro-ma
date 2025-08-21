# Content Maestro - AI 블로그 콘텐츠 생성기

AI를 활용하여 블로그 콘텐츠를 생성하는 웹 애플리케이션입니다.

## 주요 기능

- 🔐 이메일/비밀번호 로그인
- 🌐 구글 소셜 로그인
- 💳 크레딧 시스템
- 🤖 AI 콘텐츠 생성 (OpenAI GPT-4o)
- 📊 사용 통계
- 📝 콘텐츠 히스토리
- 🔍 SEO 최적화 팁

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **State Management**: React Context API
- **AI**: OpenAI GPT-4o API
- **Payment**: 토스페이먼츠 V2

## 설치 및 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트를 생성합니다.
2. 프로젝트 설정에서 다음 정보를 확인합니다:
   - Project URL
   - Anon (public) key

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가합니다:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API 설정
OPENAI_API_KEY=your_openai_api_key_here

# Google OAuth 설정 (선택사항)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. OpenAI API 설정

1. [OpenAI](https://platform.openai.com/)에서 API 키를 생성합니다.
2. `.env.local` 파일에 `OPENAI_API_KEY`를 설정합니다.
3. GPT-4o 모델을 사용할 수 있는 계정인지 확인합니다.

### 5. 데이터베이스 스키마 설정

1. Supabase 대시보드에서 SQL Editor를 엽니다.
2. `supabase-schema.sql` 파일의 내용을 복사하여 실행합니다.

**중요**: 만약 `content_history` 테이블이 없다는 오류가 발생한다면:

1. Supabase 대시보드 → SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- content_history 테이블 생성
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
CREATE INDEX IF NOT EXISTS idx_content_history_user_id ON public.content_history(user_id);
CREATE INDEX IF NOT EXISTS idx_content_history_created_at ON public.content_history(created_at);

-- RLS 활성화
ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "사용자는 자신의 콘텐츠만 조회/수정 가능" ON public.content_history
  FOR ALL USING (auth.uid() = user_id);
```

**추가로 필요한 테이블들:**

```sql
-- credit_transactions 테이블 생성
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')) NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);

-- RLS 활성화
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "사용자는 자신의 트랜잭션만 조회 가능" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 트랜잭션만 생성 가능" ON public.credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- profiles 테이블에 password_hash 컬럼 추가 (기존 테이블이 있는 경우)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- profiles 테이블에 credits 컬럼 추가 (기존 테이블이 있는 경우)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 10;
```

2. 또는 웹사이트에서 오른쪽 하단의 🐛 버튼을 클릭하여 "🔧 content_history 테이블 생성" 버튼을 사용하세요.

### 6. Google OAuth 설정 (선택사항)

구글 소셜 로그인을 사용하려면:

1. [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트를 생성합니다.
2. OAuth 2.0 클라이언트 ID를 생성합니다.
3. 승인된 리디렉션 URI에 다음을 추가합니다:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (개발용)

### 7. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인합니다.

## 프로젝트 구조

```
content-maestro-ma/
├── app/                    # Next.js App Router
│   ├── auth/              # 인증 관련 페이지
│   ├── dashboard/         # 대시보드
│   ├── login/             # 로그인 페이지
│   ├── signup/            # 회원가입 페이지
│   └── ...
├── components/             # 재사용 가능한 컴포넌트
│   ├── ui/                # shadcn/ui 컴포넌트
│   └── ...
├── lib/                    # 유틸리티 및 설정
│   ├── auth-context.tsx   # 인증 컨텍스트
│   ├── supabase.ts        # Supabase 클라이언트
│   └── ...
└── ...
```

## AI 콘텐츠 생성 시스템

### OpenAI GPT-4o 연동
- 사용자가 입력한 주제와 키워드를 기반으로 고품질 블로그 콘텐츠를 자동 생성
- 다양한 콘텐츠 유형 지원: 블로그 포스트, 아티클, 소셜미디어, 뉴스레터
- 톤앤매너 선택 가능: 전문적, 친근한, 캐주얼, 격식있는, 창의적
- 마크다운 형식으로 구조화된 콘텐츠 생성

### SEO 최적화
- 생성된 콘텐츠에 대한 맞춤형 SEO 최적화 팁 제공
- 키워드 밀도, 헤딩 태그, 메타 디스크립션 등 최적화 가이드
- 검색 엔진 친화적인 콘텐츠 구조 제안

### 크레딧 시스템
- 콘텐츠 1회 생성 시 1 크레딧 차감
- 무료 가입 시 10 크레딧 제공
- 크레딧 부족 시 토스페이먼츠를 통한 추가 구매 가능

## 인증 시스템

### 이메일/비밀번호 로그인
- 사용자가 이메일과 비밀번호로 계정을 생성하고 로그인할 수 있습니다.
- 비밀번호는 10자 이상, 영문자/숫자/특수기호를 포함해야 합니다.

### 구글 소셜 로그인
- Google OAuth를 통해 간편하게 로그인할 수 있습니다.
- 첫 로그인 시 자동으로 프로필이 생성됩니다.

### 보안
- Row Level Security (RLS)가 활성화되어 있습니다.
- 사용자는 자신의 데이터만 접근할 수 있습니다.
- JWT 토큰 기반 인증을 사용합니다.

## 크레딧 시스템

- 회원가입 시 무료 크레딧 10개를 제공합니다.
- AI 콘텐츠 생성 시 크레딧이 차감됩니다.
- 크레딧 구매 및 사용 내역을 추적할 수 있습니다.

## 배포

### Vercel 배포 (권장)

1. GitHub에 코드를 푸시합니다.
2. [Vercel](https://vercel.com)에서 새 프로젝트를 생성합니다.
3. 환경 변수를 설정합니다.
4. 배포합니다.

### 기타 플랫폼

- Netlify
- Railway
- AWS Amplify

## 문제 해결

### 일반적인 문제

1. **인증 오류**: 환경 변수가 올바르게 설정되었는지 확인하세요.
2. **데이터베이스 연결 오류**: Supabase 프로젝트가 활성 상태인지 확인하세요.
3. **OAuth 오류**: 리디렉션 URI가 올바르게 설정되었는지 확인하세요.

### 로그 확인

브라우저 개발자 도구의 콘솔에서 오류 메시지를 확인할 수 있습니다.

## 기여하기

1. 이 저장소를 포크합니다.
2. 새 기능 브랜치를 생성합니다.
3. 변경사항을 커밋합니다.
4. Pull Request를 생성합니다.

## 라이선스

MIT License

## 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.
