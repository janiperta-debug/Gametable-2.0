"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageCircle } from "lucide-react"

interface Message {
  id: string
  user: string
  message: string
  timestamp: Date
  avatar?: string
}

interface EventChatProps {
  eventId: string
  eventTitle: string
}

export function EventChat({ eventId, eventTitle }: EventChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      user: "Mike Johnson",
      message: "Hey everyone! Looking forward to tonight's game session.",
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    },
    {
      id: "2",
      user: "Sarah Chen",
      message: "Should I bring any snacks? I can pick up some drinks on the way.",
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    },
    {
      id: "3",
      user: "Alex Rivera",
      message: "I might be 15 minutes late due to traffic, but I'll be there!",
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
    },
  ])

  const [newMessage, setNewMessage] = useState("")
  const [currentUser] = useState("You") // In real app, this would come from auth
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      user: currentUser,
      message: newMessage.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <Card className="room-furniture h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="font-cinzel text-accent-gold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Event Chat
        </CardTitle>
        <p className="text-sm text-muted-foreground">Coordinate details for {eventTitle}</p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message, index) => {
              const showDate =
                index === 0 || formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp)

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center text-xs text-muted-foreground py-2">
                      {formatDate(message.timestamp)}
                    </div>
                  )}

                  <div className={`flex gap-3 ${message.user === currentUser ? "justify-end" : "justify-start"}`}>
                    {message.user !== currentUser && (
                      <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-accent-gold">{message.user.charAt(0)}</span>
                      </div>
                    )}

                    <div className={`max-w-[80%] ${message.user === currentUser ? "order-first" : ""}`}>
                      {message.user !== currentUser && (
                        <p className="text-xs text-muted-foreground mb-1">{message.user}</p>
                      )}

                      <div
                        className={`rounded-lg px-3 py-2 ${
                          message.user === currentUser
                            ? "bg-accent-gold text-accent-gold-foreground ml-auto"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.user === currentUser ? "text-accent-gold-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>

                    {message.user === currentUser && (
                      <div className="w-8 h-8 rounded-full bg-accent-gold flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-accent-gold-foreground">
                          {message.user.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button type="submit" size="sm" className="theme-accent-gold" disabled={!newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
