
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

  // Enhanced detection of confirmation links
  useEffect(() => {
    // Log all the information for debugging
    console.log('Current URL:', window.location.href);
    console.log('Search params:', location.search);
    console.log('Hash:', location.hash);
    
    const url = window.location.href;
    const queryParams = new URLSearchParams(location.search);
    
    // More comprehensive checks for confirmation indicators
    const hasConfirmationIndicators = 
      url.includes('confirmation_token') || 
      queryParams.has('confirmation_token') ||
      url.includes('type=signup') || 
      queryParams.get('type') === 'signup' ||
      url.includes('confirm') ||
      url.includes('verify') ||
      queryParams.has('token') ||
      url.includes('token=');
    
    if (hasConfirmationIndicators) {
      console.log('Detected confirmation indicators on Index page, redirecting to auth callback');
      // Redirect with all possible parameters
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
