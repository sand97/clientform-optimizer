
import React from 'react';
import { Facebook, Twitter, Linkedin, Mail, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="site-container">
        <div className="container mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="text-2xl font-bold text-white mb-4">
                Form<span className="text-blue-400">Filler</span>
              </div>
              <p className="mb-6 text-gray-400 max-w-md">
                Transform how you collect client information and fill documents with our innovative platform.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <div className="grid grid-cols-2 gap-2">
                <ul className="space-y-3">
                  {["Features", "How It Works", "Pricing"].map((item, i) => (
                    <li key={i}>
                      <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-3">
                  {["Enterprise", "Security", "Updates"].map((item, i) => (
                    <li key={i}>
                      <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <div className="grid grid-cols-2 gap-2">
                <ul className="space-y-3">
                  {["Documentation", "Guides", "API Reference"].map((item, i) => (
                    <li key={i}>
                      <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-3">
                  {["Blog", "Support", "Training"].map((item, i) => (
                    <li key={i}>
                      <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <div className="grid grid-cols-2 gap-2">
                <ul className="space-y-3">
                  {["About Us", "Careers", "Contact"].map((item, i) => (
                    <li key={i}>
                      <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-3">
                  {["Privacy Policy", "Terms of Service", "Legal"].map((item, i) => (
                    <li key={i}>
                      <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} FormFiller. All rights reserved.
              </p>
            </div>
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-6">
              <div className="flex items-center text-sm text-gray-500">
                <Mail className="h-4 w-4 mr-2" />
                contact@formfiller.com
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="h-4 w-4 mr-2" />
                +1 (555) 123-4567
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
