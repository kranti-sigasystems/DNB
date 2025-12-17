'use client';

import CTA from '@/components/features/home/components/CTA';
import Features from '@/components/features/home/components/Features';
import Footer from '@/components/features/home/components/Footer';
import Hero from '@/components/features/home/components/Hero';
import LandingNavbar from '@/components/features/home/components/Landingnavbar';
import Plan from '@/components/features/home/components/Plan';
import Testimonal from '@/components/features/home/components/Testimonal';

export default function LandingPage() {
  return (
    <main className="flex w-full flex-col">
      <LandingNavbar />

      <Hero />

      <div className="container mx-auto p-4">
        <Features />
        {/* <Plan /> */}
        <Testimonal />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
