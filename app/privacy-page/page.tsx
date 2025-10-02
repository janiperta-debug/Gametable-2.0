import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, Eye, Database, UserCheck, Mail } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="ornate-text font-heading text-5xl font-bold">Privacy Policy</h1>
          </div>
          <p className="font-body text-muted-foreground text-lg">Last Updated: January 2025</p>
        </div>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-2xl font-bold">
              Our Commitment to Your Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>
              At GameTable, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our gaming community platform.
            </p>
            <p>
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy,
              please do not access the application.
            </p>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold flex items-center">
              <Database className="h-6 w-6 mr-3 text-accent-gold" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">Personal Information</h3>
              <p className="mb-2">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Name and display name</li>
                <li>Email address</li>
                <li>Profile photo</li>
                <li>Location (optional)</li>
                <li>Gaming preferences and interests</li>
              </ul>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">Game Collection Data</h3>
              <p className="mb-2">When you use GameTable, we collect:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Board games, RPGs, miniatures, and trading cards in your collection</li>
                <li>Game ratings and reviews</li>
                <li>Wishlist items</li>
                <li>Play history and statistics</li>
              </ul>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">Social and Event Data</h3>
              <p className="mb-2">We collect information about your social interactions:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Friend connections and requests</li>
                <li>Event RSVPs and attendance</li>
                <li>Messages and conversations</li>
                <li>Notifications preferences</li>
              </ul>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">Usage Information</h3>
              <p className="mb-2">We automatically collect certain information:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
                <li>Usage patterns and feature interactions</li>
                <li>Performance and error logs</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold flex items-center">
              <Eye className="h-6 w-6 mr-3 text-accent-gold" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Create and manage your account</li>
              <li>Connect you with other gamers and facilitate events</li>
              <li>Send you notifications about events, messages, and friend requests</li>
              <li>Personalize your experience and recommend games</li>
              <li>Analyze usage patterns to improve our platform</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold flex items-center">
              <Lock className="h-6 w-6 mr-3 text-accent-gold" />
              How We Share Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>We may share your information in the following circumstances:</p>

            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">With Other Users</h3>
              <p>
                Your profile information, game collection, and event participation may be visible to other GameTable
                users based on your privacy settings. You control what information is public, visible to friends only,
                or private.
              </p>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">With Service Providers</h3>
              <p>
                We use third-party services like Firebase for authentication and data storage, BoardGameGeek for game
                data, and analytics providers to help us operate our platform.
              </p>
            </div>

            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">For Legal Reasons</h3>
              <p>
                We may disclose your information if required by law or in response to valid legal requests, or to
                protect the rights, property, or safety of GameTable, our users, or others.
              </p>
            </div>

            <p className="font-semibold">We do not sell your personal information to third parties.</p>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold flex items-center">
              <UserCheck className="h-6 w-6 mr-3 text-accent-gold" />
              Your Rights and Choices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>You have the following rights regarding your personal information:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and data
              </li>
              <li>
                <strong>Portability:</strong> Export your data in a machine-readable format
              </li>
              <li>
                <strong>Opt-out:</strong> Unsubscribe from marketing communications
              </li>
              <li>
                <strong>Privacy Settings:</strong> Control who can see your profile and collection
              </li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at{" "}
              <a href="mailto:gametableapp.contact@gmail.com" className="text-accent-gold hover:underline">
                gametableapp.contact@gmail.com
              </a>
            </p>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold">Data Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>
              We implement appropriate technical and organizational measures to protect your personal information
              against unauthorized access, alteration, disclosure, or destruction. This includes:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Secure cloud infrastructure (Firebase)</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your
              information, we cannot guarantee absolute security.
            </p>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold">Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>
              GameTable is not intended for children under 13 years of age. We do not knowingly collect personal
              information from children under 13. If you are a parent or guardian and believe your child has provided us
              with personal information, please contact us.
            </p>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold">International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>
              Your information may be transferred to and processed in countries other than your country of residence.
              These countries may have different data protection laws. By using GameTable, you consent to the transfer
              of your information to our facilities and service providers.
            </p>
          </CardContent>
        </Card>

        <Card className="room-furniture mb-8">
          <CardHeader>
            <CardTitle className="ornate-text font-heading text-xl font-bold">Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy
              Policy periodically for any changes.
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
            <p>If you have questions or concerns about this Privacy Policy or our data practices, please contact us:</p>
            <div className="bg-accent-gold/10 p-4 rounded-lg border border-accent-gold/20">
              <p className="font-semibold mb-2">GameTable Support</p>
              <p>
                Email:{" "}
                <a href="mailto:gametableapp.contact@gmail.com" className="text-accent-gold hover:underline">
                  gametableapp.contact@gmail.com
                </a>
              </p>
              <p className="mt-2 text-sm">
                For GDPR-related requests, please include "GDPR Request" in the subject line.
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
