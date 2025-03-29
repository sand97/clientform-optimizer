
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-500">
              Form<span className="text-gray-800">Filler</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-500 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-blue-500 transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-500 transition-colors">
              Pricing
            </a>
            <div className="flex space-x-2">
              {user ? (
                <>
                  <Button variant="outline" className="mr-1" as={Link} to="/dashboard">
                    Dashboard
                  </Button>
                  <Button variant="ghost" onClick={handleLogout}>Log out</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="mr-1" as={Link} to="/auth/login">
                    Log in
                  </Button>
                  <Button as={Link} to="/auth/register">Get Started</Button>
                </>
              )}
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-blue-500 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-gray-200 mt-2">
            <div className="flex flex-col space-y-4">
              <a 
                href="#features" 
                className="text-gray-600 hover:text-blue-500 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className="text-gray-600 hover:text-blue-500 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </a>
              <a 
                href="#pricing" 
                className="text-gray-600 hover:text-blue-500 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              <div className="flex flex-col space-y-3 pt-3">
                {user ? (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      as={Link} 
                      to="/dashboard" 
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full" 
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                    >
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      as={Link} 
                      to="/auth/login" 
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Log in
                    </Button>
                    <Button 
                      className="w-full" 
                      as={Link} 
                      to="/auth/register" 
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
