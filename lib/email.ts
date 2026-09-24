import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export type EmailNotificationType =
  | "friend_request"
  | "badge_earned"
  | "event_rsvp"
  | "event_invite"
  | "new_message"
  | "admin_broadcast"

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping email")
    return { success: false, error: "Email not configured" }
  }

  const fromAddress = process.env.EMAIL_FROM || "Gametable <noreply@resend.dev>"
  console.log("[Email] Sending email to:", to, "from:", fromAddress, "subject:", subject)

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
      text: text || subject,
    })

    if (error) {
      console.error("[Email] Failed to send:", error)
      return { success: false, error: error.message }
    }

    console.log("[Email] Sent successfully, id:", data?.id)
    return { success: true, id: data?.id }
  } catch (err) {
    console.error("[Email] Error:", err)
    return { success: false, error: "Failed to send email" }
  }
}

// Email templates
export function getFriendRequestEmailTemplate(senderName: string, senderId?: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gametable.app'
  const profileUrl = senderId ? `${appUrl}/profile/${encodeURIComponent(senderId)}` : null

  return {
    subject: `${senderName} wants to connect on Gametable`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Friend Request</h2>
        <p style="color: #4a4a4a; line-height: 1.6;"><strong>${senderName}</strong> wants to connect with you on Gametable!</p>
        <p style="color: #4a4a4a; line-height: 1.6;">Log in to accept their request and start sharing your gaming experiences.</p>
        ${profileUrl ? `<a href="${profileUrl}" style="display:inline-block;background:#d4af37;color:#1a1a1a;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:16px;margin-right:8px;">View Profile</a>` : ''}
        <a href="${appUrl}/notifications" style="display:inline-block;background:#d4af37;color:#1a1a1a;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:16px;">View Request</a>
      </div>
    `,
  }
}

export function getBadgeEarnedEmailTemplate(badgeName: string) {
  return {
    subject: `You've earned a new badge: ${badgeName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Badge Unlocked!</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">Congratulations! You've earned the <strong>${badgeName}</strong> badge on Gametable.</p>
        <p style="color: #4a4a4a; line-height: 1.6;">Keep gaming and collecting badges to show off your achievements!</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gametable.app'}/trophies" style="display:inline-block;background:#d4af37;color:#1a1a1a;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:16px;">View Trophies</a>
      </div>
    `,
  }
}

export function getEventRsvpEmailTemplate(eventName: string, attendeeName: string) {
  return { subject: `${attendeeName} RSVP'd to ${eventName}`, html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #1a1a1a;">New RSVP!</h2><p style="color: #4a4a4a; line-height: 1.6;"><strong>${attendeeName}</strong> has RSVP'd to your event: <strong>${eventName}</strong></p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gametable.app'}/events" style="display:inline-block;background:#d4af37;color:#1a1a1a;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:16px;">View Event</a></div>` }
}

export function getEventInvitationEmailTemplate(eventName: string, hostName: string) {
  return { subject: `${hostName} invited you to ${eventName}`, html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #1a1a1a;">You're Invited!</h2><p style="color: #4a4a4a; line-height: 1.6;"><strong>${hostName}</strong> invited you to <strong>${eventName}</strong> on Gametable.</p><p style="color: #4a4a4a; line-height: 1.6;">Log in to view the event and respond to the invitation.</p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gametable.app'}/events" style="display:inline-block;background:#d4af37;color:#1a1a1a;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:16px;">View Event</a></div>` }
}

export function getNewMessageEmailTemplate(senderName: string) {
  return { subject: `New message from ${senderName} on Gametable`, html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #1a1a1a;">New Message</h2><p style="color: #4a4a4a; line-height: 1.6;">You have a new message from <strong>${senderName}</strong> on Gametable.</p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gametable.app'}/messages" style="display:inline-block;background:#d4af37;color:#1a1a1a;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:16px;">Read Message</a></div>` }
}

export function getAdminBroadcastEmailTemplate(title: string, message: string, imageUrl?: string | null) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gametable.app"
  const crestUrl = `${appUrl}/crests/main-hall-home.png`

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")

  const safeTitle = escapeHtml(title)
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />")
  const safeImage = imageUrl ? escapeHtml(imageUrl) : null

  return {
    subject: `[Gametable] ${title}`,
    html: `
      <div style="margin:0;padding:32px 12px;background:#100d0b;font-family:Georgia,'Times New Roman',serif;color:#ead9ad;">
        <div style="max-width:620px;margin:0 auto;border:1px solid #a87924;background:#171310;box-shadow:0 8px 30px rgba(0,0,0,.35);">
          <div style="padding:34px 32px 28px;text-align:center;border-bottom:1px solid #6f5120;">
            <img src="${crestUrl}" alt="GameTable crest" width="82" height="82" style="display:block;margin:0 auto 14px;object-fit:contain;" />
            <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#b9954b;">GAMETABLE</div>
            <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;font-weight:normal;color:#e2b44f;">${safeTitle}</h1>
          </div>

          ${safeImage ? `<div style="padding:20px 20px 0;text-align:center;"><img src="${safeImage}" alt="" width="580" style="display:block;width:100%;max-width:580px;height:auto;margin:0 auto;border:1px solid #6f5120;" /></div>` : ""}
          <div style="padding:34px 32px 30px;">
            <p style="margin:0 0 22px;font-size:18px;line-height:1.7;color:#e7d6aa;">
              <strong>The manor staff wishes to inform you...</strong>
            </p>
            <div style="font-size:16px;line-height:1.8;color:#d8c69b;">
              ${safeMessage}
            </div>
          </div>

          <div style="padding:24px 32px 30px;text-align:center;border-top:1px solid #6f5120;">
            <a href="${appUrl}" style="display:inline-block;padding:13px 28px;background:#c99a32;color:#17110a;text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:bold;border:1px solid #e1bd68;">
              Visit GameTable
            </a>
            <p style="margin:22px 0 0;font-size:12px;line-height:1.5;color:#806d4a;">
              A formal correspondence from the GameTable manor.
            </p>
          </div>
        </div>
      </div>
    `
  }
}
