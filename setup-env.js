#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 Content Maestro 환경 변수 설정 도우미')
console.log('=====================================\n')

// .env.local 파일 경로
const envFilePath = path.join(process.cwd(), '.env.local')

// 환경 변수 템플릿
const envTemplate = `# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI API 설정
OPENAI_API_KEY=your_openai_api_key_here

# 토스페이먼츠 설정 (크레딧 구매 기능)
NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
TOSS_PAYMENTS_SECRET_KEY=test_sk_D4yKeq5bgrpKRd0JYbLVGX0lzW6Y

# Google OAuth 설정 (선택사항)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
`

// .env.local 파일이 이미 존재하는지 확인
if (fs.existsSync(envFilePath)) {
  console.log('⚠️  .env.local 파일이 이미 존재합니다.')
  console.log('📁 파일 경로:', envFilePath)
  
  const currentContent = fs.readFileSync(envFilePath, 'utf8')
  console.log('\n📋 현재 내용:')
  console.log('─'.repeat(50))
  console.log(currentContent)
  console.log('─'.repeat(50))
  
  console.log('\n💡 기존 파일을 백업하고 새로 생성하려면:')
  console.log('   1. 기존 .env.local 파일을 .env.local.backup으로 이름 변경')
  console.log('   2. 이 스크립트를 다시 실행')
  
} else {
  // 새 .env.local 파일 생성
  try {
    fs.writeFileSync(envFilePath, envTemplate)
    console.log('✅ .env.local 파일이 생성되었습니다!')
    console.log('📁 파일 경로:', envFilePath)
    console.log('\n📋 다음 단계를 따라 환경 변수를 설정하세요:')
    console.log('\n1️⃣  Supabase 프로젝트 설정:')
    console.log('   - https://supabase.com 에서 새 프로젝트 생성')
    console.log('   - 프로젝트 설정 → API에서 URL과 키 확인')
    console.log('   - .env.local 파일의 Supabase 관련 값들을 실제 값으로 교체')
    
    console.log('\n2️⃣  OpenAI API 설정:')
    console.log('   - https://platform.openai.com 에서 API 키 생성')
    console.log('   - .env.local 파일의 OPENAI_API_KEY를 실제 값으로 교체')
    
    console.log('\n3️⃣  개발 서버 재시작:')
    console.log('   npm run dev')
    
    console.log('\n📚 자세한 설정 방법은 ENV_SETUP.md 파일을 참고하세요.')
    
  } catch (error) {
    console.error('❌ .env.local 파일 생성 실패:', error.message)
    console.log('\n💡 수동으로 파일을 생성하세요:')
    console.log('   1. 프로젝트 루트에 .env.local 파일 생성')
    console.log('   2. 위의 템플릿 내용을 복사하여 붙여넣기')
    console.log('   3. 실제 값으로 교체')
  }
}

console.log('\n🔗 유용한 링크:')
console.log('   - Supabase: https://supabase.com')
console.log('   - OpenAI: https://platform.openai.com')
console.log('   - 토스페이먼츠: https://payments.toss.im')
console.log('   - Google Cloud: https://console.cloud.google.com')
