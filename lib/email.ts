import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export type EmailNotificationType = 
  | "friend_request" 
  | "badge_earned" 
  | "event_rsvp" 
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

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Gametable <noreply@resend.dev>",
      to,
      subject,
      html,
      text: text || subject,
    })

    if (error) {
      console.error("[Email] Failed to send:", error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error("[Email] Error:", err)
    return { success: false, error: "Failed to send email" }
  }
}

// Email templates
export function getFriendRequestEmailTemplate(senderName: string) {
  return {
    subject: `${senderName} wants to connect on Gametable`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Friend Request</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">
          <strong>${senderName}</strong> wants to connect with you on Gametable!
        </p>
        <p style="color: #4a4a4a; line-height: 1.6;">
          Log in to accept their request and start sharing your gaming experiences.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gametable.app'}/notifications" 
           style="display: inline-block; background: #d4af37; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">
          View Request
        </a>
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
        <p style="color: #4a4a4a; line-height: 1.6;">
          Congratulations! You've earned the <strong>${badgeName}</strong> badge on Gametable.
        </p>
        <p style="color: #4a4a4a; line-height: 1.6;">
          Keep gaming and collecting badges to show off your achievements!
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gametable.app'}/trophies" 
           style="display: inline-block; background: #d4af37; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">
          View Trophies
        </a>
      </div>
    `,
  }
}

export function getEventRsvpEmailTemplate(eventName: string, attendeeName: string) {
  return {
    subject: `${attendeeName} RSVP'd to ${eventName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New RSVP!</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">
          <strong>${attendeeName}</strong> has RSVP'd to your event: <strong>${eventName}</strong>
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gametable.app'}/events" 
           style="display: inline-block; background: #d4af37; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">
          View Event
        </a>
      </div>
    `,
  }
}

export function getNewMessageEmailTemplate(senderName: string) {
  return {
    subject: `New message from ${senderName} on Gametable`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Message</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">
          You have a new message from <strong>${senderName}</strong> on Gametable.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gametable.app'}/messages" 
           style="display: inline-block; background: #d4af37; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">
          Read Message
        </a>
      </div>
    `,
  }
}

export function getAdminBroadcastEmailTemplate(title: string, message: string) {
  return {
    subject: `[Gametable] ${title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">${title}</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">
          ${message}
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gametable.app'}" 
           style="display: inline-block; background: #d4af37; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">
          Visit Gametable
        </a>
      </div>
    `,
  }
}
