"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useTranslations } from "@/lib/i18n"
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const t = useTranslations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      setIsSuccess(true)
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
              {t("auth.resetEmailSent")}
            </h1>

            <p className="text-muted-foreground mb-6">
              {t("auth.resetEmailInstructions")}
            </p>

            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("auth.backToLogin")}
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
          <h1 className="font-charm text-3xl text-primary">{t("auth.forgotPasswordTitle")}</h1>
          <p className="text-muted-foreground mt-2 text-center">{t("auth.forgotPasswordSubtitle")}</p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  {t("auth.sending")}
                </>
              ) : (
                t("auth.sendResetLink")
              )}
            </Button>
          </form>

          {/* Back to login */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/auth/login" className="text-primary hover:underline font-medium inline-flex items-center">
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t("auth.backToLogin")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
