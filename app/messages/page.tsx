"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import {
  ArchiveCard,
  ArchiveCardContent,
  ArchiveCardHeader,
  ArchiveCardTitle,
  ArchiveIconButton,
  archiveField,
} from "@/components/archive-frame"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Search, Loader2 } from "lucide-react"
import { ThemeHero } from "@/components/theme-hero"
import { useTranslations } from "@/lib/i18n"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  markMessagesAsRead,
  type Conversation,
  type Message
} from "@/app/actions/messages"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

export default function MessagingPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const t = useTranslations()
  const { user } = useUser()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const conversationParam = searchParams.get("conversation")

  // Load conversations
  useEffect(() => {
    async function loadConversations() {
      if (!user) {
        setLoadingConversations(false)
        return
      }
      const result = await getConversations()
      if (!result.error) {
        setConversations(result.data)
        // Auto-select conversation from URL param or first conversation
        if (result.data.length > 0 && !selectedConversation) {
          if (conversationParam) {
            const targetConvo = result.data.find(c => c.id === conversationParam)
            setSelectedConversation(targetConvo || result.data[0])
          } else {
            setSelectedConversation(result.data[0])
          }
        }
      }
      setLoadingConversations(false)
    }
    loadConversations()
  }, [user, conversationParam])

  // Load messages when conversation is selected
  useEffect(() => {
    async function loadMessages() {
      if (!selectedConversation) return
      setLoadingMessages(true)
      const result = await getMessages(selectedConversation.id)
      if (!result.error) {
        setMessages(result.data)
        // Mark messages as read
        await markMessagesAsRead(selectedConversation.id)
        // Update unread count in conversations list
        setConversations(prev => prev.map(c => 
          c.id === selectedConversation.id ? { ...c, unread_count: 0 } : c
        ))
      }
      setLoadingMessages(false)
    }
    loadMessages()
  }, [selectedConversation?.id])

  // Subscribe to realtime messages
  useEffect(() => {
    if (!selectedConversation || !user) return

    const supabase = createClient()
    
    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        async (payload) => {
          const newMsg = payload.new as Message
          
          // Add message to list if not already there
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          
          // Mark as read if from other user
          if (newMsg.sender_id !== user.id) {
            await markMessagesAsRead(selectedConversation.id)
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation?.id, user?.id])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return
    
    setSending(true)
    const content = newMessage.trim()
    setNewMessage("")
    
    const result = await sendMessage(selectedConversation.id, content)
    
    if (result.error) {
      toast({
        title: t("common.error"),
        description: result.error,
        variant: "destructive"
      })
      setNewMessage(content) // Restore message on error
    } else if (result.data) {
      // Optimistically add the message (realtime will also add it, but we dedupe)
      setMessages(prev => {
        if (prev.some(m => m.id === result.data!.id)) return prev
        return [...prev, result.data!]
      })
      
      // Update conversation's last message
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id 
          ? { ...c, last_message: result.data!, updated_at: new Date().toISOString() }
          : c
      ))
    }
    setSending(false)
  }

  const filteredConversations = conversations.filter(c => {
    const name = c.other_participant?.display_name || c.other_participant?.username || ""
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getDisplayName = (conv: Conversation) => {
    return conv.other_participant?.display_name || conv.other_participant?.username || "Unknown"
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  if (!user) {
    return (
      <div className="min-h-screen room-environment">
        <main className="container mx-auto px-4 py-8">
          <ThemeHero page="messages" mode="backdrop">
            <div className="text-center">
              <h1 className="logo-text text-5xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                {t("messages.title")}
              </h1>
              <p className="font-body text-foreground/90 text-xl max-w-3xl mx-auto mt-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                {t("messages.subtitle")}
              </p>
            </div>
          </ThemeHero>
          <ArchiveCard className="max-w-md mx-auto">
            <ArchiveCardContent className="p-8 text-center">
              <MessageCircle className="h-16 w-16 text-accent-gold mx-auto mb-4" />
              <h3 className="font-heading text-xl mb-2">{t("messages.loginRequired")}</h3>
              <p className="text-muted-foreground font-body">{t("messages.loginToMessage")}</p>
            </ArchiveCardContent>
          </ArchiveCard>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8 max-w-full overflow-x-hidden">
        <ThemeHero page="messages" mode="backdrop">
          <div className="text-center">
            <h1 className="logo-text text-5xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              {t("messages.title")}
            </h1>
            <p className="font-body text-foreground/90 text-xl max-w-3xl mx-auto mt-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {t("messages.subtitle")}
            </p>
          </div>
        </ThemeHero>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-4 max-w-7xl mx-auto">
          {/* Conversations Sidebar */}
          <div className="w-full lg:col-span-1">
            <ArchiveCard>
              <ArchiveCardHeader>
                <ArchiveCardTitle className="text-xl normal-case mb-3">{t("messages.conversations")}</ArchiveCardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input 
                    placeholder={t("messages.searchConversations")} 
                    className={cn("pl-10 font-body", archiveField)}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </ArchiveCardHeader>
              <ArchiveCardContent className="h-[488px] overflow-y-auto px-0">
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-accent-gold" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground font-body">
                    {conversations.length === 0 
                      ? t("messages.noConversations")
                      : t("messages.noSearchResults")
                    }
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConversations.map((conversation) => {
                      const displayName = getDisplayName(conversation)
                      const initials = getInitials(displayName)
                      const lastMsgTime = conversation.last_message?.created_at
                        ? formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })
                        : ""
                      
                      return (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation)}
                          className={`p-4 cursor-pointer transition-colors hover:bg-accent-gold/10 ${
                            selectedConversation?.id === conversation.id ? "bg-accent-gold/20" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <Avatar className="h-12 w-12 flex-shrink-0">
                              <AvatarImage 
                                src={conversation.other_participant?.avatar_url || "/placeholder.svg"} 
                                alt={displayName} 
                              />
                              <AvatarFallback className="font-body">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-baseline justify-between gap-2 mb-1">
                                <h4 className="font-body font-semibold text-sm truncate flex-1">
                                  {displayName}
                                </h4>
                                <span className="text-xs text-muted-foreground font-body whitespace-nowrap flex-shrink-0">
                                  {lastMsgTime}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm text-muted-foreground font-body truncate flex-1 min-w-0">
                                  {conversation.last_message?.content || t("messages.noMessages")}
                                </p>
                                {(conversation.unread_count || 0) > 0 && (
                                  <Badge
                                    variant="destructive"
                                    className="h-5 min-w-[20px] rounded-full px-1.5 text-xs flex items-center justify-center flex-shrink-0"
                                  >
                                    {conversation.unread_count}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ArchiveCardContent>
            </ArchiveCard>
          </div>

          {/* Chat Area */}
          <div className="w-full lg:col-span-3">
            <ArchiveCard className="min-h-[600px]">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <ArchiveCardHeader className="border-b border-accent-gold/20 pb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={selectedConversation.other_participant?.avatar_url || "/placeholder.svg"}
                          alt={getDisplayName(selectedConversation)}
                        />
                        <AvatarFallback className="font-body">
                          {getInitials(getDisplayName(selectedConversation))}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-heading font-semibold">{getDisplayName(selectedConversation)}</h3>
                      </div>
                    </div>
                  </ArchiveCardHeader>

                  {/* Messages */}
                  <ArchiveCardContent className="h-[408px] overflow-y-auto py-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground font-body">
                        {t("messages.startConversation")}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isOwn = message.sender_id === user.id
                          const time = formatDistanceToNow(new Date(message.created_at), { addSuffix: true })
                          
                          return (
                            <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words ${
                                  isOwn
                                    ? "bg-accent-gold text-accent-gold-foreground"
                                    : "bg-black/45 text-foreground border border-accent-gold/20"
                                }`}
                              >
                                <p className="font-body text-sm break-words">{message.content}</p>
                                <p
                                  className={`text-xs mt-1 ${isOwn ? "text-accent-gold-foreground/70" : "text-foreground/50"}`}
                                >
                                  {time}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ArchiveCardContent>

                  {/* Message Input */}
                  <div className="px-5 pb-5 pt-4 border-t border-accent-gold/20">
                    <div className="flex items-end gap-2">
                      <Textarea
                        placeholder={t("messages.typeMessage")}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className={cn("flex-1 min-h-[40px] max-h-[120px] font-body", archiveField)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                      />
                      <ArchiveIconButton
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        active
                        aria-label={t("messages.send") || "Send"}
                        icon={sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[560px] text-muted-foreground font-body">
                  {t("messages.selectConversation")}
                </div>
              )}
            </ArchiveCard>
          </div>
        </div>
      </main>
    </div>
  )
}
