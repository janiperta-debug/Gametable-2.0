"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { sendAnnouncement } from "@/app/actions/send-announcement"
import { useToast } from "@/hooks/use-toast"

export default function AnnouncementsPage() {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [testMode, setTestMode] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

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
      const result = await sendAnnouncement({
        subject,
        message,
        testMode,
      })

      if (result.success) {
        toast({
          title: "Announcement Sent",
          description: testMode
            ? "Test announcement sent to your email."
            : `Announcement sent to ${result.recipientCount} users.`,
        })
        setSubject("")
        setMessage("")
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2D0A0A] to-[#1A0505] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="border-2 border-[#8B6914] rounded-lg p-8 bg-[#3D1010]/80 backdrop-blur">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <h1 className="text-3xl font-serif text-[#D4AF37]">Manor Announcement Composer</h1>
            </div>
            <p className="text-[#D4AF37]/70 text-sm">
              Create formal correspondence from the manor staff to all residents. Your message will be delivered with
              elegant manor theming.
            </p>
          </div>

          {/* Subject Field */}
          <div className="mb-6">
            <Label htmlFor="subject" className="text-[#D4AF37] mb-2 block">
              Subject
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value.slice(0, 200))}
              placeholder="e.g., New Gaming Features Available, Manor Maintenance Notice..."
              className="bg-[#2D0A0A] border-[#8B6914] text-[#D4AF37] placeholder:text-[#8B6914]"
              maxLength={200}
            />
            <p className="text-xs text-[#8B6914] mt-1">{subject.length}/200 characters</p>
          </div>

          {/* Message Field */}
          <div className="mb-6">
            <Label htmlFor="message" className="text-[#D4AF37] mb-2 block">
              Message
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 5000))}
              placeholder="Compose your manor announcement here. This will be formatted as elegant correspondence from the manor staff..."
              className="bg-[#2D0A0A] border-[#8B6914] text-[#D4AF37] placeholder:text-[#8B6914] min-h-[200px]"
              maxLength={5000}
            />
            <p className="text-xs text-[#8B6914] mt-1">{message.length}/5000 characters</p>
          </div>

          {/* Test Mode Toggle */}
          <div className="mb-6 flex items-center gap-3 p-4 bg-[#2D0A0A] border border-[#8B6914] rounded">
            <Switch
              id="test-mode"
              checked={testMode}
              onCheckedChange={setTestMode}
              className="data-[state=checked]:bg-[#D4AF37]"
            />
            <div className="flex-1">
              <Label htmlFor="test-mode" className="text-[#D4AF37] font-semibold cursor-pointer">
                🧪 Test Mode (send only to me)
              </Label>
              <p className="text-xs text-[#D4AF37]/70 mt-1">
                ✓ Safe mode: Announcement will only be sent to your email for testing
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-[#8B6914]/20 border border-[#8B6914] rounded">
            <div className="flex gap-2">
              <svg
                className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-[#D4AF37]">
                <p className="mb-1">
                  Your announcement will be formatted with manor theming and sent as{" "}
                  <span className="font-semibold">"The manor staff wishes to inform you..."</span> followed by your
                  message.
                </p>
                {testMode && (
                  <p className="text-[#D4AF37] font-semibold flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
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
            className="w-full bg-[#8B6914] hover:bg-[#D4AF37] text-[#2D0A0A] font-semibold py-6 text-lg"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                {testMode ? "Send Test Announcement" : "Send to All Users"}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
