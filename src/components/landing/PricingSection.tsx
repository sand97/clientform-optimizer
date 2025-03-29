
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For individuals and small businesses just getting started",
    features: [
      "Up to 5 document templates",
      "100 form submissions per month",
      "Basic field validation",
      "Email support",
      "PDF document generation"
    ],
    buttonText: "Get Started",
    buttonVariant: "outline",
    popular: false
  },
  {
    name: "Professional",
    price: "$29",
    period: "per month",
    description: "Perfect for growing businesses with more document needs",
    features: [
      "Up to 50 document templates",
      "1,000 form submissions per month",
      "Advanced field validation",
      "Priority email support",
      "Multiple document formats",
      "Form analytics dashboard",
      "Custom branding"
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "default",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations with complex document workflows",
    features: [
      "Unlimited document templates",
      "Unlimited form submissions",
      "Advanced validation with custom rules",
      "Dedicated support manager",
      "API access for integration",
      "Advanced security features",
      "Custom workflow automation",
      "Single sign-on (SSO)"
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline",
    popular: false
  }
];

const PricingSection = () => {
  return (
    <section id="pricing" className="section-padding bg-gray-50">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-gray-600">
            Choose the plan that's right for your business, from startups to enterprise
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`bg-white rounded-xl p-8 border ${
                plan.popular 
                  ? 'border-blue-500 shadow-lg shadow-blue-100' 
                  : 'border-gray-200 shadow-sm'
              } relative flex flex-col h-full`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-3xl md:text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-500 ml-2">{plan.period}</span>
                  )}
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>
              
              <div className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start">
                    <div className="mt-1 mr-3">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-auto">
                <Button 
                  variant={plan.buttonVariant as "default" | "outline"} 
                  className={`w-full py-6 ${
                    plan.popular 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : ''
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-white rounded-xl border border-gray-200 p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Need a custom solution?
              </h3>
              <p className="text-gray-600 mb-6">
                Our enterprise plan can be tailored to your specific requirements. Get in touch with our sales team to discuss your needs.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "Custom integrations with your existing systems",
                  "Advanced security requirements",
                  "Specialized document workflows",
                  "Volume discounts"
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <div className="mt-1 mr-3">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Button>
                Contact our sales team
              </Button>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <div className="text-lg font-medium text-gray-900 mb-3">
                Frequently Asked Questions
              </div>
              <div className="space-y-4">
                {[
                  {
                    q: "Can I upgrade or downgrade my plan later?",
                    a: "Yes, you can change your plan at any time. Changes take effect on your next billing cycle."
                  },
                  {
                    q: "Do I need technical knowledge to use FormFiller?",
                    a: "No, our platform is designed for non-technical users with an intuitive interface."
                  },
                  {
                    q: "Is there a long-term contract?",
                    a: "No, our paid plans are month-to-month with no long-term commitment required."
                  }
                ].map((faq, i) => (
                  <div key={i}>
                    <div className="font-medium text-gray-900 mb-1">{faq.q}</div>
                    <div className="text-gray-600 text-sm">{faq.a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
