import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mail, Send, Shield, FileText, Facebook, Twitter, Instagram } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="ornate-text font-heading text-5xl font-bold">Contact Us</h1>
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            Get in touch with the GameTable team - we're here to help enhance your gaming experience
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 max-w-6xl mx-auto">
          <div>
            <Card className="room-furniture">
              <CardHeader>
                <CardTitle className="ornate-text font-heading text-2xl font-bold flex items-center">
                  <Send className="h-6 w-6 mr-3 text-accent-gold" />
                  Send us a Message
                </CardTitle>
                <p className="font-body text-muted-foreground">
                  Have a question, suggestion, or need assistance? We'd love to hear from you.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="font-body">
                      First Name
                    </Label>
                    <Input id="firstName" placeholder="Enter your first name" className="font-body" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="font-body">
                      Last Name
                    </Label>
                    <Input id="lastName" placeholder="Enter your last name" className="font-body" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-body">
                    Email Address
                  </Label>
                  <Input id="email" type="email" placeholder="your.email@example.com" className="font-body" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="font-body">
                    Subject
                  </Label>
                  <Input id="subject" placeholder="What's this about?" className="font-body" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="font-body">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help you..."
                    className="min-h-[120px] font-body"
                  />
                </div>
                <Button className="w-full theme-accent-gold" size="lg">
                  <Send className="h-4 w-4 mr-2" />
                  <span className="font-body">Send Message</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="room-furniture">
              <CardHeader>
                <CardTitle className="ornate-text font-heading text-2xl font-bold">Get in Touch</CardTitle>
                <p className="font-body text-muted-foreground">Connect with us on social media</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <a
                  href="#"
                  className="flex items-center space-x-4 p-4 rounded-lg hover:bg-accent-gold/10 transition-colors"
                >
                  <div className="p-3 rounded-lg bg-accent-gold/20 text-accent-gold flex-shrink-0">
                    <Twitter className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-lg">X (Twitter)</h4>
                    <p className="font-body text-sm text-muted-foreground">Follow us for updates and news</p>
                  </div>
                </a>

                <a
                  href="#"
                  className="flex items-center space-x-4 p-4 rounded-lg hover:bg-accent-gold/10 transition-colors"
                >
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex-shrink-0">
                    <Facebook className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-lg">Facebook</h4>
                    <p className="font-body text-sm text-muted-foreground">Join our community</p>
                  </div>
                </a>

                <a
                  href="#"
                  className="flex items-center space-x-4 p-4 rounded-lg hover:bg-accent-gold/10 transition-colors"
                >
                  <div className="p-3 rounded-lg bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 flex-shrink-0">
                    <Instagram className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-lg">Instagram</h4>
                    <p className="font-body text-sm text-muted-foreground">See our latest photos</p>
                  </div>
                </a>

                <a
                  href="#"
                  className="flex items-center space-x-4 p-4 rounded-lg hover:bg-accent-gold/10 transition-colors"
                >
                  <div className="p-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex-shrink-0">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-lg">TikTok</h4>
                    <p className="font-body text-sm text-muted-foreground">Watch our gaming content</p>
                  </div>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-16 max-w-6xl mx-auto">
          <Card className="room-furniture border-accent-gold/30">
            <CardHeader className="text-center">
              <CardTitle className="ornate-text font-heading text-3xl font-bold">Legal Information</CardTitle>
              <p className="font-body text-muted-foreground">Learn about our policies and your rights</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 mb-8">
                <Card className="room-furniture border-accent-gold/20">
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-gold/20 mb-4">
                      <Shield className="h-8 w-8 text-accent-gold" />
                    </div>
                    <h3 className="ornate-text font-heading text-xl font-bold mb-2">Privacy Policy</h3>
                    <p className="font-body text-sm text-muted-foreground mb-4">
                      How we collect, use, and protect your data
                    </p>
                    <Button variant="outline" className="bg-transparent">
                      <span className="font-body">Read Policy</span>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="room-furniture border-accent-gold/20">
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-gold/20 mb-4">
                      <FileText className="h-8 w-8 text-accent-gold" />
                    </div>
                    <h3 className="ornate-text font-heading text-xl font-bold mb-2">Terms of Service</h3>
                    <p className="font-body text-sm text-muted-foreground mb-4">Your rights and responsibilities</p>
                    <Button variant="outline" className="bg-transparent">
                      <span className="font-body">Read Terms</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center p-4 rounded-lg bg-accent-gold/10 border border-accent-gold/20">
                <p className="font-body text-sm">
                  For GDPR-related inquiries, please email{" "}
                  <a href="mailto:gametableapp.contact@gmail.com" className="text-accent-gold hover:underline">
                    gametableapp.contact@gmail.com
                  </a>{" "}
                  with "GDPR Request" in the subject line.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
