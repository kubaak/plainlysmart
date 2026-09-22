import { Navigation } from "@/components/Navigation";
import { BookingExperience } from "@/components/booking";
import { HeroSection } from "@/components/home/HeroSection";
import { ValueStrip } from "@/components/home/ValueStrip";
import { ServicesSection } from "@/components/home/ServicesSection";
import { AutomationSection } from "@/components/home/AutomationSection";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { BusinessProblemsSection } from "@/components/home/BusinessProblemsSection";
import { WhyUsSection } from "@/components/home/WhyUsSection";
import { ContactSection } from "@/components/home/ContactSection";
import { HomeFooter } from "@/components/home/HomeFooter";
import { AvailabilityPanel } from "@/components/home/AvailabilityPanel";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Sections own their localized copy; see messages/en.json for the English text.
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <BookingExperience>
      <Navigation />
      <main id="main">
        <HeroSection />
        <ValueStrip />
        <ServicesSection />
        <AutomationSection />
        <BenefitsSection />
        <ProcessSection />
        <BusinessProblemsSection />
        <WhyUsSection />
        <ContactSection />
      </main>
      <HomeFooter locale={locale} />
      <AvailabilityPanel />
    </BookingExperience>
  );
}
