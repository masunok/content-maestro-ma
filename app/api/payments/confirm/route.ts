import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Supabase 연결 정보 확인
    console.log('Supabase connection info:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET'
    })
    
    // 클라이언트에서 받은 JSON 요청 바디입니다.
    const { paymentKey, orderId, amount, userId, userEmail, userName } = await request.json()

    // 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { 
          success: false,
          code: 'MISSING_PARAMETERS',
          message: '필수 파라미터가 누락되었습니다.',
          details: { paymentKey, orderId, amount }
        },
        { status: 400 }
      )
    }

    console.log('Payment confirmation request:', { 
      paymentKey, 
      orderId, 
      amount, 
      userId, 
      userEmail, 
      userName 
    })

    // 토스페이먼츠 API는 시크릿 키를 사용자 ID로 사용하고, 비밀번호는 사용하지 않습니다.
    // 비밀번호가 없다는 것을 알리기 위해 시크릿 키 뒤에 콜론을 추가합니다.
    const widgetSecretKey = process.env.TOSS_PAYMENTS_SECRET_KEY || 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6'
    const encryptedSecretKey = 'Basic ' + Buffer.from(widgetSecretKey + ':').toString('base64')

    console.log('Using secret key:', widgetSecretKey.includes('test_') ? 'TEST_KEY' : 'PRODUCTION_KEY')

    // 결제를 승인하면 결제수단에서 금액이 차감돼요.
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: encryptedSecretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: orderId,
        amount: amount,
        paymentKey: paymentKey,
      }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('TossPayments API error:', responseData)
      return NextResponse.json(
        responseData,
        { status: response.status }
      )
    }

    // 결제 성공 비즈니스 로직을 구현하세요.
    console.log('Payment confirmed successfully:', responseData)
    
    // 1. 주문 ID에서 패키지 정보 추출
    const packageInfo = extractPackageFromOrderId(orderId, amount)
    if (!packageInfo) {
      console.error('Failed to extract package info from orderId:', orderId)
      return NextResponse.json(
        { 
          success: false,
          code: 'INVALID_ORDER_ID',
          message: '주문 ID에서 패키지 정보를 추출할 수 없습니다.',
          details: { orderId, amount }
        },
        { status: 400 }
      )
    }

    // 2. 사용자 정보 처리
    let user: any
    
    if (userId && userEmail && userName) {
      // 클라이언트에서 전달받은 사용자 정보 사용
      console.log('Using client-provided user info:', { userId, userEmail, userName })
      
      // SECURITY DEFINER 함수를 사용하여 프로필 생성/수정 (RLS 우회)
      const { data: profileResult, error: profileError } = await supabase
        .rpc('create_or_update_user_profile', {
          p_user_id: userId,
          p_email: userEmail,
          p_name: userName,
          p_credits: 0
        })
      
      if (profileError) {
        console.error('Failed to create/update user profile:', profileError)
        return NextResponse.json(
          { 
            success: false,
            code: 'USER_PROFILE_ERROR',
            message: '사용자 프로필 생성/수정에 실패했습니다.',
            details: profileError.message
          },
          { status: 500 }
        )
      }
      
      if (!profileResult) {
        console.error('Profile creation/update returned false')
        return NextResponse.json(
          { 
            success: false,
            code: 'USER_PROFILE_ERROR',
            message: '사용자 프로필 생성/수정에 실패했습니다.',
            details: 'Profile function returned false'
          },
          { status: 500 }
        )
      }
      
      console.log('User profile created/updated successfully')
      
      // 프로필 정보 조회
      const { data: existingUser, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, name, credits')
        .eq('id', userId)
        .single()
      
      if (fetchError) {
        console.error('Failed to fetch user profile after creation:', fetchError)
        return NextResponse.json(
          { 
            success: false,
            code: 'USER_FETCH_ERROR',
            message: '사용자 프로필 조회에 실패했습니다.',
            details: fetchError.message
          },
          { status: 500 }
        )
      }
      
      user = existingUser
      console.log('User profile fetched:', user)
    } else {
      // 클라이언트에서 사용자 정보가 전달되지 않은 경우 (fallback)
      console.log('No user info provided, using fallback method...')
      
      const { data: allUsers, error: listError } = await supabase
        .from('profiles')
        .select('id, email, name, credits')
        .limit(1)
      
      if (listError) {
        console.error('Failed to list users:', listError)
        return NextResponse.json(
          { 
            success: false,
            code: 'USER_LIST_ERROR',
            message: '사용자 목록 조회에 실패했습니다.',
            details: listError.message
          },
          { status: 500 }
        )
      }
      
      if (!allUsers || allUsers.length === 0) {
        console.log('No users found, creating test user...')
        
        const testUserId = 'test-user-' + Date.now()
        const { data: profileResult, error: profileError } = await supabase
          .rpc('create_or_update_user_profile', {
            p_user_id: testUserId,
            p_email: 'test@example.com',
            p_name: '테스트 사용자',
            p_credits: 0
          })
        
        if (profileError || !profileResult) {
          console.error('Failed to create test user profile:', profileError)
          return NextResponse.json(
            { 
              success: false,
              code: 'USER_CREATION_FAILED',
              message: '테스트 사용자 생성에 실패했습니다.',
              details: profileError?.message || 'Profile function returned false'
            },
            { status: 500 }
          )
        }
        
        // 테스트 사용자 프로필 조회
        const { data: testUser, error: testUserError } = await supabase
          .from('profiles')
          .select('id, email, name, credits')
          .eq('id', testUserId)
          .single()
        
        if (testUserError) {
          console.error('Failed to fetch test user profile:', testUserError)
          return NextResponse.json(
            { 
              success: false,
              code: 'USER_FETCH_ERROR',
              message: '테스트 사용자 프로필 조회에 실패했습니다.',
              details: testUserError.message
            },
            { status: 500 }
          )
        }
        
        user = testUser
        console.log('Test user created:', user)
      } else {
        user = allUsers[0]
        console.log('Using fallback user:', user)
      }
    }
    
    console.log('Final user for credit update:', { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      currentCredits: user.credits 
    })

    // 3. SECURITY DEFINER 함수를 사용하여 크레딧 추가 (RLS 우회)
    console.log(`Adding ${packageInfo.credits} credits to user ${user.id} using SECURITY DEFINER function...`)
    
    const { data: creditResult, error: creditError } = await supabase
      .rpc('add_user_credits', {
        p_user_id: user.id,
        p_amount: packageInfo.credits,
        p_description: `${packageInfo.name} 패키지 구매 (${orderId})`,
        p_metadata: {
          orderId,
          amount: amount,
          packageName: packageInfo.name,
          paymentKey: paymentKey
        }
      })
    
    if (creditError) {
      console.error('Failed to add credits using SECURITY DEFINER function:', creditError)
      return NextResponse.json(
        { 
          success: false,
          code: 'CREDIT_UPDATE_FAILED',
          message: '크레딧 추가에 실패했습니다.',
          details: creditError.message
        },
        { status: 500 }
      )
    }
    
    if (!creditResult) {
      console.error('Credit addition function returned false')
      return NextResponse.json(
        { 
          success: false,
          code: 'CREDIT_UPDATE_FAILED',
          message: '크레딧 추가에 실패했습니다.',
          details: 'Credit function returned false'
        },
        { status: 500 }
      )
    }
    
    console.log('Credits added successfully using SECURITY DEFINER function')
    
    // 4. 업데이트된 사용자 정보 조회
    const { data: updatedUser, error: updateFetchError } = await supabase
      .from('profiles')
      .select('id, email, name, credits')
      .eq('id', user.id)
      .single()
    
    if (updateFetchError) {
      console.error('Failed to fetch updated user profile:', updateFetchError)
      // 크레딧은 이미 추가되었으므로 경고만 남김
    } else {
      console.log(`User credits updated from ${user.credits} to ${updatedUser.credits}`)
    }

    console.log(`Successfully added ${packageInfo.credits} credits to user ${user.id}`)

    return NextResponse.json({
      success: true,
      ...responseData,
      creditsAdded: packageInfo.credits,
      newTotalCredits: updatedUser?.credits || (user.credits + packageInfo.credits),
      packageName: packageInfo.name,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Payment confirmation error:', error)
    
    let errorMessage = '결제 승인 중 오류가 발생했습니다.'
    let errorCode = 'INTERNAL_ERROR'
    let errorDetails = null
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack
    } else if (typeof error === 'object' && error !== null) {
      errorDetails = error
    }
    
    return NextResponse.json(
      { 
        success: false,
        code: errorCode,
        message: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// 주문 ID에서 패키지 정보를 추출하는 함수
function extractPackageFromOrderId(orderId: string, amount: number) {
  // 패키지별 정보
  const packages = {
    9900: { name: '베이직', credits: 50 },
    24900: { name: '프로', credits: 150 },
    79900: { name: '엔터프라이즈', credits: 500 }
  }

  const packageInfo = packages[amount as keyof typeof packages]
  if (!packageInfo) {
    console.error('Unknown package amount:', amount)
    return null
  }

  return packageInfo
}
