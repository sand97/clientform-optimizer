
import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "HR Director",
    company: "Global Services Inc.",
    content: "FormFiller has completely transformed our onboarding process. What used to take days now happens in minutes, and our team can focus on more important tasks instead of chasing paperwork.",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Operations Manager",
    company: "Innovative Solutions",
    content: "Our clients love how easy it is to fill out forms on their phones. The validation features have reduced errors by over 85%, saving us countless hours of back-and-forth communication.",
    rating: 5
  },
  {
    name: "Olivia Rodriguez",
    role: "Customer Service Lead",
    company: "Speedy Insurance",
    content: "We were hesitant to change our document processes, but FormFiller made it painless. We kept all our existing templates and workflows while giving our customers a much better experience.",
    rating: 5
  }
];

const TestimonialsSection = () => {
  return (
    <section className="section-padding bg-white">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by businesses of all sizes
          </h2>
          <p className="text-lg text-gray-600">
            See what our customers have to say about how FormFiller has improved their document workflows
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-gray-50 border border-gray-100 rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4">
                <Quote className="h-10 w-10 text-blue-200" />
              </div>
              <div className="flex mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
              <div className="mt-auto">
                <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-blue-500 text-white rounded-2xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Join hundreds of satisfied customers
          </h3>
          <p className="text-xl text-blue-50 mb-8 max-w-2xl mx-auto">
            Transform your client information collection process and start saving time and reducing errors today.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 max-w-3xl mx-auto text-center">
            {[
              { metric: "95%", description: "Reduction in form errors" },
              { metric: "85%", description: "Less time spent on data entry" },
              { metric: "3x", description: "Faster document completion" },
              { metric: "99%", description: "Customer satisfaction" }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.metric}</div>
                <p className="text-blue-100">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
