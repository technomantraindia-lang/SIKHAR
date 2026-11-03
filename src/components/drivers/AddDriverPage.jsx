import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  User,
  Car,
  Shield,
  CreditCard,
  CheckCircle2,
  FileText,
  AlertTriangle,
  MapPin,
  Clock,
  Plus,
  X,
  Scan,
  Camera,
  FileUp,
  Trash2
} from '../common/Icons';
import { onboardDriverApi, fetchFleetTowerApi, createVehicleApi, scanDocumentWithGeminiApi } from '../../services/api';
import DocumentOcrScannerModal, {
  preprocessImageForOcr,
  parseIndianDocumentOcr
} from '../common/DocumentOcrScannerModal';
import Tesseract from 'tesseract.js';

// Fallback spare assets if network is offline
const FLEET_AVAILABLE_VEHICLES = [
  { reg: 'DL52GD6605', model: 'WagonR H3 CNG', type: 'CNG', image: '/images/wagonr.jpg', status: 'Available', hub: 'Gurgaon Hub' },
  { reg: 'DL1Z08899', model: 'Tigor EV Fleet', type: 'EV', image: '/images/tigor.jpg', status: 'Available', hub: 'Noida Hub' },
  { reg: 'HR55BC2211', model: 'WagonR H3 CNG', type: 'CNG', image: '/images/wagonr.jpg', status: 'Available', hub: 'Gurgaon Hub' },
  { reg: 'HR38AK1234', model: 'Tigor EV Fleet', type: 'EV', image: '/images/tigor.jpg', status: 'Available', hub: 'South Delhi Hub' },
  { reg: 'DL8CAZ7788', model: 'WagonR H3 CNG', type: 'CNG', image: '/images/wagonr.jpg', status: 'Available', hub: 'South Delhi Hub' },
  { reg: 'HR38AK5678', model: 'WagonR H3 CNG', type: 'CNG', image: '/images/wagonr.jpg', status: 'Available', hub: 'North Delhi Hub' },
  { reg: 'UP16HT7788', model: 'Tigor EV Fleet', type: 'EV', image: '/images/tigor.jpg', status: 'Available', hub: 'Noida Hub' }
];

