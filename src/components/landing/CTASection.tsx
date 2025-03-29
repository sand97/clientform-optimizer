import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
const CTASection = () => {
  return <section className="section-padding bg-white">
      <div className="site-container">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl px-6 py-12 md:p-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to transform your document collection process?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of businesses that are saving time and reducing errors with FormFiller.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg">
                Start your free trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white px-8 py-6 text-lg text-white bg-blue-600 hover:bg-blue-500">
                Book a demo
              </Button>
            </div>
            <p className="text-blue-100 mt-6">
              No credit card required. 14-day free trial.
            </p>
          </div>
        </div>
      </div>
    </section>;
};
export default CTASection;