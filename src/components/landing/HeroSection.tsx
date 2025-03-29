
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="pt-36 md:pt-32 pb-24 md:pb-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="site-container">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 md:space-y-8 lg:pr-12 animate-fade-in">
              <h1 className="text-5xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Smart forms that <span className="text-blue-500">simplify</span> document collection
              </h1>
              <p className="text-xl text-gray-600 md:pr-8">
                Collect accurate client information with validation, automatically fill documents, and improve user experience for web and mobile.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Button size="lg" className="text-md px-8 py-6">
                  Start for free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-md px-8 py-6">
                  Book a demo
                </Button>
              </div>
              <div className="text-sm text-gray-500 pt-2">
                No credit card required. Free plan available.
              </div>
            </div>
            
            <div className="relative lg:pl-8 animate-fade-in-up">
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-5 md:p-8 relative z-10">
                <div className="border-b pb-4 mb-6">
                  <h3 className="text-lg font-medium">Client Information Form</h3>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md h-10 px-3 flex items-center text-gray-800">
                      John Smith
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md h-10 px-3 flex items-center text-gray-800">
                      john@example.com
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-green-600">Validation in progress...</span>
                  </div>
                  <div className="pt-3">
                    <Button className="w-full">Continue</Button>
                  </div>
                </div>
              </div>
              
              <div className="hidden md:block absolute -bottom-10 -right-8 bg-blue-500 w-40 h-40 rounded-lg opacity-30 blur-3xl"></div>
              <div className="hidden md:block absolute top-10 -left-10 bg-blue-300 w-32 h-32 rounded-full opacity-30 blur-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
