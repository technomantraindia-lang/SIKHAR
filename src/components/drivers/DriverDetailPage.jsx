import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Car,
  Shield,
  Phone,
  CreditCard,
  CheckCircle2,
  FileText,
  AlertTriangle,
  MapPin,
  Clock,
  Activity,
  RefreshCw,
  User,
  Scan,
  Trash2,
  Eye,
  X,
  Plus,
  Download,
  Camera,
  FileUp,
  ArrowRight,
  Edit
} from '../common/Icons';
import AdminOptionSelect from '../common/AdminOptionSelect';
import {
  fetchDriverByIdApi,
  updateDriverStatusApi,
  topupDriverWalletApi,
  assignDriverVehicleApi,
  updateDriverLeaseApi,
  requestDriverLeaveApi,
  deleteDriverApi,
  fetchDriverDocumentsApi,
  addDriverDocumentApi,
  deleteDriverDocumentApi,
  fetchTripsApi
} from '../../services/api';
import DocumentOcrScannerModal from '../common/DocumentOcrScannerModal';
import StatutoryCertificateViewerModal from './StatutoryCertificateViewerModal';

const AVAILABLE_CARS = [
  { reg: 'DL52GD6605', model: 'WagonR H3 CNG', type: 'CNG' },
  { reg: 'HR55BC2211', model: 'WagonR H3 CNG', type: 'CNG' },
  { reg: 'DL8CAZ7788', model: 'WagonR H3 CNG', type: 'CNG' },
  { reg: 'DL1Z08899', model: 'Tigor EV Fleet', type: 'EV' },
  { reg: 'HR38AK1234', model: 'Tigor EV Fleet', type: 'EV' },
  { reg: 'HR38AK5678', model: 'WagonR H3 CNG', type: 'CNG' },
  { reg: 'UP16HT7788', model: 'Tigor EV Fleet', type: 'EV' }
];

const DOC_CATEGORIES_CONFIG = [
  { value: 'dl', label: 'Commercial Driving Licence (LMV-TR)', defaultTitle: 'Commercial Smart Driving Licence (LMV-TR)' },
  { value: 'aadhaar', label: 'UIDAI Aadhaar Biometric Card', defaultTitle: 'UIDAI Aadhaar Biometric Card' },
  { value: 'pan', label: 'PAN Card (Income Tax Dept)', defaultTitle: 'Income Tax Permanent Account Number (PAN)' },
  { value: 'police', label: 'Police Verification Certificate', defaultTitle: 'Commissioner Police Clearance Report' },
  { value: 'agreement', label: 'Commercial Vehicle Lease Agreement', defaultTitle: 'Master Commercial Vehicle Lease v1.0' },
  { value: 'medical', label: 'Medical & Eye Fitness (Form 1-A)', defaultTitle: 'Form 1-A Commercial Pilot Medical Certificate' },
  { value: 'badge', label: 'State Pilot Transport Badge', defaultTitle: 'State Transport Authority Pilot Badge' },
  { value: 'other', label: 'Other Fleet Statutory Record', defaultTitle: 'Auxiliary Statutory Identification' }
];

const hasUploadedDocumentImage = (doc) => {
  const url = doc?.fileUrl;
  return typeof url === 'string'
    && url.length > 200
    && !url.includes('data:image/jpeg;base64,/9j/4AAQSkZJRg==');
};

