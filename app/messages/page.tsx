"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Search, Loader2 } from "lucide-react"
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
        // Auto-select first conversation
        if (result.data.length > 0 && !selectedConversation) {
          setSelectedConversation(result.data[0])
        }
      }
      setLoadingConversations(false)
    }
    loadConversations()
  }, [user])

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
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-accent-gold mr-3" />
              <h1 className="logo-text text-5xl font-bold">{t("messages.title")}</h1>
            </div>
          </div>
          <Card className="room-furniture max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-16 w-16 text-accent-gold mx-auto mb-4" />
              <h3 className="font-heading text-xl mb-2">{t("messages.loginRequired")}</h3>
              <p className="text-muted-foreground font-body">{t("messages.loginToMessage")}</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="logo-text text-5xl font-bold">{t("messages.title")}</h1>
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            {t("messages.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-4 max-w-7xl mx-auto">
          {/* Conversations Sidebar */}
          <div className="w-full lg:col-span-1">
            <Card className="room-furniture h-[600px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="font-heading text-xl">{t("messages.conversations")}</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder={t("messages.searchConversations")} 
                    className="pl-10 font-body"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
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
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="w-full lg:col-span-3">
            <Card className="room-furniture h-[600px] flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="flex-shrink-0 border-b border-accent-gold/20">
                    <div className="flex items-center space-x-3">
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
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 overflow-y-auto p-4">
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
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                <p className="font-body text-sm break-words">{message.content}</p>
                                <p
                                  className={`text-xs mt-1 ${isOwn ? "text-accent-gold-foreground/70" : "text-muted-foreground"}`}
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
                  </CardContent>

                  {/* Message Input */}
                  <div className="flex-shrink-0 p-4 border-t border-accent-gold/20">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder={t("messages.typeMessage")}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 min-h-[40px] max-h-[120px] font-body"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="theme-accent-gold self-end"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground font-body">
                  {t("messages.selectConversation")}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
