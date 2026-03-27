"use client"

import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "@/lib/i18n"
import { Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
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

        {/* Content Card */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>

          <h1 className="font-cinzel text-2xl text-foreground mb-4">
            {t("auth.checkYourEmail")}
          </h1>

          <p className="text-muted-foreground mb-6">
            {t("auth.verifyEmailSent")}
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              {t("auth.verifyEmailInstructions")}
            </p>
          </div>

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
