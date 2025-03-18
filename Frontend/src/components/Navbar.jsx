import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [nav, setNav] = useState(false);
  const [currentSection, setCurrentSection] = useState('hero');
  const navigate = useNavigate();
  
  const handleNav = () => {
    setNav(!nav);
  };

  useEffect(() => {
    // Function to determine which section is currently in view
    const handleScroll = () => {
      const sections = [
        { id: 'hero', element: document.querySelector('.hero-section') },
        { id: 'stats', element: document.querySelector('.stats-section') },
        { id: 'mission', element: document.querySelector('.mission-section') },
        { id: 'how-it-works', element: document.querySelector('.how-it-works-section') },
        { id: 'features', element: document.querySelector('.features-section') },
        { id: 'testimonials', element: document.querySelector('.testimonials-section') },
        { id: 'faq', element: document.querySelector('.faq-section') },
        { id: 'cta', element: document.querySelector('.cta-section') },
        { id: 'footer', element: document.querySelector('.footer-section') }
      ];

      const scrollPosition = window.scrollY + 100; // Adding offset for navbar height

      for (const section of sections) {
        if (!section.element) continue;
        
        const sectionTop = section.element.offsetTop;
        const sectionHeight = section.element.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setCurrentSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Function to determine navbar background based on current section
  const getNavbarStyle = () => {
    switch (currentSection) {
      case 'hero':
        return 'bg-transparent'; // Transparent for hero section
      case 'mission':
        return 'bg-[#fdc3c2] text-white'; // Pink background for mission section
      case 'how-it-works':
        return 'bg-[#ffc595] text-white'; // Pink background for how-it-works section
      case 'cta':
        return 'bg-[#fdc3c2] text-white'; // Pink background for CTA section
      case 'features':
        return 'bg-[#fdc3c2] text-white'; // Pink background for features section
      case 'testimonials':
        return 'bg-[#ffc595] text-white'; // Pink background for testimonials section
      default:
        return window.scrollY > 50 ? 'bg-white shadow-md' : 'bg-transparent'; // Default behavior
    }
  };

  return (
    <div className={`fixed w-full z-50 transition-all duration-300 ${getNavbarStyle()}`}>
      <div className='flex justify-between items-center w-full h-26 px-4'>
        <div className='flex-1'></div> 
        <div className='flex justify-center flex-1'>
          <img src="src/assets/chowpal_logo.png" alt="ChowPal Logo" width={140} />
        </div>
        <div className='flex justify-end items-center flex-1 gap-2'>
          <span className={`font-medium  text-5xl ${
            currentSection === 'footer' || currentSection === 'stats' || currentSection === 'cta' 
              ? 'text-white' 
              : 'text-black'
          }`} style={{ fontFamily: 'Pacifico, cursive' }}>
            Login
          </span>
          <button
            onClick={() => navigate("/login")}
            className="rounded-lg transition-all"
          >
            <img src="src/assets/restaurant_icon.png" alt="Login Icon" width={140} height={100} />
          </button>
          <button
            onClick={() => navigate("/login")}
            className="rounded-lg transition-all"
          >
            <img src="src/assets/user.png" alt="Login Icon" width={85} height={100} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
