// API Client interacting with Node.js Express backend (http://localhost:5000 via proxy /api)

const API_BASE = '/api';

export async function loginAdminApi(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Authentication rejected by security gateway.');
    }

    // Persist session token and profile
    if (data.token) {
      localStorage.setItem('sikhar_admin_token', data.token);
      localStorage.setItem('sikhar_admin_user', JSON.stringify(data.user));
    }
    return data;
}

export async function fetchDashboardApi() {
  try {
    const response = await fetch(`${API_BASE}/dashboard`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to retrieve dashboard metrics.');
    }
    return data.data;
  } catch (err) {
    console.warn('Backend fetch failed, attempting cached local metrics:', err);
    // Return cached if network is interrupted
    const cached = localStorage.getItem('sikhar_cached_dashboard');
    if (cached) return JSON.parse(cached);
    throw err;
  }
}

export async function fetchFleetTowerApi(filterStatus = 'all', searchQuery = '') {
  try {
    const url = new URL(`${window.location.origin}${API_BASE}/fleet`);
    if (filterStatus && filterStatus !== 'all') url.searchParams.append('status', filterStatus);
    if (searchQuery) url.searchParams.append('search', searchQuery);

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to retrieve fleet tower data.');
    }
    return data.data;
  } catch (err) {
    console.error('Fleet API fetch error:', err);
    throw err;
  }
}

export async function fetchVehicleDetailApi(vehicleId) {
  try {
    const response = await fetch(`${API_BASE}/fleet/vehicles/${encodeURIComponent(vehicleId)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch vehicle detail.');
    }
    return data.vehicle;
  } catch (err) {
    console.error('Vehicle detail API error:', err);
    throw err;
  }
}

export async function executeVehicleActionApi(vehicleId, actionType, payload = {}) {
  try {
    const response = await fetch(`${API_BASE}/fleet/vehicles/${encodeURIComponent(vehicleId)}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType, payload })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to execute vehicle action.');
    }
    return data;
  } catch (err) {
    console.error('Vehicle action error:', err);
    throw err;
  }
}

export async function createVehicleApi(vehicleData) {
  try {
    const response = await fetch(`${API_BASE}/fleet/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicleData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to onboard vehicle asset.');
    }
    return data;
  } catch (err) {
    console.error('Create vehicle API error:', err);
    throw err;
  }
}

export async function updateVehicleStatusApi(vehicleId, status, reason = '', driver = undefined, nextAction = '') {
  try {
    const response = await fetch(`${API_BASE}/fleet/vehicles/${encodeURIComponent(vehicleId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason, driver, nextAction })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update vehicle status.');
    }
    return data;
  } catch (err) {
    console.error('Update vehicle status API error:', err);
    throw err;
  }
}


// ========================================================
// DRIVER CONTROL TOWER APIS
// ========================================================

export async function fetchDriversApi(status = 'all', wallet = 'all', search = '') {
  try {
    const url = new URL(`${window.location.origin}${API_BASE}/drivers`);
    if (status && status !== 'all') url.searchParams.append('status', status);
    if (wallet && wallet !== 'all') url.searchParams.append('wallet', wallet);
    if (search && search.trim() !== '') url.searchParams.append('search', search.trim());

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to retrieve driver registry.');
    }
    return data.data;
  } catch (err) {
    console.error('Driver API error:', err);
    throw err;
  }
}

export async function fetchDriverByIdApi(id) {
  try {
    const response = await fetch(`${API_BASE}/drivers/${encodeURIComponent(id)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch driver profile.');
    }
    return data.data;
  } catch (err) {
    console.error('Fetch driver profile error:', err);
    throw err;
  }
}

export async function updateDriverStatusApi(id, status, reason = '') {
  try {
    const response = await fetch(`${API_BASE}/drivers/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update driver status.');
    }
    return data;
  } catch (err) {
    console.error('Update driver status error:', err);
    throw err;
  }
}