export default function AddDriverPage({ onBack, onDriverCreated }) {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [viewMode, setViewMode] = useState('all'); // 'all' (single page scroll) or 'wizard' (step by step)
  const [otpSent, setOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(true);

  // Document OCR Scanning State
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrTargetType, _setOcrTargetType] = useState('all');
  const [ocrSuccessToast, setOcrSuccessToast] = useState(null);

  // Multi-Document Batch OCR & Storage
  const multiFileInputRef = useRef(null);
  const [attachedDocs, setAttachedDocs] = useState([]);
  const [isBatchOcrProcessing, setIsBatchOcrProcessing] = useState(false);
  const [batchOcrProgress, setBatchOcrProgress] = useState('');

  // Dedicated Statutory KYC Document Images & Save States (DL, Aadhaar, PAN)
  const _dlFileInputRef = useRef(null);
  const _aadhaarFileInputRef = useRef(null);
  const _panFileInputRef = useRef(null);

  const [dlDocImage, setDlDocImage] = useState(null); // { fileUrl, fileName, fileSize, saved: boolean }
  const [aadhaarDocImage, setAadhaarDocImage] = useState(null);
  const [panDocImage, setPanDocImage] = useState(null);

  const _handleSingleDocFileSelect = async (category, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });

      const docInfo = {
        fileUrl: dataUrl,
        fileName: file.name,
        fileSize: `${Math.round(file.size / 1024)} KB`,
        saved: false,
        category
      };

      if (category === 'dl') setDlDocImage(docInfo);
      else if (category === 'aadhaar') setAadhaarDocImage(docInfo);
      else if (category === 'pan') setPanDocImage(docInfo);

      // Auto-extract text in background if field is empty
      try {
        let extracted = null;
        try {
          const geminiData = await scanDocumentWithGeminiApi(dataUrl, category);
          if (geminiData && (geminiData.name || geminiData.drivingLicence || geminiData.aadhaar || geminiData.panCard)) {
            extracted = geminiData;
          }
        } catch {}

        if (!extracted) {
          const preprocessed = await preprocessImageForOcr(dataUrl);
          const tesseractPromise = Tesseract.recognize(preprocessed, 'eng');
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));
          const ocrRes = await Promise.race([tesseractPromise, timeoutPromise]);
          extracted = parseIndianDocumentOcr(ocrRes?.data?.text || '', category) || {};
        }

        if (extracted) {
          if (category === 'aadhaar') {
            setFormData(prev => ({
              ...prev,
              aadhaar: extracted.aadhaar || prev.aadhaar,
              name: extracted.name || prev.name,
              address: extracted.address || prev.address,
              dob: extracted.dob || prev.dob,
              gender: extracted.gender || prev.gender,
              phone: extracted.phone || prev.phone,
              fatherName: extracted.fatherName || prev.fatherName,
              referenceName: extracted.fatherName || prev.referenceName,
              city: extracted.city || prev.city
            }));
          } else if (category === 'pan') {
            setFormData(prev => ({
              ...prev,
              panCard: extracted.panCard || prev.panCard
            }));
          } else if (category === 'dl') {
            setFormData(prev => ({
              ...prev,
              drivingLicence: extracted.drivingLicence || prev.drivingLicence,
              dlExpiry: extracted.dlExpiry || prev.dlExpiry,
              dlCategory: extracted.dlCategory || prev.dlCategory,
              name: prev.name ? prev.name : (extracted.name || '')
            }));
          }

          const summaryParts = [
            category === 'aadhaar' && extracted.aadhaar && `Aadhaar: ${extracted.aadhaar}`,
            category === 'aadhaar' && extracted.name && `Name: ${extracted.name}`,
            category === 'aadhaar' && extracted.address && `Address: ${extracted.address.slice(0, 45)}...`,
            category === 'pan' && extracted.panCard && `PAN: ${extracted.panCard}`,
            category === 'dl' && extracted.drivingLicence && `DL: ${extracted.drivingLicence}`
          ].filter(Boolean).join(' • ');

          if (summaryParts) {
            setOcrSuccessToast(`✓ Auto-Extracted from photo: ${summaryParts}`);
            setTimeout(() => setOcrSuccessToast(null), 6000);
          }
        }
      } catch (ocrErr) {
        console.warn('Silent OCR note:', ocrErr);
      }
    } catch (err) {
      alert('Could not read image: ' + err.message);
    }
    e.target.value = '';
  };

  const _handleSaveSingleDocImage = (category) => {
    let targetDoc = null;
    let label = '';
    let docNumber = '';
    let typeName = '';

    if (category === 'dl' && dlDocImage) {
      setDlDocImage(prev => ({ ...prev, saved: true }));
      targetDoc = dlDocImage;
      label = 'Commercial Driving Licence (DL)';
      typeName = 'Driving Licence';
      docNumber = formData.drivingLicence || 'DL Recorded';
    } else if (category === 'aadhaar' && aadhaarDocImage) {
      setAadhaarDocImage(prev => ({ ...prev, saved: true }));
      targetDoc = aadhaarDocImage;
      label = 'Aadhaar Biometric Card';
      typeName = 'Aadhaar Card';
      docNumber = formData.aadhaar || 'UIDAI Recorded';
    } else if (category === 'pan' && panDocImage) {
      setPanDocImage(prev => ({ ...prev, saved: true }));
      targetDoc = panDocImage;
      label = 'PAN Card';
      typeName = 'PAN Card';
      docNumber = formData.panCard || 'PAN Recorded';
    }

    if (!targetDoc) return;

    // Add or update in attachedDocs
    setAttachedDocs(prev => {
      const filtered = prev.filter(d => d.category !== category && d.type !== category);
      return [
        ...filtered,
        {
          id: `doc-${category}-${Date.now()}`,
          title: `${label} Specimen`,
          type: typeName,
          category: category,
          docNumber: docNumber,
          fileUrl: targetDoc.fileUrl,
          fileSize: targetDoc.fileSize,
          uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          verified: true,
          status: 'Verified (Admin Saved)'
        }
      ];
    });

    setOcrSuccessToast(`✓ ${label} image successfully saved & attached to Driver KYC Vault!`);
    setTimeout(() => setOcrSuccessToast(null), 5000);
  };

  const _handleRemoveSingleDocImage = (category) => {
    if (category === 'dl') setDlDocImage(null);
    else if (category === 'aadhaar') setAadhaarDocImage(null);
    else if (category === 'pan') setPanDocImage(null);

    setAttachedDocs(prev => prev.filter(d => d.category !== category && d.type !== category));
  };

  const handleOcrDataExtracted = (extracted) => {
    if (!extracted) return;
    const docKind = ocrTargetType !== 'all' ? ocrTargetType : (extracted.detectedType || 'all');

    if (docKind === 'aadhaar') {
      // Strict Aadhaar Mode: Only update Name, Aadhaar number, Address (and DOB/Gender/Phone)
      setFormData(prev => ({
        ...prev,
        aadhaar: extracted.aadhaar || prev.aadhaar,
        name: extracted.name || prev.name,
        address: extracted.address || prev.address,
        dob: extracted.dob || prev.dob,
        gender: extracted.gender || prev.gender,
        phone: extracted.phone || prev.phone,
        fatherName: extracted.fatherName || prev.fatherName,
        referenceName: extracted.fatherName || prev.referenceName,
        city: extracted.city || prev.city
      }));
    } else if (docKind === 'pan') {
      // Strict PAN Mode: Only update PAN Card Number
      setFormData(prev => ({
        ...prev,
        panCard: extracted.panCard || prev.panCard
      }));
    } else if (docKind === 'dl') {
      // Strict Driving Licence Mode: Only update DL Number, Expiry, Category
      setFormData(prev => ({
        ...prev,
        drivingLicence: extracted.drivingLicence || prev.drivingLicence,
        dlExpiry: extracted.dlExpiry || prev.dlExpiry,
        dlCategory: extracted.dlCategory || prev.dlCategory,
        name: prev.name ? prev.name : (extracted.name || '')
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        name: extracted.name || prev.name,
        phone: extracted.phone || prev.phone,
        dob: extracted.dob || prev.dob,
        gender: extracted.gender || prev.gender,
        fatherName: extracted.fatherName || prev.fatherName,
        referenceName: extracted.fatherName || prev.referenceName,
        drivingLicence: extracted.drivingLicence || prev.drivingLicence,
        dlExpiry: extracted.dlExpiry || prev.dlExpiry,
        dlCategory: extracted.dlCategory || prev.dlCategory,
        aadhaar: extracted.aadhaar || prev.aadhaar,
        panCard: extracted.panCard || prev.panCard,
        address: extracted.address || prev.address,
        policeVerification: extracted.policeVerification || prev.policeVerification
      }));
    }

    // If an image was returned from the OCR modal, assign it to the respective document
    if (extracted.image) {
      const targetCat = ocrTargetType === 'all'
        ? (extracted.detectedType === 'dl' || extracted.drivingLicence ? 'dl' : extracted.detectedType === 'aadhaar' || extracted.aadhaar ? 'aadhaar' : extracted.detectedType === 'pan' || extracted.panCard ? 'pan' : 'dl')
        : ocrTargetType;

      const docObj = {
        fileUrl: extracted.image,
        fileName: `${targetCat.toUpperCase()}_Scanned.jpg`,
        fileSize: 'OCR Image',
        saved: true,
        category: targetCat
      };

      if (targetCat === 'dl') setDlDocImage(docObj);
      else if (targetCat === 'aadhaar') setAadhaarDocImage(docObj);
      else if (targetCat === 'pan') setPanDocImage(docObj);

      const typeLabel = targetCat === 'dl' ? 'Driving Licence' : targetCat === 'aadhaar' ? 'Aadhaar Card' : 'PAN Card';
      const docNum = targetCat === 'dl' ? (extracted.drivingLicence || formData.drivingLicence) : targetCat === 'aadhaar' ? (extracted.aadhaar || formData.aadhaar) : (extracted.panCard || formData.panCard);

      setAttachedDocs(prev => {
        const filtered = prev.filter(d => d.category !== targetCat && d.type !== targetCat);
        return [
          ...filtered,
          {
            id: `doc-${targetCat}-${Date.now()}`,
            title: `${typeLabel} Photo`,
            type: typeLabel,
            category: targetCat,
            docNumber: docNum || 'Verified Document',
            fileUrl: extracted.image,
            fileSize: 'OCR Scanned',
            uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            verified: true,
            status: 'Verified (OCR Cleared)'
          }
        ];
      });
    }
    const summary = [
      extracted.name && `Name: ${extracted.name}`,
      extracted.phone && `Mobile: ${extracted.phone}`,
      extracted.dob && `DOB: ${extracted.dob}`,
      extracted.gender && `Gender: ${extracted.gender}`,
      extracted.aadhaar && `Aadhaar: ${extracted.aadhaar}`,
      extracted.drivingLicence && `DL: ${extracted.drivingLicence}`,
      extracted.panCard && `PAN: ${extracted.panCard}`
    ].filter(Boolean).join(' • ');
    setOcrSuccessToast(`✓ Auto-Fetched from ${extracted.docType || 'Document'}: ${summary}`);
    setTimeout(() => setOcrSuccessToast(null), 6000);
  };

  const handleMultiImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsBatchOcrProcessing(true);
    setBatchOcrProgress(`Reading ${files.length} document image${files.length > 1 ? 's' : ''}...`);

    const newDocs = [];
    const mergedFields = {};

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBatchOcrProgress(`Analyzing Image ${i + 1} of ${files.length}: ${file.name}...`);

      try {
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        });

        // Priority 1: Call Google Gemini Multimodal Vision API (if GEMINI_API_KEY in .env)
        let extracted = null;
        let geminiWorked = false;
        try {
          setBatchOcrProgress(`Analyzing Image ${i + 1} with Google Gemini Vision AI...`);
          const geminiData = await scanDocumentWithGeminiApi(dataUrl, 'all');
          if (geminiData && (geminiData.name || geminiData.drivingLicence || geminiData.aadhaar || geminiData.panCard)) {
            extracted = geminiData;
            geminiWorked = true;
          }
        } catch (geminiErr) {
          console.info('Gemini batch note (using local engine):', geminiErr.message);
        }

        // Priority 2: Local Preprocessing & Tesseract OCR Fallback
        if (!geminiWorked) {
          let recognizedText = '';
          try {
            const preprocessed = await preprocessImageForOcr(dataUrl);
            const tesseractPromise = Tesseract.recognize(preprocessed, 'eng');
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 10000)
            );
            const ocrRes = await Promise.race([tesseractPromise, timeoutPromise]);
            recognizedText = ocrRes?.data?.text || '';
          } catch (tessErr) {
            console.warn('Batch OCR note:', tessErr.message);
          }
          extracted = parseIndianDocumentOcr(recognizedText, 'all') || {};
        }

        if (!extracted) extracted = {};

        if (extracted.name && !mergedFields.name) mergedFields.name = extracted.name;
        if (extracted.phone && !mergedFields.phone) mergedFields.phone = extracted.phone;
        if (extracted.dob && !mergedFields.dob) mergedFields.dob = extracted.dob;
        if (extracted.gender && !mergedFields.gender) mergedFields.gender = extracted.gender;
        if (extracted.fatherName && !mergedFields.fatherName) {
          mergedFields.fatherName = extracted.fatherName;
          mergedFields.referenceName = extracted.fatherName;
        }
        if (extracted.drivingLicence && !mergedFields.drivingLicence) mergedFields.drivingLicence = extracted.drivingLicence;
        if (extracted.dlExpiry && !mergedFields.dlExpiry) mergedFields.dlExpiry = extracted.dlExpiry;
        if (extracted.dlCategory && !mergedFields.dlCategory) mergedFields.dlCategory = extracted.dlCategory;
        if (extracted.aadhaar && !mergedFields.aadhaar) mergedFields.aadhaar = extracted.aadhaar;
        if (extracted.panCard && !mergedFields.panCard) mergedFields.panCard = extracted.panCard;
        if (extracted.address && !mergedFields.address) mergedFields.address = extracted.address;

        let docType = extracted.detectedType || 'other';
        let docTitle = file.name;
        if (docType === 'dl' || extracted.drivingLicence) {
          docType = 'dl';
          docTitle = `Driving Licence Card (${extracted.drivingLicence || 'DL'})`;
        } else if (docType === 'aadhaar' || extracted.aadhaar) {
          docType = 'aadhaar';
          docTitle = `Aadhaar Card (${extracted.aadhaar ? extracted.aadhaar.slice(-4) : 'UIDAI'})`;
        } else if (docType === 'pan' || extracted.panCard) {
          docType = 'pan';
          docTitle = `PAN Card (${extracted.panCard || 'ITD'})`;
        } else {
          docTitle = `Driver KYC Document (${file.name})`;
        }

        const docItem = {
          id: `doc_${Date.now()}_${i}`,
          title: docTitle,
          type: docType,
          category: docType,
          docNumber: docType === 'dl' ? (extracted.drivingLicence || '') : docType === 'aadhaar' ? (extracted.aadhaar || '') : (extracted.panCard || ''),
          fileUrl: dataUrl,
          fileSize: `${Math.round(file.size / 1024)} KB`,
          uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          verified: true,
          status: 'Verified (OCR Cleared)',
          extractedData: extracted
        };

        newDocs.push(docItem);

        if (docType === 'dl') setDlDocImage({ fileUrl: dataUrl, fileName: file.name, fileSize: docItem.fileSize, saved: true, category: 'dl' });
        if (docType === 'aadhaar') setAadhaarDocImage({ fileUrl: dataUrl, fileName: file.name, fileSize: docItem.fileSize, saved: true, category: 'aadhaar' });
        if (docType === 'pan') setPanDocImage({ fileUrl: dataUrl, fileName: file.name, fileSize: docItem.fileSize, saved: true, category: 'pan' });
      } catch (err) {
        console.warn('Error reading file:', file.name, err);
      }
    }

    setFormData((prev) => ({
      ...prev,
      ...mergedFields
    }));

    setAttachedDocs((prev) => [...prev, ...newDocs]);
    setIsBatchOcrProcessing(false);
    setBatchOcrProgress('');

    const toastSummary = [
      mergedFields.name && `Name: ${mergedFields.name}`,
      mergedFields.phone && `Mobile: ${mergedFields.phone}`,
      mergedFields.drivingLicence && `DL: ${mergedFields.drivingLicence}`,
      mergedFields.aadhaar && `Aadhaar: ${mergedFields.aadhaar}`,
      mergedFields.dob && `DOB: ${mergedFields.dob}`
    ].filter(Boolean).join(' • ');

    setOcrSuccessToast(
      `✓ Processed ${files.length} Document Images! Auto-Filled: ${toastSummary || 'KYC Information'}. Saved to Driver Document Vault.`
    );
    setTimeout(() => setOcrSuccessToast(null), 8000);

    if (multiFileInputRef.current) {
      multiFileInputRef.current.value = '';
    }
  };

  const handleRotateAttachedDoc = async (docIndex) => {
    const doc = attachedDocs[docIndex];
    if (!doc || !doc.fileUrl) return;
    try {
      const rotatedUrl = await preprocessImageForOcr(doc.fileUrl, 90);
      setAttachedDocs((prev) => {
        const next = [...prev];
        next[docIndex] = { ...next[docIndex], fileUrl: rotatedUrl };
        return next;
      });
      // Re-run OCR with Gemini Vision or Local Engine
      try {
        let extracted = null;
        try {
          const geminiData = await scanDocumentWithGeminiApi(rotatedUrl, doc.type);
          if (geminiData && (geminiData.name || geminiData.drivingLicence || geminiData.aadhaar)) {
            extracted = geminiData;
          }
        } catch (gErr) {
          console.info('Rotated Gemini note:', gErr.message);
        }

        if (!extracted) {
          const tesseractPromise = Tesseract.recognize(rotatedUrl, 'eng');
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 8000)
          );
          const ocrRes = await Promise.race([tesseractPromise, timeoutPromise]);
          const recognized = ocrRes?.data?.text || '';
          extracted = parseIndianDocumentOcr(recognized, doc.type) || {};
        }

        if (extracted && (extracted.name || extracted.drivingLicence || extracted.aadhaar || extracted.phone)) {
          setFormData((prev) => ({
            ...prev,
            name: extracted.name || prev.name,
            phone: extracted.phone || prev.phone,
            drivingLicence: extracted.drivingLicence || prev.drivingLicence,
            aadhaar: extracted.aadhaar || prev.aadhaar,
            dob: extracted.dob || prev.dob,
            gender: extracted.gender || prev.gender,
            fatherName: extracted.fatherName || prev.fatherName,
            address: extracted.address || prev.address
          }));
        }
      } catch (err) {
        console.warn('Rotated OCR warning:', err);
      }
    } catch (err) {
      console.warn('Rotation error:', err);
    }
  };

  const handleRemoveAttachedDoc = (docIndex) => {
    setAttachedDocs((prev) => prev.filter((_, idx) => idx !== docIndex));
  };

  const [formData, setFormData] = useState({
    name: '',
    dob: '1986-07-16',
    gender: 'Male',
    fatherName: '',
    phone: '',
    altPhone: '',
    city: 'Gurgaon Operations Hub',
    address: '',
    emergencyContact: '',
    emergencyRelation: 'Brother',
    // Reference / Guarantor (PDF Step 01)
    referenceName: 'Suresh Verma',
    referencePhone: '98101 88990',
    referenceRelation: 'Guarantor',
    referenceAddress: 'Sector 14, Gurgaon',
    // Statutory KYC (PDF Page 3 & 4)
    drivingLicence: '',
    dlExpiry: '2030-11-14',
    dlCategory: 'Commercial LMV',
    aadhaar: '',
    panCard: '',
    policeVerification: 'Verified (Clear)',
    kycReviewStatus: 'Verified',
    // Commercial Deal Terms (PDF Step 02 & 04)
    rentalModel: 'Fixed Daily Rental',
    agreedRate: '1000',
    securityDeposit: '75000',
    contractMonths: 12,
    billingFrequency: 'Daily Debit (00:00 hrs)',
    taxRule: 'GST 5% (Commercial Passenger Transport)',
    // 12-Hour Shift Specifics
    shiftType: 'Day Shift (06:00 AM - 06:00 PM)',
    coDriver: 'Sandeep Kumar (Shared)',
    // Agreement Signing (PDF Step 04)
    agreementVersion: 'v1.0 (Master Commercial Lease)',
    agreementSigned: true,
    signingMethod: 'Digital Aadhaar e-Sign',
    // Deposit Confirmation (PDF Step 05)
    depositMode: 'Bank Transfer (Escrow)',
    depositReceiptNumber: 'UTR-89127632',
    depositConfirmed: true,
    // Vehicle Asset Allocation (PDF Step 06)
    selectedVehicleReg: 'DL52GD6605',
    handoverOdometer: '45,210',
    handoverKeys: true,
    handoverQcPassed: true,
    initialBalance: 0
  });

  const [fleetVehicles, setFleetVehicles] = useState(FLEET_AVAILABLE_VEHICLES);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehReg, setNewVehReg] = useState('');
  const [newVehModel, setNewVehModel] = useState('');
  const [newVehType, setNewVehType] = useState('CNG');
  const [newVehOdo, setNewVehOdo] = useState('100');
  const [isSubmittingVeh, setIsSubmittingVeh] = useState(false);

  useEffect(() => {
    async function loadFleet() {
      try {
        const res = await fetchFleetTowerApi('all');
        if (res && res.vehicles && res.vehicles.length > 0) {
          const mapped = res.vehicles.map(v => ({
            reg: v.registration,
            model: v.model,
            type: v.type || 'CNG',
            status: v.status,
            driver: v.driver,
            hub: v.hub || v.location || 'Sikhar Central Yard',
            image: v.type === 'EV' ? '/images/tigor.jpg' : '/images/wagonr.jpg'
          }));
          setFleetVehicles(mapped);
        }
      } catch (e) {
        console.warn('Could not load dynamic fleet in AddDriverPage, using fallback spares:', e);
      }
    }
    loadFleet();
  }, []);

  const selectedVehicleObj = fleetVehicles.find(
    (v) => (v.reg || v.registration) === formData.selectedVehicleReg
  );

  const handleCreateNewVehicle = async (e) => {
    e.preventDefault();
    if (!newVehReg.trim()) {
      alert('Please enter a vehicle registration plate number.');
      return;
    }
    try {
      setIsSubmittingVeh(true);
      const cleanPlate = newVehReg.trim().toUpperCase().replace(/\s+/g, '');
      const payload = {
        registration: cleanPlate,
        model: newVehModel.trim() || 'Commercial Fleet Vehicle',
        type: newVehType,
        odometer: newVehOdo || '100',
        status: 'Ready to Deploy',
        hub: 'Sikhar Central Yard'
      };
      await createVehicleApi(payload);
      const newVehItem = {
        reg: cleanPlate,
        model: payload.model,
        type: payload.type,
        status: 'Ready to Deploy',
        driver: 'Unassigned',
        hub: 'Sikhar Central Yard',
        image: payload.type === 'EV' ? '/images/tigor.jpg' : '/images/wagonr.jpg'
      };
      setFleetVehicles(prev => [newVehItem, ...prev]);
      updateField('selectedVehicleReg', cleanPlate);
      updateField('handoverOdometer', payload.odometer);
      setShowAddVehicleModal(false);
      setNewVehReg('');
      setNewVehModel('');
      alert(`✅ Vehicle ${cleanPlate} (${payload.model}) successfully added to fleet and selected!`);
    } catch (err) {
      alert(err.message || 'Failed to add vehicle.');
    } finally {
      setIsSubmittingVeh(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Readiness Calculation for the live preview widget (aligned with PDF 6 gates)
  const readinessChecks = [
    { label: 'Gate 01: Driver Profile & Mobile Verified', done: !!formData.name.trim() && formData.phone.trim().length >= 10 && mobileVerified },
    { label: 'Gate 02: Commercial DL, PAN Card & KYC', done: !!formData.drivingLicence.trim() },
    { label: 'Gate 03: Commercial Deal & Tax Rule', done: Number(formData.agreedRate) > 0 },
    { label: 'Gate 04: Agreement v1.0 Generated & Signed', done: formData.agreementSigned },
    { label: 'Gate 05: Escrow Security Deposit Confirmed', done: formData.depositConfirmed && Number(formData.securityDeposit) > 0 },
    { label: 'Gate 06: Vehicle Handover & Odometer Ready', done: !formData.selectedVehicleReg || (formData.handoverKeys && formData.handoverQcPassed) }
  ];
  const completedChecksCount = readinessChecks.filter((c) => c.done).length;
  const readinessPercent = Math.round((completedChecksCount / readinessChecks.length) * 100);

  const getInitials = (name) => {
    if (!name || !name.trim()) return 'DR';
    return name
      .trim()
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleSendOtp = () => {
    setOtpSent(true);
    setTimeout(() => {
      setMobileVerified(true);
    }, 800);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.drivingLicence.trim()) {
      alert('Please fill in required fields: Full Name, Mobile Phone, and Commercial Driving Licence.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        dob: formData.dob || '1986-07-16',
        gender: formData.gender || 'Male',
        fatherName: formData.fatherName.trim(),
        phone: formData.phone.trim(),
        altPhone: formData.altPhone.trim(),
        city: formData.city,
        address: formData.address.trim() || `${formData.city}, Delhi NCR`,
        emergencyContact: formData.emergencyContact.trim(),
        emergencyRelation: formData.emergencyRelation,
        // PDF Step 01 Reference
        referenceName: formData.referenceName.trim(),
        referencePhone: formData.referencePhone.trim(),
        referenceRelation: formData.referenceRelation,
        referenceAddress: formData.referenceAddress.trim(),
        // PDF Step 02 Statutory KYC
        drivingLicence: formData.drivingLicence.trim().toUpperCase(),
        dlExpiry: formData.dlExpiry || '14 Nov 2030',
        dlCategory: formData.dlCategory,
        aadhaar: formData.aadhaar.trim() || 'XXXX-XXXX-9821',
        panCard: formData.panCard.trim().toUpperCase() || '',
        policeVerification: formData.policeVerification,
        kycReviewStatus: formData.kycReviewStatus,
        // PDF Step 02 & 03 Commercial Deal
        rentalModel: formData.rentalModel,
        agreedRate: `₹${Number(formData.agreedRate).toLocaleString('en-IN')} / day`,
        securityDeposit: `₹${Number(formData.securityDeposit).toLocaleString('en-IN')} (Secured in Escrow)`,
        contractMonths: Number(formData.contractMonths) || 12,
        billingFrequency: formData.billingFrequency,
        taxRule: formData.taxRule,
        shiftType: formData.rentalModel === '12-Hour Shift Lease' ? formData.shiftType : '24-Hour Dedicated',
        coDriver: formData.rentalModel === '12-Hour Shift Lease' ? formData.coDriver : '',
        // PDF Step 04 & 05 Agreement & Escrow
        agreementVersion: formData.agreementVersion,
        agreementSigned: formData.agreementSigned,
        depositReceipt: formData.depositReceiptNumber,
        depositStatus: 'Held in Escrow',
        // PDF Step 06 Vehicle & Handover
        vehicleRegistration: formData.selectedVehicleReg || '',
        vehicleModel: selectedVehicleObj ? (selectedVehicleObj.model || selectedVehicleObj.reg) : (formData.selectedVehicleReg ? 'Commercial Fleet Vehicle' : ''),
        vehicleType: selectedVehicleObj ? selectedVehicleObj.type : 'CNG',
        handoverOdometer: `${formData.handoverOdometer} km`,
        initialBalance: Number(formData.initialBalance) || 0,
        // Attached KYC Documents Vault
        documents: (() => {
          let docs = [...attachedDocs];
          if (dlDocImage?.fileUrl && !docs.some(d => d.category === 'dl' || d.type === 'Driving Licence')) {
            docs.push({
              id: `doc-dl-${Date.now()}`,
              title: 'Commercial Driving Licence (DL) Photo',
              type: 'Driving Licence',
              category: 'dl',
              docNumber: formData.drivingLicence.trim().toUpperCase(),
              fileUrl: dlDocImage.fileUrl,
              fileSize: dlDocImage.fileSize || 'Attached',
              uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              verified: true,
              status: 'Verified (Admin Saved)'
            });
          }
          if (aadhaarDocImage?.fileUrl && !docs.some(d => d.category === 'aadhaar' || d.type === 'Aadhaar Card')) {
            docs.push({
              id: `doc-aadhaar-${Date.now()}`,
              title: 'Aadhaar Biometric Card Photo',
              type: 'Aadhaar Card',
              category: 'aadhaar',
              docNumber: formData.aadhaar.trim(),
              fileUrl: aadhaarDocImage.fileUrl,
              fileSize: aadhaarDocImage.fileSize || 'Attached',
              uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              verified: true,
              status: 'Verified (Admin Saved)'
            });
          }
          if (panDocImage?.fileUrl && !docs.some(d => d.category === 'pan' || d.type === 'PAN Card')) {
            docs.push({
              id: `doc-pan-${Date.now()}`,
              title: 'PAN Card Photo',
              type: 'PAN Card',
              category: 'pan',
              docNumber: formData.panCard.trim().toUpperCase(),
              fileUrl: panDocImage.fileUrl,
              fileSize: panDocImage.fileSize || 'Attached',
              uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              verified: true,
              status: 'Verified (Admin Saved)'
            });
          }
          return docs.length > 0 ? docs : undefined;
        })()
      };

      const res = await onboardDriverApi(payload);
      if (onDriverCreated) {
        onDriverCreated(res.data);
      } else {
        onBack();
      }
    } catch (err) {
      alert(err.message || 'Failed to onboard driver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, id: 'step-personal', label: '1. Personal & Mobile', icon: <User size={15} /> },
    { num: 2, id: 'step-kyc', label: '2. KYC, DL & PAN Card', icon: <Shield size={15} /> },
    { num: 3, id: 'step-lease', label: '3. Lease & Shift Deal', icon: <FileText size={15} /> },
    { num: 4, id: 'step-vehicle', label: '4. Vehicle & Handover', icon: <Car size={15} /> },
    { num: 5, id: 'step-wallet', label: '5. Smart 3-Pocket Wallet', icon: <CreditCard size={15} /> }
  ];

  const handleStepClick = (num, id) => {
    setActiveStep(num);
    if (viewMode === 'all') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="adp-wrapper">
      {/* Top Header & Breadcrumb Ribbon */}
      <div className="adp-top-ribbon">
        <div className="adp-breadcrumb-cluster">
          <button className="adp-btn-back-roster" onClick={onBack} title="Back to Driver Directory">
            <span className="adp-back-arrow">←</span>
            <span>Back to Driver Directory</span>
          </button>
          <span className="adp-crumb-sep">/</span>
          <span className="adp-crumb-current">Onboard Commercial Driver (PDF 6-Gate Plan)</span>
        </div>

        <div className="adp-top-actions">
          <div className="adp-view-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
              title="Show all sections together on one page"
            >
              All Sections View
            </button>
            <button
              type="button"
              className={`mode-btn ${viewMode === 'wizard' ? 'active' : ''}`}
              onClick={() => setViewMode('wizard')}
              title="Step-by-step guided wizard"
            >
              Step-by-Step
            </button>
          </div>
          <button type="button" className="adp-btn-cancel-top" onClick={onBack}>
            Cancel
          </button>
          <button
            type="button"
            className="adp-btn-submit-top"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Activating...' : '✓ Complete Onboarding & Activate'}
          </button>
        </div>
      </div>

      {/* Hero Banner Header */}
      <div className="adp-hero-card">
        <div className="adp-hero-left">
          <div className="adp-hero-avatar-badge">
            <Users size={28} />
          </div>
          <div className="adp-hero-copy">
            <div className="adp-system-badge">
              <span className="adp-live-pulse-dot" />
              <span>SIKHAR DRIVER ONBOARDING • 6-STAGE LEASE ACTIVATION PROTOCOL</span>
            </div>
            <h1 className="adp-hero-title">Onboard Commercial Driver & Activate Lease</h1>
            <p className="adp-hero-desc">
              Executes the institutional client plan: verify mobile, enforce MoRTH DL/KYC clearance, bind commercial lease terms (including 12-hour dual-driver shifts), secure escrow deposit, and hand over fleet asset.
            </p>
          </div>
        </div>

        <div className="adp-hero-stats">
          <div className="adp-hero-stat-pill">
            <span className="stat-label">Available Cars</span>
            <strong className="stat-val text-green">{FLEET_AVAILABLE_VEHICLES.length} Ready</strong>
          </div>
          <div className="adp-hero-stat-pill">
            <span className="stat-label">Statutory KYC</span>
            <strong className="stat-val text-blue">Parivahan Live</strong>
          </div>
          <div className="adp-hero-stat-pill">
            <span className="stat-label">Activation Mode</span>
            <strong className="stat-val text-purple">Zero-Bypass Policy</strong>
          </div>
        </div>
      </div>

      {/* 6-Stage Visual Workflow Ribbon (PDF Page 5 "Customer to active lease") */}
      <div className="adp-workflow-pills-bar">
        <span className="wf-bar-title">PDF LIFECYCLE FLOW:</span>
        <div className="wf-steps-strip">
          <span className={`wf-step ${formData.name && formData.phone ? 'done' : 'active'}`}>01 Driver & Mobile</span>
          <span className="wf-arrow">→</span>
          <span className={`wf-step ${formData.drivingLicence ? 'done' : ''}`}>02 KYC & Licence</span>
          <span className="wf-arrow">→</span>
          <span className={`wf-step ${formData.agreedRate ? 'done' : ''}`}>03 Deal & Shifts</span>
          <span className="wf-arrow">→</span>
          <span className={`wf-step ${formData.agreementSigned ? 'done' : ''}`}>04 Sign Agreement</span>
          <span className="wf-arrow">→</span>
          <span className={`wf-step ${formData.depositConfirmed ? 'done' : ''}`}>05 Escrow Deposit</span>
          <span className="wf-arrow">→</span>
          <span className={`wf-step ${formData.selectedVehicleReg ? 'done' : ''}`}>06 Handover & Active</span>
        </div>
      </div>

      {/* Step Navigator Bar */}
      <div className="adp-stepper-ribbon">
        {stepsList.map((s) => {
          const isCurrent = activeStep === s.num;
          return (
            <button
              key={s.num}
              type="button"
              className={`adp-step-btn ${isCurrent ? 'is-active' : ''}`}
              onClick={() => handleStepClick(s.num, s.id)}
            >
              <span className="step-btn-num">{s.num}</span>
              <span className="step-btn-icon">{s.icon}</span>
              <span className="step-btn-label">{s.label.split('. ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Layout: Form Columns + Live Preview Aside */}
      <div className="adp-content-split">
        {/* Left Column: The Form */}
        <div className="adp-form-col">
          {/* Main Unified Batch OCR KYC Document Upload Center */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const files = e.dataTransfer?.files;
              if (files && files.length > 0) {
                handleMultiImageUpload({ target: { files } });
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #091326 0%, #111d38 100%)',
              border: '2px dashed #0284c7',
              borderRadius: '14px',
              padding: '22px 24px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.18)',
              position: 'relative'
            }}
          >
            <input
              type="file"
              ref={multiFileInputRef}
              multiple
              accept="image/*"
              onChange={handleMultiImageUpload}
              style={{ display: 'none' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '280px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                }}>
                  <Scan size={26} color="#ffffff" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '15px', color: '#ffffff', letterSpacing: '-0.2px' }}>
                      Commercial Driver KYC Document Auto-Onboarding
                    </strong>
                    <span style={{ fontSize: '10px', background: '#38bdf8', color: '#091326', padding: '2px 8px', borderRadius: '10px', fontWeight: 900 }}>
                      BATCH OCR ENGINE
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                    Upload all driver document photos here at once (DL, Aadhaar Front/Back, PAN). Sikhar OCR auto-extracts official details (Aadhaar Name &amp; No, PAN No, DL No &amp; Expiry) and securely stores photos in the KYC Vault.
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => multiFileInputRef.current && multiFileInputRef.current.click()}
                  disabled={isBatchOcrProcessing}
                  style={{
                    padding: '11px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isBatchOcrProcessing ? '#047857' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: isBatchOcrProcessing ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.45)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <FileText size={17} />
                  <span>{isBatchOcrProcessing ? batchOcrProgress : '📑 Select Multiple Images (Batch OCR & Store)'}</span>
                </button>
              </div>
            </div>

            {/* Quick Document Category Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Accepted Documents:</span>
              <span style={{ fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                🆔 Aadhaar Card (Front / Back)
              </span>
              <span style={{ fontSize: '11px', color: '#a7f3d0', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                💳 PAN Card (NSDL / ITD)
              </span>
              <span style={{ fontSize: '11px', color: '#fde68a', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                📄 Commercial Driving Licence (DL)
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>
                All manual typing inputs remain active below
              </span>
            </div>
          </div>

          {/* Attached Documents Vault Gallery & Batch Progress */}
          {isBatchOcrProcessing && (
            <div style={{
              background: '#eff6ff',
              border: '1.5px solid #93c5fd',
              borderRadius: '10px',
              padding: '12px 18px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#1d4ed8'
            }}>
              <div style={{ width: '18px', height: '18px', border: '3px solid #93c5fd', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div>
                <strong style={{ fontSize: '13px' }}>Neural Batch OCR Processing:</strong>
                <span style={{ fontSize: '12.5px', marginLeft: '6px' }}>{batchOcrProgress}</span>
              </div>
            </div>
          )}

          {attachedDocs.length > 0 && (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🗄️</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                      Driver KYC Document Vault ({attachedDocs.length} Attached)
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                      All uploaded photos are OCR-scanned and will be permanently stored in this driver's record.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => multiFileInputRef.current && multiFileInputRef.current.click()}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={13} />
                  <span>+ Add More Images</span>
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '14px'
              }}>
                {attachedDocs.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      background: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ position: 'relative', height: '140px', background: '#0f172a' }}>
                      <img
                        src={doc.fileUrl}
                        alt={doc.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        color: '#38bdf8',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {doc.type}
                      </span>
                      <span style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(5, 150, 105, 0.9)',
                        color: '#ffffff',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        ✓ Stored in Vault
                      </span>
                    </div>

                    <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doc.title}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                          {doc.fileSize} • Uploaded
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleRotateAttachedDoc(idx)}
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                          title="Rotate image 90 degrees and re-run OCR"
                        >
                          <span>↺ Rotate 90°</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachedDoc(idx)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#dc2626',
                            cursor: 'pointer'
                          }}
                          title="Remove document"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ocrSuccessToast && (
            <div style={{
              background: '#064e3b',
              border: '1.5px solid #10b981',
              borderRadius: '10px',
              padding: '12px 18px',
              marginBottom: '18px',
              color: '#a7f3d0',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}>
              <CheckCircle2 size={18} color="#34d399" />
              <span>{ocrSuccessToast}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* SECTION 1: Personal, Mobile Verification & Reference (PDF Step 01) */}
            {(viewMode === 'all' || activeStep === 1) && (
              <div className="adp-card-section" id="step-personal">
                <div className="adp-card-header">
                  <div className="card-header-icon blue">
                    <User size={18} />
                  </div>
                  <div className="card-header-texts">
                    <div className="card-step-badge">GATE 01 • PROFILES, MOBILE & REFERENCE</div>
                    <h2 className="card-title">Driver Profile, Mobile Verification & Reference</h2>
                    <p className="card-sub">Primary pilot identification, verified mobile contact, guarantor reference, and operating terminal.</p>
                  </div>
                </div>

                <div className="adp-grid-2col">
                  <div className="adp-form-group full-width">
                    <label className="adp-field-label">
                      Full Driver Name (As on Driving Licence / Aadhaar) <span className="req">*</span>
                    </label>
                    <div className="adp-input-wrap">
                      <input
                        type="text"
                        className="adp-text-input"
                        required
                        placeholder="e.g. Nasir Gotam / D Manikandan"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">
                      Date of Birth (DOB) <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className="adp-text-input font-mono"
                      placeholder="e.g. 27/07/1979 or 16/07/1986"
                      value={formData.dob}
                      onChange={(e) => updateField('dob', e.target.value)}
                    />
                    <span className="adp-field-hint">Auto-extracted from Aadhaar / DL / PAN OCR</span>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Gender</label>
                    <select
                      className="adp-select-input"
                      value={formData.gender}
                      onChange={(e) => updateField('gender', e.target.value)}
                    >
                      <option value="Male">Male (पुरुष)</option>
                      <option value="Female">Female (महिला)</option>
                      <option value="Other">Other / Transgender</option>
                    </select>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Father / S/D/W Name</label>
                    <input
                      type="text"
                      className="adp-text-input"
                      placeholder="e.g. Duraisamy / Rajendra Singh"
                      value={formData.fatherName}
                      onChange={(e) => {
                        updateField('fatherName', e.target.value);
                        if (!formData.referenceName || formData.referenceName === 'Suresh Verma') {
                          updateField('referenceName', e.target.value);
                        }
                      }}
                    />
                    <span className="adp-field-hint">Auto-extracted from PAN Father's Name or DL S/D/W</span>
                  </div>

                  <div className="adp-form-group">
                    <div className="flex-between">
                      <label className="adp-field-label">
                        Primary Mobile (WhatsApp) <span className="req">*</span>
                      </label>
                      <span className="mobile-verify-status-badge">
                        {mobileVerified ? '✓ Mobile Verified (OTP)' : otpSent ? 'Awaiting OTP' : 'Verification Required'}
                      </span>
                    </div>
                    <div className="adp-phone-input-wrap">
                      <span className="country-code-pill">+91</span>
                      <input
                        type="tel"
                        className="adp-text-input phone-field"
                        required
                        placeholder="98765 43210"
                        value={formData.phone}
                        onChange={(e) => {
                          updateField('phone', e.target.value);
                          if (e.target.value.length >= 10 && !mobileVerified) {
                            setMobileVerified(true);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-verify-otp-pill"
                        onClick={handleSendOtp}
                        title="Verify phone via automated SMS OTP"
                      >
                        {mobileVerified ? '✓ Verified' : otpSent ? 'Resend' : 'Verify OTP'}
                      </button>
                    </div>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Alternate Mobile Number</label>
                    <div className="adp-phone-input-wrap">
                      <span className="country-code-pill">+91</span>
                      <input
                        type="tel"
                        className="adp-text-input phone-field"
                        placeholder="98123 45678"
                        value={formData.altPhone}
                        onChange={(e) => updateField('altPhone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Permanent Residential Address</label>
                    <input
                      type="text"
                      className="adp-text-input"
                      placeholder="e.g. Village Chakkarpur, Sector 28, Gurgaon"
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                    />
                  </div>

                  {/* Personal Reference / Guarantor (PDF Page 3 & 5 requirement) */}
                  <div className="adp-form-group">
                    <label className="adp-field-label">
                      Personal Reference / Guarantor Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className="adp-text-input"
                      placeholder="e.g. Suresh Verma"
                      value={formData.referenceName}
                      onChange={(e) => updateField('referenceName', e.target.value)}
                    />
                    <span className="adp-field-hint">Required for commercial lease collateral assurance</span>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Guarantor Relation & Phone</label>
                    <div className="flex-gap-2">
                      <select
                        className="adp-select-input"
                        style={{ width: '130px' }}
                        value={formData.referenceRelation}
                        onChange={(e) => updateField('referenceRelation', e.target.value)}
                      >
                        <option value="Guarantor">Guarantor</option>
                        <option value="Father">Father</option>
                        <option value="Brother">Brother</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Peer Driver">Fleet Peer</option>
                      </select>
                      <input
                        type="tel"
                        className="adp-text-input"
                        placeholder="Guarantor Phone (+91...)"
                        value={formData.referencePhone}
                        onChange={(e) => updateField('referencePhone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="adp-form-group full-width">
                    <label className="adp-field-label">Emergency Contact Line</label>
                    <div className="flex-gap-2">
                      <select
                        className="adp-select-input"
                        style={{ width: '130px' }}
                        value={formData.emergencyRelation}
                        onChange={(e) => updateField('emergencyRelation', e.target.value)}
                      >
                        <option value="Brother">Brother</option>
                        <option value="Father">Father</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Mother">Mother</option>
                        <option value="Relative">Relative</option>
                      </select>
                      <input
                        type="tel"
                        className="adp-text-input"
                        placeholder="Emergency Phone (e.g. 98991 22334)"
                        value={formData.emergencyContact}
                        onChange={(e) => updateField('emergencyContact', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {viewMode === 'wizard' && (
                  <div className="adp-card-wizard-nav">
                    <div />
                    <button
                      type="button"
                      className="btn-wizard-next"
                      onClick={() => setActiveStep(2)}
                    >
                      Continue to Statutory KYC →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: Statutory KYC & Compliance (PDF Page 3 & 4) */}
            {(viewMode === 'all' || activeStep === 2) && (
              <div className="adp-card-section" id="step-kyc">
                <div className="adp-card-header">
                  <div className="card-header-icon green">
                    <Shield size={18} />
                  </div>
                  <div className="card-header-texts">
                    <div className="card-step-badge">GATE 02 • STATUTORY KYC & LICENSING</div>
                    <h2 className="card-title">Commercial Driving Licence & Verification</h2>
                    <p className="card-sub">Commercial Driving Licence, Aadhaar Biometrics, and Police Clearance with clear Submitted/Verified statuses.</p>
                  </div>
                </div>

                <div className="adp-grid-2col">
                  <div className="adp-form-group">
                    <label className="adp-field-label">
                      Commercial Driving Licence (DL) Number <span className="req">*</span>
                    </label>
                    <div className="adp-input-wrap">
                      <input
                        type="text"
                        className="adp-text-input font-mono"
                        required
                        placeholder="e.g. GJ06 20250013670"
                        value={formData.drivingLicence}
                        onChange={(e) => updateField('drivingLicence', e.target.value)}
                      />
                    </div>
                    <span className="adp-field-hint">Auto-filled via top batch upload (MoRTH Sarathi API verified)</span>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Licence Expiry Date</label>
                    <input
                      type="date"
                      className="adp-text-input"
                      value={formData.dlExpiry}
                      onChange={(e) => updateField('dlExpiry', e.target.value)}
                    />
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Licence Category</label>
                    <select
                      className="adp-select-input"
                      value={formData.dlCategory}
                      onChange={(e) => updateField('dlCategory', e.target.value)}
                    >
                      <option value="Commercial LMV">Commercial LMV (Light Motor Vehicle Transport)</option>
                      <option value="Commercial Transport">Commercial Transport (Badge Holder)</option>
                      <option value="LMV-NT">LMV-NT (Non-Transport with Commercial Permit)</option>
                    </select>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Aadhaar Card Number</label>
                    <input
                      type="text"
                      className="adp-text-input font-mono"
                      placeholder="e.g. 3639 7365 6509"
                      value={formData.aadhaar}
                      onChange={(e) => updateField('aadhaar', e.target.value)}
                    />
                    <span className="adp-field-hint">Auto-filled via top batch upload (Name, 12-digit Aadhaar &amp; Address)</span>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">
                      PAN Card Number (Permanent Account Number)
                    </label>
                    <div className="adp-input-wrap">
                      <input
                        type="text"
                        className="adp-text-input font-mono uppercase"
                        placeholder="e.g. ABCDE1234F"
                        maxLength={10}
                        value={formData.panCard}
                        onChange={(e) => updateField('panCard', e.target.value.toUpperCase())}
                      />
                    </div>
                    <span className="adp-field-hint">Auto-filled via top batch upload (NSDL / ITD TDS validation)</span>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">Police Verification Certificate</label>
                    <select
                      className="adp-select-input"
                      value={formData.policeVerification}
                      onChange={(e) => updateField('policeVerification', e.target.value)}
                    >
                      <option value="Verified (Clear)">Verified (Clear Commissioner Report on Record)</option>
                      <option value="In Verification">In Verification (Receipt Uploaded, 14-Day Grace)</option>
                      <option value="Exempted/Pending">Pending (7-Day Provisional Window)</option>
                    </select>
                  </div>

                  <div className="adp-form-group">
                    <label className="adp-field-label">KYC Review Lifecycle Status</label>
                    <select
                      className="adp-select-input"
                      value={formData.kycReviewStatus}
                      onChange={(e) => updateField('kycReviewStatus', e.target.value)}
                    >
                      <option value="Verified">Verified (Full Statutory Compliance Cleared)</option>
                      <option value="Submitted">Submitted (Under Operations Review)</option>
                      <option value="Provisional">Provisional (Awaiting Physical Verification)</option>
                    </select>
                  </div>
                </div>

                <div className="adp-callout-banner green">
                  <CheckCircle2 size={18} className="callout-icon" />
                  <div className="callout-text">
                    <strong>Zero-Bypass KYC Protocol Active (PDF Page 4 & 5)</strong>
                    <p>The system enforces that a driver cannot be activated on road until statutory Driving Licence and KYC criteria are fully cleared.</p>
                  </div>
                </div>

                {viewMode === 'wizard' && (
                  <div className="adp-card-wizard-nav">
                    <button
                      type="button"
                      className="btn-wizard-prev"
                      onClick={() => setActiveStep(1)}
                    >
                      ← Back to Personal
                    </button>
                    <button
                      type="button"
                      className="btn-wizard-next"
                      onClick={() => setActiveStep(3)}
                    >
                      Continue to Lease Terms →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3: Commercial Lease Terms & 12-Hour Shift Option (PDF Step 02, 04, 05) */}
            {(viewMode === 'all' || activeStep === 3) && (
              <div className="adp-card-section" id="step-lease">
                <div className="adp-card-header">
                  <div className="card-header-icon amber">
                    <FileText size={18} />
                  </div>
                  <div className="card-header-texts">
                    <div className="card-step-badge">GATE 03 • COMMERCIAL LEASE & AGREEMENT</div>
                    <h2 className="card-title">Commercial Lease Deal Terms & Shift Model</h2>
                    <p className="card-sub">Configure rental model, 12-hour dual-driver shift schedules, billing frequency, and escrow deposit.</p>
                  </div>
                </div>

                <div className="adp-grid-2col">
                  {/* Model Selection Row */}
                  <div className="adp-form-group full-width">
                    <label className="adp-field-label">Select Commercial Lease Model</label>
                    <div className="adp-radio-cards-row">
                      {[
                        { 
                          id: 'Fixed Daily Rental', 
                          title: 'Fixed Daily Rental', 
                          sub: 'Standard 24-hr vehicle dedicated to 1 driver' 
                        },
                        { 
                          id: 'Revenue Share 80/20', 
                          title: 'Rev-Share 80/20', 
                          sub: 'Driver keeps 80% net fare, Sikhar keeps 20%' 
                        },
                        { 
                          id: '12-Hour Shift Lease', 
                          title: '12-Hour Shift', 
                          sub: 'Shared dual-driver vehicle (Day / Night Shift)' 
                        }
                      ].map((model) => (
                        <div
                          key={model.id}
                          className={`adp-radio-card ${formData.rentalModel === model.id ? 'is-selected' : ''}`}
                          onClick={() => updateField('rentalModel', model.id)}
                        >
                          <input
                            type="radio"
                            name="rentalModel"
                            checked={formData.rentalModel === model.id}
                            onChange={() => updateField('rentalModel', model.id)}
                          />
                          <div>
                            <strong>{model.title}</strong>
                            <span>{model.sub}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SPECIAL SECTION: Explaining & Configuring 12-Hour Shift Lease */}
                  {formData.rentalModel === '12-Hour Shift Lease' && (
                    <div className="adp-special-shift-panel full-width">
                      <div className="shift-panel-header">
                        <div className="shift-icon-wrap">
                          <Clock size={18} />
                        </div>
                        <div>
                          <strong>12-Hour Shift: Shared Dual-Driver Vehicle Configuration</strong>
                          <p>
                            <strong>What this means:</strong> Instead of 1 driver holding the vehicle for 24 hours, the car is operated by <strong>two drivers sharing 1 vehicle</strong>. Driver A takes Day Shift (06:00 to 18:00) and Driver B takes Night Shift (18:00 to 06:00). This achieves 24/7 fleet revenue uptime and reduces daily vehicle rental costs for both drivers.
                          </p>
                        </div>
                      </div>

                      <div className="shift-config-grid">
                        <div className="adp-form-group">
                          <label className="adp-field-label">Assigned Shift Window</label>
                          <select
                            className="adp-select-input"
                            value={formData.shiftType}
                            onChange={(e) => updateField('shiftType', e.target.value)}
                          >
                            <option value="Day Shift (06:00 AM - 06:00 PM)">Day Shift (06:00 AM – 06:00 PM • 12 Hours)</option>
                            <option value="Night Shift (06:00 PM - 06:00 AM)">Night Shift (06:00 PM – 06:00 AM • 12 Hours)</option>
                          </select>
                        </div>

                        <div className="adp-form-group">
                          <label className="adp-field-label">Paired Co-Driver (Partner on other shift)</label>
                          <input
                            type="text"
                            className="adp-text-input"
                            placeholder="e.g. Sandeep Kumar (DL52GD7393)"
                            value={formData.coDriver}
                            onChange={(e) => updateField('coDriver', e.target.value)}
                          />
                          <span className="adp-field-hint">Co-driver who hands over the vehicle at hub terminal</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rental Rate */}
                  <div className="adp-form-group">
                    <label className="adp-field-label">
                      Agreed Rental Rate (₹ / Day or Shift) <span className="req">*</span>
                    </label>
                    <div className="adp-currency-input-wrap">
                      <span className="currency-symbol">₹</span>
                      <input
                        type="number"
                        className="adp-text-input currency-field"
                        value={formData.agreedRate}
                        onChange={(e) => updateField('agreedRate', e.target.value)}
                      />
                      <span className="currency-suffix">{formData.rentalModel === '12-Hour Shift Lease' ? '/ shift' : '/ day'}</span>
                    </div>
                    <div className="adp-quick-presets">
                      <button type="button" onClick={() => updateField('agreedRate', '600')}>₹600</button>
                      <button type="button" onClick={() => updateField('agreedRate', '850')}>₹850</button>
                      <button type="button" onClick={() => updateField('agreedRate', '1000')}>₹1,000</button>
                      <button type="button" onClick={() => updateField('agreedRate', '1150')}>₹1,150</button>
                    </div>
                  </div>

                  {/* Billing Frequency (PDF Step 02) */}
                  <div className="adp-form-group">
                    <label className="adp-field-label">Billing Frequency & Cycle</label>
                    <select
                      className="adp-select-input"
                      value={formData.billingFrequency}
                      onChange={(e) => updateField('billingFrequency', e.target.value)}
                    >
                      <option value="Daily Debit (00:00 hrs)">Daily Automated Wallet Debit (00:00 hrs)</option>
                      <option value="Weekly Cycle (Every Monday)">Weekly Cycle (Every Monday)</option>
                      <option value="Monthly Advance">Monthly Advance Invoice</option>
                    </select>
                  </div>

                  {/* Tax Rule (PDF Step 02) */}
                  <div className="adp-form-group">
                    <label className="adp-field-label">Statutory Tax Rule (GST)</label>
                    <select
                      className="adp-select-input"
                      value={formData.taxRule}
                      onChange={(e) => updateField('taxRule', e.target.value)}
                    >
                      <option value="GST 5% (Commercial Passenger Transport)">GST 5% (Commercial Passenger Transport with ITC)</option>
                      <option value="GST Exempt (Section 11)">GST Exempt (Section 11 Non-AC / Specialized)</option>
                      <option value="GST 18% (Commercial Hire)">GST 18% (Commercial Equipment Hire)</option>
                    </select>
                  </div>

                  {/* Security Deposit in Escrow (PDF Step 05) */}
                  <div className="adp-form-group">
                    <label className="adp-field-label">Security Deposit in Escrow (₹)</label>
                    <div className="adp-currency-input-wrap">
                      <span className="currency-symbol">₹</span>
                      <input
                        type="number"
                        className="adp-text-input currency-field"
                        value={formData.securityDeposit}
                        onChange={(e) => updateField('securityDeposit', e.target.value)}
                      />
                    </div>
                    <div className="adp-quick-presets">
                      <button type="button" onClick={() => updateField('securityDeposit', '50000')}>₹50k</button>
                      <button type="button" onClick={() => updateField('securityDeposit', '75000')}>₹75k</button>
                      <button type="button" onClick={() => updateField('securityDeposit', '100000')}>₹100k</button>
                    </div>
                  </div>

                  {/* Contract Agreement Tenure & Versioning (PDF Step 04) */}
                  <div className="adp-form-group">
                    <label className="adp-field-label">Contract Agreement Tenure</label>
                    <select
                      className="adp-select-input"
                      value={formData.contractMonths}
                      onChange={(e) => updateField('contractMonths', e.target.value)}
                    >
                      <option value="6">6 Months Contract (Provisional)</option>
                      <option value="12">12 Months (1 Year Standard Fleet Lease)</option>
                      <option value="24">24 Months (2 Year Extended Master Lease)</option>
                    </select>
                  </div>

                  {/* Agreement Versioning & E-Sign Status (PDF Step 04) */}
                  <div className="adp-form-group">
                    <label className="adp-field-label">Commercial Agreement Document</label>
                    <div className="agreement-signing-control-box">
                      <div className="agr-doc-info">
                        <FileText size={16} className="text-blue" />
                        <div>
                          <strong>{formData.agreementVersion}</strong>
                          <span>Aadhaar e-Sign • Pre-approved Master Legal Template</span>
                        </div>
                      </div>
                      <span className="badge-signed">✓ E-Signed Ready</span>
                    </div>
                  </div>
                </div>

                {/* Financial Overview Strip */}
                <div className="adp-financial-summary-strip">
                  <div className="fin-metric">
                    <span className="fin-lbl">Billing Debit</span>
                    <strong className="fin-val text-green">₹{Number(formData.agreedRate || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="fin-divider" />
                  <div className="fin-metric">
                    <span className="fin-lbl">Estimated Monthly Gross</span>
                    <strong className="fin-val">₹{(Number(formData.agreedRate || 0) * 30).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="fin-divider" />
                  <div className="fin-metric">
                    <span className="fin-lbl">Escrow Guarantee</span>
                    <strong className="fin-val text-blue">₹{Number(formData.securityDeposit || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="fin-divider" />
                  <div className="fin-metric">
                    <span className="fin-lbl">Contract Term</span>
                    <strong className="fin-val">{formData.contractMonths} Months</strong>
                  </div>
                </div>

                {viewMode === 'wizard' && (
                  <div className="adp-card-wizard-nav">
                    <button
                      type="button"
                      className="btn-wizard-prev"
                      onClick={() => setActiveStep(2)}
                    >
                      ← Back to KYC
                    </button>
                    <button
                      type="button"
                      className="btn-wizard-next"
                      onClick={() => setActiveStep(4)}
                    >
                      Continue to Vehicle Allocation →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4: Vehicle Asset Allocation & Handover (PDF Step 03 & 06) */}
            {(viewMode === 'all' || activeStep === 4) && (
              <div className="adp-card-section" id="step-vehicle">
                <div className="adp-card-header">
                  <div className="card-header-icon purple">
                    <Car size={18} />
                  </div>
                  <div className="card-header-texts">
                    <div className="card-step-badge">GATE 04 • FLEET ASSET & HANDOVER INSPECTION</div>
                    <h2 className="card-title">Commercial Vehicle Allocation & Handover</h2>
                    <p className="card-sub">Pair an active vehicle asset with this driver, verify statutory compliance, and record starting odometer.</p>
                  </div>
                </div>

                {/* Vehicle Selection Grid */}
                <div className="adp-vehicle-assignment-flow">
                  <div className="adp-veh-options-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span className="opt-title">Select Ready Vehicle Asset:</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        style={{
                          padding: '6px 14px',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '6px',
                          background: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                        onClick={() => setShowAddVehicleModal(true)}
                        title="Add and onboard a new vehicle into the fleet"
                      >
                        <Plus size={14} />
                        Add Vehicle
                      </button>
                      <button
                        type="button"
                        className={`standby-toggle-btn ${formData.selectedVehicleReg === '' ? 'is-active' : ''}`}
                        onClick={() => updateField('selectedVehicleReg', '')}
                      >
                        {formData.selectedVehicleReg === '' ? '✓ Standby Pool Selected' : 'Place on Standby Pool (No Car)'}
                      </button>
                    </div>
                  </div>

                  <div className="adp-fleet-card-grid">
                    {fleetVehicles.map((v) => {
                      const vReg = v.reg || v.registration;
                      const isSelected = formData.selectedVehicleReg === vReg;
                      const isAllocated = (v.status === 'Allocated' || v.status === 'On Road' || (v.driver && v.driver !== 'Unassigned'));

                      return (
                        <div
                          key={vReg}
                          className={`adp-fleet-tile ${isSelected ? 'is-selected' : ''} ${isAllocated ? 'is-allocated' : ''}`}
                          style={isAllocated ? { opacity: 0.65, cursor: 'not-allowed', borderColor: '#cbd5e1', background: '#f8fafc' } : {}}
                          onClick={() => {
                            if (isAllocated) {
                              alert(`⛔ Vehicle ${vReg} is currently ALLOCATED to ${v.driver}. It cannot be allocated to another driver until its allocation period is over.`);
                              return;
                            }
                            updateField('selectedVehicleReg', vReg);
                          }}
                        >
                          <div className="fleet-tile-img-box">
                            <img
                              src={v.image || '/images/wagonr.jpg'}
                              alt={v.model}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <span className={`fuel-type-pill ${(v.type || 'CNG').toLowerCase()}`}>
                              {v.type || 'CNG'}
                            </span>
                          </div>
                          <div className="fleet-tile-body">
                            <div className="reg-row">
                              <strong className="reg-number">{vReg}</strong>
                              {isSelected ? (
                                <span className="assigned-tag">Selected</span>
                              ) : isAllocated ? (
                                <span style={{ fontSize: '10px', background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                  Allocated
                                </span>
                              ) : null}
                            </div>
                            <span className="car-model-name">{v.model || vReg}</span>
                            <div className="hub-row">
                              <MapPin size={11} />
                              <span>{isAllocated ? `Allocated to ${v.driver}` : (v.hub || 'Central Yard')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Selection Banner */}
                  {selectedVehicleObj ? (
                    <div className="adp-selected-veh-banner">
                      <div className="veh-banner-left">
                        <img
                          src={selectedVehicleObj.image}
                          alt={selectedVehicleObj.model}
                          className="banner-thumb"
                        />
                        <div>
                          <div className="banner-title-line">
                            <strong className="banner-reg">{selectedVehicleObj.reg}</strong>
                            <span className="banner-assigned-pill">
                              ✓ {formData.rentalModel === '12-Hour Shift Lease' ? 'Shared 12-Hour Allocation' : 'Assigned 1:1 to Driver'}
                            </span>
                          </div>
                          <span className="banner-sub">
                            {selectedVehicleObj.model} • {selectedVehicleObj.type} Powertrain • Stationed at {selectedVehicleObj.hub}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-unassign-veh"
                        onClick={() => updateField('selectedVehicleReg', '')}
                      >
                        Unassign Car
                      </button>
                    </div>
                  ) : (
                    <div className="adp-callout-banner amber">
                      <AlertTriangle size={18} className="callout-icon" />
                      <div className="callout-text">
                        <strong>Driver on Standby Crew Pool</strong>
                        <p>No vehicle asset currently assigned. You can bind a commercial vehicle at any time directly from the Driver Profile dashboard.</p>
                      </div>
                    </div>
                  )}

                  {/* Handover Prerequisites Checklist (PDF Step 06) */}
                  {selectedVehicleObj && (
                    <div className="handover-checklist-card">
                      <strong className="handover-title">Handover Prerequisites & Departure QC (PDF Step 06)</strong>
                      <div className="handover-inputs-grid">
                        <div className="adp-form-group">
                          <label className="adp-field-label">Odometer Reading at Handover (km)</label>
                          <input
                            type="text"
                            className="adp-text-input font-mono"
                            value={formData.handoverOdometer}
                            onChange={(e) => updateField('handoverOdometer', e.target.value)}
                          />
                        </div>
                        <div className="handover-checks-row">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.handoverKeys}
                              onChange={(e) => updateField('handoverKeys', e.target.checked)}
                            />
                            <span>2 Ignition Keys Handed Over</span>
                          </label>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.handoverQcPassed}
                              onChange={(e) => updateField('handoverQcPassed', e.target.checked)}
                            />
                            <span>Pre-QC Inspection & RC/PUC in Glovebox Cleared</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {viewMode === 'wizard' && (
                  <div className="adp-card-wizard-nav">
                    <button
                      type="button"
                      className="btn-wizard-prev"
                      onClick={() => setActiveStep(3)}
                    >
                      ← Back to Lease
                    </button>
                    <button
                      type="button"
                      className="btn-wizard-next"
                      onClick={() => setActiveStep(5)}
                    >
                      Continue to Smart Wallet →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 5: Smart 3-Pocket Wallet Configuration (PDF Page 6) */}
            {(viewMode === 'all' || activeStep === 5) && (
              <div className="adp-card-section" id="step-wallet">
                <div className="adp-card-header">
                  <div className="card-header-icon blue">
                    <CreditCard size={18} />
                  </div>
                  <div className="card-header-texts">
                    <div className="card-step-badge">GATE 05 • 3-POCKET SMART WALLET</div>
                    <h2 className="card-title">Driver Smart Wallet Account (Opening Balance ₹0)</h2>
                    <p className="card-sub">Enforces the institutional 3-pocket ledger (Posted Balance, Active Holds, and Spendable Funds).</p>
                  </div>
                </div>

                <div className="adp-grid-2col">
                  <div className="adp-form-group full-width">
                    <label className="adp-field-label">Initial Opening Balance (₹) — Default is ₹0</label>
                    <div className="adp-currency-input-wrap">
                      <span className="currency-symbol">₹</span>
                      <input
                        type="number"
                        className="adp-text-input currency-field"
                        value={formData.initialBalance}
                        onChange={(e) => updateField('initialBalance', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="adp-quick-presets">
                      <button type="button" onClick={() => updateField('initialBalance', '0')}>₹0 (Default Start)</button>
                      <button type="button" onClick={() => updateField('initialBalance', '500')}>₹500</button>
                      <button type="button" onClick={() => updateField('initialBalance', '1000')}>₹1,000</button>
                    </div>
                    <span className="adp-field-hint">Driver wallet opens with ₹0. When the driver recharges via UPI or Cash, daily rent (₹{Number(formData.agreedRate || 1000).toLocaleString('en-IN')}) will be debited automatically.</span>
                  </div>

                  {/* Outstanding Vehicle Rental Alert when Balance is 0 */}
                  {Number(formData.initialBalance || 0) <= 0 && formData.selectedVehicleReg && (
                    <div className="adp-callout-banner amber full-width" style={{ marginTop: '6px', background: '#fff7ed', borderColor: '#fdba74' }}>
                      <AlertTriangle size={18} className="callout-icon" style={{ color: '#ea580c' }} />
                      <div className="callout-text">
                        <strong style={{ color: '#9a3412' }}>Vehicle Rent Stays as Outstanding Pending Payment</strong>
                        <p style={{ color: '#7c2d12' }}>
                          Because this new driver is starting with <strong>₹0 wallet balance</strong> and car <strong>{selectedVehicleObj ? `${selectedVehicleObj.model} [${selectedVehicleObj.reg}]` : formData.selectedVehicleReg}</strong> is allocated, the car rental fee of <strong>₹{Number(formData.agreedRate || 1000).toLocaleString('en-IN')}</strong> will remain recorded as <strong>Outstanding Pending Payment</strong> on their account. When they recharge their wallet, the system automatically clears and settles this balance.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3-Pocket Smart Wallet Preview + Outstanding Dues Pocket */}
                <div className="adp-three-pocket-preview">
                  <div className="pocket-preview-box">
                    <span className="p-badge">POCKET 1</span>
                    <span className="p-title">POSTED BALANCE</span>
                    <strong className={`p-num ${Number(formData.initialBalance || 0) <= 0 && formData.selectedVehicleReg ? 'text-red' : ''}`}>
                      ₹{Number(formData.initialBalance || 0) <= 0 && formData.selectedVehicleReg 
                        ? `-${Number(formData.agreedRate || 1000).toLocaleString('en-IN')}` 
                        : Number(formData.initialBalance || 0).toLocaleString('en-IN')}
                    </strong>
                    <span className="p-sub">Total verified funds credited</span>
                  </div>
                  <div className="pocket-preview-box hold">
                    <span className="p-badge hold">POCKET 2</span>
                    <span className="p-title">ACTIVE HOLDS</span>
                    <strong className="p-num">₹0</strong>
                    <span className="p-sub">Held for EV charging sessions</span>
                  </div>
                  <div className="pocket-preview-box spendable">
                    <span className="p-badge spendable">POCKET 3</span>
                    <span className="p-title">SPENDABLE FUNDS</span>
                    <strong className="p-num text-green">₹{Math.max(0, Number(formData.initialBalance || 0)).toLocaleString('en-IN')}</strong>
                    <span className="p-sub">Available for daily lease debit</span>
                  </div>
                  {Number(formData.initialBalance || 0) <= 0 && formData.selectedVehicleReg && (
                    <div className="pocket-preview-box" style={{ background: '#fff7ed', borderColor: '#fed7aa' }}>
                      <span className="p-badge" style={{ background: '#ffedd5', color: '#c2410c' }}>OUTSTANDING</span>
                      <span className="p-title" style={{ color: '#9a3412' }}>VEHICLE RENT DUE</span>
                      <strong className="p-num" style={{ color: '#ea580c' }}>₹{Number(formData.agreedRate || 1000).toLocaleString('en-IN')}</strong>
                      <span className="p-sub" style={{ color: '#9a3412' }}>Pending First Top-Up</span>
                    </div>
                  )}
                </div>

                {viewMode === 'wizard' && (
                  <div className="adp-card-wizard-nav">
                    <button
                      type="button"
                      className="btn-wizard-prev"
                      onClick={() => setActiveStep(4)}
                    >
                      ← Back to Vehicle
                    </button>
                    <div />
                  </div>
                )}
              </div>
            )}

            {/* Bottom Form Action Buttons */}
            <div className="adp-master-submit-footer">
              <button
                type="button"
                className="btn-cancel-onboard"
                onClick={onBack}
              >
                Cancel & Return
              </button>
              <button
                type="submit"
                className="btn-submit-onboard"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="adp-btn-spinner" />
                    <span>Activating Driver Account...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Complete Driver Onboarding & Activate Profile</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Right Column: Sticky Live Profile Preview */}
        <aside className="adp-preview-aside">
          <div className="adp-live-preview-card">
            <div className="preview-card-header">
              <span className="live-pill">
                <span className="live-dot" /> LIVE PROFILE PREVIEW
              </span>
              <span className="pilot-id-tag">PILOT-NEW</span>
            </div>

            {/* Driver Identity Top */}
            <div className="preview-driver-identity">
              <div className="preview-avatar-circle">
                {getInitials(formData.name)}
              </div>
              <div className="preview-identity-texts">
                <h3 className="preview-name">
                  {formData.name.trim() || 'New Commercial Pilot'}
                </h3>
                <span className="preview-phone">
                  {formData.phone ? `+91 ${formData.phone}` : '+91 XXXXX XXXXX'}
                </span>
                <span className="preview-hub">
                  <MapPin size={12} /> {formData.city.split(' • ')[0]}
                </span>
              </div>
            </div>

            {/* Quick Status and Rating */}
            <div className="preview-status-strip">
              <span className={`status-pill ${formData.selectedVehicleReg ? 'online' : 'standby'}`}>
                {formData.selectedVehicleReg ? '● Ready for Shift' : '○ Standby Pool'}
              </span>
              <span className="rating-pill">★ 5.0 (New Pilot)</span>
            </div>

            <div className="preview-divider" />

            {/* Shift & Allocation Model */}
            <div className="preview-section-item">
              <span className="sec-lbl">Lease & Shift Model</span>
              <div className="preview-shift-tag-box">
                <strong>{formData.rentalModel}</strong>
                {formData.rentalModel === '12-Hour Shift Lease' && (
                  <span className="shift-sub-tag">● {formData.shiftType}</span>
                )}
              </div>
            </div>

            {/* Assigned Vehicle Highlight */}
            <div className="preview-section-item">
              <span className="sec-lbl">Assigned Vehicle Asset</span>
              {selectedVehicleObj ? (
                <div className="preview-assigned-car-box">
                  <img
                    src={selectedVehicleObj.image}
                    alt={selectedVehicleObj.model}
                    className="car-thumb"
                  />
                  <div>
                    <strong className="car-reg">{selectedVehicleObj.reg}</strong>
                    <span className="car-model">{selectedVehicleObj.model} ({selectedVehicleObj.type})</span>
                  </div>
                </div>
              ) : (
                <div className="preview-unassigned-car-box">
                  <AlertTriangle size={14} />
                  <span>Standby Crew Pool (No Car)</span>
                </div>
              )}
            </div>

            {/* Deal Terms Strip */}
            <div className="preview-section-item">
              <span className="sec-lbl">Commercial Terms</span>
              <div className="preview-deal-grid">
                <div>
                  <label>Daily Rent</label>
                  <strong className="text-green">₹{Number(formData.agreedRate || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <label>Escrow Deposit</label>
                  <strong className="text-blue">₹{Number(formData.securityDeposit || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <label>Opening Wallet</label>
                  <strong>₹{Number(formData.initialBalance || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

            {/* Statutory Compliance Checklist (PDF 6 Gates) */}
            <div className="preview-section-item">
              <div className="readiness-header">
                <span className="sec-lbl">PDF 6-Gate Readiness</span>
                <strong className="readiness-score">{readinessPercent}%</strong>
              </div>
              <div className="readiness-progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>

              <div className="readiness-check-list">
                {readinessChecks.map((chk, i) => (
                  <div key={i} className={`chk-item ${chk.done ? 'is-done' : ''}`}>
                    <CheckCircle2 size={13} className="chk-icon" />
                    <span>{chk.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instant Submit from sidebar */}
            <div className="preview-action-box">
              <button
                type="button"
                className="btn-sidebar-submit"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Activating Driver...' : '✓ Complete Onboarding'}
              </button>
            </div>

            {/* Compliance Guarantee badge */}
            <div className="preview-trust-footer">
              <Shield size={14} className="text-blue" />
              <span>MoRTH SARATHI, UIDAI & Escrow Verified</span>
            </div>
          </div>
        </aside>
      </div>
      {/* Modal: Add New Vehicle Asset */}
      {showAddVehicleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              width: '460px',
              maxWidth: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                  Register &amp; Add New Vehicle Asset
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVehicleModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNewVehicle} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Vehicle Registration Plate (e.g. DL01EV9988) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. HR26DQ5678"
                  value={newVehReg}
                  onChange={(e) => setNewVehReg(e.target.value.toUpperCase())}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Vehicle Model Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tata Nexon EV, WagonR H3, Tigor EV"
                  value={newVehModel}
                  onChange={(e) => setNewVehModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Powertrain Fuel Type
                  </label>
                  <select
                    value={newVehType}
                    onChange={(e) => setNewVehType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px'
                    }}
                  >
                    <option value="CNG">CNG</option>
                    <option value="EV">EV (Electric)</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Odometer at Handover (km)
                  </label>
                  <input
                    type="number"
                    value={newVehOdo}
                    onChange={(e) => setNewVehOdo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: '#475569'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVeh}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isSubmittingVeh ? 'Adding...' : '✓ Add & Select Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Document OCR Scanner Modal (Upload & Camera Live Capture) */}
      <DocumentOcrScannerModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        targetDocType={ocrTargetType}
        title="Driver Document OCR Scanner (Upload & Camera)"
        onDataExtracted={handleOcrDataExtracted}
      />
    </div>
  );
}
