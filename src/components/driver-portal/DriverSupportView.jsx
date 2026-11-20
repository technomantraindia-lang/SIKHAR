import React, { useState } from 'react';
import {
  Phone,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  FileText,
  Clock,
  Shield
} from '../common/Icons';

export default function DriverSupportView({ driverUser }) {
  const driver = driverUser || {};
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    setTicketSubmitted(true);
    setTicketSubject('');
    setTicketMsg('');
    setTimeout(() => setTicketSubmitted(false), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Red Alert SOS Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 60%, #450a0a 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        border: '1px solid rgba(248, 113, 113, 0.3)',
        boxShadow: '0 8px 24px rgba(153, 27, 27, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              background: '#ef4444',
              color: '#ffffff',
              padding: '3px 8px',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase'
            }}>
              🚨 24/7 Priority Emergency
            </span>
            <span style={{ color: '#fca5a5', fontSize: '12px' }}>
              Instant roadside and accident response
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 6px', color: '#ffffff' }}>
            Hub Helpdesk & Emergency Operations Center
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#fecaca', maxWidth: '600px' }}>
            For on-road vehicle breakdown, accident claim, battery charging help, or personal emergency, contact our dispatch marshals right now.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="tel:9818778654"
            style={{
              background: '#ffffff',
              color: '#991b1b',
              padding: '12px 20px',
              borderRadius: '9px',
              fontWeight: 850,
              fontSize: '14px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            <Phone size={16} />
            <span>Call Hub Hotline</span>
          </a>
        </div>
      </div>

      {/* Directory Cards */}
      <div className="driver-two-col-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        {/* Left: Contact Directory */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
            Direct Fleet Communications Directory
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { title: 'Gurgaon Central Terminal Dispatch', sub: 'Hub Operations Supervisor', phone: '+91 98187 78654', badge: 'Hub #1' },
              { title: 'Towing & Roadside Crane Recovery', sub: '24/7 Breakdown Recovery Unit', phone: '1800-102-4444', badge: 'Toll-Free' },
              { title: 'Fast-Charging Emergency Support', sub: 'EV Traction Battery / Charger Assistance', phone: '+91 98118 77654', badge: 'EV Team' },
              { title: 'Driver Dispute & Claims Desk', sub: 'Wallet, fines, toll reconciliation', phone: '+91 98101 88990', badge: 'Finance' },
              { title: 'Emergency Contact on Your Record', sub: 'Listed Next-of-Kin', phone: driver.kyc?.emergencyContact || '7986451320 (Brother)', badge: 'Kin' }
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '9px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>{c.title}</strong>
                    <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      {c.badge}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>{c.sub}</span>
                </div>

                <a
                  href={`tel:${c.phone.replace(/[^0-9]/g, '')}`}
                  style={{
                    padding: '6px 12px',
                    background: '#0284c7',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 750,
                    textDecoration: 'none'
                  }}
                >
                  Call
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Submit Request / Ticket */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
            Submit an Operations Assistance Ticket
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>
            Direct message to your operating yard fleet managers for fast resolution.
          </p>

          {ticketSubmitted && (
            <div style={{
              background: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: '8px',
              padding: '12px',
              color: '#15803d',
              fontSize: '12.5px',
              fontWeight: 700,
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} />
              <span>Ticket logged with ID #TCK-{Math.floor(1000 + Math.random() * 9000)}. Hub manager will call you within 15 minutes.</span>
            </div>
          )}

          <form onSubmit={handleSubmitTicket}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Issue Category *
              </label>
              <select
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  background: '#ffffff',
                  boxSizing: 'border-box'
                }}
                required
              >
                <option value="">Select ticket category...</option>
                <option value="Vehicle Mechanical / Battery">Vehicle Mechanical or Battery Charging Issue</option>
                <option value="Wallet Deduction Query">Wallet Rental Auto-Debit / Recharge Query</option>
                <option value="Shift or Attendance">Shift Timing or Attendance Adjustment</option>
                <option value="Document Renewal">Document / Licence Renewal Alert</option>
                <option value="Other">Other Yard Inquiries</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Detailed Message / Location Description *
              </label>
              <textarea
                value={ticketMsg}
                onChange={(e) => setTicketMsg(e.target.value)}
                rows={4}
                placeholder="Explain the issue, vehicle current location, or assistance required..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
                required
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '11px',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              Submit Ticket to Operations Desk
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