export async function topupDriverWalletApi(id, amount, method = 'Admin Credit Voucher', reference = '') {
  try {
    const response = await fetch(`${API_BASE}/drivers/${encodeURIComponent(id)}/wallet/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, method, reference })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to credit driver wallet.');
    }
    return data;
  } catch (err) {
    console.error('Topup wallet error:', err);
    throw err;
  }
}

export async function fetchWalletHealthApi(status = 'all', search = '') {
  try {
    const url = new URL(`${window.location.origin}${API_BASE}/drivers/wallet-health`);
    if (status && status !== 'all') url.searchParams.append('status', status);
    if (search && search.trim() !== '') url.searchParams.append('search', search.trim());

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to retrieve wallet health metrics.');
    }
    return data.data;
  } catch (err) {
    console.error('Wallet health API fetch error:', err);
    throw err;
  }
}

export async function onboardDriverApi(driverPayload) {
  try {
    const response = await fetch(`${API_BASE}/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driverPayload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to onboard driver.');
    }
    return data;
  } catch (err) {
    console.error('Onboard driver error:', err);
    throw err;
  }
}

export async function assignDriverVehicleApi(driverId, vehicleRegistration, vehicleModel = 'WagonR H3 CNG', vehicleType = 'CNG') {
  try {
    const response = await fetch(`${API_BASE}/drivers/${encodeURIComponent(driverId)}/vehicle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleRegistration, vehicleModel, vehicleType })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update vehicle assignment.');
    }
    return data;
  } catch (err) {
    console.error('Assign vehicle error:', err);
    throw err;
  }
}

export async function requestDriverLeaveApi(driverId, reason = 'Family Leave', days = 1) {
  try {
    const response = await fetch(`${API_BASE}/drivers/${encodeURIComponent(driverId)}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, days })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to request driver leave.');
    }
    return data;
  } catch (err) {
    console.error('Request leave error:', err);
    throw err;
  }
}

export async function amendDriverDealApi(driverId, dealData) {
  try {
    const response = await fetch(`${API_BASE}/drivers/${encodeURIComponent(driverId)}/deal`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dealData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to amend commercial deal.');
    }
    return data;
  } catch (err) {
    console.error('Amend deal error:', err);
    throw err;
  }
}

// ========================================================
// DRIVER-VEHICLE ASSIGNMENT & SWAP APIS
// ========================================================

export async function fetchAssignmentsApi() {
  try {
    const response = await fetch(`${API_BASE}/assignments`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to retrieve assignment records.');
    }
    return data;
  } catch (err) {
    console.error('Fetch assignments error:', err);
    throw err;
  }
}

export async function createAssignmentApi(payload) {
  try {
    const response = await fetch(`${API_BASE}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to assign vehicle.');
    }
    return data;
  } catch (err) {
    console.error('Create assignment error:', err);
    throw err;
  }
}

export async function revertAssignmentApi(assignmentId, returnOdometer = '', returnNotes = '') {
  try {
    const response = await fetch(`${API_BASE}/assignments/${encodeURIComponent(assignmentId)}/revert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnOdometer, returnNotes })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to revert assignment.');
    }
    return data;
  } catch (err) {
    console.error('Revert assignment error:', err);
    throw err;
  }
}

