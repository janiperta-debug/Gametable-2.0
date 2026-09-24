"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArchiveButton, ArchiveCard, ArchiveCardContent, archiveField } from "@/components/archive-frame"
import { sendBroadcast, checkIsAdmin, getBroadcastHistory, uploadNewsletterImage, listNewsletterImages, type BroadcastHistory } from "@/app/actions/admin"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/useUser"
import { Loader2, Send, Mail, Shield, AlertTriangle, History, Users, Clock, Crown, ImagePlus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "@/lib/i18n"

export default function AnnouncementsPage() {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [testMode, setTestMode] = useState(true)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [savedImages, setSavedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [history, setHistory] = useState<BroadcastHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const { toast } = useToast()
  const { user, loading } = useUser()
  const router = useRouter()
  const t = useTranslations()

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false)
        setLoadingHistory(false)
        return
      }

      const result = await checkIsAdmin()
      setIsAdmin(result.isAdmin)

      if (result.isAdmin) {
        const historyResult = await getBroadcastHistory()
        setHistory(historyResult.broadcasts)
        const imageResult = await listNewsletterImages()
        setSavedImages(imageResult.images)
      }
      setLoadingHistory(false)
    }

    if (!loading) {
      void checkAdmin()
    }
  }, [user, loading])

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: t("common.error"),
        description: t("correspondence.admin.missingInformation"),
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      const result = await sendBroadcast({
        subject,
        body: message,
        testMode,
        imageUrl,
      })

      if (result.success) {
        toast({
          title: t("correspondence.admin.announcementSent"),
          description: testMode
            ? t("correspondence.admin.testSentDescription")
            : t("correspondence.admin.sentDescription")
                .replace("{recipientCount}", String(result.recipientCount))
                .replace("{emailCount}", String(result.emailCount)),
        })
        setSubject("")
        setMessage("")
        setImageUrl(null)

        const historyResult = await getBroadcastHistory()
        setHistory(historyResult.broadcasts)
      } else {
        toast({
          title: t("correspondence.admin.failedToSend"),
          description: result.error || t("correspondence.admin.sendError"),
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("correspondence.admin.sendError"),
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen page-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen page-background flex items-center justify-center p-6">
        <ArchiveCard className="max-w-md">
          <ArchiveCardContent className="p-8 text-center space-y-4">
            <Shield className="w-16 h-16 text-accent-gold mx-auto" />
            <h1 className="text-2xl font-cinzel text-accent-gold">{t("correspondence.admin.loginRequired")}</h1>
            <p className="text-muted-foreground">{t("correspondence.admin.loginDescription")}</p>
            <ArchiveButton onClick={() => router.push("/login")} active>
              {t("correspondence.admin.goToLogin")}
            </ArchiveButton>
          </ArchiveCardContent>
        </ArchiveCard>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen page-background flex items-center justify-center p-6">
        <ArchiveCard className="max-w-md">
          <ArchiveCardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-accent-gold mx-auto" />
            <h1 className="text-2xl font-cinzel text-accent-gold">{t("correspondence.admin.accessDenied")}</h1>
            <p className="text-muted-foreground">{t("correspondence.admin.accessDeniedDescription")}</p>
            <ArchiveButton onClick={() => router.push("/")} variant="outline">
              {t("correspondence.admin.returnHome")}
            </ArchiveButton>
          </ArchiveCardContent>
        </ArchiveCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen page-background px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <ArchiveCard>
          <ArchiveCardContent className="p-5 sm:p-8 space-y-6">
            <header className="flex items-start gap-3">
              <Mail className="mt-1 h-7 w-7 shrink-0 text-accent-gold" />
              <div>
                <h1 className="font-cinzel text-2xl sm:text-3xl text-accent-gold">
                  {t("correspondence.admin.title")}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {t("correspondence.admin.description")}
                </p>
              </div>
            </header>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subject" className="font-cinzel text-accent-gold">
                  {t("correspondence.admin.subject")}
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value.slice(0, 200))}
                  placeholder={t("correspondence.admin.subjectPlaceholder")}
                  className={archiveField}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">{subject.length}/200</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="font-cinzel text-accent-gold">
                  {t("correspondence.admin.message")}
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 5000))}
                  placeholder={t("correspondence.admin.messagePlaceholder")}
                  className={`${archiveField} min-h-[220px]`}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground">{message.length}/5000</p>
              </div>


              <div className="space-y-3">
                <Label htmlFor="newsletter-image" className="font-cinzel text-accent-gold">Uutiskirjeen kuva (valinnainen)</Label>
                <p className="text-sm text-muted-foreground">Lisää kuva otsikon alle. JPG, PNG, WebP tai GIF, enintään 5 Mt. Ladattuja kuvia voi käyttää uudelleen.</p>
                <label htmlFor="newsletter-image" className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-accent-gold/40 px-4 py-3 text-sm text-accent-gold hover:bg-accent-gold/10">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {uploading ? "Ladataan kuvaa..." : "Lisää kuva"}
                </label>
                <input id="newsletter-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={uploading || isSending}
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    event.target.value = ""
                    if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
                      toast({ title: "Virheellinen kuva", description: "Valitse JPG-, PNG-, WebP- tai GIF-kuva (enintään 5 Mt).", variant: "destructive" })
                      return
                    }
                    setUploading(true)
                    try {
                      const data = new FormData()
                      data.set("image", file)
                      const result = await uploadNewsletterImage(data)
                      if (result.url) { setImageUrl(result.url); setSavedImages((current) => [result.url!, ...current.filter((url) => url !== result.url)]) }
                      else toast({ title: "Kuvan lataus epäonnistui", description: result.error, variant: "destructive" })
                    } catch { toast({ title: "Kuvan lataus epäonnistui", variant: "destructive" }) }
                    finally { setUploading(false) }
                  }} />
                {imageUrl && <div className="relative max-w-xl overflow-hidden rounded-lg border border-accent-gold/30">
                  <img src={imageUrl} alt="Uutiskirjeen valittu kuva" className="h-auto w-full" />
                  <button type="button" onClick={() => setImageUrl(null)} aria-label="Poista kuva kirjeestä" className="absolute right-2 top-2 rounded-full bg-black/80 p-2 text-white"><X className="h-4 w-4" /></button>
                </div>}
                {savedImages.length > 0 && <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Aiemmin ladatut kuvat</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {savedImages.map((url) => <button type="button" key={url} aria-label="Valitse aiemmin ladattu kuva" aria-pressed={imageUrl === url} onClick={() => setImageUrl(url)}
                      className={`aspect-square overflow-hidden rounded-lg border-2 ${imageUrl === url ? "border-accent-gold" : "border-accent-gold/20"}`}>
                      <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </button>)}
                  </div>
                </div>}
                <div className="rounded-lg border border-accent-gold/25 bg-black/20 p-4">
                  <p className="mb-3 text-sm text-accent-gold">Kirjeen esikatselu</p>
                  <div className="mx-auto max-w-lg space-y-4 border border-accent-gold/30 bg-[#171310] p-4 text-center">
                    <p className="text-xs tracking-[0.2em] text-[#b9954b]">GAMETABLE</p>
                    <h3 className="break-words font-heading text-xl text-[#e2b44f]">{subject || "Uutiskirjeen otsikko"}</h3>
                    {imageUrl && <img src={imageUrl} alt="" className="h-auto w-full" />}
                    <p className="whitespace-pre-wrap break-words text-left text-sm leading-7 text-[#d8c69b]">{message || "Uutiskirjeen teksti näkyy tässä."}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-[hsl(var(--surface-dark)/0.35)] p-4">
                <Switch
                  id="test-mode"
                  checked={testMode}
                  onCheckedChange={setTestMode}
                  className="data-[state=checked]:bg-accent-gold"
                />
                <div className="flex-1">
                  <Label htmlFor="test-mode" className="flex items-center gap-2 font-cinzel text-accent-gold cursor-pointer">
                    <Shield className="h-4 w-4" />
                    {t("correspondence.admin.testMode")}
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("correspondence.admin.testModeDescription")}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-[hsl(var(--accent-gold)/0.06)] p-4">
                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-accent-gold" />
                  <div className="space-y-2 text-sm text-foreground">
                    <p>
                      {t("correspondence.admin.infoFormatting")}{" "}
                      <span className="font-semibold">{t("correspondence.admin.infoOpening")}</span>{" "}
                      {t("correspondence.admin.infoFollowedBy")}
                    </p>
                    <p className="text-muted-foreground">
                      {t("correspondence.admin.infoDelivery")}
                    </p>
                    {testMode && (
                      <p className="flex items-center gap-1 font-semibold text-accent-gold">
                        <Shield className="h-4 w-4" />
                        {t("correspondence.admin.testModeWarning")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <ArchiveButton
                onClick={handleSend}
                disabled={isSending || uploading || !subject.trim() || !message.trim()}
                active
                icon={isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              >
                {isSending
                  ? t("correspondence.admin.sending")
                  : testMode
                    ? t("correspondence.admin.sendTest")
                    : t("correspondence.admin.sendAll")}
              </ArchiveButton>
            </div>
          </ArchiveCardContent>
        </ArchiveCard>

        <ArchiveCard>
          <ArchiveCardContent className="p-5 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <History className="h-6 w-6 text-accent-gold" />
              <h2 className="font-cinzel text-xl sm:text-2xl text-accent-gold">
                {t("correspondence.admin.history")}
              </h2>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-accent-gold" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Mail className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p>{t("correspondence.admin.noHistory")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((broadcast) => (
                  <div
                    key={broadcast.id}
                    className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-dark)/0.45)] p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <h3 className="font-semibold text-accent-gold">{broadcast.subject}</h3>
                      <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(broadcast.sent_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{broadcast.body}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {broadcast.recipient_count} {t("correspondence.admin.recipients")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {broadcast.email_count} {t("correspondence.admin.emailsSent")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ArchiveCardContent>
        </ArchiveCard>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Crown className="h-3.5 w-3.5 text-accent-gold" />
          {t("correspondence.admin.manorStaff")}
        </div>
      </div>
    </div>
  )
}
