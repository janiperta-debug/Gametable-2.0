"use server"

import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendAnnouncement(subject: string, message: string) {
  try {
    // Get all users with email notifications enabled
    const usersSnapshot = await getDocs(collection(db, "profiles"))
    const emails: string[] = []

    usersSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.email && data.emailNotifications !== false) {
        emails.push(data.email)
      }
    })

    if (emails.length === 0) {
      return { success: false, error: "No users to send to" }
    }

    // Send emails in batches
    const batchSize = 50
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      await resend.emails.send({
        from: "GameTable Manor <announcements@gametable.app>",
        to: batch,
        subject: subject,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #c9a227; text-align: center;">GameTable Manor</h1>
            <hr style="border: 1px solid #c9a227;" />
            <div style="padding: 20px 0;">
              ${message}
            </div>
            <hr style="border: 1px solid #c9a227;" />
            <p style="text-align: center; color: #666; font-size: 12px;">
              You received this because you're a member of GameTable Manor.
            </p>
          </div>
        `,
      })
    }

    return { success: true, count: emails.length }
  } catch (error) {
    console.error("Failed to send announcement:", error)
    return { success: false, error: "Failed to send announcement" }
  }
}
