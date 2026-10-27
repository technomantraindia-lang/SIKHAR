import React from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  CheckCircle2,
  Shield,
  Car,
  Users,
  CreditCard
} from '../common/Icons';

export default function CommercialLeaseAgreementPreviewModal({
  isOpen,
  onClose,
  agreementData = {},
  isSigned = false,
  onSignAgreement
}) {
  if (!isOpen) return null;

  const {
    customerName = 'Rajesh Kumar Verma',
    customerPhone = '+91 98112 34567',
    drivingLicence = 'HR-2620190012345',
    aadhaar = '5421-9876-1234',
    address = 'H.No 142, Sector 28, Chakkarpur, Gurgaon, Haryana 122002',
    selectedVehicleReg = 'HR26WG4411',
    selectedVehicleObj = { model: 'Maruti Suzuki WagonR H3 CNG', type: 'CNG', odometer: '18,400 km' },
    dealType = 'Fixed Lease',
    rateAmount = '1000',
    billingFrequency = 'Daily',
    securityDeposit = '75000',
    depositReceiptRef = 'UTR-ESL-2026-9901',
    tenureMonths = 12
  } = agreementData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="driver-modal-overlay-custom printable-agreement-modal"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8, 16, 38, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="printable-contract-dialog"
        style={{
          width: '100%',
          maxWidth: '900px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Header */}
        <div
          style={{
            background: '#0f172a',
            padding: '14px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="#38bdf8" />
            <div>
              <strong style={{ fontSize: '14.5px' }}>Official Commercial Vehicle Lease Contract Preview</strong>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
                Document Ref: SFL-AGR-2026-{selectedVehicleReg.slice(-4) || '1042'} · Institutional Gate 4 Verified
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: '6px 14px',
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Legal Document Sheet */}
        <div
          id="printable-lease-contract"
          style={{
            padding: '36px 40px',
            overflowY: 'auto',
            flex: 1,
            background: '#ffffff',
            color: '#0f172a',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          {/* Institutional Stamp & Letterhead */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', color: '#0f172a' }}>
                  SIKHAR FLEET PRIVATE LIMITED
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                CIN: U60200DL2024PTC123456 • GSTIN: 07AAACS1234F1Z5 • Commercial Fleet Operators
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Registered Operations Terminal: Sector 44 Institutional Area, Gurugram, Delhi NCR 122003
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ border: '2px solid #0284c7', padding: '6px 12px', borderRadius: '6px', display: 'inline-block', background: '#f0f9ff' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#0284c7' }}>
                  E-Stamped Contract
                </div>
                <div style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'monospace', color: '#0f172a' }}>
                  IN-DL8921827419
                </div>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                Certificate of Govt Stamp Duty Paid
              </div>
            </div>
          </div>

          {/* Agreement Title */}
          <div style={{ textAlign: 'center', margin: '20px 0 24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px', color: '#0f172a' }}>
              MASTER COMMERCIAL VEHICLE LEASE &amp; OPERATIONAL AGREEMENT
            </h2>
            <div style={{ fontSize: '11.5px', color: '#475569' }}>
              Executed in accordance with Motor Vehicles Act, 1988 &amp; Commercial Transport Fleet Guidelines
            </div>
          </div>

          {/* Preamble & Parties Box */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '12.5px', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 10px' }}>
              This Commercial Lease Agreement (hereinafter referred to as the <strong>"Agreement"</strong>) is made and entered into on this{' '}
              <strong>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>, by and between:
            </p>
            <p style={{ margin: '0 0 8px' }}>
              <strong>1. SIKHAR FLEET PRIVATE LIMITED</strong>, having its registered operational hub at Sector 44, Gurugram (hereinafter called the <strong>"LESSOR"</strong>, which expression shall include its successors and permitted assigns); AND
            </p>
            <p style={{ margin: 0 }}>
              <strong>2. MR. {customerName.toUpperCase()}</strong>, holding Commercial Driving Licence No.{' '}
              <code>{drivingLicence}</code>, Aadhaar No. <code>{aadhaar}</code>, residing at{' '}
              <em>{address}</em>, Contact Phone: <strong>{customerPhone}</strong> (hereinafter called the <strong>"LESSEE"</strong>).
            </p>
          </div>

          {/* Schedule A: Vehicle Asset Specifications Table */}
          <h4 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a', borderLeft: '4px solid #0284c7', paddingLeft: '8px', margin: '20px 0 10px' }}>
            SCHEDULE A: VEHICLE ASSET PARTICULARS
          </h4>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '22px', border: '1px solid #cbd5e1' }}>
            <tbody>
              <tr style={{ background: '#f1f5f9' }}>
                <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 700, width: '25%' }}>Registration Plate</td>
                <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#0284c7' }}>{selectedVehicleReg}</td>
                <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 700, width: '25%' }}>Make &amp; Model</td>
                <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{selectedVehicleObj?.model || 'Commercial Fleet Vehicle'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 700 }}>Powertrain / Fuel</td>
                <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{selectedVehicleObj?.type || 'CNG / Clean Energy'}</td>
                <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 700 }}>Odometer at Handover</td>
                <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>{selectedVehicleObj?.odometer || '18,400 km'}</td>
              </tr>
              <tr style={{ background: '#f1f5f9' }}>
                <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 700 }}>Chassis (VIN) No.</td>
                <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>MAT612034NJB09812</td>
                <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 700 }}>Base Depot / Yard</td>
                <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>Sikhar Hub Central Operations Yard</td>
              </tr>
            </tbody>
          </table>

          {/* Schedule B: Commercial Consideration & Escrow Terms */}
          <h4 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a', borderLeft: '4px solid #0284c7', paddingLeft: '8px', margin: '20px 0 10px' }}>
            SCHEDULE B: COMMERCIAL DEAL TERMS &amp; ESCROW PROTOCOL
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Commercial Model</span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>{dealType}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Rental Rate</span>
              <strong style={{ fontSize: '13px', color: '#16a34a' }}>
                {dealType === 'Fixed Lease' ? `₹${rateAmount} / day` : '75% Driver / 25% Sikhar'}
              </strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Escrow Security Deposit</span>
              <strong style={{ fontSize: '13px', color: '#0284c7' }}>₹{Number(securityDeposit).toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Lease Duration</span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>{tenureMonths} Months</strong>
            </div>
          </div>

          {/* Legal Clauses */}
          <div style={{ fontSize: '11.5px', lineHeight: 1.6, color: '#334155' }}>
            <p><strong>1. PERMITTED USE &amp; BOUNDARIES:</strong> The Lessee shall deploy the vehicle solely for passenger ride-hailing and permitted commercial logistics. The vehicle shall operate strictly within the approved territory (Delhi NCR and contiguous state corridors).</p>
            <p><strong>2. TELEMATICS &amp; 24x7 IOT MONITORING:</strong> The Lessee acknowledges that the asset is equipped with real-time 4G GPS, OBD-II speed governors (calibrated at 60 km/h), and battery/CNG telemetry. The Lessor reserves the right of remote ignition immobilisation in event of unauthorized territory exit, repeated safety violations, or rental payment default.</p>
            <p><strong>3. MAINTENANCE PROTOCOLS:</strong> Scheduled preventive servicing (every 10,000 km) shall be borne entirely by the Lessor at authorized OEM service hubs. Daily pre-trip inspection, tire pressure, and proper battery charging etiquette remain the strict operational responsibility of the Lessee.</p>
            <p><strong>4. SECURITY ESCROW GUARANTEE:</strong> The security deposit of ₹{Number(securityDeposit).toLocaleString('en-IN')} (Ref: {depositReceiptRef}) shall remain safely held in escrow. Upon clean completion of tenure and clearance of all traffic challans or minor damage, the full deposit shall be refunded within 7 banking days.</p>
          </div>

          {/* Signatures & Stamps Footer */}
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Lessor Signature Box */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', background: '#f8fafc', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                FOR SIKHAR FLEET PRIVATE LIMITED (LESSOR)
              </div>
              <div style={{ margin: '14px 0', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ border: '1.5px dashed #0284c7', padding: '6px 14px', borderRadius: '4px', color: '#0284c7', fontSize: '11px', fontWeight: 800 }}>
                  ✓ DIGITALLY AUTHORIZED SEAL · FLEET DIRECTORATE
                </div>
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 700 }}>Authorized Signatory</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Operations &amp; Legal Compliance Dept</div>
            </div>

            {/* Lessee Signature Box */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', background: '#f8fafc', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                CUSTOMER / DRIVER LESSEE ACCEPTANCE
              </div>
              <div style={{ margin: '14px 0', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isSigned ? (
                  <div style={{ border: '1.5px dashed #16a34a', padding: '6px 14px', borderRadius: '4px', color: '#16a34a', fontSize: '11px', fontWeight: 800 }}>
                    ✓ DIGITALLY SIGNED &amp; ACCEPTED BY {customerName.toUpperCase()}
                  </div>
                ) : (
                  <div style={{ color: '#d97706', fontSize: '11px', fontWeight: 700 }}>
                    ⏳ Awaiting Digital E-Signature Acceptance
                  </div>
                )}
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 700 }}>{customerName}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Primary Commercial Lessee</div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div style={{ background: '#f8fafc', padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#475569' }}>
            <CheckCircle2 size={16} color="#16a34a" />
            <span>Digital contract compliant with Indian Contract Act 1872 &amp; IT Act 2000.</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {!isSigned && onSignAgreement && (
              <button
                type="button"
                onClick={() => {
                  onSignAgreement();
                  onClose();
                }}
                style={{
                  padding: '8px 18px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Sign Contract Now
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                background: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
