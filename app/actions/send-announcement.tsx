"use server"

import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

interface AnnouncementData {
  subject: string
  message: string
  testMode: boolean
}

interface AnnouncementResult {
  success: boolean
  error?: string
  recipientCount?: number
}

export async function sendAnnouncement(data: AnnouncementData): Promise<AnnouncementResult> {
  try {
    const { subject, message, testMode } = data

    // Get recipients
    let recipients: string[] = []

    if (testMode) {
      // Test mode: send only to admin email
      recipients = ["jani.perta@gmail.com"]
    } else {
      // Production mode: get all user emails from Firebase
      const usersRef = collection(db, "userProfiles")
      const usersSnapshot = await getDocs(usersRef)
      recipients = usersSnapshot.docs.map((doc) => doc.data().email).filter((email) => email) // Filter out any undefined emails
    }

    if (recipients.length === 0) {
      return {
        success: false,
        error: "No recipients found",
      }
    }

    // Format the message with manor theming
    const formattedMessage = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: linear-gradient(to bottom, #2D0A0A, #1A0505); color: #D4AF37; padding: 40px; border: 2px solid #8B6914; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #D4AF37; font-size: 28px; margin: 0;">🏰 GameTable Manor</h1>
          <p style="color: #8B6914; font-size: 14px; margin-top: 8px;">Official Manor Correspondence</p>
        </div>
        
        <div style="background: rgba(61, 16, 16, 0.8); padding: 30px; border: 1px solid #8B6914; border-radius: 4px;">
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            <em>The manor staff wishes to inform you...</em>
          </p>
          
          <div style="color: #D4AF37; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">
            ${message}
          </div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #8B6914; text-align: center;">
          <p style="color: #8B6914; font-size: 12px; margin: 0;">
            This announcement was sent from GameTable Manor
          </p>
          <p style="color: #8B6914; font-size: 12px; margin-top: 8px;">
            <a href="https://www.gametable.site" style="color: #D4AF37; text-decoration: none;">www.gametable.site</a>
          </p>
        </div>
      </div>
    `

    // Send emails using Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GameTable Manor <onboarding@resend.dev>",
        to: recipients,
        subject: `🏰 ${subject}`,
        html: formattedMessage,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Resend error:", errorData)
      return {
        success: false,
        error: errorData.message || "Failed to send announcement",
      }
    }

    return {
      success: true,
      recipientCount: recipients.length,
    }
  } catch (error) {
    console.error("[v0] Error sending announcement:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
