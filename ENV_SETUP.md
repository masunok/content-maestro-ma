# 환경 변수 설정 가이드

## 필수 환경 변수

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수들을 설정해야 합니다.

### 1. Supabase 설정

```env
# Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase 익명 키 (공개)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Supabase 서비스 롤 키 (비공개, 서버 사이드에서만 사용)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**설정 방법:**
1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. 프로젝트 설정 → API에서 URL과 키들 확인
3. `NEXT_PUBLIC_` 접두사가 붙은 키는 클라이언트에서 사용되므로 공개됨
4. `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드에서만 사용되므로 비공개로 유지

### 2. OpenAI API 설정

```env
# OpenAI API 키
OPENAI_API_KEY=sk-your_openai_api_key_here
```

**설정 방법:**
1. [OpenAI Platform](https://platform.openai.com/)에서 계정 생성
2. API Keys 섹션에서 새 키 생성
3. GPT-4o 모델을 사용할 수 있는 계정인지 확인
4. API 키는 절대 공개되지 않도록 주의

### 3. 토스페이먼츠 설정 (크레딧 구매 기능)

```env
# 토스페이먼츠 클라이언트 키 (공개)
NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq

# 토스페이먼츠 시크릿 키 (비공개)
TOSS_PAYMENTS_SECRET_KEY=test_sk_D4yKeq5bgrpKRd0JYbLVGX0lzW6Y
```

**설정 방법:**
1. [토스페이먼츠](https://payments.toss.im/)에서 계정 생성
2. 테스트 모드와 실제 모드의 키가 다름
3. `NEXT_PUBLIC_` 접두사가 붙은 키는 클라이언트에서 사용

## 선택적 환경 변수

### Google OAuth 설정 (소셜 로그인)

```env
# Google OAuth 클라이언트 ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**설정 방법:**
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. 승인된 리디렉션 URI 설정:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (개발용)

## 환경 변수 파일 예시

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI API 설정
OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz

# 토스페이먼츠 설정
NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
TOSS_PAYMENTS_SECRET_KEY=test_sk_D4yKeq5bgrpKRd0JYbLVGX0lzW6Y

# Google OAuth 설정 (선택사항)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

## 주의사항

1. **`.env.local` 파일은 절대 Git에 커밋하지 마세요**
2. **`NEXT_PUBLIC_` 접두사가 붙은 키만 클라이언트에서 사용 가능**
3. **서비스 롤 키와 API 키는 절대 공개되지 않도록 주의**
4. **프로덕션 환경에서는 HTTPS를 사용해야 합니다**

## 문제 해결

### OpenAI API 오류
- API 키가 올바르게 설정되었는지 확인
- 계정에 충분한 크레딧이 있는지 확인
- GPT-4o 모델 사용 권한이 있는지 확인

### Supabase 연결 오류
- 프로젝트 URL과 키가 올바른지 확인
- 프로젝트가 활성 상태인지 확인
- RLS 정책이 올바르게 설정되었는지 확인

### 토스페이먼츠 오류
- 클라이언트 키와 시크릿 키가 올바른지 확인
- 테스트 모드/실제 모드 설정 확인
- 결제 승인 URL이 올바르게 설정되었는지 확인
