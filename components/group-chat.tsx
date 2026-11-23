"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArchiveFrame, ArchiveIconButton, archiveField } from "@/components/archive-frame"
import { ArchiveDivider } from "@/components/archive-divider"
import { Send, MessageCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getGroupMessages, sendGroupMessage, type GroupMessage } from "@/app/actions/groups"
import { useToast } from "@/hooks/use-toast"

export function GroupChat({ groupId, groupName }: { groupId: string; groupName: string }) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    const load = async () => {
      const [{ data: { user } }, result] = await Promise.all([
        supabase.auth.getUser(),
        getGroupMessages(groupId),
      ])
      if (!active) return
      setCurrentUserId(user?.id ?? null)
      if (result.error) setLoadError(true)
      else setMessages(result.messages)
      setLoading(false)
    }
    void load()

    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "group_messages",
        filter: `group_id=eq.${groupId}`,
      }, async payload => {
        const { data } = await supabase
          .from("group_messages")
          .select("*, sender:profiles!group_messages_sender_id_fkey(id, display_name, username, avatar_url)")
          .eq("id", payload.new.id)
          .single()
        if (active && data) {
          setMessages(previous => previous.some(item => item.id === data.id) ? previous : [...previous, data as GroupMessage])
        }
      })
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [groupId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault()
    const content = newMessage.trim()
    if (!content || sending) return
    setSending(true)
    const result = await sendGroupMessage(groupId, content)
    if (result.error) {
      toast({ title: "Viestin lähetys epäonnistui", description: "Tarkista yhteys ja yritä uudelleen.", variant: "destructive" })
    } else {
      setNewMessage("")
    }
    setSending(false)
  }

  const formatDate = (value: string) => new Date(value).toLocaleDateString("fi-FI")
  const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <ArchiveFrame className="mb-6 flex max-h-[70vh] flex-col">
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2 font-cinzel text-accent-gold">
          <MessageCircle className="h-5 w-5" />
          Ryhmän keskustelu
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{groupName}</p>
      </div>

      {loading ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-accent-gold" />
          <p className="mt-2 text-sm text-muted-foreground">Ladataan viestejä…</p>
        </div>
      ) : loadError ? (
        <div className="p-6 text-center text-sm text-muted-foreground">Keskustelun lataaminen epäonnistui. Päivitä sivu ja yritä uudelleen.</div>
      ) : (
        <>
          <ScrollArea className="min-h-[180px] flex-1 px-5">
            <div className="space-y-4 pb-4">
              {messages.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <MessageCircle className="mx-auto mb-2 h-10 w-10 opacity-50" />
                  <p>Ei vielä viestejä. Aloita keskustelu!</p>
                </div>
              ) : messages.map((message, index) => {
                const own = message.sender_id === currentUserId
                const showDate = index === 0 || formatDate(message.created_at) !== formatDate(messages[index - 1].created_at)
                const senderName = message.sender_id === null ? "Poistettu käyttäjä" : message.sender?.display_name || message.sender?.username || "Pelaaja"
                return (
                  <div key={message.id}>
                    {showDate ? <ArchiveDivider variant="subtle" className="my-2" /> : null}
                    <div className={`flex gap-3 ${own ? "justify-end" : "justify-start"}`}>
                      {!own ? (
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-accent-gold/20">
                          {message.sender?.avatar_url
                            ? <img src={message.sender.avatar_url} alt="" className="h-full w-full object-cover" />
                            : <div className="flex h-full w-full items-center justify-center text-xs text-accent-gold">{senderName.charAt(0).toUpperCase()}</div>}
                        </div>
                      ) : null}
                      <div className="max-w-[82%]">
                        {!own ? (
                          <p className="mb-1 text-xs text-muted-foreground">
                            {message.sender?.username
                              ? <Link href={`/users/${message.sender.username}`} className="hover:text-accent-gold">{senderName}</Link>
                              : senderName}
                          </p>
                        ) : null}
                        <div className={`rounded-lg border border-accent-gold/15 px-3 py-2 ${own ? "bg-accent-gold text-accent-gold-foreground" : "bg-black/30"}`}>
                          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                          <p className={`mt-1 text-right text-xs ${own ? "text-accent-gold-foreground/70" : "text-muted-foreground"}`}>{formatTime(message.created_at)}</p>
                        </div>
                      </div>
                      {own ? (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-gold text-xs text-accent-gold-foreground">
                          {message.sender?.avatar_url
                            ? <img src={message.sender.avatar_url} alt="" className="h-full w-full object-cover" />
                            : (senderName.charAt(0).toUpperCase())}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
              <div ref={endRef} />
            </div>
          </ScrollArea>
          <div className="border-t border-accent-gold/20 p-4 pt-3">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input value={newMessage} onChange={event => setNewMessage(event.target.value)} placeholder="Kirjoita viesti…" className={`flex-1 ${archiveField}`} maxLength={5000} disabled={sending} />
              <ArchiveIconButton type="submit" active disabled={!newMessage.trim() || sending} aria-label="Lähetä viesti" icon={sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} />
            </form>
          </div>
        </>
      )}
    </ArchiveFrame>
  )
}
