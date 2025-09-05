"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, MapPin, Users, Clock, Send, MessageCircle } from "lucide-react"

interface EventDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: any
}

interface ChatMessage {
  id: number
  user: string
  avatar: string
  message: string
  timestamp: string
}

export function EventDetailsModal({ open, onOpenChange, event }: EventDetailsModalProps) {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      user: "Mike Johnson",
      avatar: "/placeholder.svg?height=32&width=32",
      message: "Looking forward to this! Should I bring any specific games?",
      timestamp: "2:30 PM",
    },
    {
      id: 2,
      user: "Sarah Chen",
      avatar: "/placeholder.svg?height=32&width=32",
      message: "I'll bring Wingspan and Azul as backup options",
      timestamp: "2:45 PM",
    },
    {
      id: 3,
      user: "Alex Rivera",
      avatar: "/placeholder.svg?height=32&width=32",
      message: "Perfect! I can bring some snacks too",
      timestamp: "3:15 PM",
    },
  ])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: messages.length + 1,
      user: "You",
      avatar: "/placeholder.svg?height=32&width=32",
      message: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages([...messages, message])
    setNewMessage("")
  }

  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="room-furniture max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="ornate-text font-heading text-2xl">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[calc(85vh-120px)]">
          <Tabs defaultValue="details" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4 flex-shrink-0">
              <TabsTrigger value="details" className="font-body">
                Event Details
              </TabsTrigger>
              <TabsTrigger value="chat" className="font-body">
                <MessageCircle className="h-4 w-4 mr-2" />
                Event Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Event Info */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-600 border-green-200">{event.status}</Badge>
                      <Badge variant="outline" className="bg-blue-100 text-blue-600">
                        {event.category}
                      </Badge>
                    </div>

                    <p className="font-body text-muted-foreground">{event.description}</p>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-accent-gold" />
                        <span className="font-body">{event.date}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-accent-gold" />
                        <span className="font-body">{event.time}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-accent-gold" />
                        <div>
                          <div className="font-body">{event.location}</div>
                          <div className="font-body text-sm text-muted-foreground">{event.address}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-accent-gold" />
                        <span className="font-body">
                          {event.attendees}/{event.maxAttendees} attending
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Host & Actions */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-accent-gold/20">
                      <h3 className="font-heading font-semibold mb-3">Host</h3>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={event.hostAvatar || "/placeholder.svg"} alt={event.host} />
                          <AvatarFallback className="font-body">
                            {event.host
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-body font-semibold">{event.host}</div>
                          <div className="font-body text-sm text-muted-foreground">Event Organizer</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {event.status === "invited" && (
                        <>
                          <Button className="theme-accent-gold w-full">Join Event</Button>
                          <Button variant="outline" className="w-full bg-transparent">
                            Maybe
                          </Button>
                        </>
                      )}
                      {event.status === "attending" && (
                        <Button variant="outline" className="w-full bg-transparent">
                          Leave Event
                        </Button>
                      )}
                      {event.status === "hosting" && (
                        <>
                          <Button className="theme-accent-gold w-full">Edit Event</Button>
                          <Button variant="outline" className="w-full bg-transparent">
                            Manage Attendees
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4 border border-accent-gold/20 rounded-lg mb-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.avatar || "/placeholder.svg"} alt={message.user} />
                        <AvatarFallback className="text-xs font-body">
                          {message.user
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-body font-semibold text-sm">{message.user}</span>
                          <span className="font-body text-xs text-muted-foreground">{message.timestamp}</span>
                        </div>
                        <p className="font-body text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="flex space-x-2 flex-shrink-0">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 font-body"
                />
                <Button type="submit" size="icon" className="theme-accent-gold">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
