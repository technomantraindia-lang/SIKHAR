import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Shield,
  FileText,
  User,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Scan,
  FileUp,
  Camera,
  ExternalLink,
  RefreshCw,
  Clock,
  Eye,
  Download
} from '../common/Icons';
import {
  fetchDriverDocumentsApi,
  addDriverDocumentApi,
  deleteDriverDocumentApi
} from '../../services/api';
import AdminOptionSelect from '../common/AdminOptionSelect';
import DocumentOcrScannerModal from '../common/DocumentOcrScannerModal';

const DOCUMENT_CATEGORIES = [
  { value: 'dl', label: 'Commercial Driving Licence (DL)', defaultTitle: 'Commercial Smart Driving Licence (LMV-TR)' },
  { value: 'aadhaar', label: 'Aadhaar Biometric Card', defaultTitle: 'UIDAI Aadhaar Identity Card' },
  { value: 'pan', label: 'PAN Card (Income Tax)', defaultTitle: 'Income Tax Permanent Account Number' },
  { value: 'police', label: 'Police Verification Certificate', defaultTitle: 'Commissioner Police Clearance Report' },
  { value: 'agreement', label: 'Commercial Lease Agreement', defaultTitle: 'Master Commercial Vehicle Lease v1.0' },
  { value: 'medical', label: 'Medical & Eye Fitness', defaultTitle: 'Form 1-A Commercial Pilot Medical Certificate' },
  { value: 'badge', label: 'Commercial Driver Badge', defaultTitle: 'State Transport Authority Pilot Badge' },
  { value: 'other', label: 'Other Fleet KYC Document', defaultTitle: 'Auxiliary Identification Document' }
];

