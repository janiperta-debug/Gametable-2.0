"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Search, Plus, MoreHorizontal, Phone, Video } from "lucide-react"

const conversations = [
  {
    id: 1,
    name: "Sarah Chen",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Want to play Wingspan tonight?",
    time: "2 min ago",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: "Gaming Group",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Mike: See you all at 7 PM!",
    time: "15 min ago",
    unread: 0,
    online: false,
    isGroup: true,
  },
  {
    id: 3,
    name: "Alex Rivera",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Thanks for the game recommendation!",
    time: "1 hour ago",
    unread: 0,
    online: true,
  },
  {
    id: 4,
    name: "Emma Thompson",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "The D&D session was amazing!",
    time: "2 hours ago",
    unread: 1,
    online: false,
  },
]

const messages = [
  {
    id: 1,
    sender: "Sarah Chen",
    content: "Hey! I just got Wingspan and I'm dying to try it. Want to play tonight?",
    time: "7:30 PM",
    isOwn: false,
  },
  {
    id: 2,
    sender: "You",
    content: "I love that game. What time works for you?",
    time: "7:32 PM",
    isOwn: true,
  },
  {
    id: 3,
    sender: "Sarah Chen",
    content: "How about 8 PM? I can host at my place.",
    time: "7:33 PM",
    isOwn: false,
  },
  {
    id: 4,
    sender: "You",
    content: "Perfect! I'll bring some snacks. See you at 8!",
    time: "7:35 PM",
    isOwn: true,
  },
]

export default function MessagingPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message to the backend
      console.log("Sending message:", newMessage)
      setNewMessage("")
    }
  }

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="ornate-text font-heading text-5xl font-bold">Messages</h1>
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            Connect and communicate with your gaming community
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4 max-w-7xl mx-auto">
          {/* Conversations Sidebar */}
          <div className="lg:col-span-1">
            <Card className="room-furniture h-[600px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading text-xl">Conversations</CardTitle>
                  <Button size="sm" className="theme-accent-gold">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search conversations..." className="pl-10 font-body" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                <div className="space-y-1">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-accent-gold/10 ${
                        selectedConversation.id === conversation.id ? "bg-accent-gold/20" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={conversation.avatar || "/placeholder.svg"} alt={conversation.name} />
                            <AvatarFallback className="font-body">
                              {conversation.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-body font-semibold text-sm truncate">{conversation.name}</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground font-body">{conversation.time}</span>
                              {conversation.unread > 0 && (
                                <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs">
                                  {conversation.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground font-body truncate mt-1">
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="room-furniture h-[600px] flex flex-col">
              {/* Chat Header */}
              <CardHeader className="flex-shrink-0 border-b border-accent-gold/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={selectedConversation.avatar || "/placeholder.svg"}
                          alt={selectedConversation.name}
                        />
                        <AvatarFallback className="font-body">
                          {selectedConversation.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {selectedConversation.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold">{selectedConversation.name}</h3>
                      <p className="text-sm text-muted-foreground font-body">
                        {selectedConversation.online ? "Online" : "Last seen 2 hours ago"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isOwn
                            ? "bg-accent-gold text-accent-gold-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <p className="font-body text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${message.isOwn ? "text-accent-gold-foreground/70" : "text-muted-foreground"}`}
                        >
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>

              {/* Message Input */}
              <div className="flex-shrink-0 p-4 border-t border-accent-gold/20">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Type your message..."
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
                    disabled={!newMessage.trim()}
                    className="theme-accent-gold self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
