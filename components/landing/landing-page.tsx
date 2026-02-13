"use client"

import { LandingNavbar } from "./landing-navbar"
import { HeroSection } from "./hero-section"
import { FeaturesSection } from "./features-section"
import { RoomsSection } from "./rooms-section"
import { HowItWorksSection } from "./how-it-works-section"
import { CommunitySection } from "./community-section"
import { CtaSection } from "./cta-section"
import { LandingFooter } from "./landing-footer"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[hsl(345,80%,8%)]">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <RoomsSection />
      <HowItWorksSection />
      <CommunitySection />
      <CtaSection />
      <LandingFooter />
    </div>
  )
}
