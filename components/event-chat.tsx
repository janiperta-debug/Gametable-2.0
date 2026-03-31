"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageCircle, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import { getEventMessages, sendEventMessage, type EventMessage } from "@/app/actions/events"
import { useToast } from "@/hooks/use-toast"

interface EventChatProps {
  eventId: string
  eventTitle: string
}

export function EventChat({ eventId, eventTitle }: EventChatProps) {
  const t = useTranslations()
  const { toast } = useToast()
  
  const [messages, setMessages] = useState<EventMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load initial messages and set up real-time subscription
  useEffect(() => {
    const supabase = createClient()
    
    const loadMessages = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)

        // Load existing messages
        const result = await getEventMessages(eventId)
        if (result.error) {
          // Table might not exist yet - gracefully handle
          console.log("Event messages not available:", result.error)
          setError(result.error)
        } else if (result.messages) {
          setMessages(result.messages)
        }
      } catch (err) {
        console.error("Error loading messages:", err)
        setError("Chat unavailable")
      }
      setLoading(false)
    }

    loadMessages()

    // Set up real-time subscription
    const channel = supabase
      .channel(`event-messages-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_messages',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          // Fetch the full message with sender info
          const { data: newMsg } = await supabase
            .from('event_messages')
            .select(`
              *,
              sender:profiles!event_messages_sender_id_fkey(id, display_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single()

          if (newMsg) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === newMsg.id)) {
                return prev
              }
              return [...prev, newMsg]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const result = await sendEventMessage(eventId, newMessage.trim())

    if (result.error) {
      toast({
        title: t("common.error"),
        description: result.error,
        variant: "destructive",
      })
    } else {
      setNewMessage("")
      // The real-time subscription will add the message
    }

    setSending(false)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return t("common.today") || "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t("common.yesterday") || "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <Card className="room-furniture h-[600px] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
        <p className="mt-2 text-muted-foreground">{t("common.loading") || "Loading..."}</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="room-furniture h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="font-cinzel text-accent-gold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {t("events.eventChat") || "Event Chat"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            {t("events.chatUnavailable") || "Chat is temporarily unavailable"}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="room-furniture h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="font-cinzel text-accent-gold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          {t("events.eventChat") || "Event Chat"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("events.chatDescription") || "Coordinate details for"} {eventTitle}
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t("events.noMessages") || "No messages yet. Start the conversation!"}</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const showDate =
                  index === 0 || formatDate(message.created_at) !== formatDate(messages[index - 1].created_at)
                const isCurrentUser = message.sender_id === currentUserId

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center text-xs text-muted-foreground py-2">
                        {formatDate(message.created_at)}
                      </div>
                    )}

                    <div className={`flex gap-3 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                      {!isCurrentUser && (
                        <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center flex-shrink-0">
                          {message.sender?.avatar_url ? (
                            <img 
                              src={message.sender.avatar_url} 
                              alt={message.sender.display_name || ""} 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-accent-gold">
                              {(message.sender?.display_name || "?").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}

                      <div className={`max-w-[80%] ${isCurrentUser ? "order-first" : ""}`}>
                        {!isCurrentUser && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {message.sender?.display_name || t("profile.anonymous") || "Anonymous"}
                          </p>
                        )}

                        <div
                          className={`rounded-lg px-3 py-2 ${
                            isCurrentUser
                              ? "bg-accent-gold text-accent-gold-foreground ml-auto"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isCurrentUser ? "text-accent-gold-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>

                      {isCurrentUser && (
                        <div className="w-8 h-8 rounded-full bg-accent-gold flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-accent-gold-foreground">
                            {(message.sender?.display_name || "Y").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t("events.typeMessage") || "Type your message..."}
              className="flex-1"
              disabled={sending}
            />
            <Button 
              type="submit" 
              size="sm" 
              className="theme-accent-gold" 
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