export async function extendAssignmentApi(assignmentId, additionalDays = 1, newEndDate = '', extendReason = '') {
  try {
    const response = await fetch(`${API_BASE}/assignments/${encodeURIComponent(assignmentId)}/extend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ additionalDays, newEndDate, extendReason })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to extend assignment.');
    }
    return data;
  } catch (err) {
    console.error('Extend assignment error:', err);
    throw err;
  }
}

export function getCachedAdminUser() {
  const stored = localStorage.getItem('sikhar_admin_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  return {
    id: 'ADM-001',
    name: 'Fleet Administrator',
    email: 'admin@sikharfleet.com',
    role: 'Administrator',
    initials: 'FA',
    branch: 'Delhi NCR Central Hub'
  };
}

export function logoutAdminApi() {
  localStorage.removeItem('sikhar_admin_token');
  localStorage.removeItem('sikhar_admin_user');
}

// =========================================================================
// RENTALS & COLLECTIONS API CLIENT (Bookings, Leases & Invoices)
// =========================================================================

export async function fetchLeasesApi(status = 'all', dealType = 'all', search = '') {
  try {
    const url = new URL(`${window.location.origin}${API_BASE}/rentals/leases`);
    if (status && status !== 'all') url.searchParams.append('status', status);
    if (dealType && dealType !== 'all') url.searchParams.append('dealType', dealType);
    if (search) url.searchParams.append('search', search);

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to retrieve lease agreements.');
    }
    return data.data;
  } catch (err) {
    console.error('Fetch leases error:', err);
    throw err;
  }
}

export async function fetchLeaseDetailApi(id) {
  try {
    const response = await fetch(`${API_BASE}/rentals/leases/${encodeURIComponent(id)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch lease details.');
    }
    return data.data;
  } catch (err) {
    console.error('Fetch lease detail error:', err);
    throw err;
  }
}

export async function createLeaseApi(payload) {
  try {
    const response = await fetch(`${API_BASE}/rentals/leases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create lease agreement.');
    }
    return data;
  } catch (err) {
    console.error('Create lease error:', err);
    throw err;
  }
}

export async function signLeaseAgreementApi(id) {
  try {
    const response = await fetch(`${API_BASE}/rentals/leases/${encodeURIComponent(id)}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to sign agreement.');
    }
    return data;
  } catch (err) {
    console.error('Sign lease error:', err);
    throw err;
  }
}

export async function confirmLeaseDepositApi(id, amount, reference) {
  try {
    const response = await fetch(`${API_BASE}/rentals/leases/${encodeURIComponent(id)}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, reference })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to confirm deposit.');
    }
    return data;
  } catch (err) {
    console.error('Confirm deposit error:', err);
    throw err;
  }
}

export async function activateLeaseApi(id) {
  try {
    const response = await fetch(`${API_BASE}/rentals/leases/${encodeURIComponent(id)}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to activate lease.');
    }
    return data;
  } catch (err) {
    console.error('Activate lease error:', err);
    throw err;
  }
}

export async function fetchInvoicesApi(status = 'all', search = '') {
  try {
    const url = new URL(`${window.location.origin}${API_BASE}/rentals/invoices`);
    if (status && status !== 'all') url.searchParams.append('status', status);
    if (search) url.searchParams.append('search', search);

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to retrieve rental invoices.');
    }
    return data.data;
  } catch (err) {
    console.error('Fetch invoices error:', err);
    throw err;
  }
}

export async function createInvoiceApi(payload) {
  try {
    const response = await fetch(`${API_BASE}/rentals/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to generate invoice.');
    }
    return data;
  } catch (err) {
    console.error('Create invoice error:', err);
    throw err;
  }
}

export async function payInvoiceWalletApi(id) {
  try {
    const response = await fetch(`${API_BASE}/rentals/invoices/${encodeURIComponent(id)}/pay-wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to process wallet payment.');
    }
    return data;
  } catch (err) {
    console.error('Pay invoice via wallet error:', err);
    throw err;
  }
}

export async function payInvoiceDirectApi(id, paymentMethod = 'UPI', reference = '') {
  try {
    const response = await fetch(`${API_BASE}/rentals/invoices/${encodeURIComponent(id)}/pay-direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod, reference })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to record direct payment.');
    }
    return data;
  } catch (err) {
    console.error('Pay invoice direct error:', err);
    throw err;
  }
}

export async function waiveInvoiceApi(id, reason = '') {
  try {
    const response = await fetch(`${API_BASE}/rentals/invoices/${encodeURIComponent(id)}/waive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to waive invoice.');
    }
    return data;
  } catch (err) {
    console.error('Waive invoice error:', err);
    throw err;
  }
}

