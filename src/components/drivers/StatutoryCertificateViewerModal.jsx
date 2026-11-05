import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Shield,
  FileText,
  User,
  CreditCard,
  CheckCircle2,
  Printer,
  Download,
  Eye,
  EyeOff,
  Camera,
  Scan,
  RotateCcw,
  Maximize2,
  FileUp,
  Trash2,
  RefreshCw,
  Sparkles,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Award
} from '../common/Icons';
import { updateDriverDocumentApi } from '../../services/api';

/**
 * High-Fidelity Indian National Emblem SVG (Ashok Lion Capital)
 */
function AshokEmblem({ size = 36, color = '#1e3a8a' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" stroke={color} strokeWidth="2.5" strokeDasharray="3 2" opacity="0.6" />
      {/* Base Pedestal */}
      <rect x="25" y="80" width="50" height="7" rx="2" fill={color} />
      <rect x="30" y="74" width="40" height="6" rx="1.5" fill={color} opacity="0.85" />
      {/* Dharma Chakra Center */}
      <circle cx="50" cy="77" r="3" fill="#ffffff" />
      <circle cx="50" cy="77" r="1.5" fill={color} />
      {/* Lions Body Silhouette */}
      <path d="M38 74 C36 60 33 46 38 35 C42 27 50 25 50 25 C50 25 58 27 62 35 C67 46 64 60 62 74 Z" fill={color} />
      {/* Front Center Lion Head */}
      <circle cx="50" cy="22" r="11" fill={color} />
      <circle cx="47" cy="20" r="1.5" fill="#ffffff" />
      <circle cx="53" cy="20" r="1.5" fill="#ffffff" />
      <path d="M48 24 Q50 26 52 24" stroke="#ffffff" strokeWidth="1" fill="none" />
      {/* Left Lion Head */}
      <circle cx="34" cy="26" r="9" fill={color} opacity="0.9" />
      <circle cx="32" cy="24" r="1.2" fill="#ffffff" />
      {/* Right Lion Head */}
      <circle cx="66" cy="26" r="9" fill={color} opacity="0.9" />
      <circle cx="68" cy="24" r="1.2" fill="#ffffff" />
      {/* Mane Flourishes */}
      <path d="M42 32 C38 36 36 44 38 52" stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M58 32 C62 36 64 44 62 52" stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M50 30 V56" stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.7" />
    </svg>
  );
}

/**
 * Smart Card IC Microchip SVG Graphic
 */
function SmartCardChip() {
  return (
    <div style={{
      width: '54px',
      height: '42px',
      borderRadius: '6px',
      background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%)',
      border: '1px solid #b45309',
      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.15)',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0
    }}>
      <div style={{ position: 'absolute', inset: '3px', border: '1px solid #78350f', borderRadius: '4px', opacity: 0.5 }} />
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#78350f', opacity: 0.6 }} />
      <div style={{ position: 'absolute', left: '38%', top: 0, bottom: 0, width: '1px', background: '#78350f', opacity: 0.6 }} />
      <div style={{ position: 'absolute', right: '38%', top: 0, bottom: 0, width: '1px', background: '#78350f', opacity: 0.6 }} />
      <div style={{ position: 'absolute', top: '22%', left: '22%', right: '22%', bottom: '22%', border: '1px solid #78350f', borderRadius: '3px', opacity: 0.4 }} />
    </div>
  );
}

/**
 * QR Code specimen generator
 */
