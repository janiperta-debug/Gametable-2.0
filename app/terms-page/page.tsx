import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Scale, AlertTriangle, Users, Mail } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="ornate-text font-heading text-5xl font-bold">Terms of Service</h1>
          </div>
          <p className="font-body text-muted-foreground text-lg">Last Updated: January 2025</p>
        </div>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-2xl font-bold">Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>
              Welcome to GameTable! These Terms of Service ("Terms") govern your access to and use of the GameTable
              platform, including our website, mobile applications, and related services (collectively, the "Service").
            </p>
            <p>
              By accessing or using GameTable, you agree to be bound by these Terms. If you do not agree to these Terms,
              please do not use our Service.
            </p>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold flex items-center">
              <Users className="h-6 w-6 mr-3 text-accent-gold" />
              User Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">Account Creation</h3>
              <p className="mb-2">To use GameTable, you must create an account. You agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">Age Requirements</h3>
              <p>
                You must be at least 13 years old to use GameTable. If you are under 18, you must have permission from a
                parent or guardian to use our Service.
              </p>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">Account Termination</h3>
              <p>
                You may delete your account at any time. We reserve the right to suspend or terminate your account if
                you violate these Terms or engage in conduct that we deem harmful to other users or our Service.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold flex items-center">
              <Scale className="h-6 w-6 mr-3 text-accent-gold" />
              Acceptable Use
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>You agree to use GameTable only for lawful purposes. You will not:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the intellectual property rights of others</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Distribute spam, malware, or viruses</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use automated tools to scrape or collect data</li>
              <li>Impersonate another person or entity</li>
              <li>Engage in any activity that disrupts or interferes with the Service</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold">User Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">Your Content</h3>
              <p>
                You retain ownership of any content you post on GameTable, including game collections, reviews,
                messages, and profile information ("User Content"). By posting User Content, you grant us a worldwide,
                non-exclusive, royalty-free license to use, display, and distribute your content in connection with
                operating the Service.
              </p>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">Content Standards</h3>
              <p className="mb-2">Your User Content must not:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Contain hate speech, threats, or harassment</li>
                <li>Include explicit or inappropriate material</li>
                <li>Violate the privacy or rights of others</li>
                <li>Promote illegal activities</li>
                <li>Contain false or misleading information</li>
              </ul>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">Content Moderation</h3>
              <p>
                We reserve the right to review, remove, or modify any User Content that violates these Terms or that we
                deem inappropriate. However, we are not obligated to monitor all content posted on our platform.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold">Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>
              The GameTable Service, including its design, features, graphics, and code, is owned by GameTable and
              protected by copyright, trademark, and other intellectual property laws. You may not copy, modify,
              distribute, or create derivative works based on our Service without our express permission.
            </p>
            <p>
              Game data, including titles, descriptions, and images, may be sourced from third-party providers like
              BoardGameGeek and are subject to their respective terms and licenses.
            </p>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold">Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>
              GameTable integrates with third-party services, including Firebase for authentication and BoardGameGeek
              for game data. Your use of these services is subject to their respective terms and privacy policies. We
              are not responsible for the practices or content of third-party services.
            </p>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold flex items-center">
              <AlertTriangle className="h-6 w-6 mr-3 text-accent-gold" />
              Disclaimers and Limitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">Service "As Is"</h3>
              <p>
                GameTable is provided "as is" and "as available" without warranties of any kind, either express or
                implied. We do not guarantee that the Service will be uninterrupted, secure, or error-free.
              </p>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">Limitation of Liability</h3>
              <p>
                To the fullest extent permitted by law, GameTable and its affiliates will not be liable for any
                indirect, incidental, special, consequential, or punitive damages arising from your use of the Service,
                including loss of data, revenue, or profits.
              </p>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">User Interactions</h3>
              <p>
                You are solely responsible for your interactions with other users. We are not responsible for disputes,
                conflicts, or harm arising from user interactions, including in-person gaming events organized through
                our platform.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold">Indemnification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>
              You agree to indemnify and hold harmless GameTable, its affiliates, and their respective officers,
              directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including
              legal fees) arising from your use of the Service, your User Content, or your violation of these Terms.
            </p>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold">Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>
              Your use of GameTable is also governed by our Privacy Policy, which explains how we collect, use, and
              protect your personal information. Please review our{" "}
              <Link href="/privacy-page" className="text-accent-gold hover:underline">
                Privacy Policy
              </Link>{" "}
              to understand our practices.
            </p>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold">Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>
              We may update these Terms from time to time. We will notify you of material changes by posting the updated
              Terms on this page and updating the "Last Updated" date. Your continued use of GameTable after changes are
              posted constitutes your acceptance of the revised Terms.
            </p>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold">Governing Law</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>
              These Terms are governed by and construed in accordance with the laws of the jurisdiction in which
              GameTable operates, without regard to conflict of law principles. Any disputes arising from these Terms or
              your use of the Service will be resolved in the courts of that jurisdiction.
            </p>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold">Severability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will
              continue in full force and effect.
            </p>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold flex items-center">
              <Mail className="h-6 w-6 mr-3 text-accent-gold" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>If you have questions about these Terms of Service, please contact us:</p>
            <div className="bg-accent-gold/10 p-4 rounded-lg border border-accent-gold/20">
              <p className="font-semibold mb-2">GameTable Support</p>
              <p>
                Email:{" "}
                <a href="mailto:gametableapp.contact@gmail.com" className="text-accent-gold hover:underline">
                  gametableapp.contact@gmail.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Link href="/contact">
            <Button variant="outline" className="bg-transparent">
              <span className="font-body">Back to Contact</span>
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
