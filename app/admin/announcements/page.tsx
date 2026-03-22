"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { sendBroadcast, checkIsAdmin, getBroadcastHistory, type BroadcastHistory } from "@/app/actions/admin"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/useUser"
import { Loader2, Send, Mail, Shield, AlertTriangle, History, Users, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AnnouncementsPage() {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [testMode, setTestMode] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [history, setHistory] = useState<BroadcastHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const { toast } = useToast()
  const { user, loading } = useUser()
  const router = useRouter()

  // Check admin status
  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false)
        return
      }
      const result = await checkIsAdmin()
      setIsAdmin(result.isAdmin)
      
      if (result.isAdmin) {
        // Load broadcast history
        const historyResult = await getBroadcastHistory()
        setHistory(historyResult.broadcasts)
        setLoadingHistory(false)
      }
    }
    
    if (!loading) {
      checkAdmin()
    }
  }, [user, loading])

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject and message.",
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
      })

      if (result.success) {
        toast({
          title: "Announcement Sent",
          description: testMode
            ? "Test announcement sent to your email."
            : `Announcement sent to ${result.recipientCount} users (${result.emailCount} emails).`,
        })
        setSubject("")
        setMessage("")
        
        // Refresh history
        const historyResult = await getBroadcastHistory()
        setHistory(historyResult.broadcasts)
      } else {
        toast({
          title: "Failed to Send",
          description: result.error || "An error occurred while sending.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send announcement. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  // Loading state
  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen page-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen page-background flex items-center justify-center p-6">
        <div className="room-furniture p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-accent-gold mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-accent-gold mb-2">Login Required</h1>
          <p className="text-accent-gold/70 mb-4">Please log in to access the admin panel.</p>
          <Button onClick={() => router.push("/login")} className="theme-accent-gold">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen page-background flex items-center justify-center p-6">
        <div className="room-furniture p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-accent-gold mb-2">Access Denied</h1>
          <p className="text-accent-gold/70 mb-4">
            You do not have administrator privileges to access this page.
          </p>
          <Button onClick={() => router.push("/")} variant="outline" className="border-accent-gold/40 text-accent-gold">
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen page-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Composer Card */}
        <div className="room-furniture p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-8 h-8 text-accent-gold" />
              <h1 className="text-3xl font-serif text-accent-gold">Manor Announcement Composer</h1>
            </div>
            <p className="text-accent-gold/70 text-sm">
              Create formal correspondence from the manor staff to all residents. Your message will be delivered with
              elegant manor theming.
            </p>
          </div>

          {/* Subject Field */}
          <div className="mb-6">
            <Label htmlFor="subject" className="text-accent-gold mb-2 block">
              Subject
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value.slice(0, 200))}
              placeholder="e.g., New Gaming Features Available, Manor Maintenance Notice..."
              className="bg-surface-dark border-accent-gold/40 text-accent-gold placeholder:text-accent-copper"
              maxLength={200}
            />
            <p className="text-xs text-accent-copper mt-1">{subject.length}/200 characters</p>
          </div>

          {/* Message Field */}
          <div className="mb-6">
            <Label htmlFor="message" className="text-accent-gold mb-2 block">
              Message
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 5000))}
              placeholder="Compose your manor announcement here. This will be formatted as elegant correspondence from the manor staff..."
              className="bg-surface-dark border-accent-gold/40 text-accent-gold placeholder:text-accent-copper min-h-[200px]"
              maxLength={5000}
            />
            <p className="text-xs text-accent-copper mt-1">{message.length}/5000 characters</p>
          </div>

          {/* Test Mode Toggle */}
          <div className="mb-6 flex items-center gap-3 p-4 bg-surface-dark border border-accent-gold/40 rounded">
            <Switch
              id="test-mode"
              checked={testMode}
              onCheckedChange={setTestMode}
              className="data-[state=checked]:bg-accent-gold"
            />
            <div className="flex-1">
              <Label htmlFor="test-mode" className="text-accent-gold font-semibold cursor-pointer">
                Test Mode (send only to me)
              </Label>
              <p className="text-xs text-accent-gold/70 mt-1">
                Safe mode: Announcement will only be sent to your email for testing
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-accent-gold/10 border border-accent-gold/40 rounded">
            <div className="flex gap-2">
              <Mail className="w-5 h-5 text-accent-gold flex-shrink-0 mt-0.5" />
              <div className="text-sm text-accent-gold">
                <p className="mb-1">
                  Your announcement will be formatted with manor theming and sent as{" "}
                  <span className="font-semibold">&quot;The manor staff wishes to inform you...&quot;</span> followed by your
                  message.
                </p>
                <p className="text-accent-gold/70">
                  In-app notifications will be created for all users. Emails will only be sent to users who have enabled
                  &quot;Announcements & updates&quot; in their notification preferences.
                </p>
                {testMode && (
                  <p className="text-accent-gold font-semibold flex items-center gap-1 mt-2">
                    <Shield className="w-4 h-4" />
                    TEST MODE: Only you will receive this announcement.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={isSending || !subject.trim() || !message.trim()}
            className="w-full theme-accent-gold font-semibold py-6 text-lg"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                {testMode ? "Send Test Announcement" : "Send to All Users"}
              </span>
            )}
          </Button>
        </div>

        {/* Broadcast History */}
        <div className="room-furniture p-8">
          <div className="flex items-center gap-3 mb-6">
            <History className="w-6 h-6 text-accent-gold" />
            <h2 className="text-2xl font-serif text-accent-gold">Broadcast History</h2>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent-gold" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-accent-gold/70">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No broadcasts have been sent yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((broadcast) => (
                <div
                  key={broadcast.id}
                  className="p-4 bg-surface-dark border border-accent-gold/20 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-accent-gold">{broadcast.subject}</h3>
                    <div className="flex items-center gap-1 text-xs text-accent-gold/60">
                      <Clock className="w-3 h-3" />
                      {new Date(broadcast.sent_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <p className="text-sm text-accent-gold/70 line-clamp-2 mb-3">{broadcast.body}</p>
                  <div className="flex items-center gap-4 text-xs text-accent-gold/60">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {broadcast.recipient_count} recipients
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {broadcast.email_count} emails sent
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
