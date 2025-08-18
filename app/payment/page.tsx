"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, CreditCard, Smartphone, Building2, Shield, Zap } from "lucide-react"
import Link from "next/link"

const creditPackages = {
  basic: { name: "베이직", credits: 50, price: 9900 },
  pro: { name: "프로", credits: 150, price: 24900 },
  enterprise: { name: "엔터프라이즈", credits: 500, price: 79900 },
}

export default function PaymentPage() {
  const { user, isLoading, addCredits } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const packageId = searchParams.get("package") as keyof typeof creditPackages
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvc: "",
    cardholderName: "",
    phoneNumber: "",
  })

  const selectedPackage = packageId ? creditPackages[packageId] : null

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
    if (!selectedPackage) {
      router.push("/credits")
    }
  }, [user, isLoading, selectedPackage, router])

  const handlePayment = async () => {
    if (!selectedPackage || !user) return

    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Mock successful payment
    addCredits(selectedPackage.credits, `${selectedPackage.name} 패키지 구매`)

    // Redirect to success page
    router.push(`/payment/success?package=${packageId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user || !selectedPackage) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/credits">
            <ArrowLeft className="h-4 w-4 mr-2" />
            크레딧 구매로 돌아가기
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>주문 요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedPackage.name} 패키지</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    {selectedPackage.credits}개 크레딧
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{selectedPackage.price.toLocaleString()}원</div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-semibold">
                <span>총 결제 금액</span>
                <span className="text-lg text-primary">{selectedPackage.price.toLocaleString()}원</span>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>안전한 결제가 보장됩니다</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>결제 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label>결제 방법</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="card" id="card" />
                    <CreditCard className="h-4 w-4" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer">
                      신용카드/체크카드
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="transfer" id="transfer" />
                    <Building2 className="h-4 w-4" />
                    <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                      계좌이체
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="phone" id="phone" />
                    <Smartphone className="h-4 w-4" />
                    <Label htmlFor="phone" className="flex-1 cursor-pointer">
                      휴대폰 결제
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Card Payment Form */}
              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">카드번호</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">유효기간</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input
                        id="cvc"
                        placeholder="123"
                        value={formData.cvc}
                        onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardholderName">카드소유자명</Label>
                    <Input
                      id="cardholderName"
                      placeholder="홍길동"
                      value={formData.cardholderName}
                      onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Phone Payment Form */}
              {paymentMethod === "phone" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">휴대폰 번호</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="010-1234-5678"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Transfer Payment Info */}
              {paymentMethod === "transfer" && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    계좌이체를 선택하시면 가상계좌가 발급됩니다. 발급된 계좌로 입금하시면 자동으로 크레딧이 충전됩니다.
                  </p>
                </div>
              )}

              <Button className="w-full" onClick={handlePayment} disabled={isProcessing} size="lg">
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    결제 처리 중...
                  </>
                ) : (
                  `${selectedPackage.price.toLocaleString()}원 결제하기`
                )}
              </Button>

              <div className="text-xs text-muted-foreground text-center">
                결제 진행 시{" "}
                <Link href="/terms" className="underline">
                  이용약관
                </Link>{" "}
                및{" "}
                <Link href="/privacy" className="underline">
                  개인정보처리방침
                </Link>
                에 동의한 것으로 간주됩니다.
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