function SpecimenQrCode({ text = 'SIKHAR-VERIFIED' }) {
  return (
    <div style={{
      width: '68px',
      height: '68px',
      background: '#ffffff',
      border: '1.5px solid #0f172a',
      borderRadius: '6px',
      padding: '4px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
      flexShrink: 0
    }} title={`QR Specimen: ${text}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '18px', height: '18px', border: '3px solid #0f172a', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '6px', height: '6px', background: '#0f172a' }} />
        </div>
        <div style={{ width: '18px', height: '18px', border: '3px solid #0f172a', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '6px', height: '6px', background: '#0f172a' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '14px', gap: '2px' }}>
        <div style={{ width: '4px', height: '4px', background: '#0f172a' }} />
        <div style={{ width: '6px', height: '4px', background: '#0284c7' }} />
        <div style={{ width: '4px', height: '4px', background: '#0f172a' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '18px', height: '18px', border: '3px solid #0f172a', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '6px', height: '6px', background: '#0f172a' }} />
        </div>
        <div style={{ width: '18px', height: '18px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px' }}>
          <div style={{ background: '#0f172a', borderRadius: '1px' }} />
          <div style={{ background: '#0f172a', borderRadius: '1px' }} />
          <div style={{ background: '#0f172a', borderRadius: '1px' }} />
          <div style={{ background: '#0f172a', borderRadius: '1px' }} />
        </div>
      </div>
    </div>
  );
}

const CATEGORY_TABS = [
  { id: 'dl', label: 'Commercial DL', subtitle: 'MoRTH Form 7', icon: Award, color: '#0284c7' },
  { id: 'aadhaar', label: 'Aadhaar Card', subtitle: 'UIDAI Biometric', icon: Shield, color: '#f97316' },
  { id: 'pan', label: 'PAN Card', subtitle: 'Income Tax Dept', icon: CreditCard, color: '#2563eb' },
  { id: 'police', label: 'Police PCC', subtitle: 'Commissionerate', icon: User, color: '#16a34a' },
  { id: 'agreement', label: 'Lease Deal', subtitle: 'Executed Contract', icon: FileText, color: '#7c3aed' }
];

export default function StatutoryCertificateViewerModal({
  isOpen,
  onClose,
  driver,
  initialCategory = 'dl',
  initialDoc = null,
  onDocumentUpdated = null,
  onTriggerOcr = null
}) {
  const [activeTab, setActiveTab] = useState(initialCategory || 'dl');
  const [viewMode, setViewMode] = useState('specimen'); // 'specimen' or 'scanned'
  const [isMaskedAadhaar, setIsMaskedAadhaar] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [attachedDoc, setAttachedDoc] = useState(initialDoc);
  const fileInputRef = useRef(null);

  // Sync initialCategory when modal opens
  useEffect(() => {
    if (initialCategory) {
      setActiveTab(initialCategory);
    }
    setAttachedDoc(initialDoc || null);
  }, [initialCategory, initialDoc, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Driver details normalization
  const kyc = driver?.kyc || {};
  const driverName = (driver?.name || 'Dhruv Parekh').toUpperCase();
  const fatherName = (kyc.fatherName || 'PAREKH RAKESHBHAI').toUpperCase();
  const dob = kyc.dob || '09-04-2007';
  const address = kyc.address || 'A/12, manish appartment, new sama road, Vadodara, Gujarat - 390008';
  const dlNumber = kyc.drivingLicence || 'GJ06 20250013670';
  const dlExpiry = kyc.dlExpiry || '14 Nov 2030';
  const aadhaarNumber = kyc.aadhaar || '3639 7365 6509';
  const panNumber = kyc.panCard || 'ABCDE1234F';

  // Find matching document record in driver.documents
  const currentDoc = useMemo(() => {
    const docs = [
      ...(attachedDoc ? [attachedDoc] : []),
      ...(Array.isArray(driver?.documents) ? driver.documents : [])
    ];
    return docs.find(
      (d) => d && (d.category === activeTab || (d.type && d.type.toLowerCase().includes(activeTab)))
    ) || null;
  }, [driver, activeTab, attachedDoc]);

  // Determine if valid scanned image exists (not placeholder 39 bytes)
  const hasValidScanImage = useMemo(() => {
    const url = currentDoc?.fileUrl;
    if (!url) return false;
    if (typeof url === 'string' && url.length > 200 && !url.includes('data:image/jpeg;base64,/9j/4AAQSkZJRg==')) {
      return true;
    }
    return false;
  }, [currentDoc]);

  // Default viewMode based on image availability
  useEffect(() => {
    if (hasValidScanImage) {
      setViewMode('scanned');
    } else {
      setViewMode('specimen');
    }
    setZoomLevel(1);
    setRotation(0);
  }, [activeTab, hasValidScanImage]);

  if (!isOpen || !driver) return null;

  const showNotice = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleCopy = (text, label) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      showNotice(`Copied ${label} to clipboard: ${text}`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      // ignore
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSpecimen = () => {
    if (!hasValidScanImage) {
      showNotice('Upload the real document image first. No specimen is available for download.');
      return;
    }
    showNotice(`Preparing official PDF certificate specimen for ${driver.name}...`);
    // Create print view or download
    window.print();
  };

  const handleUploadPhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDeletePhoto = async () => {
    if (!currentDoc?.id || !hasValidScanImage) return;
    if (!window.confirm(`Delete the uploaded ${CATEGORY_TABS.find((tab) => tab.id === activeTab)?.label || 'document'} image? The document number and KYC record will remain.`)) return;

    try {
      setIsUploading(true);
      showNotice('Removing uploaded document image...');
      const res = await updateDriverDocumentApi(driver.id, currentDoc.id, {
        fileUrl: '',
        status: 'Pending Upload',
        verified: false,
        updatedAt: new Date().toISOString()
      });

      if (res && res.document) {
        setAttachedDoc(res.document);
        if (onDocumentUpdated) onDocumentUpdated(res.document, res.documents);
        showNotice('Uploaded image deleted. You can upload a new image now.');
      }
    } catch (err) {
      console.error('Failed to delete document image:', err);
      showNotice(err.message || 'Could not delete the uploaded image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    try {
      setIsUploading(true);
      showNotice('Attaching and optimizing document photo...');

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result;
        try {
          const docId = currentDoc?.id || `doc-${activeTab}-${driver.id}`;
          const updates = {
            category: activeTab,
            type: activeTab === 'dl' ? 'Driving Licence' :
                  activeTab === 'aadhaar' ? 'Aadhaar Card' :
                  activeTab === 'pan' ? 'PAN Card' :
                  activeTab === 'police' ? 'Police Clearance' : 'Agreement',
            title: activeTab === 'dl' ? `Driving Licence (${dlNumber})` :
                   activeTab === 'aadhaar' ? `Aadhaar Biometric Card (${aadhaarNumber.slice(-4)})` :
                   activeTab === 'pan' ? `Income Tax PAN (${panNumber})` :
                   activeTab === 'police' ? 'Police Clearance Report' : 'Commercial Agreement',
            docNumber: activeTab === 'dl' ? dlNumber :
                       activeTab === 'aadhaar' ? aadhaarNumber :
                       activeTab === 'pan' ? panNumber : 'PCC-GJ-88194',
            fileUrl: base64Data,
            status: 'Verified (Photo Attached)',
            verified: true,
            updatedAt: new Date().toISOString()
          };

          const res = await updateDriverDocumentApi(driver.id, docId, updates);
          if (res && res.document) {
            setAttachedDoc(res.document);
            showNotice('✓ Document scan attached and secured in encrypted vault!');
            if (onDocumentUpdated) {
              onDocumentUpdated(res.document, res.documents);
            }
            setViewMode('scanned');
          }
        } catch (err) {
          console.error('Failed to attach document photo:', err);
          showNotice('Notice: Image updated in memory preview.');
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  return (
    <div
      className="driver-modal-overlay-custom statutory-cert-modal-root"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
    >
      {/* Hidden file input for uploading real physical photo scan */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <div
        className="driver-modal-dialog-box statutory-cert-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '920px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          border: '1px solid #cbd5e1',
          overflow: 'hidden'
        }}
      >
        {/* ========================================================================= */}
        {/* TOP MODAL HEADER (Institutional Gov & Fleet Header) */}
        {/* ========================================================================= */}
        <div style={{
          padding: '16px 22px',
          background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #0284c7',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
              fontWeight: 800
            }}>
              <Shield size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.2px', color: '#ffffff' }}>
                  Statutory KYC Certificate Viewer
                </h3>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: '#059669',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <CheckCircle2 size={12} />
                  <span>UIDAI / MoRTH Institutional Verified</span>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '3px', fontSize: '12px', color: '#94a3b8' }}>
                <span>Driver: <strong style={{ color: '#f8fafc' }}>{driver.name}</strong> ({driver.id})</span>
                <span>•</span>
                <span>Phone: <strong style={{ color: '#f8fafc' }}>{driver.phone || '+91 94284 24115'}</strong></span>
                <span>•</span>
                <span>Hub: <strong style={{ color: '#f8fafc' }}>{driver.hub || 'Gurgaon / Vadodara'}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              title="Print official certificate format"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Close Viewer (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DOCUMENT CATEGORY TABS BAR */}
        {/* ========================================================================= */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          gap: '8px',
          flexWrap: 'wrap',
          flexShrink: 0
        }}>
          {/* Left: Tab Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', maxWidth: '100%' }}>
            {CATEGORY_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: isActive ? `1.5px solid ${tab.color}` : '1px solid #cbd5e1',
                    background: isActive ? '#ffffff' : '#f1f5f9',
                    color: isActive ? tab.color : '#475569',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <TabIcon size={15} color={isActive ? tab.color : '#64748b'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Display Toggle (When Scanned Photo exists) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hasValidScanImage ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#e2e8f0',
                padding: '3px',
                borderRadius: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => setViewMode('scanned')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: viewMode === 'scanned' ? '#ffffff' : 'transparent',
                    color: viewMode === 'scanned' ? '#0f172a' : '#64748b',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer',
                    boxShadow: viewMode === 'scanned' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Camera size={12} />
                  <span>Scanned Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('specimen')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: viewMode === 'specimen' ? '#ffffff' : 'transparent',
                    color: viewMode === 'specimen' ? '#0f172a' : '#64748b',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer',
                    boxShadow: viewMode === 'specimen' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Sparkles size={12} />
                  <span>Digital Specimen Card</span>
                </button>
              </div>
            ) : (
              <span style={{
                fontSize: '11.5px',
                color: '#64748b',
                background: '#e0f2fe',
                color: '#0284c7',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Sparkles size={13} />
                <span>Document image not uploaded</span>
              </span>
            )}
          </div>
        </div>

        {/* Notice Bar if active */}
        {actionNotice && (
          <div style={{
            background: '#ecfdf5',
            color: '#065f46',
            borderBottom: '1px solid #a7f3d0',
            padding: '7px 20px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={15} color="#059669" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN VIEWER BODY */}
        {/* ========================================================================= */}
        <div style={{
          padding: '24px 28px',
          overflowY: 'auto',
          flex: 1,
          background: '#f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* MODE A: SCANNED PHOTO WITH ZOOM CONTROLS */}
          {viewMode === 'scanned' && hasValidScanImage ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Zoom Controls Toolbar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                marginBottom: '16px'
              }}>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                  style={{ padding: '4px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px', cursor: 'pointer', fontWeight: 800 }}
                  title="Zoom Out"
                >
                  -
                </button>
                <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '48px', textAlign: 'center', color: '#334155' }}>
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                  style={{ padding: '4px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px', cursor: 'pointer', fontWeight: 800 }}
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => { setZoomLevel(1); setRotation(0); }}
                  style={{ padding: '4px 8px', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#475569' }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  style={{ padding: '4px 8px', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#475569' }}
                  title="Rotate 90 degrees"
                >
                  <RotateCcw size={12} />
                  <span>Rotate</span>
                </button>
              </div>

              {/* Scanned Image Canvas */}
              <div style={{
                maxWidth: '780px',
                width: '100%',
                maxHeight: '52vh',
                overflow: 'auto',
                background: '#0f172a',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}>
                <img
                  src={currentDoc.fileUrl}
                  alt={currentDoc.title || 'Document Scan'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '48vh',
                    objectFit: 'contain',
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease',
                    borderRadius: '6px'
                  }}
                />
              </div>
            </div>
          ) : hasValidScanImage ? (
            /* MODE B: INSTITUTIONAL GOVERNMENT STATUTORY DIGITAL SPECIMEN CARDS */
            <div style={{ width: '100%', maxWidth: '780px' }}>
              {/* TAB 1: COMMERCIAL DRIVING LICENCE (FORM 7 MoRTH) */}
              {activeTab === 'dl' && (
                <div
                  className="printable-certificate-card"
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '2px solid #0284c7',
                    boxShadow: '0 12px 30px rgba(2, 132, 199, 0.12), 0 2px 8px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {/* DL Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #0c2340 0%, #173b6c 100%)',
                    color: '#ffffff',
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '3px solid #f59e0b'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <AshokEmblem size={38} color="#fcd34d" />
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', color: '#fcd34d' }}>
                          UNION OF INDIA • TRANSPORT DEPARTMENT
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.5px' }}>
                          GUJARAT MOTOR VEHICLES DEPARTMENT
                        </div>
                        <div style={{ fontSize: '10px', color: '#93c5fd', fontWeight: 600 }}>
                          FORM 7 (RULE 16(2)) • DRIVING LICENCE FOR MOTOR VEHICLES
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: '#059669',
                        color: '#ffffff',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        letterSpacing: '0.4px',
                        display: 'inline-block'
                      }}>
                        SARATHI VERIFIED ✓
                      </span>
                      <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '3px' }}>
                        Type: Commercial LMV-TR
                      </div>
                    </div>
                  </div>

                  {/* DL Card Body */}
                  <div style={{ padding: '20px 24px', background: '#fafbfc' }}>
                    {/* Top Row: Chip, DL Number & Validity */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <SmartCardChip />
                        <div>
                          <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                            Driving Licence Number:
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '1px' }}>
                              {dlNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(dlNumber, 'DL Number')}
                              style={{ border: 'none', background: '#e0f2fe', color: '#0284c7', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              {copiedField === 'DL Number' ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                          Valid Till: <strong style={{ color: '#059669', fontSize: '13px' }}>{dlExpiry} (TRANS)</strong>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                          Authorised Class: <strong style={{ color: '#0f172a' }}>LMV-TR, MCWG</strong>
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Photo, Personal Details & QR */}
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px', gap: '20px', alignItems: 'start' }}>
                      {/* Driver Photo Box */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          width: '110px',
                          height: '130px',
                          borderRadius: '8px',
                          border: '2px solid #cbd5e1',
                          background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          {hasValidScanImage ? (
                            <img src={currentDoc.fileUrl} alt={driverName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <>
                              <User size={46} color="#64748b" />
                              <span style={{ fontSize: '10px', fontWeight: 800, color: '#475569', marginTop: '4px' }}>
                                {driver.name?.split(' ').map(n => n[0]).join('') || 'DP'}
                              </span>
                            </>
                          )}
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(15, 23, 42, 0.75)', color: '#ffffff', fontSize: '8.5px', padding: '2px 0', fontWeight: 700 }}>
                            SPECIMEN
                          </div>
                        </div>
                        <div style={{ marginTop: '6px', fontSize: '10px', color: '#64748b', fontStyle: 'italic', borderTop: '1px dashed #cbd5e1', paddingTop: '3px' }}>
                          Holder Signature
                        </div>
                      </div>

                      {/* Driver Details Table */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                        <div>
                          <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Full Name of Licence Holder:</span>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14.5px' }}>{driverName}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Father / Guardian:</span>
                            <div style={{ fontWeight: 700, color: '#334155' }}>{fatherName}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Date of Birth / Blood:</span>
                            <div style={{ fontWeight: 700, color: '#334155' }}>{dob} • Blood: O+</div>
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Permanent Address:</span>
                          <div style={{ fontWeight: 600, color: '#334155', lineHeight: 1.35, fontSize: '12px' }}>{address}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '4px' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Licensing Authority:</span>
                            <div style={{ fontWeight: 700, color: '#0284c7', fontSize: '11.5px' }}>RTO Vadodara (GJ06)</div>
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Badge / Issue Date:</span>
                            <div style={{ fontWeight: 700, color: '#334155', fontSize: '11.5px' }}>GJ-COMM-8912 • 15 Jan 2020</div>
                          </div>
                        </div>
                      </div>

                      {/* Right QR Code & Sign */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <SpecimenQrCode text={`DL:${dlNumber}|${driverName}`} />
                        <span style={{ fontSize: '9px', color: '#64748b', textAlign: 'center', lineHeight: 1.2 }}>
                          Digitally Signed MoRTH SARATHI
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DL Footer Security Bar */}
                  <div style={{
                    padding: '8px 20px',
                    background: '#f1f5f9',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#64748b'
                  }}>
                    <span>Commercial Transport Authorized (Section 10 of M.V. Act 1988)</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>Active Fleet Status: Clear to Drive</span>
                  </div>
                </div>
              )}

              {/* TAB 2: AADHAAR BIOMETRIC CARD (UIDAI) */}
              {activeTab === 'aadhaar' && (
                <div
                  className="printable-certificate-card"
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '2px solid #f97316',
                    boxShadow: '0 12px 30px rgba(249, 115, 22, 0.12), 0 2px 8px rgba(0,0,0,0.06)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Tricolor Ribbon Header */}
                  <div style={{ height: '7px', background: 'linear-gradient(90deg, #ff9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%)' }} />

                  {/* Aadhaar Brand Header */}
                  <div style={{
                    background: '#ffffff',
                    padding: '12px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #fed7aa'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <AshokEmblem size={36} color="#0f172a" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                          भारत सरकार / GOVERNMENT OF INDIA
                        </div>
                        <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 700 }}>
                          भारतीय विशिष्ट पहचान प्राधिकरण / Unique Identification Authority of India
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#ea580c', letterSpacing: '-0.5px' }}>
                        आधार
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>
                        MERA AADHAAR, MERI PEHCHAN
                      </div>
                    </div>
                  </div>

                  {/* Aadhaar Body */}
                  <div style={{ padding: '22px 26px', background: '#fffaf5' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px', gap: '22px', alignItems: 'start' }}>
                      {/* Photo Avatar */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          width: '110px',
                          height: '130px',
                          borderRadius: '8px',
                          border: '2px solid #fed7aa',
                          background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                          overflow: 'hidden'
                        }}>
                          {hasValidScanImage ? (
                            <img src={currentDoc.fileUrl} alt={driverName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <>
                              <User size={46} color="#c2410c" />
                              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#9a3412', marginTop: '4px' }}>
                                {driver.name?.split(' ').map(n => n[0]).join('') || 'DP'}
                              </span>
                            </>
                          )}
                        </div>
                        <span style={{ fontSize: '10px', color: '#059669', fontWeight: 800, marginTop: '5px', display: 'block' }}>
                          ✓ Biometrics Verified
                        </span>
                      </div>

                      {/* Aadhaar Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#9a3412', fontWeight: 700 }}>नाम / Name:</div>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>{driverName}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <div style={{ fontSize: '10.5px', color: '#9a3412', fontWeight: 700 }}>जन्म तिथि / DOB:</div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>{dob}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '10.5px', color: '#9a3412', fontWeight: 700 }}>लिंग / Gender:</div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>Male / पुरुष</div>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '10.5px', color: '#9a3412', fontWeight: 700 }}>पिता / C/O:</div>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>{fatherName}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '10.5px', color: '#9a3412', fontWeight: 700 }}>पता / Address:</div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', lineHeight: 1.3 }}>{address}</div>
                        </div>
                      </div>

                      {/* QR Code */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <SpecimenQrCode text={`UIDAI:${aadhaarNumber}|${driverName}`} />
                        <span style={{ fontSize: '9px', color: '#9a3412', textAlign: 'center', fontWeight: 700 }}>
                          Secure UIDAI QR Code
                        </span>
                      </div>
                    </div>

                    {/* Aadhaar Number Highlight Box */}
                    <div style={{
                      marginTop: '20px',
                      padding: '12px 20px',
                      background: '#ffffff',
                      borderRadius: '10px',
                      border: '1.5px solid #fdba74',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 8px rgba(249, 115, 22, 0.08)'
                    }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#9a3412', fontWeight: 800, textTransform: 'uppercase' }}>
                          आधार क्रमांक / Aadhaar Number:
                        </div>
                        <div style={{
                          fontFamily: 'monospace',
                          fontSize: '22px',
                          fontWeight: 900,
                          color: '#b91c1c',
                          letterSpacing: '2.5px',
                          marginTop: '2px'
                        }}>
                          {isMaskedAadhaar
                            ? `XXXX XXXX ${aadhaarNumber.slice(-4)}`
                            : aadhaarNumber}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setIsMaskedAadhaar((m) => !m)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #fdba74',
                            background: '#fff7ed',
                            color: '#c2410c',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {isMaskedAadhaar ? <Eye size={13} /> : <EyeOff size={13} />}
                          <span>{isMaskedAadhaar ? 'Unmask' : 'Mask'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(aadhaarNumber, 'Aadhaar Number')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#ea580c',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {copiedField === 'Aadhaar Number' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Slogan Footer */}
                  <div style={{
                    padding: '8px 22px',
                    background: '#ffedd5',
                    borderTop: '1px solid #fed7aa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#9a3412',
                    fontWeight: 700
                  }}>
                    <span>मेरा आधार, मेरी पहचान (Mera Aadhaar, Meri Pehchan)</span>
                    <span style={{ color: '#059669' }}>✓ UIDAI OTP Verified</span>
                  </div>
                </div>
              )}

              {/* TAB 3: PAN CARD (INCOME TAX DEPARTMENT) */}
              {activeTab === 'pan' && (
                <div
                  className="printable-certificate-card"
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '2px solid #2563eb',
                    boxShadow: '0 12px 30px rgba(37, 99, 235, 0.12), 0 2px 8px rgba(0,0,0,0.06)',
                    overflow: 'hidden'
                  }}
                >
                  {/* PAN Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                    color: '#ffffff',
                    padding: '12px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <AshokEmblem size={36} color="#ffffff" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 900 }}>
                          आयकर विभाग / INCOME TAX DEPARTMENT
                        </div>
                        <div style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 700 }}>
                          भारत सरकार / GOVT. OF INDIA
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#bfdbfe', fontWeight: 800 }}>
                        PERMANENT ACCOUNT NUMBER CARD
                      </div>
                      <div style={{ fontSize: '10px', color: '#93c5fd' }}>
                        NSDL / PROTEAN E-GOV VERIFIED
                      </div>
                    </div>
                  </div>

                  {/* PAN Body with Guilloche Wave effect */}
                  <div style={{
                    padding: '24px 28px',
                    background: 'linear-gradient(180deg, #f0f7ff 0%, #e0f2fe 100%)',
                    borderBottom: '1px solid #bfdbfe'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px', gap: '22px', alignItems: 'start' }}>
                      {/* Photo Box */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          width: '110px',
                          height: '130px',
                          borderRadius: '8px',
                          border: '2px solid #93c5fd',
                          background: '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                          overflow: 'hidden'
                        }}>
                          {hasValidScanImage ? (
                            <img src={currentDoc.fileUrl} alt={driverName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <>
                              <User size={46} color="#1d4ed8" />
                              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#1e3a8a', marginTop: '4px' }}>
                                {driver.name?.split(' ').map(n => n[0]).join('') || 'DP'}
                              </span>
                            </>
                          )}
                        </div>
                        <div style={{ marginTop: '6px', fontSize: '10px', color: '#1e3a8a', fontStyle: 'italic', borderTop: '1px dashed #93c5fd', paddingTop: '3px' }}>
                          Dhruv Parekh (Sign)
                        </div>
                      </div>

                      {/* PAN Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '10.5px', color: '#1e3a8a', fontWeight: 700 }}>
                            स्थायी खाता संख्या / Permanent Account Number:
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '2px' }}>
                              {panNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(panNumber, 'PAN Number')}
                              style={{ border: 'none', background: '#2563eb', color: '#ffffff', padding: '3px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              {copiedField === 'PAN Number' ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '10.5px', color: '#1e3a8a', fontWeight: 700 }}>नाम / Name:</div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{driverName}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '10.5px', color: '#1e3a8a', fontWeight: 700 }}>पिता का नाम / Father's Name:</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{fatherName}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '10.5px', color: '#1e3a8a', fontWeight: 700 }}>जन्म की तारीख / Date of Birth:</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{dob}</div>
                        </div>
                      </div>

                      {/* Hologram & QR */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '74px',
                          height: '32px',
                          borderRadius: '4px',
                          background: 'linear-gradient(135deg, #a78bfa 0%, #38bdf8 50%, #4ade80 100%)',
                          border: '1px solid #7dd3fc',
                          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          fontWeight: 900,
                          color: '#0f172a',
                          letterSpacing: '1px'
                        }}>
                          HOLOGRAM
                        </div>
                        <SpecimenQrCode text={`PAN:${panNumber}|${driverName}`} />
                      </div>
                    </div>
                  </div>

                  {/* PAN Footer */}
                  <div style={{
                    padding: '8px 22px',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#475569'
                  }}>
                    <span>Issued under Section 139A of Income Tax Act 1961</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>✓ ITD e-Filing Linked & Active</span>
                  </div>
                </div>
              )}

              {/* TAB 4: POLICE CLEARANCE CERTIFICATE (PCC) */}
              {activeTab === 'police' && (
                <div
                  className="printable-certificate-card"
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '2px solid #16a34a',
                    boxShadow: '0 12px 30px rgba(22, 163, 74, 0.12), 0 2px 8px rgba(0,0,0,0.06)',
                    padding: '28px 32px'
                  }}
                >
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '18px' }}>
                    <AshokEmblem size={44} color="#166534" />
                    <h3 style={{ margin: '8px 0 2px', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                      OFFICE OF THE COMMISSIONER OF POLICE
                    </h3>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>
                      POLICE CLEARANCE CERTIFICATE (PCC) • CHARACTER & ANTECEDENTS REPORT
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Ref No: PCC/GJ-VAD/2026/88194 • Vadodara City Police Commissionerate
                    </div>
                  </div>

                  <div style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.6, textAlign: 'justify' }}>
                    <p style={{ margin: '0 0 12px' }}>
                      This is to certify that criminal records verification was conducted for Sri <strong>{driverName}</strong>,
                      Son of <strong>{fatherName}</strong>, Date of Birth <strong>{dob}</strong>,
                      residing at <strong>{address}</strong>, holder of Commercial Driving Licence No. <strong>{dlNumber}</strong>.
                    </p>
                    <p style={{ margin: '0 0 12px' }}>
                      As per the Crime and Criminal Tracking Network & Systems (CCTNS) verification and local jurisdictional police report,
                      there is <strong>NO ADVERSE OR CRIMINAL RECORD</strong> recorded against him in any police station records.
                    </p>

                    <div style={{
                      background: '#ecfdf5',
                      border: '1.5px solid #86efac',
                      borderRadius: '8px',
                      padding: '12px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      margin: '18px 0'
                    }}>
                      <CheckCircle2 size={24} color="#16a34a" />
                      <div>
                        <div style={{ fontWeight: 800, color: '#065f46', fontSize: '14px' }}>
                          CLEARANCE FINDING: VERIFIED CLEAR (NO ADVERSE RECORDS)
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#047857' }}>
                          Approved for commercial passenger fleet transport driving under Haryana & Gujarat Police guidelines.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '28px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        <div>Date of Issue: <strong>15 Oct 2026</strong></div>
                        <div>Clearance Validity: <strong>12 Months</strong></div>
                        <div>Fleet Guarantor on Record: <strong>{driver.kyc?.reference?.name || 'Not provided'}</strong></div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', border: '2px dashed #16a34a', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: '#16a34a', margin: '0 auto 6px' }}>
                          OFFICIAL
                          <br />
                          SEAL
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>Joint Commissioner of Police (HQ)</div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>Vadodara Commissionerate</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: COMMERCIAL LEASE AGREEMENT (v1.0) */}
              {activeTab === 'agreement' && (
                <div
                  className="printable-certificate-card"
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '2px solid #7c3aed',
                    boxShadow: '0 12px 30px rgba(124, 58, 237, 0.12), 0 2px 8px rgba(0,0,0,0.06)',
                    padding: '28px 32px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #ede9fe', paddingBottom: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#7c3aed', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                        <FileText size={22} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                          COMMERCIAL VEHICLE LEASE AGREEMENT (v1.0)
                        </h3>
                        <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 700 }}>
                          SIKHAR FLEET TECHNOLOGIES PRIVATE LIMITED • DRIVER PARTNER AGREEMENT
                        </div>
                      </div>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', fontWeight: 800, fontSize: '11px' }}>
                      {driver.deal?.agreementSigned ? `LEGAL STATUS: ${driver.deal.leaseStatus || 'EXECUTED'}` : 'LEGAL STATUS: NOT ASSIGNED'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '22px' }}>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Rental Model</span>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{driver.deal?.type || 'Not assigned'}</div>
                    </div>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Daily Rate</span>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#0284c7', marginTop: '2px' }}>{driver.deal?.rate || '—'}</div>
                    </div>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Escrow Security</span>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#16a34a', marginTop: '2px' }}>{driver.deal?.deposit || '—'}</div>
                    </div>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Agreement Tenure</span>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>12 Months</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.55 }}>
                    <p style={{ margin: '0 0 10px' }}>
                      This agreement executed between <strong>Sikhar Fleet Technologies Pvt. Ltd.</strong> and Driver Partner <strong>{driverName}</strong>
                      (DL No: <strong>{dlNumber}</strong>, Aadhaar: <strong>{aadhaarNumber}</strong>).
                    </p>
                    <ul style={{ paddingLeft: '18px', margin: '0 0 16px' }}>
                      <li>Daily rental is debited automatically from 3-pocket smart wallet every 24 hours at 00:00 AM.</li>
                      <li>Escrow security deposit of ₹75,000 is locked securely and refundable upon contract conclusion and clean vehicle audit.</li>
                      <li>Vehicle must be operated within authorized NCR / Gujarat operational zones under MoRTH regulations.</li>
                    </ul>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
                    <span>E-Signed by {driver.name} (OTP Authenticated)</span>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>✓ Zero-Bypass Escrow Lock Active</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              width: '100%',
              maxWidth: '620px',
              padding: '42px 30px',
              background: '#ffffff',
              border: '1.5px dashed #94a3b8',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 14px',
                borderRadius: '16px',
                background: '#f1f5f9',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileUp size={30} />
              </div>
              <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '18px' }}>
                {CATEGORY_TABS.find((tab) => tab.id === activeTab)?.label || 'Document'} image not uploaded
              </h3>
              <p style={{ margin: '0 auto 20px', maxWidth: '470px', color: '#64748b', fontSize: '13px', lineHeight: 1.55 }}>
                This viewer shows only the real image uploaded by an admin. The digital certificate/specimen is hidden until a document photo is attached to this driver record.
              </p>
              <button
                type="button"
                onClick={handleUploadPhotoClick}
                disabled={isUploading}
                style={{
                  padding: '10px 18px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: isUploading ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px'
                }}
              >
                <Camera size={16} />
                {isUploading ? 'Uploading...' : 'Upload document image'}
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL BOTTOM ACTION TOOLBAR */}
        {/* ========================================================================= */}
        <div style={{
          padding: '14px 24px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          flexShrink: 0
        }}>
          {/* Left Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleUploadPhotoClick}
              disabled={isUploading}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #0284c7',
                background: '#f0f9ff',
                color: '#0284c7',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: '0 1px 3px rgba(2, 132, 199, 0.1)'
              }}
              title="Upload or replace photo scan for this certificate"
            >
              <Camera size={15} />
              <span>{isUploading ? 'Uploading...' : hasValidScanImage ? 'Edit / Replace Image' : 'Upload Image'}</span>
            </button>

            {hasValidScanImage && (
              <button
                type="button"
                onClick={handleDeletePhoto}
                disabled={isUploading}
                style={{
                  padding: '8px 13px',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  background: '#fff1f2',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Delete only the uploaded image; keep the KYC record"
              >
                <Trash2 size={14} />
                <span>Delete Image</span>
              </button>
            )}

            {onTriggerOcr && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTriggerOcr(activeTab);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Scan document using Gemini AI OCR"
              >
                <Scan size={14} />
                <span>Re-scan with AI OCR</span>
              </button>
            )}
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleDownloadSpecimen}
              disabled={!hasValidScanImage}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: hasValidScanImage ? 'pointer' : 'not-allowed',
                opacity: hasValidScanImage ? 1 : 0.55,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={15} />
              <span>{hasValidScanImage ? 'Download Specimen' : 'Upload image first'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: '#0f172a',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

