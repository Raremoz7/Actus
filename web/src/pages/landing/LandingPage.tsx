import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useAuthStore } from '../../store/authStore';
import { useLenis } from '../../hooks/useLenis';
import { Navbar } from './sections/Navbar';
import { HeroSection } from './sections/HeroSection';
import { SocialProofSection } from './sections/SocialProofSection';
import { StartTheDaySection } from './sections/StartTheDaySection';
import { EatSection } from './sections/EatSection';
import { HealthRecordsSection } from './sections/HealthRecordsSection';
import { IntelligenceSection } from './sections/IntelligenceSection';
import { StickyFeaturesSection } from './sections/StickyFeaturesSection';
import { AccordionSection } from './sections/AccordionSection';
import { PrivacySection } from './sections/PrivacySection';
import { GallerySection } from './sections/GallerySection';
import { ReviewsSection } from './sections/ReviewsSection';
import { CtaSection } from './sections/CtaSection';
import { Footer } from './sections/Footer';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function LandingPage() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);

  useLenis();

  useEffect(() => {
    if (accessToken) navigate('/app', { replace: true });
  }, [accessToken, navigate]);

  return (
    <div
      style={{
        fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", Inter, sans-serif',
        overflowX: 'hidden',
        background: '#fff',
      }}
    >
      <Navbar />
      <HeroSection />
      <SocialProofSection />

      {/* Strain / Sleep / Recovery */}
      <StartTheDaySection />

      {/* Nutrition */}
      <EatSection />

      {/* Health records with floating source icons */}
      <HealthRecordsSection />

      {/* Intelligence: orbs + heading (dark) */}
      <IntelligenceSection />

      {/* Sticky scroll — chat phone pinned, 4 features (dark wrapper, light panel) */}
      <StickyFeaturesSection />

      {/* And that's not all — accordion (white) */}
      <AccordionSection />

      {/* Built for privacy (dark teal panel) */}
      <PrivacySection />

      {/* Crafted with care — photo mosaic */}
      <GallerySection />

      {/* App Store reviews */}
      <ReviewsSection />

      {/* Ready when you are — CTA */}
      <CtaSection />

      <Footer />
    </div>
  );
}
