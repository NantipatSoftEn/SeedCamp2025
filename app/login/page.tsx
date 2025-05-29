"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, LogIn, Mail, Lock, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [showDocsModal, setShowDocsModal] = useState(false)

  const { signIn, signUp, resetPassword } = useAuth()
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await signIn(email, password)

    if (error) {
      setError(error)
    } else {
      router.push("/")
    }

    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password)

    if (error) {
      setError(error)
    } else {
      setSuccess("Check your email for the confirmation link!")
    }

    setLoading(false)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setError("")
    setSuccess("")

    if (!resetEmail) {
      setError("Please enter your email address")
      setResetLoading(false)
      return
    }

    const { error } = await resetPassword(resetEmail)

    if (error) {
      setError(error)
    } else {
      setSuccess("Password reset email sent! Check your inbox.")
    }

    setResetLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">SeedCamp 2025</CardTitle>
          <CardDescription>Sign in to access the management system</CardDescription>
          <div className="flex justify-center mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDocsModal(true)}
              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
            >
              <FileText className="mr-2 h-4 w-4" />
              เอกสารการใช้งาน (อ่านก่อนใช้ระบบ)
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="reset">Reset</TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Reset Password Tab */}
            <TabsContent value="reset">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={resetLoading}
                    />
                  </div>
                  <p className="text-xs text-gray-500">We'll send you a link to reset your password</p>
                </div>

                <Button type="submit" className="w-full" disabled={resetLoading}>
                  {resetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending email...
                    </>
                  ) : (
                    "Send Reset Email"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Error and Success Messages */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 mt-4">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 mt-4">
              <div className="text-green-800">{success}</div>
            </div>
          )}
        </CardContent>

        <CardFooter className="text-center">
          <div className="text-sm text-gray-600">
            <p>example:bonus@seedchurchbkk.org</p>
            <p className="font-mono text-xs">nick_name@seedchurchbkk.org</p>
          </div>
        </CardFooter>
      </Card>

      {/* Documentation Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">เอกสารการใช้งานระบบ SeedCamp 2025</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDocsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4 text-sm text-gray-700">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">⚠️ ข้อควรระวัง - กรุณาอ่านก่อนใช้งาน</h3>
                  <p className="text-red-700">
                    ระบบนี้ใช้สำหรับจัดการข้อมูลผู้เข้าร่วม SeedCamp 2025 เท่านั้น กรุณาใช้งานอย่างระมัดระวังและไม่แชร์ข้อมูลส่วนตัวของผู้เข้าร่วม
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🔐 การเข้าสู่ระบบ</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>ใช้อีเมลและรหัสผ่านที่ได้รับจากผู้ดูแลระบบ</li>
                    <li>หากลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ</li>
                    <li>ไม่แชร์ข้อมูลการเข้าสู่ระบบกับผู้อื่น</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">👥 การจัดการข้อมูลผู้เข้าร่วม</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>สามารถดู แก้ไข และเพิ่มข้อมูลผู้เข้าร่วมได้</li>
                    <li>ตรวจสอบสถานะการชำระเงินและอัปโหลดสลิป</li>
                    <li>จัดการข้อมูลกลุมดูแลและข้อมูลสุขภาพ</li>
                    <li>ส่งออกข้อมูลเป็นไฟล์ CSV</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">💰 การจัดการการชำระเงิน</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>อัปเดตสถานะการชำระเงิน: Paid, Pending, Unpaid</li>
                    <li>อัปโหลดสลิปการโอนเงิน</li>
                    <li>ตรวจสอบยอดเงินและสถิติการชำระ</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">📊 รายงานและสถิติ</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>ดูสถิติผู้เข้าร่วมตามเพศ ไซส์เสื้อ</li>
                    <li>ติดตามสถานะการชำระเงิน</li>
                    <li>ดูข้อมูลกลุ่มดูแลและโรคประจำตัว</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🔒 ความปลอดภัยข้อมูล</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>ข้อมูลทั้งหมดเป็นความลับ ห้ามเปิดเผยต่อบุคคลภายนอก</li>
                    <li>ออกจากระบบทุกครั้งหลังใช้งานเสร็จ</li>
                    <li>ไม่ใช้งานในที่สาธารณะหรือคอมพิวเตอร์ส่วนกลาง</li>
                  </ul>
                </div>

                {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">📞 ติดต่อสอบถาม</h3>
                  <p className="text-blue-700">หากมีปัญหาการใช้งาน กรุณาติดต่อทีมผู้ดูแลระบบ SeedCamp 2025</p>
                </div> */}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  onClick={() => setShowDocsModal(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  เข้าใจแล้ว
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