// ========================================================
// ESCALATIONS & TICKETING SERVICE API
// ========================================================

export async function fetchEscalationsApi(filters = {}) {
  try {
    const url = new URL(`${window.location.origin}${API_BASE}/escalations`);
    if (filters.status && filters.status !== 'all') url.searchParams.append('status', filters.status);
    if (filters.priority && filters.priority !== 'all') url.searchParams.append('priority', filters.priority);
    if (filters.category && filters.category !== 'all') url.searchParams.append('category', filters.category);
    if (filters.search) url.searchParams.append('search', filters.search);

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch escalations.');
    }
    return data;
  } catch (err) {
    console.error('Fetch escalations API error:', err);
    throw err;
  }
}

export async function fetchEscalationDetailApi(id) {
  try {
    const response = await fetch(`${API_BASE}/escalations/${encodeURIComponent(id)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Failed to fetch escalation ${id}.`);
    }
    return data.ticket;
  } catch (err) {
    console.error('Fetch escalation detail error:', err);
    throw err;
  }
}

export async function createEscalationApi(payload) {
  try {
    const response = await fetch(`${API_BASE}/escalations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create escalation ticket.');
    }
    return data;
  } catch (err) {
    console.error('Create escalation error:', err);
    throw err;
  }
}

export async function updateEscalationApi(id, payload) {
  try {
    const response = await fetch(`${API_BASE}/escalations/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Failed to update escalation ${id}.`);
    }
    return data;
  } catch (err) {
    console.error('Update escalation error:', err);
    throw err;
  }
}

export async function addEscalationNoteApi(id, note, user = 'Admin') {
  try {
    const response = await fetch(`${API_BASE}/escalations/${encodeURIComponent(id)}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note, user })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add note.');
    }
    return data;
  } catch (err) {
    console.error('Add escalation note error:', err);
    throw err;
  }
}

export async function resolveEscalationApi(id, resolutionNote = '', driverConfirmed = true) {
  try {
    const response = await fetch(`${API_BASE}/escalations/${encodeURIComponent(id)}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolutionNote, driverConfirmed })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to resolve escalation.');
    }
    return data;
  } catch (err) {
    console.error('Resolve escalation error:', err);
    throw err;
  }
}

// ========================================================
// TRIPS & REVENUE SHARE API SUITE
// ========================================================

export async function fetchTripsApi(filters = {}) {
  try {
    const url = new URL(`${window.location.origin}${API_BASE}/trips`);
    if (filters.status && filters.status !== 'all') url.searchParams.append('status', filters.status);
    if (filters.source && filters.source !== 'all') url.searchParams.append('source', filters.source);
    if (filters.vehicle && filters.vehicle !== 'all') url.searchParams.append('vehicle', filters.vehicle);
    if (filters.driver && filters.driver !== 'all') url.searchParams.append('driver', filters.driver);
    if (filters.search && filters.search.trim()) url.searchParams.append('search', filters.search.trim());

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to retrieve trips telemetry.');
    }
    return data;
  } catch (err) {
    console.error('Fetch trips error:', err);
    throw err;
  }
}

export async function fetchTripDetailApi(id) {
  try {
    const response = await fetch(`${API_BASE}/trips/${encodeURIComponent(id)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Failed to fetch trip ${id}.`);
    }
    return data.trip;
  } catch (err) {
    console.error('Fetch trip detail error:', err);
    throw err;
  }
}

export async function createTripApi(tripData) {
  try {
    const response = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to log manual trip.');
    }
    return data;
  } catch (err) {
    console.error('Create trip error:', err);
    throw err;
  }
}

export async function importTripsApi(tripsArray) {
  try {
    const response = await fetch(`${API_BASE}/trips/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trips: tripsArray })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to import trips statement.');
    }
    return data;
  } catch (err) {
    console.error('Import trips error:', err);
    throw err;
  }
}

