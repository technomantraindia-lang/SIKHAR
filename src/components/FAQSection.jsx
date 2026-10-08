import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "What is SIKHAR and who is it built for?",
      a: "SIKHAR is an ultra-high performance cloud and intelligence orchestration platform designed for modern engineering teams, system architects, and high-growth tech companies requiring sub-millisecond reliability and AI-native workflows."
    },
    {
      q: "When will VIP Waitlist invites be distributed?",
      a: "Waitlist members will receive priority rollout invitations in weekly batches starting with Phase 4. Early subscribers also receive $500 in cloud credits and direct access to the engineering team's Discord."
    },
    {
      q: "Is SIKHAR compatible with existing Node.js and cloud infrastructure?",
      a: "Yes! SIKHAR provides drop-in SDKs and API connectors for Node.js, TypeScript, Go, and Python, compatible with AWS, GCP, Azure, and bare-metal environments."
    },
    {
      q: "Will there be a free tier for solo developers and open-source projects?",
      a: "Absolutely. SIKHAR will launch with a generous community tier that includes full access to core telemetry, CLI tools, and free monthly compute units for open-source contributors."
    },
    {
      q: "How can I request enterprise custom integrations or private VPC deployment?",
      a: "Enterprise teams can register using their corporate email on the waitlist or contact enterprise@sikhar.io for custom security audits and dedicated private VPC previews."
    }
  ];

  return (
    <section className="faq-section">
      <div className="section-header">
        <div className="section-tag">
          <span>GOT QUESTIONS?</span>
        </div>
        <h2 className="section-title">
          Frequently Asked <span className="gradient-text">Questions</span>
        </h2>
        <p className="section-subtitle">
          Everything you need to know about SIKHAR and our early access program.
        </p>
      </div>

      <div className="faq-list">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index} 
              className={`faq-item glass-card ${isOpen ? 'faq-item-open' : ''}`}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <div className="faq-question-row">
                <span className="faq-q-text">{faq.q}</span>
                <span className={`faq-toggle-icon ${isOpen ? 'rotate-180' : ''}`}>
                  <ChevronDown size={18} />
                </span>
              </div>
              {isOpen && (
                <div className="faq-answer-row">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