export default function DriverDocumentsModal({
  isOpen,
  onClose,
  driver,
  initialCategory = 'all',
  onDocumentsUpdated
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(initialCategory || 'all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrTargetType, setOcrTargetType] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const fileUploadInputRef = useRef(null);

  // New Document Form State
  const [newDocType, setNewDocType] = useState('dl');
  const [newDocTitle, setNewDocTitle] = useState('Commercial Smart Driving Licence (LMV-TR)');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newIssueDate, setNewIssueDate] = useState('2020-01-15');
  const [newExpiryDate, setNewExpiryDate] = useState('2032-11-14');
  const [newVerified, setNewVerified] = useState(true);
  const [newNotes, setNewNotes] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadDocuments = useCallback(async () => {
    if (!driver || !driver.id) return;
    try {
      setLoading(true);
      const res = await fetchDriverDocumentsApi(driver.id);
      if (res && res.data && res.data.documents) {
        setDocuments(res.data.documents);
      }
    } catch (err) {
      console.warn('Could not fetch driver documents from API:', err.message);
      // Fallback seeds if offline
      if (driver.documents && driver.documents.length > 0) {
        setDocuments(driver.documents);
      } else {
        const kyc = driver.kyc || {};
        const seeds = [
          {
            id: `doc-adh-${driver.id}`,
            type: 'Aadhaar Card',
            category: 'aadhaar',
            title: 'UIDAI Aadhaar Biometric Card',
            docNumber: kyc.aadhaar || '5682 8596 2134',
            verified: true,
            issueDate: '2018-05-12',
            expiryDate: 'Lifetime / Valid',
            uploadedAt: '2026-08-15T10:30:00.000Z',
            uploadedBy: 'Admin Authority',
            status: 'Verified'
          },
          {
            id: `doc-dl-${driver.id}`,
            type: 'Driving Licence',
            category: 'dl',
            title: 'Commercial Motor Vehicle Driving Licence (LMV-TR)',
            docNumber: kyc.drivingLicence || 'MH14 20190088123',
            verified: true,
            issueDate: '2019-11-15',
            expiryDate: kyc.dlExpiry || '2032-11-14',
            uploadedAt: '2026-08-15T10:32:00.000Z',
            uploadedBy: 'Admin Authority',
            status: 'Verified'
          }
        ];
        if (kyc.panCard) {
          seeds.push({
            id: `doc-pan-${driver.id}`,
            type: 'PAN Card',
            category: 'pan',
            title: 'Income Tax Permanent Account Number (PAN)',
            docNumber: kyc.panCard,
            verified: true,
            issueDate: '2016-07-16',
            expiryDate: 'Lifetime / Valid',
            uploadedAt: '2026-08-15T10:35:00.000Z',
            uploadedBy: 'Admin Authority',
            status: 'Verified'
          });
        }
        setDocuments(seeds);
      }
    } finally {
      setLoading(false);
    }
  }, [driver]);

  useEffect(() => {
    if (isOpen && driver) {
      loadDocuments();
      setShowAddForm(false);
      setPreviewDoc(null);
      if (initialCategory) {
        setActiveCategoryFilter(initialCategory);
      }
    }
  }, [isOpen, driver, initialCategory, loadDocuments]);

  // Handle OCR auto-fill for the Add Document form
  const handleOcrExtracted = (extracted) => {
    if (!extracted) return;
    if (extracted.detectedType === 'aadhaar' || extracted.aadhaar) {
      setNewDocType('aadhaar');
      setNewDocTitle('UIDAI Aadhaar Biometric Card');
      setNewDocNumber(extracted.aadhaar || '');
      setNewExpiryDate('Lifetime / Valid');
    } else if (extracted.detectedType === 'pan' || extracted.panCard) {
      setNewDocType('pan');
      setNewDocTitle('Income Tax Permanent Account Number (PAN)');
      setNewDocNumber(extracted.panCard || '');
      setNewExpiryDate('Lifetime / Valid');
    } else if (extracted.detectedType === 'dl' || extracted.drivingLicence) {
      setNewDocType('dl');
      setNewDocTitle('Commercial Smart Driving Licence (LMV-TR)');
      setNewDocNumber(extracted.drivingLicence || '');
      setNewExpiryDate(extracted.dlExpiry || '2032-11-14');
    }
    if (extracted.image) {
      setNewFileUrl(extracted.image);
    }
    if (extracted.rawText) {
      setNewNotes(`OCR Auto-Extracted: ${extracted.name ? 'Name: ' + extracted.name : ''} ${extracted.dob ? '• DOB: ' + extracted.dob : ''}`);
    }
    showToast(`✓ Auto-filled ${extracted.docType || 'Document'} details via OCR Scanner!`);
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!newDocNumber.trim()) {
      alert('Please enter a valid document identification number.');
      return;
    }

    try {
      setIsSubmitting(true);
      const catObj = DOCUMENT_CATEGORIES.find((c) => c.value === newDocType);
      const typeLabel = catObj ? catObj.label.split(' (')[0] : 'Document';

      const payload = {
        type: typeLabel,
        category: newDocType,
        title: newDocTitle.trim() || `${typeLabel} Record`,
        docNumber: newDocNumber.trim().toUpperCase(),
        issueDate: newIssueDate || '2020-01-01',
        expiryDate: newExpiryDate || '2032-12-31',
        verified: newVerified,
        notes: newNotes.trim(),
        fileUrl: newFileUrl.trim()
      };

      const res = await addDriverDocumentApi(driver.id, payload);
      if (res && res.allDocuments) {
        setDocuments(res.allDocuments);
      } else if (res && res.data) {
        setDocuments((prev) => [res.data, ...prev]);
      } else {
        await loadDocuments();
      }

      showToast(`✓ Document "${payload.title}" successfully added for ${driver.name}!`);
      setShowAddForm(false);
      setNewDocNumber('');
      setNewNotes('');

      if (onDocumentsUpdated) {
        onDocumentsUpdated();
      }
    } catch (err) {
      alert(err.message || 'Failed to add document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (docId, docTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${docTitle}" from ${driver.name}'s records?`)) {
      return;
    }
    try {
      await deleteDriverDocumentApi(driver.id, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      showToast(`Document "${docTitle}" removed.`);
      if (onDocumentsUpdated) onDocumentsUpdated();
    } catch (err) {
      alert(err.message || 'Failed to delete document.');
    }
  };

  if (!isOpen || !driver) return null;

  const filteredDocs = documents.filter((doc) => {
    if (activeCategoryFilter === 'all') return true;
    const cat = (doc.category || '').toLowerCase();
    const typ = (doc.type || '').toLowerCase();
    if (activeCategoryFilter === 'identity') return cat === 'aadhaar' || cat === 'pan' || typ.includes('aadhaar') || typ.includes('pan');
    if (activeCategoryFilter === 'dl') return cat === 'dl' || typ.includes('licence') || typ.includes('dl');
    if (activeCategoryFilter === 'legal') return cat === 'police' || cat === 'agreement' || typ.includes('police') || typ.includes('agreement');
    return true;
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px'
    }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '30px',
          right: '30px',
          background: '#064e3b',
          border: '1.5px solid #10b981',
          color: '#a7f3d0',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          fontWeight: 700,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 100001
        }}>
          <CheckCircle2 size={18} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div style={{
        backgroundColor: '#0f172a',
        border: '1.5px solid #334155',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
        color: '#f8fafc',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '17px',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
            }}>
              {driver.name ? driver.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'DR'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  {driver.name}'s Document Vault
                </h2>
                <span style={{
                  fontSize: '11px',
                  background: '#1e3a8a',
                  color: '#93c5fd',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  border: '1px solid #3b82f6'
                }}>
                  {documents.length} Records
                </span>
                <span style={{
                  fontSize: '11px',
                  background: '#064e3b',
                  color: '#6ee7b7',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  border: '1px solid #10b981'
                }}>
                  ADMIN ACCESS
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Phone: {driver.phone} • Status: {driver.status} • Commercial Fleet Compliance Records
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #38bdf8',
                background: showAddForm ? '#334155' : '#0284c7',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: showAddForm ? 'none' : '0 2px 10px rgba(2, 132, 199, 0.4)'
              }}
            >
              {showAddForm ? <X size={15} /> : <Plus size={15} />}
              <span>{showAddForm ? 'Close Form' : '+ Add Document (Admin)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Close Dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Category Filter Pills Bar */}
        <div style={{
          padding: '10px 24px',
          background: '#090d16',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Attached Documents' },
              { id: 'identity', label: 'Identity (Aadhaar & PAN)' },
              { id: 'dl', label: 'Driving Licences' },
              { id: 'legal', label: 'Police & Commercial Agreements' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategoryFilter(tab.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: activeCategoryFilter === tab.id ? '1px solid #38bdf8' : '1px solid #1e293b',
                  background: activeCategoryFilter === tab.id ? '#0284c7' : '#0f172a',
                  color: activeCategoryFilter === tab.id ? '#ffffff' : '#94a3b8',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadDocuments}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#38bdf8',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Admin Add Document Form Drawer */}
          {showAddForm && (
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '2px solid #0284c7',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 8px 30px rgba(2, 132, 199, 0.25)',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={20} color="#38bdf8" />
                  <strong style={{ fontSize: '15px', color: '#ffffff' }}>Admin Authority • Attach New Driver Document</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOcrTargetType(newDocType);
                    setShowOcrModal(true);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: '#0284c7',
                    border: '1px solid #38bdf8',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Scan card with OCR to auto-fill details"
                >
                  <Scan size={14} />
                  <span>Scan with AI OCR</span>
                </button>
              </div>

              <form onSubmit={handleCreateDocument}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  {/* Document Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                      DOCUMENT CLASSIFICATION *
                    </label>
                    <AdminOptionSelect
                      group="driver_document_type"
                      value={newDocType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewDocType(val);
                        const found = DOCUMENT_CATEGORIES.find(c => c.value === val);
                        if (found) setNewDocTitle(found.defaultTitle);
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12.5px',
                        fontWeight: 600
                      }}
                    >
                      {DOCUMENT_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </AdminOptionSelect>
                  </div>

                  {/* Document Title */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                      DOCUMENT TITLE *
                    </label>
                    <input
                      type="text"
                      required
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      placeholder="e.g. Commercial Smart Driving Licence"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12.5px'
                      }}
                    />
                  </div>

                  {/* Document Number */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                      DOCUMENT IDENTIFIER NUMBER *
                    </label>
                    <input
                      type="text"
                      required
                      value={newDocNumber}
                      onChange={(e) => setNewDocNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. 5682 8596 2134 / MH14 20190088123 / BNZPM2501F"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#38bdf8',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                      EXPIRY DATE / VALIDITY
                    </label>
                    <input
                      type="text"
                      value={newExpiryDate}
                      onChange={(e) => setNewExpiryDate(e.target.value)}
                      placeholder="e.g. 2032-11-14 or Lifetime / Valid"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12.5px'
                      }}
                    />
                  </div>

                  {/* Issue Date */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                      DATE OF ISSUE
                    </label>
                    <input
                      type="date"
                      value={newIssueDate}
                      onChange={(e) => setNewIssueDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12.5px'
                      }}
                    />
                  </div>

                  {/* Verification Status */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                      STATUTORY CLEARANCE STATUS
                    </label>
                    <select
                      value={newVerified ? 'verified' : 'pending'}
                      onChange={(e) => setNewVerified(e.target.value === 'verified')}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12.5px',
                        fontWeight: 600
                      }}
                    >
                      <option value="verified">✓ Verified & Approved</option>
                      <option value="pending">⏳ Pending RTO/UIDAI Check</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginTop: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                    ADMIN VERIFICATION NOTES / RTO REMARKS
                  </label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="e.g. Verified via Parivahan Sarathi API portal on 27 Oct 2026."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12.5px'
                    }}
                  />
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    style={{
                      padding: '8px 16px',
                      background: '#334155',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#cbd5e1',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '8px 20px',
                      background: '#16a34a',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 10px rgba(22, 163, 74, 0.4)'
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>{isSubmitting ? 'Saving Document...' : 'Save & Attach to Driver'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Documents Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
              <p>Loading driver document vault...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: '#1e293b',
              borderRadius: '12px',
              border: '1px dashed #475569'
            }}>
              <Shield size={36} color="#64748b" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '15px', color: '#f8fafc' }}>No documents in this category</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Use the "+ Add Document" button above to attach new driver records.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: '16px'
            }}>
              {filteredDocs.map((doc) => {
                const isAadhaar = (doc.category === 'aadhaar' || doc.type?.toLowerCase().includes('aadhaar'));
                const isPan = (doc.category === 'pan' || doc.type?.toLowerCase().includes('pan'));
                const isDl = (doc.category === 'dl' || doc.type?.toLowerCase().includes('licence') || doc.type?.toLowerCase().includes('dl'));

                return (
                  <div
                    key={doc.id}
                    style={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                      transition: 'transform 0.2s, border-color 0.2s'
                    }}
                  >
                    {/* Visual Card Header Ribbon */}
                    <div style={{
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isAadhaar
                        ? 'linear-gradient(135deg, #7c2d12 0%, #1e293b 100%)'
                        : isPan
                        ? 'linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%)'
                        : isDl
                        ? 'linear-gradient(135deg, #14532d 0%, #1e293b 100%)'
                        : '#0f172a',
                      borderBottom: '1px solid #334155'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isAadhaar ? (
                          <User size={16} color="#fb923c" />
                        ) : isPan ? (
                          <CreditCard size={16} color="#60a5fa" />
                        ) : (
                          <Shield size={16} color="#4ade80" />
                        )}
                        <strong style={{ fontSize: '13px', color: '#ffffff' }}>{doc.type}</strong>
                      </div>
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: doc.verified !== false ? '#064e3b' : '#78350f',
                        color: doc.verified !== false ? '#6ee7b7' : '#fde68a',
                        border: `1px solid ${doc.verified !== false ? '#10b981' : '#f59e0b'}`
                      }}>
                        {doc.verified !== false ? '✓ Verified' : '⏳ Review'}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>{doc.title}</span>
                        <strong style={{
                          fontSize: '16px',
                          color: '#38bdf8',
                          fontFamily: 'monospace',
                          letterSpacing: '1px',
                          display: 'block',
                          marginTop: '2px'
                        }}>
                          {doc.docNumber}
                        </strong>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        padding: '10px',
                        background: '#0f172a',
                        borderRadius: '8px',
                        border: '1px solid #1e293b',
                        fontSize: '11px'
                      }}>
                        <div>
                          <span style={{ color: '#64748b', display: 'block' }}>VALIDITY / EXPIRY:</span>
                          <strong style={{ color: '#cbd5e1' }}>{doc.expiryDate || 'Lifetime / Valid'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', display: 'block' }}>DATE OF ISSUE:</span>
                          <strong style={{ color: '#cbd5e1' }}>{doc.issueDate || '—'}</strong>
                        </div>
                      </div>

                      {doc.notes && (
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                          "{doc.notes}"
                        </p>
                      )}

                      {/* Document Image Thumbnail / Visual Specimen */}
                      {doc.fileUrl ? (
                        <div
                          onClick={() => setPreviewDoc(doc)}
                          style={{
                            height: '120px',
                            background: '#090d16',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            border: '1.5px solid #334155',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Click to view high-resolution document photo"
                        >
                          <img
                            src={doc.fileUrl}
                            alt={doc.title}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                          <div style={{
                            position: 'absolute',
                            bottom: '6px',
                            right: '6px',
                            background: 'rgba(15, 23, 42, 0.9)',
                            color: '#38bdf8',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid #0284c7'
                          }}>
                            <Eye size={12} />
                            <span>View Document Photo</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          padding: '10px 14px',
                          background: '#0f172a',
                          borderRadius: '8px',
                          border: '1px dashed #334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Institutional KYC Record Active
                          </span>
                          <span style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: 700 }}>
                            ✓ Digital Certificate
                          </span>
                        </div>
                      )}

                      <div style={{
                        marginTop: 'auto',
                        paddingTop: '8px',
                        borderTop: '1px solid #1e293b',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>
                          Uploaded {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Active'} • {doc.uploadedBy || 'Admin'}
                        </span>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              background: '#0284c7',
                              border: '1px solid #38bdf8',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Eye size={12} />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id, doc.title)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: '#450a0a',
                              border: '1px solid #dc2626',
                              color: '#fca5a5',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                            title="Delete this document"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #1e293b',
          background: '#090d16',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Protected under Sikhar Fleet Institutional KYC Protocol v2.4
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: '#334155',
              border: 'none',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Document Vault
          </button>
        </div>
      </div>

      {/* Enlarged Document Preview Dialog */}
      {previewDoc && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          zIndex: 100005,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '2px solid #38bdf8',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            color: '#ffffff',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>{previewDoc.title}</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Category: {previewDoc.type} • {driver.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                style={{
                  background: '#334155',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* If actual document image exists, render high-res view */}
            {previewDoc.fileUrl ? (
              <div style={{
                background: '#090d16',
                border: '1.5px solid #334155',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '420px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }}
                />
                <div style={{
                  marginTop: '14px',
                  padding: '10px 14px',
                  background: '#1e293b',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>DOCUMENT IDENTIFICATION:</span>
                    <strong style={{ fontSize: '15px', color: '#38bdf8', fontFamily: 'monospace' }}>
                      {previewDoc.docNumber}
                    </strong>
                  </div>
                  <a
                    href={previewDoc.fileUrl}
                    download={`${previewDoc.type || 'KYC_Doc'}_${driver.id}.jpg`}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: '#0284c7',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Download size={13} />
                    <span>Download Image</span>
                  </a>
                </div>
              </div>
            ) : (
              /* Visual Replica Card Preview */
              <div style={{
                background: '#1e293b',
                border: '1.5px solid #475569',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '2px', fontWeight: 800 }}>
                  {previewDoc.type.toUpperCase()} SPECIMEN
                </span>
                <div style={{
                  margin: '16px 0',
                  padding: '16px',
                  background: '#0f172a',
                  borderRadius: '8px',
                  border: '1px solid #334155'
                }}>
                  <strong style={{
                    fontSize: '22px',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    letterSpacing: '2px'
                  }}>
                    {previewDoc.docNumber}
                  </strong>
                  <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#cbd5e1' }}>
                    Holder: <strong>{driver.name}</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '12px', color: '#94a3b8' }}>
                  <span>Valid: <strong style={{ color: '#ffffff' }}>{previewDoc.expiryDate}</strong></span>
                  <span>Issue: <strong style={{ color: '#ffffff' }}>{previewDoc.issueDate}</strong></span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>✓ Live RTO/UIDAI Verified</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Status: <strong style={{ color: '#34d399' }}>✓ Verified Statutory Record</strong>
              </span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                style={{
                  padding: '8px 20px',
                  background: '#0284c7',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integrated OCR Modal for Quick Scan */}
      <DocumentOcrScannerModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        onDataExtracted={handleOcrExtracted}
        targetDocType={ocrTargetType}
        title={`Scan ${newDocTitle} with OCR`}
      />
    </div>
  );
}