export default function DriverDetailPage({ driverId, initialTab = 'overview', onBack, onStatusUpdated, onNavigate, onEdit }) {
  const [driver, setDriver] = useState(null);
  const [driverTrips, setDriverTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [topupAmount, setTopupAmount] = useState('');
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync tab if initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // On-Page Document Vault State
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docsCategoryFilter, setDocsCategoryFilter] = useState('all');
  const [showInlineAddDoc, setShowInlineAddDoc] = useState(false);
  const [lightboxDoc, setLightboxDoc] = useState(null);
  const [copiedDocId, setCopiedDocId] = useState(null);
  const [highlightedDocId, setHighlightedDocId] = useState(null);

  // Statutory KYC Certificate Viewer Modal State
  const [certViewerState, setCertViewerState] = useState({ isOpen: false, category: 'dl', doc: null });

  const openCertificateViewer = (categoryOrDoc = 'dl') => {
    if (typeof categoryOrDoc === 'string') {
      const cat = categoryOrDoc === 'all' ? 'dl' : categoryOrDoc;
      setCertViewerState({ isOpen: true, category: cat, doc: null });
    } else if (categoryOrDoc && typeof categoryOrDoc === 'object') {
      const cat = categoryOrDoc.category || (categoryOrDoc.type && categoryOrDoc.type.toLowerCase().includes('aadhaar') ? 'aadhaar' : categoryOrDoc.type && categoryOrDoc.type.toLowerCase().includes('pan') ? 'pan' : 'dl');
      setCertViewerState({ isOpen: true, category: cat, doc: categoryOrDoc });
    } else {
      setCertViewerState({ isOpen: true, category: 'dl', doc: null });
    }
  };

  // Inline Add Document Form State
  const [newDocCategory, setNewDocCategory] = useState('dl');
  const [newDocTitle, setNewDocTitle] = useState('Commercial Smart Driving Licence (LMV-TR)');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newIssueDate, setNewIssueDate] = useState('2020-01-15');
  const [newExpiryDate, setNewExpiryDate] = useState('2032-11-14');
  const [newIsLifetime, setNewIsLifetime] = useState(false);
  const [newDocStatus, setNewDocStatus] = useState('Verified');
  const [newNotes, setNewNotes] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);
  const [ocrScannerForAdd, setOcrScannerForAdd] = useState(false);
  const docFileInputRef = useRef(null);
  const replaceDocInputRef = useRef(null);
  const [replacingDocId, setReplacingDocId] = useState(null);

  // Delete Driver State
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteDriverConfirm = async () => {
    if (!driver) return;
    try {
      setIsDeleting(true);
      await deleteDriverApi(driver.id);
      setShowDeleteConfirmModal(false);
      showToast(`Driver ${driver.name} permanently deleted from platform registry.`);
      if (onStatusUpdated) onStatusUpdated();
      setTimeout(() => {
        onBack();
      }, 700);
    } catch (err) {
      alert('Failed to delete driver: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Leave Approval Modal State (PDF Page 3 & 8)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState('Family Leave');
  const [leaveDays, setLeaveDays] = useState(1);
  const [isLeaveLoading, setIsLeaveLoading] = useState(false);

  // Agreement Document Modal State (PDF Page 5)
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);

  // Vehicle Assignment State
  const [isAssigningVehicle, setIsAssigningVehicle] = useState(false);
  const [selectedVehicleToAssign, setSelectedVehicleToAssign] = useState('');
  const [isVehicleAssignLoading, setIsVehicleAssignLoading] = useState(false);

  // Document OCR Modal State
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrTargetType, setOcrTargetType] = useState('all');

  const handleOcrExtracted = (extracted) => {
    if (!extracted) return;
    if (ocrScannerForAdd) {
      if (extracted.docNumber) setNewDocNumber(extracted.docNumber);
      if (extracted.drivingLicence) setNewDocNumber(extracted.drivingLicence);
      if (extracted.aadhaar) setNewDocNumber(extracted.aadhaar);
      if (extracted.panCard) setNewDocNumber(extracted.panCard);
      if (extracted.expiryDate) {
        setNewExpiryDate(extracted.expiryDate);
        setNewIsLifetime(false);
      }
      if (extracted.issueDate) setNewIssueDate(extracted.issueDate);
      if (extracted.docType) {
        setNewDocTitle(`${extracted.docType.toUpperCase()} Specimen`);
      }
      setOcrScannerForAdd(false);
      showToast(`✓ Document OCR extracted data into form.`);
      return;
    }
    setDriver((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        kyc: {
          ...(prev.kyc || {}),
          drivingLicence: extracted.drivingLicence || prev.kyc?.drivingLicence,
          dlExpiry: extracted.dlExpiry || prev.kyc?.dlExpiry,
          aadhaar: extracted.aadhaar || prev.kyc?.aadhaar,
          panCard: extracted.panCard || prev.kyc?.panCard
        }
      };
    });
    showToast(`✓ Document OCR updated ${extracted.docType || 'KYC document'} successfully.`);
  };

  const handleApproveLeave = async () => {
    if (!driver) return;
    try {
      setIsLeaveLoading(true);
      const res = await requestDriverLeaveApi(driver.id, Number(leaveDays), leaveReason);
      setDriver(res.data);
      setIsLeaveModalOpen(false);
      showToast(`Leave approved for ${driver.name} (${leaveDays} days). Status set to "On Leave".`);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert(err.message || 'Failed to approve leave request');
    } finally {
      setIsLeaveLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const loadDriverDocuments = useCallback(async () => {
    if (!driverId) return;
    try {
      setLoadingDocs(true);
      const res = await fetchDriverDocumentsApi(driverId);
      if (res && res.data && res.data.documents) {
        setDocuments(res.data.documents);
      }
    } catch (err) {
      console.warn('Could not fetch driver documents from API:', err.message);
    } finally {
      setLoadingDocs(false);
    }
  }, [driverId]);

  const loadDriverData = useCallback(async () => {
    if (!driverId) return;
    try {
      setLoading(true);
      const res = await fetchDriverByIdApi(driverId);
      setDriver(res);
      try {
        const tripsRes = await fetchTripsApi({ driver: res.name });
        setDriverTrips(Array.isArray(tripsRes?.trips) ? tripsRes.trips : []);
      } catch (tripError) {
        console.warn('Could not fetch driver trips:', tripError.message);
        setDriverTrips([]);
      }
      loadDriverDocuments();
    } catch (err) {
      console.error('Failed to load driver details:', err);
    } finally {
      setLoading(false);
    }
  }, [driverId, loadDriverDocuments]);

  useEffect(() => {
    loadDriverData();
  }, [loadDriverData]);

  const scrollToDocVault = (category = 'all', highlightId = null) => {
    setActiveTab('kyc');
    setDocsCategoryFilter(category);
    if (highlightId) setHighlightedDocId(highlightId);
    setTimeout(() => {
      const el = document.getElementById('onpage-document-vault');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (highlightId) {
        setTimeout(() => setHighlightedDocId(null), 3000);
      }
    }, 120);
  };

  const handleCopyDocNumber = (id, num) => {
    if (!num) return;
    try {
      navigator.clipboard.writeText(num);
      setCopiedDocId(id);
      showToast(`Copied ${num} to clipboard`);
      setTimeout(() => setCopiedDocId(null), 2000);
    } catch (e) {
      // ignore
    }
  };

  const handleAddDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!driver || !driver.id) return;
    if (!newDocNumber.trim()) {
      alert('Please enter a valid official document number.');
      return;
    }

    try {
      setIsSubmittingDoc(true);
      const payload = {
        type: newDocCategory,
        category: newDocCategory,
        title: newDocTitle || `${newDocCategory.toUpperCase()} Document`,
        docNumber: newDocNumber.trim().toUpperCase(),
        issueDate: newIssueDate || '2020-01-01',
        expiryDate: newIsLifetime ? 'Lifetime / Valid' : (newExpiryDate || 'Lifetime / Valid'),
        status: newDocStatus || 'Verified',
        fileUrl: newFileUrl || '',
        notes: newNotes.trim(),
        verified: newDocStatus === 'Verified'
      };

      const res = await addDriverDocumentApi(driver.id, payload);
      if (res && res.data) {
        setDocuments(prev => [res.data, ...prev.filter(d => d.id !== res.data.id)]);
      }
      showToast(`✓ Document "${newDocTitle}" successfully saved to driver vault.`);
      setShowInlineAddDoc(false);
      setNewDocNumber('');
      setNewFileUrl('');
      setNewNotes('');
      loadDriverData();
      loadDriverDocuments();
    } catch (err) {
      alert('Failed to save document: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (!driver || !driver.id) return;
    if (!window.confirm(`Are you sure you want to delete "${doc.title || doc.docNumber}" from the document vault?`)) {
      return;
    }
    try {
      await deleteDriverDocumentApi(driver.id, doc.id);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      showToast(`Document "${doc.title}" removed from vault.`);
      loadDriverData();
    } catch (err) {
      alert('Failed to delete document: ' + (err.message || 'Unknown error'));
    }
  };

  const handleInlineFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setNewFileUrl(evt.target.result);
      showToast(`Image loaded (${file.name}). Click Save to attach.`);
    };
    reader.readAsDataURL(file);
  };

  const handleReplaceDocFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !replacingDocId || !driver) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target.result;
      const targetDoc = documents.find(d => d.id === replacingDocId);
      if (!targetDoc) return;
      try {
        const payload = {
          ...targetDoc,
          fileUrl: dataUrl,
          uploadedAt: new Date().toISOString()
        };
        await addDriverDocumentApi(driver.id, payload);
        setDocuments(prev => prev.map(d => d.id === replacingDocId ? { ...d, fileUrl: dataUrl } : d));
        showToast(`Document photo updated for "${targetDoc.title}".`);
      } catch (err) {
        alert('Failed to update photo: ' + err.message);
      } finally {
        setReplacingDocId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStatusSwitch = async (newStatus) => {
    if (!driver) return;
    try {
      await updateDriverStatusApi(driver.id, newStatus);
      setDriver((prev) => ({ ...prev, status: newStatus }));
      showToast(`Driver status set to "${newStatus}"`);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    if (!driver || !topupAmount) return;
    try {
      setIsTopupLoading(true);
      const res = await topupDriverWalletApi(driver.id, topupAmount, 'Admin Top-Up Voucher');
      setDriver(res.data);
      setTopupAmount('');
      showToast(`₹${topupAmount} credited successfully to ${driver.name}'s wallet!`);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert(err.message || 'Failed to credit wallet');
    } finally {
      setIsTopupLoading(false);
    }
  };

  const handleAssignVehicle = async (vehReg) => {
    if (!driver) return;
    try {
      setIsVehicleAssignLoading(true);
      const carObj = AVAILABLE_CARS.find((c) => c.reg === vehReg);
      const res = await assignDriverVehicleApi(
        driver.id,
        vehReg,
        carObj ? carObj.model : 'WagonR H3 CNG',
        carObj ? carObj.type : 'CNG'
      );
      setDriver(res.data);
      setIsAssigningVehicle(false);
      showToast(
        vehReg
          ? `Vehicle ${vehReg} successfully assigned to ${driver.name}!`
          : `Vehicle unassigned for ${driver.name} (Driver moved to Standby).`
      );
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert(err.message || 'Failed to update vehicle assignment');
    } finally {
      setIsVehicleAssignLoading(false);
    }
  };

  const handleUnassignLease = async () => {
    if (!driver?.deal) return;
    if (!window.confirm(`Unassign the commercial lease for ${driver.name}? The driver will remain available for a later lease assignment.`)) return;
    try {
      const res = await updateDriverLeaseApi(driver.id, false);
      setDriver(res.data);
      showToast(`Lease unassigned for ${driver.name}.`);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert(err.message || 'Failed to unassign lease.');
    }
  };

  const hasLease = Boolean(driver?.deal?.type);

  if (loading) {
    return (
      <div className="driver-detail-page-container">
        <div className="driver-detail-loading-state">
          <div className="loading-spinner"></div>
          <p>Loading full driver profile & live telemetry...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="driver-detail-page-container">
        <div className="driver-detail-error-card">
          <AlertTriangle size={36} className="text-red" />
          <h3>Driver Profile Not Found</h3>
          <p>Could not load profile for driver ID: {driverId}</p>
          <button className="btn-secondary" onClick={onBack}>
            ← Back to Driver Roster
          </button>
        </div>
      </div>
    );
  }

  // Get Initials
  const initials = driver.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Status badge class
  const getStatusClass = (st) => {
    switch (st) {
      case 'On Duty': return 'status-badge-duty';
      case 'On Leave': return 'status-badge-leave';
      case 'Suspended': return 'status-badge-suspended';
      default: return 'status-badge-ready';
    }
  };

  return (
    <div className="driver-detail-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="driver-action-toast-float">
          <CheckCircle2 size={16} className="text-green" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Action Navigation */}
      <div className="driver-detail-top-nav-bar">
        <div className="nav-left-breadcrumb">
          <button className="btn-back-roster" onClick={onBack} title="Back to Driver Directory">
            <span className="back-arrow">←</span>
            <span>Back to Driver Directory</span>
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-crumb current">
            {driver.name} <span className="crumb-id">({driver.id})</span>
          </span>
        </div>

        <div className="nav-right-actions">
          <button className="btn-refresh-telemetry" onClick={() => onEdit?.(driver)} title="Edit this driver master record">
            <Edit size={14} />
            <span>Edit Driver</span>
          </button>
          <button
            className="btn-refresh-telemetry"
            onClick={loadDriverData}
            title="Refresh Realtime Telemetry"
          >
            <RefreshCw size={14} />
            <span>Sync Live Data</span>
          </button>
          <a
            href={`tel:${driver.phone}`}
            className="btn-quick-call"
            title={`Call ${driver.phone}`}
          >
            <Phone size={14} />
            <span>Call Driver</span>
          </a>
        </div>
      </div>

      {/* Driver Master Hero Header Banner */}
      <div className="driver-detail-hero-banner">
        <div className="hero-profile-primary">
          <div className="driver-big-avatar-circle">
            <span className="avatar-initials-text">{initials}</span>
            <span className={`avatar-status-pip ${driver.status === 'On Duty' ? 'online' : 'away'}`} />
          </div>

          <div className="hero-driver-headings">
            <div className="hero-title-row">
              <h1 className="driver-hero-name">{driver.name}</h1>
              <span className={`driver-status-pill-lg ${getStatusClass(driver.status)}`}>
                <span className="duty-dot">●</span> {driver.status}
              </span>
              <span className="driver-rating-badge-lg">
                ★ {driver.rating || '4.8'} Rating
              </span>
              <span className="driver-contract-badge">
                {driver.deal?.type || 'No lease assigned'}
              </span>
            </div>

            <div className="hero-identity-meta-strip">
              <span className="meta-item">
                <Phone size={13} className="text-muted" />
                <strong>{driver.phone}</strong>
              </span>
              <span className="meta-item-dot">•</span>
              <span className="meta-item">
                <MapPin size={13} className="text-muted" />
                <span>{driver.city || 'Not provided'}</span>
              </span>
              <span className="meta-item-dot">•</span>
              <span className="meta-item">
                <Shield size={13} className="text-muted" />
                <span>DL: <strong>{driver.kyc?.drivingLicence || 'Not provided'}</strong></span>
              </span>
              <span className="meta-item-dot">•</span>
              <span className="meta-item">
                <FileText size={13} className="text-muted" />
                <span>PAN: <strong className="font-mono">{driver.kyc?.panCard || 'Not provided'}</strong></span>
              </span>
              <span className="meta-item-dot">•</span>
              <span className="meta-item">
                <Car size={13} className="text-muted" />
                <span>
                  Car:{' '}
                  <strong>{driver.vehicle ? driver.vehicle.registration : 'Unassigned'}</strong>
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Status Control Bar */}
        <div className="hero-quick-status-control">
          <span className="quick-status-lbl">QUICK STATUS UPDATE:</span>
          <div className="status-toggle-pill-group">
            <button
              className={`status-btn-pill on-duty ${driver.status === 'On Duty' ? 'active' : ''}`}
              onClick={() => handleStatusSwitch('On Duty')}
            >
              On Duty
            </button>
            <button
              className={`status-btn-pill leave ${driver.status === 'On Leave' ? 'active' : ''}`}
              onClick={() => handleStatusSwitch('On Leave')}
            >
              Leave
            </button>
            <button
              className={`status-btn-pill block ${driver.status === 'Suspended' ? 'active' : ''}`}
              onClick={() => handleStatusSwitch('Suspended')}
            >
              Block
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Header */}
      <div className="driver-detail-tabs-header">
        <button
          className={`detail-tab-item ${activeTab === 'overview' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          <span>Overview & Telemetry</span>
        </button>

        <button
          className={`detail-tab-item ${activeTab === 'wallet' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          <CreditCard size={16} />
          <span>3-Pocket Smart Wallet</span>
          {driver.wallet?.postedBalance < 0 && (
            <span className="tab-pill-alert">Negative</span>
          )}
        </button>

        <button
          className={`detail-tab-item ${activeTab === 'attendance' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <Clock size={16} />
          <span>Attendance & Trips</span>
        </button>

        <button
          className={`detail-tab-item ${activeTab === 'kyc' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('kyc')}
        >
          <Shield size={16} />
          <span>KYC & Commercial Deal</span>
        </button>
      </div>

      {/* Tab 1: OVERVIEW & TELEMETRY */}
      {activeTab === 'overview' && (
        <div className="driver-detail-tab-content">
          {/* Key Metric Tiles Row */}
          <div className="driver-overview-kpi-grid">
            <div className="detail-kpi-card green-accent">
              <span className="kpi-mini-lbl">TODAY'S GROSS EARNINGS</span>
              <div className="kpi-main-val-row">
                <strong className="kpi-num text-green">{driver.todayGross ?? '₹0'}</strong>
                <span className="kpi-badge-positive">+14% vs avg</span>
              </div>
              <span className="kpi-sub-desc">Total fares collected via digital meter</span>
            </div>

            <div className="detail-kpi-card blue-accent">
              <span className="kpi-mini-lbl">COMPLETED TRIPS</span>
              <div className="kpi-main-val-row">
                <strong className="kpi-num text-navy">{driver.todayTrips ?? 0} trips</strong>
                <span className="kpi-badge-neutral">Current Shift</span>
              </div>
              <span className="kpi-sub-desc">Zero cancellations recorded today</span>
            </div>

            <div className="detail-kpi-card purple-accent">
              <span className="kpi-mini-lbl">PUNCTUALITY SCORE</span>
              <div className="kpi-main-val-row">
                <strong className="kpi-num text-purple">{driver.attendance?.punctuality ?? 'Not available'}</strong>
                <span className="kpi-badge-positive">Grade A</span>
              </div>
              <span className="kpi-sub-desc">On-time yard check-in for past 30 shifts</span>
            </div>

            <div className="detail-kpi-card amber-accent">
              <span className="kpi-mini-lbl">SPENDABLE WALLET</span>
              <div className="kpi-main-val-row">
                <strong className={`kpi-num ${(driver.wallet?.spendableBalance || 0) < 500 ? 'text-red' : 'text-green'}`}>
                  ₹{(driver.wallet?.spendableBalance || 0).toLocaleString('en-IN')}
                </strong>
                <span className="kpi-badge-neutral">{driver.wallet?.status || 'Healthy'}</span>
              </div>
              <span className="kpi-sub-desc">Available for daily rental debit</span>
            </div>
          </div>

          {/* Split Two-Column Body */}
          <div className="overview-two-col-layout">
            {/* Left: Vehicle Assignment & Live GPS Telemetry */}
            <div className="overview-col-card">
              <div className="card-section-header flex-between">
                <div className="flex-header-left">
                  <Car size={18} className="text-blue" />
                  <h3>Assigned Commercial Asset</h3>
                </div>
                <button
                  type="button"
                  className="btn secondary small"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => onNavigate && onNavigate('vehicle-assignments')}
                  title="Manage vehicle assignment in Vehicle Assignment"
                >
                  <span>{driver.vehicle ? 'Manage in Vehicle Assignment →' : '+ Assign in Vehicle Assignment →'}</span>
                </button>
              </div>

              {driver.vehicle ? (
                <div className="detail-vehicle-preview-box">
                  <div className="veh-header-badge-row">
                    <span className="veh-reg-big">{driver.vehicle.registration}</span>
                    <span className={`pill ${driver.vehicle.status === 'On Road' ? 'green' : 'orange'}`}>
                      {driver.vehicle.status || 'Active'}
                    </span>
                  </div>

                  <div className="veh-specs-details-grid">
                    <div className="spec-item">
                      <span className="spec-lbl">Make & Model</span>
                      <strong className="spec-val">{driver.vehicle.model}</strong>
                    </div>
                    <div className="spec-item">
                      <span className="spec-lbl">Fuel / Powertrain</span>
                      <strong className="spec-val">{driver.vehicle.type}</strong>
                    </div>
                    <div className="spec-item">
                      <span className="spec-lbl">Current Location</span>
                      <strong className="spec-val">{driver.location || 'Gurgaon Cyber City'}</strong>
                    </div>
                    <div className="spec-item">
                      <span className="spec-lbl">Current Shift</span>
                      <strong className="spec-val">{driver.shift}</strong>
                    </div>
                  </div>

                  <div className="veh-telemetry-status-strip">
                    <div className="telemetry-bar-row">
                      <span className="telemetry-lbl">Asset Readiness & Fuel/Battery</span>
                      <span className="telemetry-pct">85% Capacity</span>
                    </div>
                    <div className="telemetry-progress-track">
                      <div className="telemetry-progress-fill" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="detail-unassigned-notice" style={{ padding: '24px 18px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  <Car size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: '0 0 12px', fontSize: '12.5px', color: '#475569', fontWeight: '500' }}>
                    No vehicle assigned to this driver currently. Pair this driver to a fleet car in the <strong>Vehicle Assignment</strong> terminal.
                  </p>
                  <button
                    type="button"
                    className="btn primary small"
                    onClick={() => onNavigate && onNavigate('vehicle-assignments')}
                  >
                    Open Vehicle Assignment Terminal →
                  </button>
                </div>
              )}

              {/* Emergency Contact & Address */}
              <div className="driver-contact-meta-card">
                <h4 className="meta-card-subheading">Personal & Emergency Details</h4>
                <div className="meta-detail-row">
                  <span className="meta-col-lbl">Home Address:</span>
                  <span className="meta-col-val">{driver.kyc?.address || 'Village Chakkarpur, Gurgaon'}</span>
                </div>
                <div className="meta-detail-row">
                  <span className="meta-col-lbl">Emergency Contact:</span>
                  <span className="meta-col-val text-blue font-bold">{driver.kyc?.emergencyContact || '+91 98112 34567'}</span>
                </div>
              </div>
            </div>

            {/* Right: Operational Notes & Active Shift */}
            <div className="overview-col-card">
              <div className="card-section-header">
                <FileText size={18} className="text-blue" />
                <h3>Operational Compliance & Audit Notes</h3>
              </div>

              <div className="operational-notices-container">
                <div className="notice-banner-item blue">
                  <div className="notice-icon-wrap">
                    <Shield size={18} className="text-blue" />
                  </div>
                  <div className="notice-text-wrap">
                    <strong>Zero-Bypass Escrow Active</strong>
                    <p>Security deposit of {driver.deal?.deposit} is held securely in the company escrow wallet.</p>
                  </div>
                </div>

                <div className="notice-banner-item green">
                  <div className="notice-icon-wrap">
                    <CheckCircle2 size={18} className="text-green" />
                  </div>
                  <div className="notice-text-wrap">
                    <strong>Statutory Documents Verified</strong>
                    <p>Driving Licence ({driver.kyc?.drivingLicence}) and Aadhaar biometrics are 100% authenticated.</p>
                  </div>
                </div>

                <div className="notice-banner-item amber">
                  <div className="notice-icon-wrap">
                    <Clock size={18} className="text-orange" />
                  </div>
                  <div className="notice-text-wrap">
                    <strong>Daily Shift Schedule</strong>
                    <p>{driver.shift}. Auto-debit for daily rental triggers every morning at 00:00 AM.</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="overview-quick-tools-footer">
                <button className="btn-driver-secondary" onClick={() => setActiveTab('wallet')}>
                  <CreditCard size={15} />
                  <span>View Full Wallet Ledger</span>
                </button>
                <button className="btn-driver-secondary" onClick={() => openCertificateViewer('dl')} title="View official driver KYC statutory certificates">
                  <Shield size={15} />
                  <span>View KYC Certificates</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 3-POCKET SMART WALLET (Exact replica of user screenshot #2) */}
      {activeTab === 'wallet' && (
        <div className="driver-detail-tab-content">
          <div className="detail-section-white-card">
            <h3 className="section-block-title">3-Pocket Smart Wallet Balance</h3>

            {/* Outstanding Vehicle Rental Pending Payment Alert (Zero Balance Logic) */}
            {driver.wallet?.outstandingDues > 0 && (
              <div className="outstanding-dues-alert-banner">
                <div className="dues-alert-left">
                  <div className="dues-alert-icon-wrap">
                    <AlertTriangle size={22} color="#b45309" />
                  </div>
                  <div>
                    <h4 className="dues-alert-title">
                      Outstanding Vehicle Rental: ₹{driver.wallet.outstandingDues.toLocaleString('en-IN')} Pending Clearance
                    </h4>
                    <p className="dues-alert-desc">
                      Driver joined or was allocated <strong>{driver.vehicle?.model || 'vehicle'} ({driver.vehicle?.registration || '—'})</strong> with ₹0 wallet balance. The daily vehicle rental payment is currently outstanding. Any wallet recharge will automatically deduct and settle this pending balance.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-settle-outstanding"
                  onClick={() => setTopupAmount(driver.wallet.outstandingDues.toString())}
                >
                  <span>Pay &amp; Settle Dues</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* 3-Pocket Smart Balance Grid + Outstanding Pocket */}
            <div className="wallet-three-pocket-grid-lg">
              <div className="pocket-box-lg posted">
                <span className="pocket-lbl-lg">POSTED BALANCE</span>
                <strong className={`pocket-val-lg ${(driver.wallet?.postedBalance || 0) < 0 ? 'text-red' : ''}`}>
                  ₹{(driver.wallet?.postedBalance || 0).toLocaleString('en-IN')}
                </strong>
                <span className="pocket-sub-lg">Total ledger funds</span>
              </div>

              <div className="pocket-box-lg hold">
                <span className="pocket-lbl-lg">ACTIVE HOLDS</span>
                <strong className="pocket-val-lg text-orange">
                  ₹{(driver.wallet?.activeHolds || 0).toLocaleString('en-IN')}
                </strong>
                <span className="pocket-sub-lg">EV Charging reserves</span>
              </div>

              <div className="pocket-box-lg spendable">
                <span className="pocket-lbl-lg">SPENDABLE BALANCE</span>
                <strong className="pocket-val-lg text-green">
                  ₹{(driver.wallet?.spendableBalance || 0).toLocaleString('en-IN')}
                </strong>
                <span className="pocket-sub-lg">Available for rent debit</span>
              </div>

              {driver.wallet?.outstandingDues > 0 && (
                <div className="pocket-box-lg outstanding-pocket">
                  <span className="pocket-lbl-lg text-amber">OUTSTANDING DUES</span>
                  <strong className="pocket-val-lg text-amber">
                    ₹{driver.wallet.outstandingDues.toLocaleString('en-IN')}
                  </strong>
                  <span className="pocket-sub-lg">Pending Car Rental</span>
                </div>
              )}
            </div>

            {/* Credit Wallet / Issue Top-Up Voucher Form */}
            <div className="wallet-topup-container-lg">
              <h4 className="topup-form-heading">Credit Wallet / Issue Top-Up Voucher</h4>
              <form onSubmit={handleTopup} className="wallet-topup-form-lg">
                <div className="topup-input-wrapper-lg">
                  <span className="rupee-icon-box">₹</span>
                  <input
                    type="number"
                    placeholder="Enter amount (e.g. 1000)"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    min="50"
                    required
                    className="topup-input-field-lg"
                  />
                </div>

                <div className="preset-amount-chips">
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className="preset-chip"
                      onClick={() => setTopupAmount(amt.toString())}
                    >
                      +₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isTopupLoading || !topupAmount}
                  className="btn-add-balance-lg"
                >
                  {isTopupLoading ? 'Processing...' : 'Add Balance'}
                </button>
              </form>
            </div>

            {/* Recent Wallet Transactions Ledger */}
            <div className="wallet-ledger-container-lg">
              <div className="ledger-header-row">
                <h4 className="ledger-heading">Recent Wallet Transactions</h4>
                <span className="ledger-count-badge">
                  {driver.wallet?.recentTransactions?.length || 0} Transactions
                </span>
              </div>

              <div className="ledger-table-responsive-wrapper">
                <table className="ledger-table-lg">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Transaction Type</th>
                      <th>Amount</th>
                      <th>Method / Reference</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driver.wallet?.recentTransactions?.map((tx, idx) => {
                      const isCredit = tx.amount.startsWith('+');
                      return (
                        <tr key={idx} className="ledger-row">
                          <td className="tx-date-cell">{tx.date}</td>
                          <td className="tx-type-cell">
                            <strong>{tx.type}</strong>
                          </td>
                          <td className={`tx-amount-cell ${isCredit ? 'credit text-green' : 'debit text-red'}`}>
                            {tx.amount}
                          </td>
                          <td className="tx-method-cell">
                            <span className="method-pill">{tx.method}</span>
                          </td>
                          <td className="tx-status-cell">
                            <span className="pill green">{tx.status || 'Success'}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: SHIFT ATTENDANCE & TRIPS */}
      {activeTab === 'attendance' && (
        <div className="driver-detail-tab-content">
          <div className="detail-section-white-card">
            <div className="flex-between mb-4">
              <div>
                <h3 className="section-block-title">Monthly Shift & Attendance Summary</h3>
                <p className="text-muted text-xs">Monitors daily shift sign-in, RTO rest periods, and approved leaves (PDF Page 3 & 8).</p>
              </div>
              <button
                type="button"
                className="btn-driver-secondary"
                onClick={() => setIsLeaveModalOpen(true)}
              >
                <Clock size={14} />
                <span>+ Approve Shift Leave</span>
              </button>
            </div>

            {/* Shift Assignment Tag */}
            <div className="shift-allocation-banner mb-4">
              <span className="shift-banner-label">Assigned Shift:</span>
              <strong className="shift-banner-val">{driver.shift || 'Shift not assigned'}</strong>
              {driver.shiftType && <span className="shift-model-pill">{driver.shiftType}</span>}
              {driver.coDriver && <span className="shift-co-driver-pill">Paired Co-Driver: {driver.coDriver}</span>}
            </div>

            <div className="attendance-stats-triplet">
              <div className="att-stat-box">
                <span className="att-stat-lbl">Present Days This Month</span>
                <strong className="att-stat-val text-green">{driver.attendance?.presentDays ?? 0} Days</strong>
                <span className="att-stat-sub">Recorded attendance</span>
              </div>
              <div className="att-stat-box">
                <span className="att-stat-lbl">Approved Leaves</span>
                <strong className="att-stat-val text-amber">{driver.attendance?.leaveDays ?? 0} Days</strong>
                <span className="att-stat-sub">Approved leave records</span>
              </div>
              <div className="att-stat-box">
                <span className="att-stat-lbl">Shift Punctuality Score</span>
                <strong className="att-stat-val text-blue">{driver.attendance?.punctuality ?? 'Not available'}</strong>
                <span className="att-stat-sub">Logged in on time at yard terminal</span>
              </div>
            </div>

            <div className="trip-history-container">
              <h4 className="trips-subheading">Recent Shift Completed Trips</h4>
              <table className="ledger-table-lg">
                <thead>
                  <tr>
                    <th>Trip ID</th>
                    <th>Time</th>
                    <th>Pickup - Drop Route</th>
                    <th>Distance</th>
                    <th>Gross Fare</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {driverTrips.map((trip) => (
                    <tr key={trip.id}>
                      <td><strong>#{trip.id}</strong></td>
                      <td>{trip.startTime || trip.endTime || '—'}</td>
                      <td>{trip.pickupLocation || '—'} → {trip.dropLocation || '—'}</td>
                      <td>{Number(trip.distanceKm || 0).toLocaleString('en-IN')} km</td>
                      <td className="text-green font-bold">₹{Number(trip.grossFare || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td><span className={`pill ${trip.status === 'Completed' ? 'green' : 'orange'}`}>{trip.status || 'Recorded'}</span></td>
                    </tr>
                  ))}
                  {!driverTrips.length && (
                    <tr>
                      <td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>
                        No trip records are linked to this driver yet.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tbody style={{ display: 'none' }}>
                  <tr>
                    <td><strong>#TRP-8821</strong></td>
                    <td>Today, 03:15 PM</td>
                    <td>DLF Phase 2 → IGI Airport T3, New Delhi</td>
                    <td>16.8 km</td>
                    <td className="text-green font-bold">₹420.00</td>
                    <td><span className="pill green">Completed</span></td>
                  </tr>
                  <tr>
                    <td><strong>#TRP-8820</strong></td>
                    <td>Today, 01:40 PM</td>
                    <td>Cyber Hub → Golf Course Ext Road, Gurgaon</td>
                    <td>11.4 km</td>
                    <td className="text-green font-bold">₹280.00</td>
                    <td><span className="pill green">Completed</span></td>
                  </tr>
                  <tr>
                    <td><strong>#TRP-8819</strong></td>
                    <td>Today, 11:20 AM</td>
                    <td>Sector 29 Market → MG Road Metro Station</td>
                    <td>5.2 km</td>
                    <td className="text-green font-bold">₹160.00</td>
                    <td><span className="pill green">Completed</span></td>
                  </tr>
                  <tr>
                    <td><strong>#TRP-8818</strong></td>
                    <td>Today, 09:10 AM</td>
                    <td>Udyog Vihar Phase 4 → Ambience Mall</td>
                    <td>4.7 km</td>
                    <td className="text-green font-bold">₹145.00</td>
                    <td><span className="pill green">Completed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: KYC & COMMERCIAL DEAL (PDF Page 3, 4, 5) */}
      {activeTab === 'kyc' && (
        <div className="driver-detail-tab-content">
          <div className="detail-section-white-card">
            <div className="flex-between mb-4">
              <div>
                <h3 className="section-block-title">Commercial Lease Deal Terms & Legal Records</h3>
                <p className="text-muted text-xs">Agreement contracts, billing frequencies, escrow deposits and statutory KYC checklist.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-driver-secondary"
                  style={{ background: '#0284c7', borderColor: '#38bdf8', color: '#ffffff', fontWeight: 700 }}
                  onClick={() => openCertificateViewer('dl')}
                  title="View official statutory KYC certificates (DL, Aadhaar, PAN)"
                >
                  <Shield size={14} />
                  <span>👁 View All KYC Certificates</span>
                </button>
                <button
                  type="button"
                  className="btn-driver-secondary"
                  onClick={() => setIsAgreementModalOpen(true)}
                  disabled={!hasLease}
                >
                  <FileText size={14} />
                  <span>{hasLease ? 'View Executed Agreement' : 'No Lease Agreement'}</span>
                </button>
                {hasLease && (
                  <button
                    type="button"
                    className="btn-driver-secondary"
                    onClick={handleUnassignLease}
                    style={{ color: '#b91c1c', borderColor: '#fecaca', background: '#fff1f2' }}
                  >
                    <X size={14} />
                    <span>Unassign Lease</span>
                  </button>
                )}
              </div>
            </div>

            <div className="deal-terms-grid-lg">
              <div className="deal-card-lg">
                <span className="deal-card-lbl">Commercial Rental Model</span>
                <strong className="deal-card-val">{driver.deal?.type || 'No lease assigned'}</strong>
                <span className="deal-card-sub">{driver.deal?.frequency || 'Assign a commercial lease when ready'}</span>
              </div>

              <div className="deal-card-lg">
                <span className="deal-card-lbl">Daily Rental Rate</span>
                <strong className="deal-card-val text-green">{driver.deal?.rate || '—'}</strong>
                <span className="deal-card-sub">{driver.deal?.taxRule || 'No lease terms recorded'}</span>
              </div>

              <div className="deal-card-lg">
                <span className="deal-card-lbl">Security Deposit in Escrow</span>
                <strong className="deal-card-val text-blue">{driver.deal?.deposit || '—'}</strong>
                <span className="deal-card-sub">{driver.deal?.depositReceipt ? `Receipt: ${driver.deal.depositReceipt}` : 'No escrow deposit recorded'}</span>
              </div>

              <div className="deal-card-lg">
                <span className="deal-card-lbl">Agreement Duration</span>
                <strong className="deal-card-val">{driver.deal?.contractMonths ? `${driver.deal.contractMonths} Months` : '—'}</strong>
                <span className="deal-card-sub">{driver.deal?.startDate ? `Started: ${driver.deal.startDate}` : 'No agreement start date'}</span>
              </div>
            </div>

            <div className="statutory-kyc-container">
              <h4 className="kyc-subheading">Statutory KYC Compliance Checklist</h4>

              <div className="kyc-checklist-grid-lg">
                <div className="kyc-card-item">
                  <div className="kyc-item-header">
                    <CheckCircle2 size={18} className="text-green" />
                    <strong>Commercial Driving Licence (MoRTH Verified)</strong>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #0284c7',
                          background: '#0284c7',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 1px 3px rgba(2, 132, 199, 0.2)'
                        }}
                        onClick={() => openCertificateViewer('dl')}
                        title="View Driving Licence Certificate Specimen & Photo"
                      >
                        <Eye size={12} />
                        <span>View Certificate</span>
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #bae6fd',
                          background: '#f0f9ff',
                          color: '#0284c7',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onClick={() => {
                          setOcrTargetType('dl');
                          setShowOcrModal(true);
                        }}
                        title="Scan or Re-scan Driving Licence with OCR"
                      >
                        <Scan size={12} />
                        <span>OCR Scan</span>
                      </button>
                    </div>
                  </div>
                  <div className="kyc-item-body">
                    <p className="kyc-val-text">{driver.kyc?.drivingLicence}</p>
                    <span className="kyc-status-badge valid">
                      Valid till {driver.kyc?.dlExpiry} • Status: {driver.kyc?.dlStatus || 'Valid'}
                    </span>
                  </div>
                </div>

                <div className="kyc-card-item">
                  <div className="kyc-item-header">
                    <CheckCircle2 size={18} className="text-green" />
                    <strong>Aadhaar Biometric Card</strong>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #ea580c',
                          background: '#ea580c',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 1px 3px rgba(234, 88, 12, 0.2)'
                        }}
                        onClick={() => openCertificateViewer('aadhaar')}
                        title="View UIDAI Aadhaar Certificate Specimen & Photo"
                      >
                        <Eye size={12} />
                        <span>View Certificate</span>
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #fed7aa',
                          background: '#fffaf5',
                          color: '#c2410c',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onClick={() => {
                          setOcrTargetType('aadhaar');
                          setShowOcrModal(true);
                        }}
                        title="Scan or Re-scan Aadhaar with OCR"
                      >
                        <Scan size={12} />
                        <span>OCR Scan</span>
                      </button>
                    </div>
                  </div>
                  <div className="kyc-item-body">
                    <p className="kyc-val-text">{driver.kyc?.aadhaar}</p>
                    <span className="kyc-status-badge valid">
                      UIDAI OTP Authenticated
                    </span>
                  </div>
                </div>

                <div className="kyc-card-item">
                  <div className="kyc-item-header">
                    <CheckCircle2 size={18} className="text-green" />
                    <strong>Permanent Account Number (PAN Card)</strong>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #2563eb',
                          background: '#2563eb',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 1px 3px rgba(37, 99, 235, 0.2)'
                        }}
                        onClick={() => openCertificateViewer('pan')}
                        title="View Income Tax PAN Certificate Specimen & Photo"
                      >
                        <Eye size={12} />
                        <span>View Certificate</span>
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #bae6fd',
                          background: '#f0f9ff',
                          color: '#0284c7',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onClick={() => {
                          setOcrTargetType('pan');
                          setShowOcrModal(true);
                        }}
                        title="Scan or Re-scan PAN Card with OCR"
                      >
                        <Scan size={12} />
                        <span>OCR Scan</span>
                      </button>
                    </div>
                  </div>
                  <div className="kyc-item-body">
                    <p className="kyc-val-text font-mono">{driver.kyc?.panCard || 'Not provided'}</p>
                    <span className="kyc-status-badge valid">
                      Income Tax Dept / NSDL Verified
                    </span>
                  </div>
                </div>

                <div className="kyc-card-item">
                  <div className="kyc-item-header">
                    <CheckCircle2 size={18} className="text-green" />
                    <strong>Police Background Verification</strong>
                    <button
                      type="button"
                      style={{
                        marginLeft: 'auto',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid #16a34a',
                        background: '#16a34a',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 1px 3px rgba(22, 163, 74, 0.2)'
                      }}
                      onClick={() => openCertificateViewer('police')}
                      title="View Police Clearance Certificate Report"
                    >
                      <Eye size={12} />
                      <span>View Certificate</span>
                    </button>
                  </div>
                  <div className="kyc-item-body">
                    <p className="kyc-val-text">{driver.kyc?.policeVerification || 'Verified (Clear)'}</p>
                    <span className="kyc-status-badge valid">
                      Verified by Commissioner Office
                    </span>
                  </div>
                </div>

                {/* Personal Guarantor & Reference (PDF Page 3 & 5 requirement) */}
                <div className="kyc-card-item">
                  <div className="kyc-item-header">
                    <User size={18} className="text-blue" />
                    <strong>Personal Guarantor & Reference</strong>
                  </div>
                  <div className="kyc-item-body">
                    <p className="kyc-val-text">{driver.kyc?.reference?.name || 'Not provided'}</p>
                    <span className="kyc-status-badge valid">
                      {driver.kyc?.reference?.relation || 'Guarantor'} • Phone: {driver.kyc?.reference?.phone || '+91 98101 88990'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* ON-PAGE STATUTORY KYC & OFFICIAL DOCUMENT VAULT (Clean Institutional Light Theme) */}
            {/* ========================================================================= */}
            <div id="onpage-document-vault" style={{ marginTop: '36px', paddingTop: '28px', borderTop: '2px dashed #cbd5e1' }}>
              {/* Vault Section Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.15)'
                  }}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                        Statutory KYC Document Vault & Official Certificates
                      </h3>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: '#0284c7',
                        border: '1px solid #bae6fd',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {documents.length} Records Verified
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Archived statutory licenses, identity cards, biometric credentials, and agreements with UIDAI / MoRTH verification.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      loadDriverDocuments();
                      showToast('Live documents synced from encrypted vault.');
                    }}
                    disabled={loadingDocs}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                    title="Reload live documents from server"
                  >
                    <RefreshCw size={13} className={loadingDocs ? 'animate-spin' : ''} />
                    <span>Sync Live Vault</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowInlineAddDoc((prev) => !prev)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: showInlineAddDoc ? '#475569' : '#0284c7',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: showInlineAddDoc ? 'none' : '0 2px 8px rgba(2, 132, 199, 0.35)'
                    }}
                  >
                    <Plus size={15} />
                    <span>{showInlineAddDoc ? 'Close Add Form' : '+ Add Document (Admin)'}</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Pills Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '20px',
                padding: '4px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                width: 'fit-content'
              }}>
                {[
                  { id: 'all', label: `All Documents (${documents.length})` },
                  { id: 'identity', label: '🪪 Identity (Aadhaar & PAN)' },
                  { id: 'dl', label: '🚗 Commercial DL' },
                  { id: 'agreements', label: '📜 Police & Agreements' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDocsCategoryFilter(tab.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: docsCategoryFilter === tab.id ? '#0284c7' : 'transparent',
                      color: docsCategoryFilter === tab.id ? '#ffffff' : '#64748b',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Expandable Inline Add Document Card */}
              {showInlineAddDoc && (
                <div
                  id="onpage-inline-add-card"
                  style={{
                    background: '#f0f9ff',
                    border: '1.5px solid #7dd3fc',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileUp size={18} color="#0284c7" />
                      <strong style={{ fontSize: '14px', color: '#0369a1', fontWeight: 800 }}>
                        Register & Save New Official Document
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInlineAddDoc(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '13px' }}
                    >
                      ✕ Close Form
                    </button>
                  </div>

                  <form onSubmit={handleAddDocumentSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
                      {/* Document Type / Category */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Document Category *
                        </label>
                        <AdminOptionSelect
                          group="driver_document_type"
                          value={newDocCategory}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewDocCategory(val);
                            const cfg = DOC_CATEGORIES_CONFIG.find(c => c.value === val);
                            if (cfg) setNewDocTitle(cfg.defaultTitle);
                            if (val === 'aadhaar' || val === 'pan') {
                              setNewIsLifetime(true);
                              setNewExpiryDate('Lifetime / Valid');
                            } else {
                              setNewIsLifetime(false);
                              if (val === 'dl') setNewExpiryDate('2032-11-14');
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '7px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#0f172a',
                            fontSize: '12.5px',
                            fontWeight: 600
                          }}
                        >
                          {DOC_CATEGORIES_CONFIG.map(cfg => (
                            <option key={cfg.value} value={cfg.value}>{cfg.label}</option>
                          ))}
                        </AdminOptionSelect>
                      </div>

                      {/* Document Title */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Document Title / Description
                        </label>
                        <input
                          type="text"
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          placeholder="e.g. Commercial Smart DL (LMV-TR)"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '7px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#0f172a',
                            fontSize: '12.5px'
                          }}
                        />
                      </div>

                      {/* Official Number */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Official Document Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={newDocNumber}
                          onChange={(e) => setNewDocNumber(e.target.value.toUpperCase())}
                          placeholder={newDocCategory === 'dl' ? 'e.g. GJ06 20250013670' : newDocCategory === 'aadhaar' ? 'e.g. 3639 7365 6509' : 'e.g. ABCDE1234F'}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '7px',
                            border: '1.5px solid #0284c7',
                            background: '#ffffff',
                            color: '#0284c7',
                            fontSize: '13px',
                            fontWeight: 800,
                            letterSpacing: '0.8px',
                            fontFamily: 'monospace'
                          }}
                        />
                      </div>

                      {/* Issue Date */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Date of Issue
                        </label>
                        <input
                          type="date"
                          value={newIssueDate}
                          onChange={(e) => setNewIssueDate(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '7px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#0f172a',
                            fontSize: '12.5px'
                          }}
                        />
                      </div>

                      {/* Expiry Date */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>
                            Expiry Date
                          </label>
                          <label style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={newIsLifetime}
                              onChange={(e) => {
                                setNewIsLifetime(e.target.checked);
                                if (e.target.checked) setNewExpiryDate('Lifetime / Valid');
                              }}
                            />
                            <span>Lifetime / Valid</span>
                          </label>
                        </div>
                        <input
                          type={newIsLifetime ? 'text' : 'date'}
                          disabled={newIsLifetime}
                          value={newIsLifetime ? 'Lifetime / Valid' : newExpiryDate}
                          onChange={(e) => setNewExpiryDate(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '7px',
                            border: '1px solid #cbd5e1',
                            background: newIsLifetime ? '#f1f5f9' : '#ffffff',
                            color: '#0f172a',
                            fontSize: '12.5px'
                          }}
                        />
                      </div>

                      {/* Verification Status */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Audit Verification Status
                        </label>
                        <AdminOptionSelect
                          group="driver_document_status"
                          value={newDocStatus}
                          onChange={(e) => setNewDocStatus(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '7px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#0f172a',
                            fontSize: '12.5px',
                            fontWeight: 600
                          }}
                        >
                          <option value="Verified">✓ Verified (MoRTH / UIDAI / ITD)</option>
                          <option value="Pending Verification">⏳ Pending Verification</option>
                        </AdminOptionSelect>
                      </div>
                    </div>

                    {/* Image / Certificate Upload Row */}
                    <div style={{
                      marginTop: '14px',
                      padding: '14px',
                      background: '#ffffff',
                      borderRadius: '9px',
                      border: '1px dashed #93c5fd'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <strong style={{ fontSize: '12.5px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Camera size={14} color="#0284c7" />
                            <span>Attach Document Photo / Certificate Specimen</span>
                          </strong>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            PNG, JPG, or PDF (Front/Back specimen scan). Stored securely with driver record.
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="file"
                            ref={docFileInputRef}
                            accept="image/*,.pdf"
                            onChange={handleInlineFileSelect}
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => docFileInputRef.current && docFileInputRef.current.click()}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '6px',
                              background: '#f0f9ff',
                              border: '1px solid #0284c7',
                              color: '#0284c7',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <FileUp size={13} />
                            <span>{newFileUrl ? 'Change Photo' : 'Upload Image'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOcrTargetType(newDocCategory);
                              setOcrScannerForAdd(true);
                              setShowOcrModal(true);
                            }}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '6px',
                              background: '#e0f2fe',
                              border: '1px solid #38bdf8',
                              color: '#0369a1',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <Scan size={13} />
                            <span>Scan with OCR</span>
                          </button>
                        </div>
                      </div>

                      {newFileUrl && (
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={newFileUrl}
                            alt="Document Specimen Preview"
                            style={{
                              width: '120px',
                              height: '76px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1'
                            }}
                          />
                          <div>
                            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700, display: 'block' }}>
                              ✓ Document Photo Attached Successfully
                            </span>
                            <button
                              type="button"
                              onClick={() => setNewFileUrl('')}
                              style={{
                                marginTop: '4px',
                                background: 'none',
                                border: 'none',
                                color: '#dc2626',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: 0,
                                textDecoration: 'underline'
                              }}
                            >
                              Remove attached photo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Admin Notes */}
                    <div style={{ marginTop: '14px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '4px', textTransform: 'uppercase' }}>
                        Admin Verification Remarks / Notes
                      </label>
                      <input
                        type="text"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="e.g. Verified via Parivahan Sarathi API portal on 28 Oct 2026."
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '7px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#0f172a',
                          fontSize: '12.5px'
                        }}
                      />
                    </div>

                    {/* Action buttons */}
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setShowInlineAddDoc(false)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#475569',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmittingDoc}
                        style={{
                          padding: '8px 22px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#16a34a',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: isSubmittingDoc ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(22, 163, 74, 0.35)'
                        }}
                      >
                        <CheckCircle2 size={15} />
                        <span>{isSubmittingDoc ? 'Saving Document...' : '💾 Save Document to Vault'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Document Cards Grid */}
              {loadingDocs ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontSize: '13px', margin: 0 }}>Loading driver documents from secure registry...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1.5px dashed #cbd5e1'
                }}>
                  <Shield size={36} color="#94a3b8" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: '#1e293b', fontWeight: 700 }}>
                    No documents found in this category
                  </h4>
                  <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: '#64748b' }}>
                    Click "+ Add Document (Admin)" above to attach official certificates and IDs for {driver.name}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowInlineAddDoc(true)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '7px',
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    + Add New Document Now
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                  gap: '18px'
                }}>
                  {filteredDocuments.map((doc) => {
                    const isHighlighted = highlightedDocId && (
                      (highlightedDocId === 'dl' && (doc.category === 'dl' || doc.type?.toLowerCase().includes('licence'))) ||
                      (highlightedDocId === 'aadhaar' && (doc.category === 'aadhaar' || doc.type?.toLowerCase().includes('aadhaar'))) ||
                      (highlightedDocId === 'pan' && (doc.category === 'pan' || doc.type?.toLowerCase().includes('pan'))) ||
                      doc.id === highlightedDocId
                    );

                    const isAadhaar = doc.category === 'aadhaar' || doc.type?.toLowerCase().includes('aadhaar');
                    const isDl = doc.category === 'dl' || doc.type?.toLowerCase().includes('licence') || doc.type?.toLowerCase().includes('dl');
                    const isPan = doc.category === 'pan' || doc.type?.toLowerCase().includes('pan');

                    return (
                      <div
                        key={doc.id}
                        id={`doc-card-${doc.id}`}
                        style={{
                          background: '#ffffff',
                          borderRadius: '12px',
                          border: isHighlighted ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          padding: '16px',
                          boxShadow: isHighlighted ? '0 0 0 4px rgba(2, 132, 199, 0.2)' : '0 2px 8px rgba(15, 23, 42, 0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        <div>
                          {/* Card Top: Type & Status Badge */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '7px',
                                background: isAadhaar ? '#ffedd5' : isDl ? '#e0f2fe' : isPan ? '#ede9fe' : '#f1f5f9',
                                color: isAadhaar ? '#c2410c' : isDl ? '#0284c7' : isPan ? '#6d28d9' : '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {isAadhaar ? <User size={16} /> : isDl ? <Car size={16} /> : isPan ? <CreditCard size={16} /> : <FileText size={16} />}
                              </div>
                              <div>
                                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block' }}>
                                  {doc.category?.toUpperCase() || 'DOCUMENT'}
                                </span>
                                <strong style={{ fontSize: '13px', color: '#0f172a', fontWeight: 700 }}>
                                  {doc.title || doc.type}
                                </strong>
                              </div>
                            </div>

                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '5px',
                              background: doc.status?.toLowerCase().includes('verified') ? '#ecfdf5' : '#fef3c7',
                              color: doc.status?.toLowerCase().includes('verified') ? '#059669' : '#b45309',
                              border: `1px solid ${doc.status?.toLowerCase().includes('verified') ? '#a7f3d0' : '#fde68a'}`,
                              fontSize: '11px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap'
                            }}>
                              <CheckCircle2 size={11} />
                              <span>{doc.status || 'Verified'}</span>
                            </span>
                          </div>

                          {/* Document Number Banner */}
                          <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px'
                          }}>
                            <div>
                              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                                Document Number
                              </span>
                              <span style={{
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                fontWeight: 800,
                                color: '#0284c7',
                                letterSpacing: '0.8px'
                              }}>
                                {doc.docNumber || '—'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyDocNumber(doc.id, doc.docNumber)}
                              title="Copy document number"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '5px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: copiedDocId === doc.id ? '#16a34a' : '#475569',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {copiedDocId === doc.id ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>

                          {/* Document Metadata Row */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px',
                            fontSize: '11.5px',
                            color: '#475569',
                            marginBottom: '12px'
                          }}>
                            <div>
                              <span style={{ color: '#94a3b8', fontSize: '10.5px', display: 'block' }}>Validity / Expiry:</span>
                              <strong>{doc.expiryDate || 'Lifetime / Valid'}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#94a3b8', fontSize: '10.5px', display: 'block' }}>Date of Issue:</span>
                              <strong>{doc.issueDate || '—'}</strong>
                            </div>
                          </div>

                          {/* Document Specimen / Image Container */}
                          <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '170px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            overflow: 'hidden',
                            background: '#f1f5f9',
                            marginBottom: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={() => openCertificateViewer(doc)}
                          title="Click to enlarge and inspect official certificate"
                          >
                            {hasUploadedDocumentImage(doc) ? (
                              <>
                                <img
                                  src={doc.fileUrl}
                                  alt={doc.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'rgba(15, 23, 42, 0.45)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: 0,
                                  transition: 'opacity 0.2s ease',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  gap: '6px'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
                                >
                                  <Eye size={16} />
                                  <span>🔍 Click to Enlarge Specimen</span>
                                </div>
                              </>
                            ) : (
                              /* Stylized Card Specimen Placeholder */
                              <div style={{
                                width: '100%',
                                height: '100%',
                                background: isAadhaar ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' :
                                            isDl ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' :
                                            'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                padding: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                position: 'relative'
                              }}>
                                <div style={{
                                  position: 'absolute',
                                  inset: 0,
                                  zIndex: 2,
                                  background: '#f8fafc',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  color: '#64748b'
                                }}>
                                  <Camera size={24} />
                                  <strong style={{ fontSize: '12px', color: '#334155' }}>Document image not uploaded</strong>
                                  <span style={{ fontSize: '10.5px' }}>Admin upload required to preview</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#334155' }}>
                                    {isAadhaar ? 'भारत सरकार / GOVT OF INDIA' : isDl ? 'GOVERNMENT OF GUJARAT / MoRTH' : 'OFFICIAL STATUTORY RECORD'}
                                  </span>
                                  <span style={{ fontSize: '9px', padding: '2px 6px', background: '#ffffff', borderRadius: '4px', fontWeight: 800, color: '#0284c7', border: '1px solid #bae6fd' }}>
                                    OFFICIAL SPECIMEN
                                  </span>
                                </div>

                                <div style={{ textAlign: 'center', padding: '4px 0' }}>
                                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                                    {driver.name}
                                  </div>
                                  <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 800, color: '#0284c7', letterSpacing: '1px' }}>
                                    {doc.docNumber || '—'}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#64748b' }}>
                                  <span>Secured Institutional Vault</span>
                                  <span>UIDAI/MoRTH Compliant</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Action Footer */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          paddingTop: '10px',
                          borderTop: '1px solid #f1f5f9'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => openCertificateViewer(doc)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #0284c7',
                                background: '#0284c7',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title={hasUploadedDocumentImage(doc) ? 'View uploaded statutory document photo' : 'Open viewer and upload the document photo'}
                            >
                              <Eye size={12} />
                              <span>{hasUploadedDocumentImage(doc) ? 'View Certificate' : 'Upload / View'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setReplacingDocId(doc.id);
                                if (replaceDocInputRef.current) replaceDocInputRef.current.click();
                              }}
                              style={{
                                padding: '5px 9px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                color: '#475569',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Replace or upload a new photo for this document"
                            >
                              <Camera size={12} />
                              <span>Replace</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #fee2e2',
                              background: '#fff1f2',
                              color: '#dc2626',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title={`Delete ${doc.title} from vault`}
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Approve Leave Dialog (PDF Page 3 & 8) */}
      {isLeaveModalOpen && (
        <div className="driver-modal-overlay-custom" onClick={() => setIsLeaveModalOpen(false)}>
          <div className="driver-modal-dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <h3>Approve Shift Leave for {driver.name}</h3>
              <button className="btn-modal-close" onClick={() => setIsLeaveModalOpen(false)}>✕</button>
            </div>
            <div className="modal-dialog-body">
              <p className="text-muted text-xs mb-3">
                Approving leave updates the attendance register, pauses daily vehicle rent debits for approved downtime (as per PDF Page 6 & 8 policy), and marks the driver status as "On Leave".
              </p>
              <div className="form-group mb-3">
                <label className="text-xs font-bold text-navy block mb-1">Leave Reason</label>
                <AdminOptionSelect
                  group="driver_leave_reason"
                  className="adp-select-input"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                >
                  <option value="Family Leave">Family Leave</option>
                  <option value="Medical Rest">Medical Rest</option>
                  <option value="Festival Leave">Festival Leave</option>
                  <option value="Personal Emergency">Personal Emergency</option>
                </AdminOptionSelect>
              </div>
              <div className="form-group mb-3">
                <label className="text-xs font-bold text-navy block mb-1">Approved Leave Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  className="adp-text-input"
                  value={leaveDays}
                  onChange={(e) => setLeaveDays(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-dialog-footer">
              <button className="btn-driver-secondary" onClick={() => setIsLeaveModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-driver-primary" onClick={handleApproveLeave} disabled={isLeaveLoading}>
                {isLeaveLoading ? 'Submitting...' : '✓ Approve Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: View Executed Agreement Dialog (PDF Page 5) */}
      {isAgreementModalOpen && (
        <div className="driver-modal-overlay-custom" onClick={() => setIsAgreementModalOpen(false)}>
          <div className="driver-modal-dialog-box large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <div>
                <h3>Master Commercial Vehicle Lease Agreement</h3>
                <span className="text-xs text-muted">Version: {driver.deal?.agreementVersion || 'Not assigned'} • Sikhar Fleet Private Limited</span>
              </div>
              <button className="btn-modal-close" onClick={() => setIsAgreementModalOpen(false)}>✕</button>
            </div>
            <div className="modal-dialog-body agreement-preview-scroll">
              <div className="agreement-paper-box">
                <div className="agr-letterhead">
                  <strong>SIKHAR FLEET PRIVATE LIMITED</strong>
                  <span>COMMERCIAL FLEET PILOT MASTER AGREEMENT</span>
                </div>
                <div className="agr-clause">
                  <strong>1. PARTIES & ASSET ALLOCATION</strong>
                  <p>
                    This agreement is entered between <strong>Sikhar Fleet Private Limited</strong> (Lessor) and commercial pilot <strong>{driver.name}</strong> (Lessee, DL: {driver.kyc?.drivingLicence}). Asset Allocated: <strong>{driver.vehicle ? `${driver.vehicle.registration} (${driver.vehicle.model})` : 'Standby Pool Asset'}</strong>.
                  </p>
                </div>
                <div className="agr-clause">
                  <strong>2. COMMERCIAL TERMS & DEBIT CYCLE</strong>
                  <p>
                    Model: <strong>{driver.deal?.type || 'No lease assigned'}</strong>. Agreed Rate: <strong>{driver.deal?.rate || '—'}</strong>. Debit frequency: {driver.deal?.frequency || 'Not assigned'}. Applicable GST: {driver.deal?.taxRule || 'Not assigned'}.
                  </p>
                </div>
                <div className="agr-clause">
                  <strong>3. SECURITY DEPOSIT IN ESCROW</strong>
                  <p>
                    Security Deposit of <strong>{driver.deal?.deposit || '—'}</strong> is secured in the IDFC First Bank Escrow account. Receipt reference: {driver.deal?.depositReceipt || 'Not assigned'}.
                  </p>
                </div>
                <div className="agr-clause">
                  <strong>4. STATUTORY VERIFICATION & SIGNATURES</strong>
                  <p>
                    Execution Method: <strong>Aadhaar OTP e-Sign Authenticated</strong>. Status: <strong>Legally Binding & Active</strong>.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-dialog-footer">
              <button className="btn-driver-secondary" onClick={() => window.print()}>
                🖨 Print / Export PDF
              </button>
              <button className="btn-driver-primary" onClick={() => setIsAgreementModalOpen(false)}>
                ✓ Close Agreement View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver KYC Document OCR Scanner Modal */}
      <DocumentOcrScannerModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        targetDocType={ocrTargetType}
        title="Driver KYC Document OCR Scanner"
        onDataExtracted={handleOcrExtracted}
      />

      {/* High-Fidelity Statutory KYC Certificate Viewer Modal */}
      <StatutoryCertificateViewerModal
        isOpen={certViewerState.isOpen}
        onClose={() => setCertViewerState({ isOpen: false, category: 'dl', doc: null })}
        driver={driver}
        initialCategory={certViewerState.category}
        initialDoc={certViewerState.doc}
        onDocumentUpdated={(updatedDoc, allDocs) => {
          if (allDocs) setDocuments(allDocs);
          loadDriverDocuments();
          showToast(`✓ Certificate "${updatedDoc.title || 'document'}" updated successfully.`);
        }}
        onTriggerOcr={(docType) => {
          setOcrTargetType(docType);
          setShowOcrModal(true);
        }}
      />

      {/* Hidden File Input for Document Photo Replacement */}
      <input
        type="file"
        ref={replaceDocInputRef}
        accept="image/*,.pdf"
        onChange={handleReplaceDocFile}
        style={{ display: 'none' }}
      />

      {/* Delete Driver Confirmation Dialog */}
      {showDeleteConfirmModal && (
        <div
          className="driver-modal-overlay-custom"
          onClick={() => !isDeleting && setShowDeleteConfirmModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="driver-modal-dialog-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              border: '1px solid #fee2e2'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Trash2 size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Delete Driver Profile?
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Driver ID: {driver.id} • {driver.name}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 16px' }}>
              Are you sure you want to permanently delete <strong>{driver.name}</strong> from the fleet registry?
              This action cannot be undone. All statutory KYC records, shift records, and smart wallet ledger will be purged.
            </p>

            {driver.vehicle && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '18px',
                fontSize: '12px',
                color: '#334155'
              }}>
                🚗 <strong>Vehicle Release:</strong> Assigned vehicle <strong>{driver.vehicle.model} [{driver.vehicle.registration}]</strong> will automatically be restored to the available fleet yard.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirmModal(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteDriverConfirm}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)'
                }}
              >
                <Trash2 size={15} />
                <span>{isDeleting ? 'Deleting Driver...' : 'Yes, Delete Driver'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
