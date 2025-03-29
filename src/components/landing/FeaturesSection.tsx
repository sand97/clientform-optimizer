
import React from 'react';
import { Check, FileCog, FilePen, FileCheck, MoveRight, UserCheck, Monitor, Timer, RefreshCw } from 'lucide-react';

const features = [
  {
    icon: <UserCheck className="h-6 w-6 text-blue-500" />,
    title: "Smart Validation",
    description: "Validate emails, phone numbers, and other data in real-time as clients fill forms to ensure accuracy."
  },
  {
    icon: <Monitor className="h-6 w-6 text-blue-500" />,
    title: "Mobile Optimized",
    description: "Beautiful, responsive forms that are easy to use on any device, especially mobile phones."
  },
  {
    icon: <FileCog className="h-6 w-6 text-blue-500" />,
    title: "Automatic Document Generation",
    description: "Instantly create filled PDFs and other documents with collected information."
  },
  {
    icon: <Timer className="h-6 w-6 text-blue-500" />,
    title: "Save Processing Time",
    description: "Reduce manual data entry and processing time by up to 90% with automated workflows."
  },
  {
    icon: <RefreshCw className="h-6 w-6 text-blue-500" />,
    title: "Seamless Corrections",
    description: "Allow users to easily correct form errors without starting over, highlighting only fields that need fixes."
  },
  {
    icon: <FileCheck className="h-6 w-6 text-blue-500" />,
    title: "Document Preservation",
    description: "Keep your existing document processes while improving the front-end experience for clients."
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="section-padding bg-white">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Features designed to improve your workflow
          </h2>
          <p className="text-lg text-gray-600">
            Our platform helps businesses collect accurate information from clients while maintaining their existing document workflows.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="p-6 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-blue-50 rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
            <div className="md:col-span-3">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Preserve your existing processes
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                No need to completely overhaul your systems. FormFiller works with your existing document templates and workflows.
              </p>
              <ul className="space-y-3">
                {[
                  "Keep using your existing document templates",
                  "Integrate with your current systems",
                  "No need for expensive software changes",
                  "Gradual implementation for minimal disruption"
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <div className="mt-1 mr-3">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <a 
                  href="#how-it-works" 
                  className="text-blue-600 font-medium inline-flex items-center hover:text-blue-700"
                >
                  Learn how it works
                  <MoveRight className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="relative">
                <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-5">
                  <div className="flex items-center mb-4">
                    <FilePen className="h-6 w-6 text-blue-500 mr-3" />
                    <h4 className="font-medium">Your existing documents</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="h-8 bg-gray-100 rounded w-full"></div>
                    <div className="h-8 bg-gray-100 rounded w-full"></div>
                    <div className="h-8 bg-gray-100 rounded w-3/4"></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Compatible with your templates</span>
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </div>
                <div className="hidden md:block absolute -bottom-4 -right-4 bg-blue-100 w-full h-full rounded-lg -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
