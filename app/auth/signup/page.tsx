"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslations } from "@/lib/i18n"
import { Mail, Lock, User, Loader2 } from "lucide-react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null)
  const router = useRouter()
  const t = useTranslations()

  const handleSignup = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/home`,
          data: {
            username: username || undefined,
            display_name: username || undefined,
          },
        },
      })
      if (error) throw error
      router.push("/auth/verify-email")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t("auth.error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignup = async (provider: "google" | "facebook") => {
    const supabase = createClient()
    setIsOAuthLoading(provider)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/home`,
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t("auth.error"))
      setIsOAuthLoading(null)
    }
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
          <h1 className="font-charm text-3xl text-primary">{t("auth.createAccount")}</h1>
          <p className="text-muted-foreground mt-2">{t("auth.signupSubtitle")}</p>
        </div>

        {/* Signup Card */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base"
              onClick={() => handleOAuthSignup("google")}
              disabled={isOAuthLoading !== null || isLoading}
            >
              {isOAuthLoading === "google" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {t("auth.signupWithGoogle")}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base"
              onClick={() => handleOAuthSignup("facebook")}
              disabled={isOAuthLoading !== null || isLoading}
            >
              {isOAuthLoading === "facebook" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              {t("auth.signupWithFacebook")}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-4 text-muted-foreground">{t("auth.orContinueWith")}</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("auth.username")} <span className="text-muted-foreground">({t("auth.optional")})</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12"
                  disabled={isLoading || isOAuthLoading !== null}
                />
              </div>
            </div>

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
                  disabled={isLoading || isOAuthLoading !== null}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                  disabled={isLoading || isOAuthLoading !== null}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12"
                  disabled={isLoading || isOAuthLoading !== null}
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
              disabled={isLoading || isOAuthLoading !== null}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.creatingAccount")}
                </>
              ) : (
                t("auth.signUp")
              )}
            </Button>
          </form>

          {/* Terms notice */}
          <p className="mt-4 text-xs text-center text-muted-foreground">
            {t("auth.termsNotice")}{" "}
            <Link href="/terms-page" className="underline hover:text-foreground">
              {t("auth.terms")}
            </Link>{" "}
            {t("auth.and")}{" "}
            <Link href="/privacy-page" className="underline hover:text-foreground">
              {t("auth.privacy")}
            </Link>
          </p>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.haveAccount")}{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              {t("auth.login")}
            </Link>
          </p>
        </div>

        {/* Back to landing */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">
            {t("auth.backToLanding")}
          </Link>
        </p>
      </div>
    </div>
  )
}
