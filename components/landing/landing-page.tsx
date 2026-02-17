"use client"

import { LandingNavbar } from "./landing-navbar"
import { HeroSection } from "./hero-section"
import { GamerTypesRibbon } from "./gamer-types-ribbon"
import { FeaturesSection } from "./features-section"
import { RoomsSection } from "./rooms-section"
import { HowItWorksSection } from "./how-it-works-section"
import { CommunitySection } from "./community-section"
import { ComingSoonSection } from "./coming-soon-section"
import { CtaSection } from "./cta-section"
import { LandingFooter } from "./landing-footer"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[hsl(345,80%,8%)]">
      <LandingNavbar />
      <HeroSection />
      <GamerTypesRibbon />
      <FeaturesSection />
      <RoomsSection />
      <HowItWorksSection />
      <CommunitySection />
      <ComingSoonSection />
      <CtaSection />
      <LandingFooter />
    </div>
  )
}
