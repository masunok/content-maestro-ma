export interface TossPaymentRequest {
  amount: number
  orderId: string
  orderName: string
  customerName: string
  customerEmail: string
  successUrl: string
  failUrl: string
  windowTarget?: 'iframe' | 'self'
}

export interface TossPaymentResponse {
  paymentKey: string
  orderId: string
  orderName: string
  method: string
  totalAmount: number
  balanceAmount: number
  suppliedAmount: number
  vat: number
  status: string
  requestedAt: string
  approvedAt?: string
  useEscrow: boolean
  currency: string
  giftCertificate?: any
  cancel?: any
  cancelAmount?: number
  cancelReason?: string
  useDiscount?: boolean
  discount?: any
  escrow?: any
  useCardPoint?: boolean
  cardPoint?: any
  useCashReceipt?: boolean
  cashReceipt?: any
  useMobilePhone?: boolean
  mobilePhone?: any
  useGiftCertificate?: boolean
  useAccountTransfer?: boolean
  accountTransfer?: any
  useVirtualAccount?: boolean
  virtualAccount?: any
  useTransfer?: boolean
  transfer?: any
  usePhoneBill?: boolean
  phoneBill?: any
  useCultureland?: boolean
  cultureland?: any
  useHappymoney?: boolean
  happymoney?: any
  useBooknlife?: boolean
  booknlife?: any
  useLottoland?: boolean
  lottoland?: any
  useToss?: boolean
  toss?: any
  usePayco?: boolean
  payco?: any
  useKakaoPay?: boolean
  kakaoPay?: any
  useNaverPay?: boolean
  naverPay?: any
  useLpay?: boolean
  lpay?: any
  useYpay?: boolean
  ypay?: any
  useInicis?: boolean
  inicis?: any
  useUplus?: boolean
  uplus?: any
  useJpay?: boolean
  jpay?: any
  useKpay?: boolean
  kpay?: any
  useApplePay?: boolean
  applePay?: boolean
  useGooglePay?: boolean
  googlePay?: boolean
  useSamsungPay?: boolean
  samsungPay?: boolean
}

export interface TossPaymentConfirmRequest {
  paymentKey: string
  orderId: string
  amount: number
}

export interface TossPaymentConfirmResponse {
  paymentKey: string
  orderId: string
  orderName: string
  method: string
  totalAmount: number
  balanceAmount: number
  suppliedAmount: number
  vat: number
  status: string
  requestedAt: string
  approvedAt: string
  useEscrow: boolean
  currency: string
  giftCertificate?: any
  cancel?: any
  cancelAmount?: number
  cancelReason?: string
  useDiscount?: boolean
  discount?: any
  escrow?: any
  useCardPoint?: boolean
  cardPoint?: any
  useCashReceipt?: boolean
  cashReceipt?: any
  useMobilePhone?: boolean
  mobilePhone?: any
  useGiftCertificate?: boolean
  useAccountTransfer?: boolean
  accountTransfer?: any
  useVirtualAccount?: boolean
  virtualAccount?: any
  useTransfer?: boolean
  transfer?: any
  usePhoneBill?: boolean
  phoneBill?: any
  useCultureland?: boolean
  cultureland?: any
  useHappymoney?: boolean
  happymoney?: any
  useBooknlife?: boolean
  booknlife?: any
  useLottoland?: boolean
  lottoland?: any
  useToss?: boolean
  toss?: any
  usePayco?: boolean
  payco?: any
  useKakaoPay?: boolean
  kakaoPay?: any
  useNaverPay?: boolean
  naverPay?: any
  useLpay?: boolean
  lpay?: any
  useYpay?: boolean
  ypay?: any
  useInicis?: boolean
  inicis?: any
  useUplus?: boolean
  uplus?: any
  useJpay?: boolean
  jpay?: any
  useKpay?: boolean
  kpay?: any
  useApplePay?: boolean
  applePay?: boolean
  useGooglePay?: boolean
  googlePay?: boolean
  useSamsungPay?: boolean
  samsungPay?: boolean
}

const TOSS_PAYMENTS_BASE_URL = 'https://api.tosspayments.com'

export class TossPaymentsAPI {
  private clientKey: string
  private secretKey: string

  constructor() {
    this.clientKey = process.env.TOSS_PAYMENTS_CLIENT_KEY || 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm'
    this.secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY || 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6'
    
    // 디버깅을 위한 로그
    console.log('TossPaymentsAPI initialized with:')
    console.log('Client Key:', this.clientKey)
    console.log('Secret Key:', this.secretKey ? `${this.secretKey.substring(0, 10)}...` : 'undefined')
    console.log('Environment:', process.env.NODE_ENV)
  }

  // 결제 요청 생성
  async createPayment(request: TossPaymentRequest): Promise<TossPaymentResponse> {
    console.log('Creating payment request:', request)
    console.log('Using secret key:', this.secretKey ? `${this.secretKey.substring(0, 10)}...` : 'undefined')
    
    // 토스페이먼츠 공식 문서에 따른 정확한 파라미터 형식
    const paymentData = {
      orderId: request.orderId,
      orderName: request.orderName,
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      amount: request.amount,
      successUrl: request.successUrl,
      failUrl: request.failUrl,
      method: 'CARD', // 기본 결제 방법
      flowMode: 'DEFAULT',
      currency: 'KRW',
      useInternationalCardOnly: false
    }

    console.log('Sending payment data to TossPayments:', paymentData)
    
    const response = await fetch(`${TOSS_PAYMENTS_BASE_URL}/v1/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })

    console.log('TossPayments API response status:', response.status)
    console.log('TossPayments API response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const error = await response.json()
      console.error('Payment creation error response:', error)
      console.error('Full error details:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        error: error
      })
      throw new Error(error.message || `결제 요청 생성에 실패했습니다. (${response.status})`)
    }

    const result = await response.json()
    console.log('Payment creation successful:', result)
    return result
  }

  // 결제 승인
  async confirmPayment(request: TossPaymentConfirmRequest): Promise<TossPaymentConfirmResponse> {
    console.log('Confirming payment:', request)
    
    const response = await fetch(`${TOSS_PAYMENTS_BASE_URL}/v1/payments/${request.paymentKey}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: request.orderId,
        amount: request.amount,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Payment confirmation error response:', error)
      throw new Error(error.message || `결제 승인에 실패했습니다. (${response.status})`)
    }

    const result = await response.json()
    console.log('Payment confirmation successful:', result)
    return result
  }

  // 결제 조회
  async getPayment(paymentKey: string): Promise<TossPaymentConfirmResponse> {
    const response = await fetch(`${TOSS_PAYMENTS_BASE_URL}/v1/payments/${paymentKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Payment retrieval error response:', error)
      throw new Error(error.message || `결제 조회에 실패했습니다. (${response.status})`)
    }

    return response.json()
  }

  // 결제 취소
  async cancelPayment(paymentKey: string, reason: string, cancelAmount?: number): Promise<TossPaymentConfirmResponse> {
    const response = await fetch(`${TOSS_PAYMENTS_BASE_URL}/v1/payments/${paymentKey}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancelReason: reason,
        ...(cancelAmount && { cancelAmount }),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Payment cancellation error response:', error)
      throw new Error(error.message || `결제 취소에 실패했습니다. (${response.status})`)
    }

    return response.json()
  }
}

export const tossPaymentsAPI = new TossPaymentsAPI()
