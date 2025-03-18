import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import Navbar from '../components/Navbar';
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const [navScrolled, setNavScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();
  
  // Handle page load and initial animations
  useEffect(() => {
    const loaderTimeout = setTimeout(() => {
      setIsLoaded(true);
      const progressInterval = setInterval(() => {
        setAnimationProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 1;
        });
      }, 15);
      return () => clearInterval(progressInterval);
    }, 800);

  
    
    // Handle scroll event for navbar
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setNavScrolled(true);
      } else {
        setNavScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(loaderTimeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Toggle accordion
  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  // Testimonial data
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Food Blogger",
      image: "src/assets/testimonial1.jpg",
      quote: "ChowPal completely changed how I experience dining out. I've met amazing people and discovered restaurants I never would have found on my own!"
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Tech Professional",
      image: "src/assets/testimonial2.jpg",
      quote: "As someone who travels frequently for work, ChowPal has been a lifesaver. No more eating alone in hotel restaurants!"
    },
    {
      id: 3,
      name: "Priya Patel",
      role: "Graduate Student",
      image: "src/assets/testimonial3.jpg",
      quote: "Moving to a new city for school was intimidating, but ChowPal helped me make friends and explore the local food scene."
    }
  ];

  // FAQ data
  const faqs = [
    {
      question: "How does ChowPal work?",
      answer: "ChowPal matches you with dining companions based on your food preferences, schedule, and location. Create a profile, set your preferences, and start connecting with potential dining partners in your area."
    },
    {
      question: "Is ChowPal free to use?",
      answer: "ChowPal offers a free basic membership with limited matches per month. Our premium membership provides unlimited matches, advanced filtering options, and exclusive restaurant deals."
    },
    {
      question: "How do you ensure user safety?",
      answer: "We take safety seriously. All users go through a verification process, and we have a comprehensive reporting system. We recommend meeting in public places and following our safety guidelines."
    },
    {
      question: "Can I use ChowPal when traveling?",
      answer: "Absolutely! ChowPal is perfect for travelers. Simply update your location in the app, and you'll be matched with locals and fellow travelers in your destination."
    },
    {
      question: "Are there dietary restriction options?",
      answer: "Yes, we have extensive dietary preference settings. You can specify allergies, restrictions, and preferences like vegetarian, vegan, gluten-free, kosher, halal, and many more."
    }
  ];

  // Function to trigger navigation with loading screen
  const handleNavigation = (path) => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate(path);
    }, 1000); // Adjust delay for animation smoothness
  };

  return (
    <div className="landing-page">
      {/* Loading Overlay */}
      <div className={`loading-overlay ${isLoaded ? 'fade-out' : ''}`}>
        <div className="loading-content">
          <img src="src/assets/chowpal_logo.png" alt="ChowPal Logo" className="loading-favicon"/>
          <div className={`loading-logo ${isLoaded ? 'fade-in' : ''}`}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col min-h-screen">
        <Navbar scrolled={navScrolled} />
        
        {/* Hero Section */}
<section className="hero-section relative min-h-screen flex items-center justify-center">
  {/* Full-screen background image */}
  <div className="absolute inset-0 w-full h-full">
    <img 
      src="src/assets/chowpal_hero.png" 
      alt="ChowPal Hero" 
      className="w-full h-full object-cover"
      onError={(e) => {
        console.error("Image failed to load");
        e.target.style.display = 'none';
      }}
    />
  </div>
  
  <div className="container mx-auto px-4 relative z-10 text-center">
    <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg">ChowPal</h1>
    <p className="text-2xl md:text-4xl font-medium text-white mb-8 drop-shadow-lg">Want to Chow with a Pal?</p>
    <p className="text-lg md:text-xl text-white mb-8 drop-shadow-lg">
      Connect with like-minded food lovers, discover new restaurants, and never eat alone again!
    </p>
    <button
      onClick={() => navigate("/register")}
      className="px-10 py-4 bg-[#fdc3c2] text-white text-xl font-semibold rounded-full hover:bg-[#fc9796] transition duration-300 shadow-lg"
    >
      Get Started
    </button>
  </div>
</section>
        
        {/* Mission Section */}
        <section className="mission-section py-20 bg-[#fdc3c2] text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Our Mission</h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                At ChowPal, we believe no one should eat alone. Our mission is to connect food lovers, 
                reduce isolation, and create meaningful connections through shared meals. Whether you're 
                new to town, looking to expand your social circle, or just don't want to dine alone, 
                ChowPal makes it easy to find companions who share your taste in food and conversation.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We're passionate about building community through culinary experiences. Food has always 
                brought people together, and we're using technology to make these connections more 
                accessible than ever before.
              </p>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="how-it-works-section py-20 bg-[#ffc595]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-16 text-center text-gray-800">How It Works</h2>
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="step-card text-center md:w-1/4 mb-12 md:mb-0">
                <div className="step-number bg-white text-black w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">1</div>
                <h3 className="text-xl font-semibold mb-4">Create Your Profile</h3>
                <p className="text-gray-600">Share your food preferences, dietary restrictions, and dining schedule.</p>
              </div>
              <div className="hidden md:block text-black text-4xl">→</div>
              <div className="step-card text-center md:w-1/4 mb-12 md:mb-0">
                <div className="step-number bg-white text-black w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">2</div>
                <h3 className="text-xl font-semibold mb-4">Find Matches</h3>
                <p className="text-gray-600">Browse potential dining companions based on shared interests and availability.</p>
              </div>
              <div className="hidden md:block text-black text-4xl">→</div>
              <div className="step-card text-center md:w-1/4">
                <div className="step-number bg-white text-black w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">3</div>
                <h3 className="text-xl font-semibold mb-4">Schedule a Meal</h3>
                <p className="text-gray-600">Pick a restaurant, set a date, and enjoy good food with good company!</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="features-section py-20 bg-[#fdc3c2]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-16 text-center text-gray-800">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Feature Card 1 */}
              <div className="feature-card bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition duration-300">
                <div className="icon-wrapper mb-6 mx-auto bg-orange-100 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                  <span className="text-4xl text-[#fdc3c2]">👥</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">Find Dining Partners</h3>
                <p className="text-gray-600">
                  Match with people who share your food preferences and dining schedule. 
                  Filter by cuisine, dietary restrictions, and more to find your perfect dining companion.
                </p>
              </div>
              
              {/* Feature Card 2 */}
              <div className="feature-card bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition duration-300">
                <div className="icon-wrapper mb-6 mx-auto bg-orange-100 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                  <span className="text-4xl text-[#fdc3c2]">📅</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">Schedule Meals</h3>
                <p className="text-gray-600">
                  Set up lunch dates, dinner outings, or coffee meetups with ease. 
                  Our calendar makes scheduling and managing your meal plans simple and hassle-free.
                </p>
              </div>
              
              {/* Feature Card 3 */}
              <div className="feature-card bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition duration-300">
                <div className="icon-wrapper mb-6 mx-auto bg-orange-100 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                  <span className="text-4xl text-[#fdc3c2]">📍</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">Discover Restaurants</h3>
                <p className="text-gray-600">
                  Find new places to eat and explore recommendations from your matches. 
                  Save your favorites and build a personal dining wishlist for future adventures.
                </p>
              </div>

              {/* Feature Card 4 */}
              <div className="feature-card bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition duration-300">
                <div className="icon-wrapper mb-6 mx-auto bg-orange-100 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                  <span className="text-4xl text-[#fdc3c2]">💬</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">Chat Function</h3>
                <p className="text-gray-600">
                  You can chat with your dining partners directly in the app using our encrypted messaging system.
                </p>
              </div>

              {/* Feature Card 5 */}
              <div className="feature-card bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition duration-300">
                <div className="icon-wrapper mb-6 mx-auto bg-orange-100 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                  <span className="text-4xl text-[#fdc3c2]">🗺️</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">Interactive Map</h3>
                <p className="text-gray-600">
                  Explore restaurants near you with our interactive map feature. 
                  See where your matches are dining and discover hidden gems in your area.
                </p>
              </div>

              {/* Feature Card 6 */}
              <div className="feature-card bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition duration-300">
                <div className="icon-wrapper mb-6 mx-auto bg-orange-100 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                  <span className="text-4xl text-[#fdc3c2]">🏬</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">Restaurant registration</h3>
                <p className="text-gray-600">
                  Restaurants can register on our platform and offer exclusive deals to our users.
                </p>
              </div>

            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="testimonials-section py-20 bg-[#ffc595]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-16 text-center text-gray-800">What Our Users Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map(testimonial => (
                <div key={testimonial.id} className="testimonial-card bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                      <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                      <p className="text-gray-600 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">"{testimonial.quote}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="faq-section py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-16 text-center text-gray-800">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto">
              {faqs.map((faq, index) => (
                <div key={index} className="mb-4">
                  <button
                    className="flex justify-between items-center w-full p-4 bg-white rounded-lg shadow-md focus:outline-none"
                    onClick={() => toggleAccordion(index)}
                  >
                    <span className="text-lg font-medium text-gray-800">{faq.question}</span>
                    <span className="text-[#fdc3c2] text-xl">
                      {activeAccordion === index ? '−' : '+'}
                    </span>
                  </button>
                  {activeAccordion === index && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="cta-section py-20 bg-[#fdc3c2] text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Find Your ChowPal?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of food lovers who are connecting, sharing meals, and creating memories together.
        </p>
        <button
          onClick={() => navigate("/register")}
          className="px-8 py-3 bg-white text-[#fdc3c2] font-semibold rounded-full hover:bg-gray-100 transition duration-300 shadow-md inline-block"
        >
          Sign up now
        </button>
      </div>
    </section>
        
        {/* Footer with Contact Form */}
        <footer className="footer-section py-16 bg-gray-800 text-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Company Info */}
              <div className="company-info">
                <img 
                  src="src/assets/chowpal_logo.png" 
                  alt="ChowPal Logo" 
                  className="h-40 justify-center mb-6"
                />
                <p className="text-gray-400 mb-6">
                  ChowPal is the leading platform for connecting food lovers for shared dining experiences.
                </p>
                <div className="social-links flex space-x-4">
                  <a href="#" className="bg-gray-700 p-2 rounded-full hover:bg-[#fdc3c2] transition duration-300 w-8 h-8 flex items-center justify-center">
                    <span>f</span>
                  </a>
                  <a href="#" className="bg-gray-700 p-2 rounded-full hover:bg-[#fdc3c2] transition duration-300 w-8 h-8 flex items-center justify-center">
                    <span>t</span>
                  </a>
                  <a href="#" className="bg-gray-700 p-2 rounded-full hover:bg-[#fdc3c2] transition duration-300 w-8 h-8 flex items-center justify-center">
                    <span>i</span>
                  </a>
                </div>
              </div>
              
              {/* Quick Links */}
              <div className="quick-links">
                <h3 className="text-xl font-bold mb-6">Quick Links</h3>
                <ul className="space-y-3">
                  <li><Link to="/about" className="text-gray-400 hover:text-white transition duration-300">About Us</Link></li>
                  <li><Link to="/how-it-works" className="text-gray-400 hover:text-white transition duration-300">How It Works</Link></li>
                  <li><Link to="/pricing" className="text-gray-400 hover:text-white transition duration-300">Pricing</Link></li>
                  <li><Link to="/privacy" className="text-gray-400 hover:text-white transition duration-300">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="text-gray-400 hover:text-white transition duration-300">Terms of Service</Link></li>
                </ul>
              </div>
              
              {/* Contact Form */}
              <div className="contact-form">
                <h3 className="text-xl font-bold mb-6">Contact Us</h3>
                <form className="space-y-4">
                  <div>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-gray-700 rounded-md text-white" 
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <input 
                      type="email" 
                      className="w-full p-3 bg-gray-700 rounded-md text-white" 
                      placeholder="Your Email"
                    />
                  </div>
                  <div>
                    <textarea 
                      rows="4" 
                      className="w-full p-3 bg-gray-700 rounded-md text-white" 
                      placeholder="Your Message"
                    ></textarea>
                  </div>
                  <button 
                    type="submit" 
                    className="flex items-center justify-center w-full p-3 bg-[#fdc3c2] text-white font-medium rounded-md hover:bg-orange-600 transition duration-300"
                  >
                    Send Message
                    <span className="ml-2">➤</span>
                  </button>
                </form>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-700 text-center">
              <p className="text-gray-400">&copy; {new Date().getFullYear()} ChowPal. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
