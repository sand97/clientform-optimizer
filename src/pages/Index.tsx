
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're actually on a confirmation flow but somehow landed on the index page
  useEffect(() => {
    const url = window.location.href;
    const queryParams = new URLSearchParams(location.search);
    
    const hasConfirmationIndicators = 
      url.includes('confirmation_token') || 
      queryParams.has('confirmation_token') ||
      url.includes('type=signup') || 
      queryParams.get('type') === 'signup' ||
      url.includes('confirm') ||
      queryParams.has('token');
    
    if (hasConfirmationIndicators) {
      console.log('Detected confirmation indicators on Index page, redirecting to auth callback');
      navigate('/auth/callback' + location.search + location.hash);
    }
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="w-full">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
