"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useTranslations } from "@/lib/i18n"
import { Lock, Loader2, CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const t = useTranslations()

  useEffect(() => {
    // Check if we have an access token in the URL (from email link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get("access_token")
    
    if (accessToken) {
      // Token is present, we can proceed with password reset
      const supabase = createClient()
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: hashParams.get("refresh_token") || "",
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError(t("auth.passwordsMismatch"))
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t("auth.passwordTooShort"))
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })
      if (error) throw error
      setIsSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login")
      }, 3000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t("auth.error"))
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md text-center">
          <div className="flex flex-col items-center mb-8">
            <Link href="/">
              <Image
                src="/images/gametable-logo.png"
                alt="GameTable"
                width={80}
                height={80}
                className="mb-4"
              />
            </Link>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>

            <h1 className="font-cinzel text-2xl text-foreground mb-4">
              {t("auth.passwordResetSuccess")}
            </h1>

            <p className="text-muted-foreground mb-6">
              {t("auth.redirectingToLogin")}
            </p>

            <Button asChild className="w-full">
              <Link href="/auth/login">
                {t("auth.goToLogin")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <Image
              src="/images/gametable-logo.png"
              alt="GameTable"
              width={80}
              height={80}
              className="mb-4"
            />
          </Link>
          <h1 className="font-charm text-3xl text-primary">{t("auth.resetPasswordTitle")}</h1>
          <p className="text-muted-foreground mt-2">{t("auth.resetPasswordSubtitle")}</p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.newPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmNewPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.resettingPassword")}
                </>
              ) : (
                t("auth.resetPassword")
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
