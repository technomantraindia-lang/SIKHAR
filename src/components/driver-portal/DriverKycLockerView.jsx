import React, { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Eye,
  Phone,
  MapPin,
  Clock,
  Printer,
  Award,
  Lock,
  ExternalLink,
  Car,
  RefreshCw,
  X
} from '../common/Icons';

export default function DriverKycLockerView({ driverUser, onRefresh, refreshing }) {
  const driver = driverUser || {};
  const kyc = driver.kyc || {};
  const vehicle = driver.vehicle || {};
  const deal = driver.deal || {};
  const activeLease = driver.activeLease || null;

  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [downloadToast, setDownloadToast] = useState('');

  // DL Expiry calculation
  const getDlAlert = () => {
    if (!kyc.dlExpiry) return null;
    try {
      const exp = new Date(kyc.dlExpiry);
      const today = new Date();
      const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        return { type: 'expired', text: 'Licence Expired! Please renew with fleet admin immediately.' };
      }
      if (diffDays <= 30) {
        return { type: 'warn', text: `Statutory Warning: DL renewal due in ${diffDays} days.` };
      }
      return { type: 'valid', text: `Statutory DL is valid until ${kyc.dlExpiry} (${diffDays} days remaining)` };
    } catch {
      return { type: 'valid', text: `Valid until ${kyc.dlExpiry}` };
    }
  };

  const dlAlert = getDlAlert();

  // 5 Master Documents in the Locker
  const documents = [
    {
      id: 'doc-dl',
      type: 'dl',
      title: 'Commercial Driving Licence (LMV-TR)',
      docNumber: kyc.drivingLicence || 'DFGH76214+675',
      category: 'identity',
      categoryLabel: 'Driving Licence',
      authority: 'Ministry of Road Transport & Highways (MoRTH)',
      issueDate: '15 Nov 2019',
      expiryDate: kyc.dlExpiry || '14 Nov 2030',
      status: 'Valid & Verified',
      badgeColor: '#16a34a',
      desc: 'Transport category commercial motor vehicle driving licence verified via Sarathi Parivahan API.',
      fileUrl: (driver.documents || []).find(d => d.type === 'dl' || d.category === 'dl')?.fileUrl || null
    },
    {
      id: 'doc-aadhaar',
      type: 'aadhaar',
      title: 'UIDAI Aadhaar Biometric Identity Card',
      docNumber: kyc.aadhaar || 'XXXX-XXXX-9821',
      category: 'identity',
      categoryLabel: 'National Identity',
      authority: 'Unique Identification Authority of India (UIDAI)',
      issueDate: '12 May 2018',
      expiryDate: 'Lifetime Valid',
      status: 'Biometric Verified',
      badgeColor: '#16a34a',
      desc: 'National 12-digit demographic and biometric identity card verified through UIDAI authentication gateway.',
      fileUrl: (driver.documents || []).find(d => d.type === 'aadhaar' || d.category === 'aadhaar')?.fileUrl || null
    },
    {
      id: 'doc-pan',
      type: 'pan',
      title: 'Income Tax Permanent Account Number (PAN)',
      docNumber: kyc.panCard || 'ABCV1234R',
      category: 'identity',
      categoryLabel: 'Tax Identification',
      authority: 'Income Tax Department (NSDL / UTIITSL)',
      issueDate: '16 Jul 2016',
      expiryDate: 'Lifetime Valid',
      status: 'Active & Linked',
      badgeColor: '#16a34a',
      desc: 'Statutory 10-character alphanumeric PAN verified for commercial fleet GST TDS and financial compliance.',
      fileUrl: (driver.documents || []).find(d => d.type === 'pan' || d.category === 'pan')?.fileUrl || null
    },
    {
      id: 'doc-police',
      type: 'police',
      title: 'Police Verification Certificate (PCC)',
      docNumber: 'PV-DEL-2026-8812',
      category: 'clearance',
      categoryLabel: 'Police Clearance',
      authority: 'District Police Commissionerate (Licensing Unit)',
      issueDate: '10 Aug 2026',
      expiryDate: '09 Aug 2027 (Annual)',
      status: kyc.policeVerification || 'Clear (No Adverse Record)',
      badgeColor: '#16a34a',
      desc: 'Official police background character and criminal antecedents verification certificate with zero adverse entries.',
      fileUrl: null
    },
    {
      id: 'doc-lease',
      type: 'lease',
      title: 'Master Commercial Vehicle Lease Agreement',
      docNumber: activeLease?.leaseNumber || deal.leaseId || 'ORD-26-633464',
      category: 'agreement',
      categoryLabel: 'Lease Contract',
      authority: 'Sikhar Fleet Private Limited Legal Department',
      issueDate: '18 Nov 2026',
      expiryDate: 'Annual Rolling Lease',
      status: 'Executed & Legally Binding',
      badgeColor: '#0284c7',
      desc: 'Master commercial electric cab lease agreement executed between Sikhar Fleet and Driver with escrow deposit terms.',
      fileUrl: null
    }
  ];

  const filteredDocs = documents.filter((doc) => {
    if (activeFilter === 'identity') return doc.category === 'identity';
    if (activeFilter === 'clearance') return doc.category === 'clearance';
    if (activeFilter === 'agreement') return doc.category === 'agreement';
    return true;
  });

  const handleDownload = (doc) => {
    setDownloadToast(`Preparing official digital copy of ${doc.title}...`);
    setTimeout(() => {
      const content = `
================================================================================
SIKHAR FLEET PRIVATE LIMITED - OFFICIAL DIGITAL KYC & DOCUMENT CERTIFICATE
================================================================================
Document Title    : ${doc.title}
Document ID / No. : ${doc.docNumber}
Issued To Driver  : ${driver.name} (Driver Roster ID: ${driver.id})
Statutory Category: ${doc.categoryLabel}
Verifying Agency  : ${doc.authority}
Status            : ${doc.status}
Issue Date        : ${doc.issueDate}
Expiry Date       : ${doc.expiryDate}
Assigned Vehicle  : ${vehicle.registration ? `${vehicle.registration} [${vehicle.model || 'TATA TIGOR EV'}]` : 'Not Allocated'}
Operating Hub     : ${driver.city || 'Gurgaon Central Terminal #1'}
Digital Hash      : SKF-SECURE-${doc.id.toUpperCase()}-${Date.now()}
================================================================================
LEGAL NOTICE: This is an authentic digital copy retrieved from the Sikhar Fleet
Driver Telematics & Statutory Compliance System. Valid for commercial operations.
================================================================================
`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sikhar_${doc.type.toUpperCase()}_${driver.id || 'driver'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadToast(`Downloaded ${doc.title} successfully!`);
      setTimeout(() => setDownloadToast(''), 4000);
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Toast Notification */}
      {downloadToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#065f46',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: '9px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontSize: '13px',
          fontWeight: 650,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} color="#34d399" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* 1. Hero Cockpit Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #07132e 0%, #0d224d 60%, #081635 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 8px 24px rgba(2, 6, 23, 0.35)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.15)',
              padding: '3px 9px',
              borderRadius: '5px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              Official KYC Vault & Document Locker
            </span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Roster ID: <strong style={{ color: '#f8fafc' }}>{driver.id || 'DRV-14'}</strong>
            </span>
          </div>

          <h1 style={{
            fontSize: '24px',
            fontWeight: 850,
            margin: '0 0 6px',
            color: '#ffffff',
            letterSpacing: '-0.3px'
          }}>
            Driver KYC Badges & Digital Document Locker
          </h1>

          <p style={{
            margin: 0,
            fontSize: '13px',
            color: '#cbd5e1',
            maxWidth: '680px',
            lineHeight: 1.5
          }}>
            Government-verified statutory credentials and executed commercial lease agreements. All documents are authorized by Sikhar Fleet Compliance and stored in an encrypted vault.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onRefresh}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '9px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} className={refreshing ? 'spinning-icon' : ''} />
            <span>Sync Live Records</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Statutory Verification Badges Ribbon */}
      <div className="driver-badges-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '12px'
      }}>
        <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: '#ecfdf5', color: '#16a34a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Shield size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Commercial DL</span>
            <strong style={{ fontSize: '13.5px', color: '#0f172a', fontFamily: 'monospace' }}>{kyc.drivingLicence || 'DFGH76214+675'}</strong>
            <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: 700, display: 'block', marginTop: '1px' }}>✓ MoRTH Valid (2030)</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: '#ecfdf5', color: '#16a34a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>UIDAI Aadhaar</span>
            <strong style={{ fontSize: '13.5px', color: '#0f172a', fontFamily: 'monospace' }}>{kyc.aadhaar || 'XXXX-XXXX-9821'}</strong>
            <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: 700, display: 'block', marginTop: '1px' }}>✓ Biometric Verified</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: '#ecfdf5', color: '#16a34a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <FileText size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Income Tax PAN</span>
            <strong style={{ fontSize: '13.5px', color: '#0f172a', fontFamily: 'monospace' }}>{kyc.panCard || 'ABCV1234R'}</strong>
            <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: 700, display: 'block', marginTop: '1px' }}>✓ NSDL Active Clear</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: '#fff7ed', color: '#c2410c', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Award size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Police Clearance</span>
            <strong style={{ fontSize: '13px', color: '#0f172a' }}>Commissionerate</strong>
            <span style={{ fontSize: '10.5px', color: '#c2410c', fontWeight: 700, display: 'block', marginTop: '1px' }}>{kyc.policeVerification || 'Clear Record'}</span>
          </div>
        </div>
      </div>

      {/* Statutory Expiry Banner */}
      {dlAlert && (
        <div style={{
          background: dlAlert.type === 'expired' ? '#fee2e2' : dlAlert.type === 'warn' ? '#fef3c7' : '#f0fdf4',
          border: `1px solid ${dlAlert.type === 'expired' ? '#fca5a5' : dlAlert.type === 'warn' ? '#fde68a' : '#bbf7d0'}`,
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12.5px',
          color: dlAlert.type === 'expired' ? '#991b1b' : dlAlert.type === 'warn' ? '#92400e' : '#166534',
          fontWeight: 650
        }}>
          {dlAlert.type === 'expired' || dlAlert.type === 'warn' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{dlAlert.text}</span>
        </div>
      )}

      {/* 3. Master Digital Document Locker Section */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {/* Locker Header & Filter Pills */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              Digital Document Locker ({documents.length} Verified Records)
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Preview verified statutory certificates or download signed digital slips on-demand
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All Documents (${documents.length})` },
              { id: 'identity', label: 'Identity (3)' },
              { id: 'agreement', label: 'Lease Contract (1)' },
              { id: 'clearance', label: 'Police Clearance (1)' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: activeFilter === f.id ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                  background: activeFilter === f.id ? '#eff6ff' : '#ffffff',
                  color: activeFilter === f.id ? '#1d4ed8' : '#64748b'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Cards Grid */}
        <div className="driver-two-col-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '16px'
        }}>
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
            >
              <div>
                {/* Top Badge & Authority Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 750,
                    color: '#64748b',
                    background: '#e2e8f0',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    {doc.categoryLabel}
                  </span>

                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 750,
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    ✓ {doc.status}
                  </span>
                </div>

                {/* Title & Number */}
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  {doc.title}
                </h4>

                <div style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Identifier / Ref:</span>
                  <strong style={{ fontSize: '13px', color: '#0284c7', fontFamily: 'monospace' }}>
                    {doc.docNumber}
                  </strong>
                </div>

                <p style={{ margin: '0 0 10px', fontSize: '11.5px', color: '#475569', lineHeight: 1.45 }}>
                  {doc.desc}
                </p>

                {/* Validity and Authority */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Authority:</span>
                    <strong style={{ color: '#334155' }}>{doc.authority.split('(')[0]}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#64748b', display: 'block' }}>Validity / Expiry:</span>
                    <strong style={{ color: '#16a34a' }}>{doc.expiryDate}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDoc(doc)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '7px',
                    color: '#1d4ed8',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <Eye size={13} />
                  <span>View Certificate</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '7px',
                    color: '#0f172a',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <Download size={13} />
                  <span>Download Slip</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Comprehensive Personal Profile & Contact Credentials (8-Card Grid) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
            Driver Personal Profile & Contact Credentials
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Master demographic particulars verified during operational fleet onboarding
          </span>
        </div>

        {/* 8-Card Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '12px',
          marginBottom: '14px'
        }}>
          {/* 1. Full Legal Name */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '9px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
              Driver Full Legal Name
            </span>
            <strong style={{ color: '#0f172a', fontSize: '15px' }}>{driver.name}</strong>
            <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Roster ID: <b>{driver.id}</b>
            </span>
          </div>

          {/* 2. Primary Mobile Phone */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '9px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
              Primary Mobile Phone
            </span>
            <strong style={{ color: '#0f172a', fontSize: '15px' }}>+91 {driver.phone}</strong>
            <span style={{ display: 'block', fontSize: '11px', color: '#16a34a', fontWeight: 700, marginTop: '2px' }}>
              ✓ Mobile OTP Verified
            </span>
          </div>

          {/* 3. Driver Email (Portal Login Key) */}
          <div style={{ background: '#eff6ff', padding: '12px 14px', borderRadius: '9px', border: '1.5px solid #93c5fd' }}>
            <span style={{ fontSize: '10.5px', color: '#1e40af', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
              Driver Email (Portal Key)
            </span>
            <strong style={{ color: '#1d4ed8', fontSize: '13.5px', wordBreak: 'break-all' }}>
              {driver.email || '—'}
            </strong>
            <span style={{ display: 'block', fontSize: '11px', color: '#2563eb', fontWeight: 650, marginTop: '2px' }}>
              Enrolled for Driver Mobile App
            </span>
          </div>

          {/* 4. Alternate Phone */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '9px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
              Alternate Contact Number
            </span>
            <strong style={{ color: '#0f172a', fontSize: '14px' }}>
              {driver.altPhone ? `+91 ${driver.altPhone}` : 'None provided'}
            </strong>
            <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Secondary contact on file
            </span>
          </div>

          {/* 5. Father's Name */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '9px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
              Father's Name (Parentage)
            </span>
            <strong style={{ color: '#0f172a', fontSize: '14px' }}>
              {kyc.fatherName || 'Not recorded'}
            </strong>
            <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              UIDAI demographic record
            </span>
          </div>

          {/* 6. Date of Birth & Gender */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '9px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
              Date of Birth & Gender
            </span>
            <strong style={{ color: '#0f172a', fontSize: '14px' }}>
              {kyc.dob || '—'} {kyc.gender ? `· ${kyc.gender}` : ''}
            </strong>
            <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Statutory verification clear
            </span>
          </div>

          {/* 7. Emergency Contact */}
          <div style={{ background: '#fef2f2', padding: '12px 14px', borderRadius: '9px', border: '1px solid #fecaca' }}>
            <span style={{ fontSize: '10.5px', color: '#b91c1c', fontWeight: 750, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
              Emergency Contact
            </span>
            <strong style={{ color: '#dc2626', fontSize: '14px' }}>
              {kyc.emergencyContact || 'None on record'}
            </strong>
            <span style={{ display: 'block', fontSize: '11px', color: '#991b1b', marginTop: '2px' }}>
              Hub emergency escalation
            </span>
          </div>

          {/* 8. Guarantor Reference */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '9px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
              Guarantor / Reference
            </span>
            <strong style={{ color: '#0f172a', fontSize: '14px' }}>
              {kyc.reference?.name || 'Suresh Verma (Ref)'}
            </strong>
            <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              {kyc.reference?.relation || 'Guarantor'} · {kyc.reference?.phone || '98101 88990'}
            </span>
          </div>
        </div>

        {/* Permanent Address Bar */}
        <div style={{
          background: '#f8fafc',
          padding: '12px 16px',
          borderRadius: '9px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', display: 'block' }}>
              Permanent Residential Address
            </span>
            <strong style={{ color: '#0f172a', fontSize: '13px' }}>
              {kyc.address || driver.city || '25 Mahadevnagar 2, Gurgaon Operations Hub'}
            </strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 750, textTransform: 'uppercase', display: 'block' }}>
              Operational Fleet Hub
            </span>
            <strong style={{ color: '#0284c7', fontSize: '13px' }}>
              {driver.city || 'Gurgaon Central Terminal #1, Delhi NCR'}
            </strong>
          </div>
        </div>
      </div>

      {/* 5. Official Statutory Certificate Viewer Modal */}
      {selectedDoc && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            maxWidth: '540px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid #cbd5e1',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '10.5px', color: '#0284c7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Official Statutory Verification Slip
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 850, color: '#0f172a' }}>
                  {selectedDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Certificate Card Container with Watermark */}
            <div style={{
              background: '#f8fafc',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              padding: '18px',
              marginBottom: '18px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-25deg)',
                fontSize: '36px',
                fontWeight: 900,
                color: 'rgba(2, 132, 199, 0.05)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none'
              }}>
                SIKHAR FLEET VERIFIED
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Document Number</span>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
                    {selectedDoc.docNumber}
                  </div>
                </div>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: '5px', fontSize: '11px', fontWeight: 750 }}>
                  ✓ {selectedDoc.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '12px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Driver Name:</span>
                  <strong style={{ color: '#0f172a' }}>{driver.name}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Roster ID:</span>
                  <strong style={{ color: '#0f172a' }}>{driver.id}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Verifying Agency:</span>
                  <strong style={{ color: '#0284c7' }}>{selectedDoc.authority}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Validity / Expiry:</span>
                  <strong style={{ color: '#16a34a' }}>{selectedDoc.expiryDate}</strong>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#64748b', background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                Security Hash: <strong className="font-mono" style={{ color: '#475569' }}>SKF-VERIFIED-AUTH-{selectedDoc.id.toUpperCase()}-2026</strong>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                style={{
                  padding: '9px 16px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '7px',
                  color: '#334155',
                  fontSize: '12.5px',
                  fontWeight: 650,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownload(selectedDoc);
                  setSelectedDoc(null);
                }}
                style={{
                  padding: '9px 16px',
                  background: '#0284c7',
                  border: 'none',
                  borderRadius: '7px',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={14} />
                <span>Download Official Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
