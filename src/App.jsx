import React, { useRef } from 'react';
import './App.css';
import ParticleBackground from './components/ParticleBackground';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeaturesPreview from './components/FeaturesPreview';
import Roadmap from './components/Roadmap';
import FAQSection from './components/FAQSection';
import Footer from './components/Footer';

function App() {
  const waitlistRef = useRef(null);

  const handleScrollToWaitlist = () => {
    if (waitlistRef.current) {
      waitlistRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const emailInput = document.getElementById('waitlist-email-input');
      if (emailInput) {
        setTimeout(() => emailInput.focus(), 500);
      }
    }
  };

  return (
    <div className="app-wrapper">
      {/* Background Ambience & Canvas Grid */}
      <div className="grid-bg" />
      <ParticleBackground />

      {/* Navigation */}
      <Navbar onScrollToWaitlist={handleScrollToWaitlist} />

      {/* Main Landing Page Content */}
      <main className="main-content">
        <Hero waitlistRef={waitlistRef} />
        <div id="features">
          <FeaturesPreview />
        </div>
        <div id="roadmap">
          <Roadmap />
        </div>
        <div id="faq">
          <FAQSection />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
