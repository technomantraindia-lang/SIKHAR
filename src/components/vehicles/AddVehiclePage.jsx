import React, { useState } from 'react';
import {
  Car,
  ChevronRight,
  Shield,
  IndianRupee,
  MapPin,
  AlertTriangle
} from '../common/Icons';
import { createVehicleApi } from '../../services/api';

export default function AddVehiclePage({ onBack, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State matching PDF Page 3 & 8 requirements
  const [formData, setFormData] = useState({
    registration: '',
    model: 'TATA TIGOR EV XPRESS T',
    type: 'EV',
    connectorType: 'CCS2 (Combined Charging System)',
    chassis: '',
    hub: 'Sikhar Hub Central Operations Yard',
    status: 'Ready to Deploy',
    odometer: '120',
    battery: '100%',
    lender: 'Signo Financing',
    monthlyEmi: '21000',
    dailyRentRate: '1150',
    permitExpiry: '2027-03-31',
    insuranceExpiry: '2027-02-28',
    fitnessExpiry: '2028-01-15',
    pucExpiry: '2027-06-30',
    driver: 'Unassigned',
    driverPhone: '—',
    notes: 'Brand new asset inducted into Sikhar commercial fleet.'
  });

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-set connector type based on powertrain
      if (field === 'type') {
        if (value === 'EV') {
          updated.connectorType = 'CCS2 (Combined Charging System)';
          updated.battery = '100%';
        } else {
          updated.connectorType = 'Standard Dual-Stage CNG Valve';
          updated.battery = '100% (CNG Full)';
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.registration || formData.registration.trim().length < 6) {
      setError('Please provide a valid Indian Registration Plate (e.g. DL52GD9901).');
      return;
    }

    try {
      setLoading(true);
      const cleanPlate = formData.registration.trim().toUpperCase().replace(/\s+/g, '');
      const payload = {
        ...formData,
        registration: cleanPlate,
        monthlyEmi: `₹${formData.monthlyEmi.replace(/[₹,]/g, '')}`,
        dailyRentRate: `₹${formData.dailyRentRate.replace(/[₹,]/g, '')}`
      };

      const result = await createVehicleApi(payload);
      if (result.success) {
        if (onSuccess) {
          onSuccess(result.vehicle);
        } else {
          onBack();
        }
      }
    } catch (err) {
      console.error('Vehicle onboarding error:', err);
      setError(err.message || 'Failed to onboard vehicle asset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="terminal-content add-vehicle-stage">
      {/* Top Header */}
      <div className="command-header">
        <div>
          <div className="breadcrumb-nav">
            <span className="breadcrumb-link" onClick={onBack}>Vehicle Master</span>
            <ChevronRight size={14} className="breadcrumb-sep" />
            <span className="breadcrumb-active">Asset Onboarding Gate</span>
          </div>
          <h1 className="executive-greeting">
            ONBOARD NEW VEHICLE ASSET
          </h1>
          <div className="executive-subline">
            Register Institutional Commercial Asset · Powertrain Telemetry · RTO Compliance &amp; Capital Financing
          </div>
        </div>

        <div className="command-actions-row">
          <button className="btn secondary" onClick={onBack} disabled={loading}>
            Cancel
          </button>
          <button className="btn primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Registering Asset...' : 'Save & Induct Asset →'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="terminal-alert-box error" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={18} color="#ef4444" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Grid */}
      <form onSubmit={handleSubmit} className="add-vehicle-form-layout">
        {/* Section 1: Asset Identity & Powertrain */}
        <div className="terminal-panel av-section-card">
          <div className="panel-title-row">
            <div className="panel-title-with-badge">
              <Car size={18} color="#0284c7" />
              <h3>1 · ASSET IDENTITY &amp; POWERTRAIN</h3>
            </div>
            <span className="count-pill blue">Gate 01</span>
          </div>

          <div className="av-form-grid">
            <div className="form-group">
              <label>Registration Number (HSRP Plate) *</label>
              <input
                type="text"
                className="terminal-input"
                placeholder="e.g. DL52GD9901 or HR38AK9922"
                value={formData.registration}
                onChange={(e) => handleChange('registration', e.target.value.toUpperCase())}
                required
              />
              <span className="form-helper">Format: State Code + District + Series + 4 Digits</span>
            </div>

            <div className="form-group">
              <label>Vehicle Model *</label>
              <select
                className="terminal-select"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
              >
                <option value="TATA TIGOR EV XPRESS T">Tata Tigor EV Xpress T (Commercial Fleet)</option>
                <option value="TATA NEXON EV PRIME">Tata Nexon EV Prime</option>
                <option value="MG ZS EV EXCITE">MG ZS EV Excite</option>
                <option value="WAGONR H3 CNG">Maruti WagonR H3 CNG (Commercial Fleet)</option>
                <option value="MARUTI DZIRE TOUR S CNG">Maruti Dzire Tour S CNG</option>
              </select>
            </div>

            <div className="form-group">
              <label>Powertrain Type *</label>
              <div className="radio-pill-group">
                <button
                  type="button"
                  className={`radio-pill-btn ${formData.type === 'EV' ? 'active' : ''}`}
                  onClick={() => handleChange('type', 'EV')}
                >
                  ⚡ Electric (EV)
                </button>
                <button
                  type="button"
                  className={`radio-pill-btn ${formData.type === 'CNG' ? 'active' : ''}`}
                  onClick={() => handleChange('type', 'CNG')}
                >
                  ⛽ Compressed Natural Gas (CNG)
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Connector / Fuel Interface *</label>
              <select
                className="terminal-select"
                value={formData.connectorType}
                onChange={(e) => handleChange('connectorType', e.target.value)}
              >
                {formData.type === 'EV' ? (
                  <>
                    <option value="CCS2 (Combined Charging System)">CCS2 (Combined Charging System - 25kW DC &amp; AC)</option>
                    <option value="Type 2 AC Mennekes">Type 2 AC Mennekes (3.3kW / 7.2kW)</option>
                    <option value="GB/T Fast DC">GB/T Fast DC (Commercial EV Standard)</option>
                  </>
                ) : (
                  <>
                    <option value="Standard Dual-Stage CNG Valve">Standard Dual-Stage CNG Valve (60L Tank)</option>
                    <option value="High-Flow NGV1 Commercial Nozzle">High-Flow NGV1 Commercial Nozzle</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group full-width">
              <label>Chassis (VIN) Number *</label>
              <input
                type="text"
                className="terminal-input"
                placeholder="e.g. MAT612034NJB98102"
                value={formData.chassis}
                onChange={(e) => handleChange('chassis', e.target.value.toUpperCase())}
              />
              <span className="form-helper">17-character standardized vehicle identification number stamped on firewall</span>
            </div>
          </div>
        </div>

        {/* Section 2: Fleet Hub Allocation & Deployment */}
        <div className="terminal-panel av-section-card">
          <div className="panel-title-row">
            <div className="panel-title-with-badge">
              <MapPin size={18} color="#0284c7" />
              <h3>2 · FLEET OPERATIONS &amp; YARD ALLOCATION</h3>
            </div>
            <span className="count-pill blue">Gate 02</span>
          </div>

          <div className="av-form-grid">
            <div className="form-group">
              <label>Assigned Operations Yard / Hub *</label>
              <select
                className="terminal-select"
                value={formData.hub}
                onChange={(e) => handleChange('hub', e.target.value)}
              >
                <option value="Sikhar Hub Central Operations Yard">Sikhar Hub Central Operations Yard (Okhla)</option>
                <option value="ABC Motors Gurgaon Workshop Hub">ABC Motors Gurgaon Workshop Hub (Sec 29)</option>
                <option value="Sikhar Noida Sector 62 Charging Hub">Sikhar Noida Sector 62 Charging Hub</option>
                <option value="Aerocity Logistics & Transit Yard">Aerocity Logistics &amp; Transit Yard</option>
              </select>
            </div>

            <div className="form-group">
              <label>Initial Operational Status *</label>
              <select
                className="terminal-select"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="Ready to Deploy">Ready to Deploy (Available in Yard)</option>
                <option value="At Workshop">At Workshop (Pre-induction Inspection)</option>
                <option value="On Road">On Road (Direct Deployment)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Starting Odometer (km)</label>
              <input
                type="number"
                className="terminal-input"
                placeholder="100"
                value={formData.odometer}
                onChange={(e) => handleChange('odometer', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Initial Battery SOC / Fuel Level</label>
              <input
                type="text"
                className="terminal-input"
                value={formData.battery}
                onChange={(e) => handleChange('battery', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Financing & Economics (PDF Page 3 & 12) */}
        <div className="terminal-panel av-section-card">
          <div className="panel-title-row">
            <div className="panel-title-with-badge">
              <IndianRupee size={18} color="#0284c7" />
              <h3>3 · CAPITAL FINANCING &amp; LEASE ECONOMICS</h3>
            </div>
            <span className="count-pill green">Gate 03</span>
          </div>

          <div className="av-form-grid">
            <div className="form-group">
              <label>Lender / Financing Institution *</label>
              <select
                className="terminal-select"
                value={formData.lender}
                onChange={(e) => handleChange('lender', e.target.value)}
              >
                <option value="Signo Financing">Signo Financing (NBFC Facility)</option>
                <option value="Astronova Capital">Astronova Capital (EV Asset Leasing)</option>
                <option value="HDFC Bank Commercial Assets">HDFC Bank Commercial Assets</option>
                <option value="Tata Capital Fleet Finance">Tata Capital Fleet Finance</option>
              </select>
            </div>

            <div className="form-group">
              <label>Monthly Lender EMI (₹) *</label>
              <input
                type="text"
                className="terminal-input"
                placeholder="21000"
                value={formData.monthlyEmi}
                onChange={(e) => handleChange('monthlyEmi', e.target.value)}
                required
              />
              <span className="form-helper">Fixed monthly institutional debt service</span>
            </div>

            <div className="form-group">
              <label>Daily Rental Rate Target (₹)</label>
              <input
                type="text"
                className="terminal-input"
                placeholder="1150"
                value={formData.dailyRentRate}
                onChange={(e) => handleChange('dailyRentRate', e.target.value)}
              />
              <span className="form-helper">Driver daily lease collection target</span>
            </div>

            <div className="form-group">
              <label>Driver Assignment</label>
              <input
                type="text"
                className="terminal-input"
                placeholder="Unassigned (Keep in Yard)"
                value={formData.driver}
                onChange={(e) => handleChange('driver', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 4: RTO Statutory Expiry Dates (PDF Page 8) */}
        <div className="terminal-panel av-section-card">
          <div className="panel-title-row">
            <div className="panel-title-with-badge">
              <Shield size={18} color="#0284c7" />
              <h3>4 · RTO STATUTORY COMPLIANCE DATES</h3>
            </div>
            <span className="count-pill green">Gate 04</span>
          </div>

          <div className="av-form-grid">
            <div className="form-group">
              <label>Commercial Taxi Permit Expiry</label>
              <input
                type="date"
                className="terminal-input"
                value={formData.permitExpiry}
                onChange={(e) => handleChange('permitExpiry', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Comprehensive Insurance Expiry</label>
              <input
                type="date"
                className="terminal-input"
                value={formData.insuranceExpiry}
                onChange={(e) => handleChange('insuranceExpiry', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>RTO Fitness Certificate Expiry</label>
              <input
                type="date"
                className="terminal-input"
                value={formData.fitnessExpiry}
                onChange={(e) => handleChange('fitnessExpiry', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>PUC Certificate Expiry</label>
              <input
                type="date"
                className="terminal-input"
                value={formData.pucExpiry}
                onChange={(e) => handleChange('pucExpiry', e.target.value)}
              />
            </div>

            <div className="form-group full-width">
              <label>Vehicle Notes / Asset Log</label>
              <textarea
                className="terminal-input"
                rows={2}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submission Actions */}
        <div className="form-footer-actions">
          <button type="button" className="btn secondary" onClick={onBack} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Registering Asset...' : 'Confirm & Induct Asset into Vehicle Master →'}
          </button>
        </div>
      </form>
    </div>
  );
}
