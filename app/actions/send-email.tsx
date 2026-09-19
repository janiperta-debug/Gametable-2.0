"use server"

export async function sendContactEmail(formData: {
  firstName: string
  lastName: string
  email: string
  subject: string
  message: string
}) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GameTable Contact <onboarding@resend.dev>",
        to: "info@janope.fi",
        reply_to: formData.email,
        subject: `[GameTable] Contact Form: ${formData.subject}`,
        tags: [
          { name: "application", value: "gametable" },
          { name: "type", value: "contact-form" },
        ],
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${formData.firstName} ${formData.lastName}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Subject:</strong> ${formData.subject}</p>
          <hr />
          <p>${formData.message.replace(/\n/g, "<br />")}</p>
        `,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Resend API error:", errorData)
      throw new Error("Failed to send email")
    }

    return { success: true }
  } catch (error) {
    console.error("Email send error:", error)
    return { success: false, error: "Failed to send message" }
  }
}
