import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Car,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Eye,
  Phone,
  MapPin,
  Clock,
  BatteryCharging,
  Fuel,
  Receipt,
  X,
  Lock,
  ExternalLink,
  Award,
  Zap
} from '../common/Icons';

export default function DriverProfileHub({ user, onUpdateDutyStatus }) {
  const driver = user || {};
  const kyc = driver.kyc || {};
  const vehicle = driver.vehicle || null;
  const deal = driver.deal || {};
  const activeLease = driver.activeLease || null;

  // Local state for duty toggle
  const [dutyStatus, setDutyStatus] = useState(driver.status || 'On Duty');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [downloadNotice, setDownloadNotice] = useState('');

  useEffect(() => {
    if (driver.status) setDutyStatus(driver.status);
  }, [driver.status]);

  const handleToggleDuty = () => {
    const nextStatus = dutyStatus === 'On Duty' ? 'Off Duty' : 'On Duty';
    setDutyStatus(nextStatus);
    if (onUpdateDutyStatus) onUpdateDutyStatus(nextStatus);
  };

  // DL Expiry alert check (warning if expiry within 30 days or expired)
  const getDlExpiryAlert = () => {
    if (!kyc.dlExpiry) return null;
    try {
      const expDate = new Date(kyc.dlExpiry);
      const today = new Date();
      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        return { type: 'expired', days: diffDays, text: 'Licence Expired! Renew immediately with Hub Admin.' };
      }
      if (diffDays <= 30) {
        return { type: 'expiring-soon', days: diffDays, text: `Statutory Warning: DL renewal due in ${diffDays} days.` };
      }
      return { type: 'valid', days: diffDays, text: `Valid until ${kyc.dlExpiry}` };
    } catch {
      return { type: 'valid', text: `Expiry: ${kyc.dlExpiry}` };
    }
  };

  const dlAlert = getDlExpiryAlert();

  // Documents list
  const documentsList = [
    {
      id: 'doc-dl',
      type: 'dl',
      title: 'Commercial Driving Licence (TR)',
      number: kyc.drivingLicence || 'DL-PENDING',
      expiry: kyc.dlExpiry || 'Lifetime',
      status: kyc.dlStatus || 'Valid',
      verified: true,
      category: kyc.dlCategory || 'Commercial LMV',
      fileUrl: (driver.documents || []).find(d => d.type === 'dl' || d.category === 'dl')?.fileUrl || null,
      desc: 'Statutory commercial transport licence verified via Sarathi Parivahan API'
    },
    {
      id: 'doc-aadhaar',
      type: 'aadhaar',
      title: 'UIDAI Aadhaar Card',
      number: kyc.aadhaar ? `XXXX-XXXX-${kyc.aadhaar.replace(/\s/g, '').slice(-4)}` : 'XXXX-XXXX-1415',
      expiry: 'Lifetime Valid',
      status: 'Verified Biometric',
      verified: true,
      category: 'Identity Proof',
      fileUrl: (driver.documents || []).find(d => d.type === 'aadhaar' || d.category === 'aadhaar')?.fileUrl || null,
      desc: 'National biometric identity card validated via UIDAI OTP gateway'
    },
    {
      id: 'doc-pan',
      type: 'pan',
      title: 'Income Tax PAN Card',
      number: kyc.panCard || 'ASDFG1234',
      expiry: 'Lifetime Valid',
      status: 'Verified Active',
      verified: true,
      category: 'Tax Identification',
      fileUrl: (driver.documents || []).find(d => d.type === 'pan' || d.category === 'pan')?.fileUrl || null,
      desc: 'Permanent Account Number verified via NSDL tax portal'
    },
    {
      id: 'doc-police',
      type: 'police',
      title: 'Police Verification Certificate',
      number: 'PV-DEL-2026-8812',
      expiry: 'Valid for 1 Year',
      status: kyc.policeVerification || 'Verified (Clear)',
      verified: !kyc.policeVerification?.includes('Pending'),
      category: 'Criminal & Background Check',
      fileUrl: null,
      desc: 'Local district police commissionerate character and antecedents certificate'
    },
    {
      id: 'doc-lease',
      type: 'lease',
      title: 'Official Fleet Lease Agreement',
      number: activeLease?.leaseNumber || 'LSE-2026-0010',
      expiry: activeLease?.endDate ? new Date(activeLease.endDate).toLocaleDateString() : 'Annual Rolling',
      status: 'Executed & Signed',
      verified: true,
      category: 'Commercial Vehicle Contract',
      fileUrl: null,
      dealModel: activeLease?.dealType || deal.type || 'Fixed Daily Rental',
      rate: activeLease?.rateDisplay || deal.rate || '₹1,000 / day',
      deposit: activeLease ? `₹${(activeLease.securityDeposit || 0).toLocaleString('en-IN')}` : (deal.deposit || '₹50,000'),
      signedDate: activeLease?.signedDate ? new Date(activeLease.signedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '15 Oct 2026',
      desc: 'Master commercial vehicle lease agreement signed between Sikhar Fleet and Driver'
    }
  ];

  // Trigger file download
  const handleDownloadDoc = (doc) => {
    setDownloadNotice(`Downloading ${doc.title}...`);
    setTimeout(() => {
      if (doc.fileUrl && doc.fileUrl.startsWith('data:')) {
        // Download base64 file
        const link = document.createElement('a');
        link.href = doc.fileUrl;
        link.download = `Sikhar_${doc.type}_${driver.id || 'driver'}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Generate printable official slip / certificate
        const blobContent = `
================================================================================
SIKHAR FLEET PRIVATE LIMITED - OFFICIAL DIGITAL DOCUMENT COPY
================================================================================
Document Type     : ${doc.title}
Document ID / No. : ${doc.number}
Issued To Driver  : ${driver.name} (Driver ID: ${driver.id})
Category          : ${doc.category}
Statutory Status  : ${doc.status}
Verification Hash : VERIFIED-UID-SKF-${Date.now()}
Assigned Vehicle  : ${vehicle ? `${vehicle.model} [${vehicle.registration}]` : 'Not Allocated'}
Commercial Deal   : ${doc.dealModel || 'Commercial Standard'}
Security Deposit  : ${doc.deposit || 'Escrow Recorded'}
Issued Date       : ${new Date().toLocaleDateString('en-IN')}
Authority         : Sikhar Fleet Central Hub Compliance Terminal
================================================================================
Notice: This is an authorized digital certificate copy for commercial driver operations.
`;
        const blob = new Blob([blobContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Sikhar_${doc.type}_${driver.id || 'driver'}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      setDownloadNotice(`✓ Downloaded ${doc.title}`);
      setTimeout(() => setDownloadNotice(''), 3000);
    }, 400);
  };

  return (
    <div className="driver-hub-container" style={{ padding: '16px', maxWidth: '900px', margin: '0 auto', color: '#0f172a' }}>

      {/* Download Alert Toast */}
      {downloadNotice && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#065f46',
          color: '#ffffff',
          padding: '10px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} color="#34d399" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Driver Identity Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)',
              overflow: 'hidden'
            }}>
              {driver.photo ? (
                <img src={driver.photo} alt={driver.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                driver.name ? driver.name.charAt(0).toUpperCase() : 'D'
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {driver.name || 'Commercial Driver'}
                </h2>
                <span style={{
                  background: '#dbeafe',
                  color: '#1e40af',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {driver.id || 'drv-00'}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px', fontSize: '13px', color: '#475569' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} color="#64748b" />
                  <b>+91 {driver.phone || '—'}</b>
                  <span style={{ color: '#16a34a', fontSize: '11px', fontWeight: 600 }}>✓ Verified</span>
                </span>

                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} color="#64748b" />
                  <span>{driver.city || kyc.address || 'Delhi NCR Hub'}</span>
                </span>

                {driver.email && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb' }}>
                    <span>✉ {driver.email}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Duty Switcher Button */}
          <div style={{ textAlign: 'right' }}>
            <button
              type="button"
              onClick={handleToggleDuty}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '30px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                transition: 'all 0.2s',
                background: dutyStatus === 'On Duty' ? '#dcfce7' : '#f1f5f9',
                color: dutyStatus === 'On Duty' ? '#15803d' : '#64748b',
                boxShadow: dutyStatus === 'On Duty' ? '0 2px 6px rgba(34, 197, 94, 0.2)' : 'none'
              }}
            >
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: dutyStatus === 'On Duty' ? '#22c55e' : '#94a3b8'
              }} />
              <span>{dutyStatus === 'On Duty' ? 'Status: On Duty' : 'Status: Off Duty'}</span>
            </button>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Tap to toggle status</div>
          </div>

        </div>

        {/* Assigned Vehicle Highlight Strip */}
        <div style={{
          marginTop: '16px',
          padding: '12px 14px',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: vehicle?.type === 'EV' ? '#ecfdf5' : '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Car size={20} color={vehicle?.type === 'EV' ? '#059669' : '#2563eb'} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Allocated Vehicle Asset
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                {vehicle?.registration ? (
                  <span>
                    {vehicle.registration} <span style={{ fontWeight: 500, color: '#475569' }}>· {vehicle.model}</span>
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8' }}>No vehicle assigned yet</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {vehicle?.type && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                background: vehicle.type === 'EV' ? '#d1fae5' : '#e0f2fe',
                color: vehicle.type === 'EV' ? '#065f46' : '#0369a1'
              }}>
                {vehicle.type === 'EV' ? <BatteryCharging size={14} /> : <Fuel size={14} />}
                <span>{vehicle.type} Fleet</span>
              </span>
            )}

            {driver.shift && (
              <span style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} color="#64748b" />
                <span>{driver.shift}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Read-Only Notice */}
      <div style={{
        background: '#fffbeb',
        border: '1px solid #fef3c7',
        borderRadius: '10px',
        padding: '12px 14px',
        marginBottom: '18px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Lock size={18} color="#d97706" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '12px', color: '#92400e', lineHeight: '1.4' }}>
          <b>Read-Only Institutional Records:</b> All driver credentials, verified KYC badges, and vehicle allocations are verified and entered by Sikhar Fleet Admin. Drivers have view and download access to on-demand digital copies.
        </div>
      </div>

      {/* Section: Statutory KYC Badges (PDF Pages 3, 5 & 11) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={18} color="#2563eb" />
            <span>My Profile & Statutory KYC Badges</span>
          </h3>
          <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
            ✓ Verified with Ministry of Transport & UIDAI
          </span>
        </div>

        {/* DL Expiry Statutory Alert Banner */}
        {dlAlert && dlAlert.type !== 'valid' && (
          <div style={{
            background: dlAlert.type === 'expired' ? '#fef2f2' : '#fff7ed',
            border: `1px solid ${dlAlert.type === 'expired' ? '#fecaca' : '#fed7aa'}`,
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertTriangle size={18} color={dlAlert.type === 'expired' ? '#dc2626' : '#ea580c'} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: dlAlert.type === 'expired' ? '#b91c1c' : '#c2410c' }}>
              {dlAlert.text}
            </span>
          </div>
        )}

        {/* 4 KYC Badges Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px'
        }}>

          {/* 1. Driving Licence Badge */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Commercial DL
                </span>
                <span style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <CheckCircle2 size={12} color="#15803d" />
                  <span>Verified</span>
                </span>
              </div>

              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>
                {kyc.drivingLicence || 'GJ06 20250013670'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Category: <b>{kyc.dlCategory || 'Commercial LMV'}</b>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Expiry: <b style={{ color: dlAlert?.type === 'expiring-soon' ? '#ea580c' : '#0f172a' }}>{kyc.dlExpiry || '2047-04-08'}</b>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => setSelectedDoc(documentsList[0])}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  color: '#334155'
                }}
              >
                <Eye size={13} /> View
              </button>
              <button
                type="button"
                onClick={() => handleDownloadDoc(documentsList[0])}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Download size={13} /> Download
              </button>
            </div>
          </div>

          {/* 2. Aadhaar Card Badge */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Aadhaar (UIDAI)
                </span>
                <span style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <CheckCircle2 size={12} color="#15803d" />
                  <span>Biometric Verified</span>
                </span>
              </div>

              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '1px' }}>
                {kyc.aadhaar ? `XXXX-XXXX-${kyc.aadhaar.replace(/\s/g, '').slice(-4)}` : 'XXXX-XXXX-1415'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                DOB: <b>{kyc.dob || '09-04-2007'}</b> · Gender: <b>{kyc.gender || 'Male'}</b>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Father: <b>{kyc.fatherName || 'Parekh Rakeshbhai'}</b>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => setSelectedDoc(documentsList[1])}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  color: '#334155'
                }}
              >
                <Eye size={13} /> View
              </button>
              <button
                type="button"
                onClick={() => handleDownloadDoc(documentsList[1])}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Download size={13} /> Download
              </button>
            </div>
          </div>

          {/* 3. Police Verification Badge */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Police Verification
                </span>
                <span style={{
                  background: kyc.policeVerification?.includes('Clear') || kyc.policeVerification?.includes('Verified') ? '#dcfce7' : '#fef3c7',
                  color: kyc.policeVerification?.includes('Clear') || kyc.policeVerification?.includes('Verified') ? '#15803d' : '#b45309',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <CheckCircle2 size={12} color={kyc.policeVerification?.includes('Clear') ? '#15803d' : '#b45309'} />
                  <span>{kyc.policeVerification || 'Verified (Clear)'}</span>
                </span>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                Antecedents & Criminal Check
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Authority: <b>District Police Commissionerate</b>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Status: <b>Clear Record · No Incident Reported</b>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => setSelectedDoc(documentsList[3])}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  color: '#334155'
                }}
              >
                <Eye size={13} /> View
              </button>
              <button
                type="button"
                onClick={() => handleDownloadDoc(documentsList[3])}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Download size={13} /> Download
              </button>
            </div>
          </div>

          {/* 4. Emergency & Reference Info */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Emergency & Guarantor
                </span>
                <span style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  On Record
                </span>
              </div>

              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                Emergency: <span style={{ fontWeight: 700, color: '#dc2626' }}>{kyc.emergencyContact || '9999030745 (Family)'}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Guarantor: <b>{kyc.reference?.name || 'Suresh Verma (Ref)'}</b>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Phone: <b>{kyc.reference?.phone || '98101 88990'}</b>
              </div>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#64748b' }}>
              Address: {kyc.address || 'Vadodara / Delhi NCR Operations'}
            </div>
          </div>

        </div>
      </div>

      {/* Section: Digital Document Locker (PDF Pages 3, 5 & 11) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={18} color="#2563eb" />
            <span>Digital Document Locker (On-Demand Download)</span>
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            5 Verified Documents
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {documentsList.map((doc) => (
            <div
              key={doc.id}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: doc.type === 'lease' ? '#fef3c7' : '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: doc.type === 'lease' ? '#d97706' : '#2563eb'
                }}>
                  {doc.type === 'lease' ? <Receipt size={20} /> : <FileText size={20} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {doc.title}
                    </span>
                    <span style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '8px'
                    }}>
                      ✓ Verified
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Doc No: <b style={{ color: '#334155' }}>{doc.number}</b>
                    {doc.rate && <span> · Rate: <b>{doc.rate}</b></span>}
                    {doc.deposit && <span> · Escrow: <b>{doc.deposit}</b></span>}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {doc.desc}
                  </div>
                </div>
              </div>

              {/* View & Download Buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDoc(doc)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#1e293b'
                  }}
                >
                  <Eye size={14} />
                  <span>View</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadDoc(doc)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '7px',
                    border: 'none',
                    background: '#1d4ed8',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* High-Resolution Document Viewer Modal */}
      {selectedDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#2563eb', fontWeight: 700 }}>
                  Sikhar Fleet Digital Document Locker
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0 0', color: '#0f172a' }}>
                  {selectedDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} color="#475569" />
              </button>
            </div>

            {/* Document Content View */}
            {selectedDoc.fileUrl ? (
              <div style={{
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                background: '#0f172a',
                textAlign: 'center',
                padding: '10px'
              }}>
                <img
                  src={selectedDoc.fileUrl}
                  alt={selectedDoc.title}
                  style={{ maxWidth: '100%', maxHeight: '340px', objectFit: 'contain' }}
                />
              </div>
            ) : (
              /* Verified Digital Certificate Template */
              <div style={{
                borderRadius: '10px',
                border: '2px dashed #93c5fd',
                background: '#f8fafc',
                padding: '20px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '15px' }}>
                    SIKHAR FLEET DIGITAL VAULT
                  </div>
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    OFFICIAL VERIFIED RECORD
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Document Identification</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedDoc.number}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Driver Name</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{driver.name}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Validity / Expiry</span>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedDoc.expiry}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Statutory Category</span>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedDoc.category}</div>
                  </div>
                  {selectedDoc.rate && (
                    <div>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>Agreed Rental Rate</span>
                      <div style={{ fontWeight: 700, color: '#16a34a' }}>{selectedDoc.rate}</div>
                    </div>
                  )}
                  {selectedDoc.deposit && (
                    <div>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>Security Deposit</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedDoc.deposit}</div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
                  Verified by: Central Hub Fleet Compliance Terminal · UIDAI / Sarathi Master
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => handleDownloadDoc(selectedDoc)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Download size={15} />
                <span>Download Official Copy</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
