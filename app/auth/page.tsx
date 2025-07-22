"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Gift, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loginData, setLoginData] = useState({ username: "", password: "" })
  const [registerData, setRegisterData] = useState({ username: "", email: "", password: "", confirmEmail: "", confirmPassword: "" })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (data.success) {
        // Store user data in localStorage for client-side access
        localStorage.setItem("currentUser", JSON.stringify(data.user))
        router.push("/dashboard")
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error("Login error:", error)
      alert("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (registerData.email !== registerData.confirmEmail) {
      alert("Emails don't match!")
      return
    }
    if (registerData.password !== registerData.confirmPassword) {
      alert("Passwords don't match!")
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

      if (data.success) {
        // Store user data in localStorage for client-side access
        localStorage.setItem("currentUser", JSON.stringify(data.user))
        alert(data.message)
        router.push("/dashboard")
      } else {
        alert(data.message)
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
      {/* Header */}
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
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="loginUsername">Username</Label>
                      <Input
                        id="loginUsername"
                        placeholder="Enter your username"
                        value={loginData.username}
                        onChange={(e) => setLoginData((prev) => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loginPassword">Password</Label>
                      <Input
                        id="loginPassword"
                        type="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
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
                      <Label htmlFor="confirmEmail">Confirm Email</Label>
                      <Input
                        id="confirmEmail"
                        type="email"
                        placeholder="Confirm your email"
                        value={registerData.confirmEmail}
                        onChange={(e) => setRegisterData((prev) => ({ ...prev, confirmEmail: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerPassword">Password</Label>
                      <Input
                        id="registerPassword"
                        type="password"
                        placeholder="Enter your password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData((prev) => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
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