export async function updateTripStatusApi(id, statusData) {
  try {
    const response = await fetch(`${API_BASE}/trips/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Failed to update trip ${id}.`);
    }
    return data;
  } catch (err) {
    console.error('Update trip status error:', err);
    throw err;
  }
}

export async function escalateTripApi(id, escalationData) {
  try {
    const response = await fetch(`${API_BASE}/trips/${encodeURIComponent(id)}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(escalationData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to raise escalation for trip.');
    }
    return data;
  } catch (err) {
    console.error('Escalate trip error:', err);
    throw err;
  }
}

// ========================================================
// MAINTENANCE CONTROL CENTER API SUITE (10-STAGE PIPELINE)
// ========================================================

export async function fetchMaintenanceApi(filters = {}) {
  try {
    const url = new URL(`${window.location.origin}${API_BASE}/maintenance`);
    if (filters.stage && filters.stage !== 'all') url.searchParams.append('stage', filters.stage);
    if (filters.status && filters.status !== 'all') url.searchParams.append('status', filters.status);
    if (filters.vehicle && filters.vehicle !== 'all') url.searchParams.append('vehicle', filters.vehicle);
    if (filters.search && filters.search.trim()) url.searchParams.append('search', filters.search.trim());

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to retrieve maintenance records.');
    }
    return data;
  } catch (err) {
    console.error('Fetch maintenance error:', err);
    throw err;
  }
}

export async function fetchJobCardDetailApi(id) {
  try {
    const response = await fetch(`${API_BASE}/maintenance/${encodeURIComponent(id)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Failed to fetch job card ${id}.`);
    }
    return data;
  } catch (err) {
    console.error('Fetch job card detail error:', err);
    throw err;
  }
}

export async function createJobCardApi(cardData) {
  try {
    const response = await fetch(`${API_BASE}/maintenance/job-cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create job card.');
    }
    return data;
  } catch (err) {
    console.error('Create job card error:', err);
    throw err;
  }
}

export async function advanceMaintenanceStageApi(id, stageData) {
  try {
    const response = await fetch(`${API_BASE}/maintenance/${encodeURIComponent(id)}/advance-stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stageData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Failed to advance stage for ${id}.`);
    }
    return data;
  } catch (err) {
    console.error('Advance maintenance stage error:', err);
    throw err;
  }
}

export async function approveEstimateApi(id, estimateData) {
  try {
    const response = await fetch(`${API_BASE}/maintenance/${encodeURIComponent(id)}/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(estimateData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to approve estimate.');
    }
    return data;
  } catch (err) {
    console.error('Approve estimate error:', err);
    throw err;
  }
}

export async function submitQcApi(id, qcData) {
  try {
    const response = await fetch(`${API_BASE}/maintenance/${encodeURIComponent(id)}/qc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qcData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit QC report.');
    }
    return data;
  } catch (err) {
    console.error('Submit QC error:', err);
    throw err;
  }
}

export async function verifyMaintenanceBillApi(id, billData) {
  try {
    const response = await fetch(`${API_BASE}/maintenance/${encodeURIComponent(id)}/bill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify final vendor invoice.');
    }
    return data;
  } catch (err) {
    console.error('Verify bill error:', err);
    throw err;
  }
}

export async function recordMaintenancePaymentApi(id, paymentData) {
  try {
    const response = await fetch(`${API_BASE}/maintenance/${encodeURIComponent(id)}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to record maintenance vendor payment.');
    }
    return data;
  } catch (err) {
    console.error('Record payment error:', err);
    throw err;
  }
}

export async function releaseVehicleApi(id, releaseData) {
  try {
    const response = await fetch(`${API_BASE}/maintenance/${encodeURIComponent(id)}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(releaseData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to release vehicle from maintenance.');
    }
    return data;
  } catch (err) {
    console.error('Release vehicle error:', err);
    throw err;
  }
}



