import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mail, MessageSquare, Phone, MapPin, Send, Clock, Users, HelpCircle } from "lucide-react"

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
          {/* Contact Form */}
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

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Get in Touch */}
            <Card className="room-furniture">
              <CardHeader>
                <CardTitle className="ornate-text font-heading text-2xl font-bold">Get in Touch</CardTitle>
                <p className="font-body text-muted-foreground">Multiple ways to reach our dedicated support team</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-accent-gold/20 text-accent-gold flex-shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-lg">Email Support</h4>
                    <p className="font-body text-accent-gold">support@gametable.com</p>
                    <p className="font-body text-sm text-muted-foreground">We typically respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-lg">Live Chat</h4>
                    <p className="font-body text-sm text-muted-foreground">Available 9 AM - 6 PM PST</p>
                    <p className="font-body text-sm text-muted-foreground">Monday through Friday</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex-shrink-0">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-lg">Phone Support</h4>
                    <p className="font-body text-accent-gold">+1 (555) 123-4567</p>
                    <p className="font-body text-sm text-muted-foreground">For urgent matters only</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex-shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-lg">Office Location</h4>
                    <p className="font-body text-sm text-muted-foreground">Seattle, Washington</p>
                    <p className="font-body text-sm text-muted-foreground">By appointment only</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Hours */}
            <Card className="room-furniture">
              <CardHeader>
                <CardTitle className="ornate-text font-heading text-xl font-bold flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-accent-gold" />
                  Support Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-body text-sm">Monday - Friday</span>
                  <span className="font-body text-sm font-semibold">9:00 AM - 6:00 PM PST</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body text-sm">Saturday</span>
                  <span className="font-body text-sm font-semibold">10:00 AM - 4:00 PM PST</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body text-sm">Sunday</span>
                  <span className="font-body text-sm text-muted-foreground">Closed</span>
                </div>
                <div className="pt-2 border-t border-accent-gold/20">
                  <p className="font-body text-xs text-muted-foreground">
                    Emergency support available 24/7 for critical issues
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Community Support */}
            <Card className="room-furniture">
              <CardHeader>
                <CardTitle className="ornate-text font-heading text-xl font-bold flex items-center">
                  <Users className="h-5 w-5 mr-2 text-accent-gold" />
                  Community Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-body text-sm text-muted-foreground mb-4">
                  Join our community forums and Discord server for peer support, game recommendations, and general
                  discussion with fellow manor members.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span className="font-body">Community Forums</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span className="font-body">Discord Server</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <Card className="room-furniture max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="ornate-text font-heading text-3xl font-bold flex items-center justify-center">
                <HelpCircle className="h-8 w-8 mr-3 text-accent-gold" />
                Frequently Asked Questions
              </CardTitle>
              <p className="font-body text-muted-foreground">Quick answers to common questions about GameTable</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-heading font-semibold mb-2">How do I import my BoardGameGeek collection?</h4>
                    <p className="font-body text-sm text-muted-foreground">
                      Go to your Collection page and click "Import from BGG". Enter your BGG username and we'll sync
                      your games automatically.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold mb-2">Can I organize private gaming events?</h4>
                    <p className="font-body text-sm text-muted-foreground">
                      Yes! Use our Events page to create private or public gaming sessions, manage RSVPs, and coordinate
                      with your gaming group.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold mb-2">How do room themes work?</h4>
                    <p className="font-body text-sm text-muted-foreground">
                      Unlock new room themes by leveling up and earning XP through gaming activities. Each theme changes
                      your entire GameTable experience.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-heading font-semibold mb-2">Is GameTable free to use?</h4>
                    <p className="font-body text-sm text-muted-foreground">
                      GameTable offers both free and premium tiers. Basic collection management and social features are
                      free forever.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold mb-2">How do I find local gaming groups?</h4>
                    <p className="font-body text-sm text-muted-foreground">
                      Use our Discover page to find players and groups in your area. Filter by location, game
                      preferences, and availability.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold mb-2">Can I track my game plays and statistics?</h4>
                    <p className="font-body text-sm text-muted-foreground">
                      Log your plays, track wins/losses, and view detailed statistics about your gaming habits and
                      preferences.
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-center mt-8">
                <Button variant="outline" className="bg-transparent">
                  <span className="font-body">View All FAQs</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Time Guarantee */}
        <div className="mt-12">
          <Card className="room-furniture max-w-2xl mx-auto text-center">
            <CardContent className="p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-gold/20 mb-6">
                <Clock className="h-8 w-8 text-accent-gold" />
              </div>
              <h3 className="ornate-text font-heading text-2xl font-bold mb-4">Our Commitment to You</h3>
              <p className="font-body text-muted-foreground mb-6">
                We're committed to providing exceptional support to our gaming community. Most inquiries receive a
                response within 4 hours during business days.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-accent-gold font-heading">Less than 4 hours</div>
                  <div className="text-sm text-muted-foreground font-body">Average Response</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent-gold font-heading">98%</div>
                  <div className="text-sm text-muted-foreground font-body">Satisfaction Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent-gold font-heading">24/7</div>
                  <div className="text-sm text-muted-foreground font-body">Emergency Support</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
