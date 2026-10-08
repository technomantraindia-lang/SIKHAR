import React, { useState } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Layers, 
  Activity, 
  Terminal, 
  Globe2, 
  Code2, 
  Check, 
  Copy 
} from 'lucide-react';

export default function FeaturesPreview() {
  const [copied, setCopied] = useState(false);
  const installCmd = "npm install @sikhar/engine-client";

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const features = [
    {
      icon: <Cpu className="feat-icon text-cyan" />,
      tag: "PERFORMANCE",
      title: "Hyper-Threaded Neural Engine",
      desc: "Process multi-million event streams and neural execution pipelines with sub-5ms deterministic latency.",
      badge: "< 5ms latency",
    },
    {
      icon: <Layers className="feat-icon text-purple" />,
      tag: "ARCHITECTURE",
      title: "Autonomous Agent Orchestration",
      desc: "Spin up self-healing, coordinated worker clusters that adapt dynamically to traffic surges and workloads.",
      badge: "Auto-Scalable",
    },
    {
      icon: <ShieldCheck className="feat-icon text-emerald" />,
      tag: "SECURITY",
      title: "Zero-Trust Military Grade Security",
      desc: "End-to-end hardware-level enclave encryption, automated compliance scans, and fine-grained IAM policies.",
      badge: "SOC2 & ISO Ready",
    },
    {
      icon: <Activity className="feat-icon text-amber" />,
      tag: "OBSERVABILITY",
      title: "Deep Real-Time Telemetry",
      desc: "Granular execution traces, interactive vector query visualization, and automated anomaly resolution.",
      badge: "Real-time Metrics",
    },
    {
      icon: <Globe2 className="feat-icon text-blue" />,
      tag: "GLOBAL EDGE",
      title: "35+ Worldwide Edge Points",
      desc: "Deploy compute directly next to your users with synchronized state trees and lightning instant caching.",
      badge: "99.999% SLA",
    },
    {
      icon: <Terminal className="feat-icon text-pink" />,
      tag: "DEVELOPER FIRST",
      title: "One-Line Integration CLI",
      desc: "Effortless SDK bindings for Node.js, TypeScript, Python, and Go with automatic type safety.",
      badge: "Universal SDK",
    },
  ];

  return (
    <section className="features-section">
      <div className="section-header">
        <div className="section-tag">
          <span>THE SIKHAR ADVANTAGE</span>
        </div>
        <h2 className="section-title">
          Engineered for <span className="gradient-text">Extreme Scale</span>
        </h2>
        <p className="section-subtitle">
          Here is a preview of the architectural primitives powering the upcoming SIKHAR release.
        </p>
      </div>

      <div className="features-grid">
        {features.map((feat, index) => (
          <div key={index} className="feature-card glass-card">
            <div className="feature-card-header">
              <div className="feature-icon-container">
                {feat.icon}
              </div>
              <span className="feature-badge">{feat.badge}</span>
            </div>
            
            <div className="feature-tag-text">{feat.tag}</div>
            <h3 className="feature-title">{feat.title}</h3>
            <p className="feature-desc">{feat.desc}</p>
            
            <div className="feature-bottom-glow" />
          </div>
        ))}
      </div>

      {/* Developer CLI Sneak Peek Banner */}
      <div className="cli-sneak-peek glass-card">
        <div className="cli-info">
          <div className="cli-icon-title">
            <Code2 size={20} className="text-cyan" />
            <span className="cli-heading">Get Ready with the SIKHAR CLI Preview</span>
          </div>
          <p className="cli-sub">
            Prepare your environments ahead of time. Available on npm, yarn, and pnpm.
          </p>
        </div>

        <div className="cli-terminal-box">
          <span className="cli-prompt">$</span>
          <code className="cli-code">{installCmd}</code>
          <button 
            className="cli-copy-btn" 
            onClick={handleCopy}
            title="Copy command"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
