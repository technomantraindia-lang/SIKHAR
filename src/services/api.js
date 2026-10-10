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
