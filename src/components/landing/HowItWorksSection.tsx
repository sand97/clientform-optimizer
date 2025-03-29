
import React from 'react';
import { FileText, ArrowRight, FormInput, FileCheck, Send } from 'lucide-react';

const steps = [
  {
    icon: <FileText className="h-8 w-8 text-blue-500" />,
    title: "Upload your document template",
    description: "Upload your existing PDF or document template that needs to be filled with client information."
  },
  {
    icon: <FormInput className="h-8 w-8 text-blue-500" />,
    title: "Create your smart form",
    description: "Design a user-friendly web form that captures all the information needed for your document."
  },
  {
    icon: <Send className="h-8 w-8 text-blue-500" />,
    title: "Share with your clients",
    description: "Send your clients a link to fill out the form on any device with real-time validation."
  },
  {
    icon: <FileCheck className="h-8 w-8 text-blue-500" />,
    title: "Get completed documents",
    description: "Automatically receive filled documents when clients submit their information."
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="section-padding bg-gray-50">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How FormFiller Works
          </h2>
          <p className="text-lg text-gray-600">
            A simple four-step process to transform how you collect information and fill documents
          </p>
        </div>
        
        <div className="relative">
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-blue-100 -translate-y-1/2 z-0"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
                  <div className="mb-4 flex justify-between items-center">
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                      {step.icon}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="md:hidden">
                        <ArrowRight className="h-5 w-5 text-blue-300" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="text-gray-600 flex-grow">{step.description}</p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-20">
                    <div className="bg-white rounded-full p-1 border border-blue-100">
                      <ArrowRight className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-16 md:mt-20 text-center">
          <p className="text-lg text-gray-700 mb-6 max-w-3xl mx-auto">
            Start improving your document workflows today with our easy-to-use platform. No coding required.
          </p>
          <a 
            href="#pricing" 
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            Get started today
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
