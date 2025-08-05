// app/auth/page.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Gift, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Import OTP components
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export default function AuthPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({ username: "", email: "", password: "", confirmPassword: "" })
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // New state for OTP
  const [otpRequired, setOtpRequired] = useState(false)
  const [loginEmailForOtp, setLoginEmailForOtp] = useState("") // To store email for OTP verification
  const [otpInput, setOtpInput] = useState("")
  const [otpMessage, setOtpMessage] = useState("")
  const [isResendingOtp, setIsResendingOtp] = useState(false)
  
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setOtpMessage("") // Clear any previous OTP messages

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginData.email, password: loginData.password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        if (data.otpRequired) {
          setOtpRequired(true)
          setLoginEmailForOtp(data.email) // Store email for OTP step
          setOtpMessage(data.message) // Show message like "OTP sent to your email"
          setOtpInput(""); // Clear OTP input field for new entry
        } else {
          // Regular login success (if OTP is ever not required)
          if(data.user && data.user.email === ADMIN_EMAIL) {
              router.push("/admin")
          } else {
              router.push("/dashboard")
          }
        }
      } else {
        alert(data.message || "Login failed.")
      }
    } catch (error) {
      console.error("Login error:", error)
      alert("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setOtpMessage("")

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmailForOtp, otp: otpInput }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert(data.message || "Login successful!")
        if(data.user && data.user.email === ADMIN_EMAIL) {
            router.push("/admin")
        } else {
            router.push("/dashboard")
        }
      } else {
        setOtpMessage(data.message || "OTP verification failed.")
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      setOtpMessage("OTP verification failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setIsResendingOtp(true)
    setOtpMessage("")
    try {
      const response = await fetch("/api/auth/login", { // Re-call login to resend OTP
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginEmailForOtp, password: loginData.password }), // Use stored email and password
      })
      const data = await response.json()
      if (response.ok && data.success && data.otpRequired) {
        setOtpMessage("New OTP sent to your email.")
        setOtpInput(""); // Clear OTP input field for new entry
      } else {
        setOtpMessage(data.message || "Failed to resend OTP.")
      }
    } catch (error) {
      console.error("Resend OTP error:", error)
      setOtpMessage("Error resending OTP.")
    } finally {
      setIsResendingOtp(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (registerData.password !== registerData.confirmPassword) {
      alert("Passwords don't match!")
      return
    }

    if (registerData.password.length < 6) {
      alert("Password must be at least 6 characters long.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerData.username,
          email: registerData.email,
          password: registerData.password,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert(data.message || "Registration successful!")
        router.push("/dashboard")
      } else {
        alert(data.message || "Registration failed.")
      }
    } catch (error) {
      console.error("Registration error:", error)
      alert("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Gift className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              CelebrateWith.me
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Account Access</CardTitle>
              <p className="text-gray-600">Login or create an account to manage your events</p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  {!otpRequired ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="loginEmail">Email</Label>
                        <Input
                          id="loginEmail"
                          type="email"
                          placeholder="Enter your email"
                          value={loginData.email}
                          onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="loginPassword">Password</Label>
                        <div className="relative">
                          <Input
                            id="loginPassword"
                            type={showLoginPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginData.password}
                            onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                          >
                            {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      <Link href="/forgot-password" className="text-sm text-purple-600 hover:underline">
                        Forgot password?
                      </Link>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Logging in..." : "Login"}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleOtpVerification} className="space-y-4">
                      <p className="text-center text-sm text-gray-600">
                        An OTP has been sent to **{loginEmailForOtp}**. Please enter it below.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="otp">One-Time Password (OTP)</Label>
                        {/* Replaced Input with InputOTP component */}
                        <InputOTP
                            maxLength={6}
                            value={otpInput}
                            onChange={(value) => setOtpInput(value)}
                            // No need for manual sanitization here, InputOTP handles it
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                      </div>
                      {otpMessage && <p className="text-center text-sm text-red-500">{otpMessage}</p>}
                      <Button type="submit" className="w-full" disabled={isLoading || otpInput.length < 6}>
                        {isLoading ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-2"/> Verifying OTP...</>
                        ) : (
                          "Verify OTP"
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleResendOtp} 
                        disabled={isResendingOtp || isLoading} 
                        className="w-full mt-2">
                        {isResendingOtp ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-2"/> Resending...</>
                        ) : (
                          "Resend OTP"
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setOtpRequired(false)} 
                        disabled={isLoading} 
                        className="w-full mt-2">
                        Back to Password Login
                      </Button>
                    </form>
                  )}
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="registerUsername">Username</Label>
                      <Input
                        id="registerUsername"
                        placeholder="Choose a username"
                        value={registerData.username}
                        onChange={(e) => setRegisterData((prev) => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerEmail">Email</Label>
                      <Input
                        id="registerEmail"
                        type="email"
                        placeholder="Enter your email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerPassword">Password</Label>
                      <div className="relative">
                        <Input
                          id="registerPassword"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={registerData.password}
                          onChange={(e) => setRegisterData((prev) => ({ ...prev, password: e.target.value }))}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                        >
                          {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
