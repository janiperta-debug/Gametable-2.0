"use client"

import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "@/lib/i18n"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message")
  const t = useTranslations()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md text-center">
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
        </div>

        {/* Error Card */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>

          <h1 className="font-cinzel text-2xl text-foreground mb-4">
            {t("auth.authError")}
          </h1>

          <p className="text-muted-foreground mb-6">
            {message || t("auth.authErrorDefault")}
          </p>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                {t("auth.tryAgain")}
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("auth.backToLanding")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>}>
      <AuthErrorContent />
    </Suspense>
  )
}
