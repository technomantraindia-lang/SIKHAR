import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

function readJson(fileName, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, fileName), 'utf8'));
  } catch (error) {
    console.error(`Finance report could not read ${fileName}:`, error.message);
    return fallback;
  }
}

function amount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined) return 0;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(value) {
  if (!value || value === '—' || value === 'Today') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateKey(value) {
  const parsed = parseDate(value);
  if (!parsed) return null;
  return parsed.toISOString().slice(0, 10);
}

function startOfDay(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function endOfDay(value) {
  return new Date(`${value}T23:59:59.999Z`);
}

function inPeriod(value, from, to) {
  const parsed = parseDate(value);
  return parsed && parsed >= from && parsed <= to;
}

function periodFromQuery(query, financialDates) {
  const validDates = financialDates.filter(Boolean).sort();
  const latest = validDates[validDates.length - 1] || new Date().toISOString().slice(0, 10);
  const latestDate = parseDate(latest) || new Date();
  const defaultFrom = `${latestDate.getUTCFullYear()}-${String(latestDate.getUTCMonth() + 1).padStart(2, '0')}-01`;
  const defaultTo = new Date(Date.UTC(latestDate.getUTCFullYear(), latestDate.getUTCMonth() + 1, 0))
    .toISOString().slice(0, 10);
  const fromKey = /^\d{4}-\d{2}-\d{2}$/.test(query.from || '') ? query.from : defaultFrom;
  const toKey = /^\d{4}-\d{2}-\d{2}$/.test(query.to || '') ? query.to : defaultTo;
  const from = startOfDay(fromKey);
  const to = endOfDay(toKey);
  return {
    from,
    to,
    fromKey,
    toKey,
    label: `${fromKey} to ${toKey}`
  };
}

function previousPeriod(period) {
  const days = Math.max(1, Math.round((period.to - period.from) / 86400000) + 1);
  const to = new Date(period.from.getTime() - 1);
  const from = new Date(to.getTime() - ((days - 1) * 86400000));
  return {
    from,
    to,
    fromKey: from.toISOString().slice(0, 10),
    toKey: to.toISOString().slice(0, 10)
  };
}

function entry({ id, date, description, category, amountValue, direction, source, sourceId, sourceRoute, note }) {
  return {
    id,
    date: dateKey(date),
    description,
    category,
    amount: Number(amountValue.toFixed(2)),
    direction,
    source,
    sourceId,
    sourceRoute,
    note: note || ''
  };
}

function loadFinanceData() {
  const invoices = readJson('invoices.json', { invoices: [] }).invoices || [];
  const leases = readJson('leases.json', { leases: [] }).leases || [];
  const trips = readJson('trips.json', { trips: [] }).trips || [];
  const maintenance = readJson('maintenance.json', { jobCards: [] }).jobCards || [];
  const fuelData = readJson('fuel.json', { chargingSessions: [], fuelLogs: [] });
  const drivers = readJson('drivers.json', { drivers: [] }).drivers || [];
  const fleet = readJson('fleet.json', { vehicles: [] }).vehicles || [];

  const dates = [
    ...invoices.map(i => dateKey(i.invoiceDate)),
    ...trips.filter(t => t.status === 'Completed').map(t => dateKey(t.endTime || t.startTime)),
    ...maintenance.filter(j => j.bill && j.checklist?.billVerified === true).map(j => dateKey(j.bill.invoiceDate)),
    ...maintenance.filter(j => j.payment?.date).map(j => dateKey(j.payment.date)),
    ...fuelData.fuelLogs.filter(f => f.status === 'Verified').map(f => dateKey(f.loggedAt)),
    ...fuelData.chargingSessions.filter(s => s.status === 'Settled').map(s => dateKey(s.endTime || s.startTime))
  ];

  return { invoices, leases, trips, maintenance, fuelData, drivers, fleet, dates };
}

function normalizeCustomerName(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function financeAsOf(data) {
  const dates = data.dates.filter(Boolean).sort();
  return parseDate(dates[dates.length - 1]) || new Date();
}

function invoiceOutstanding(invoice) {
  if (String(invoice.status || '').toLowerCase() === 'waived') return 0;
  return Math.max(0, amount(invoice.balanceDue ?? (amount(invoice.totalAmount) - amount(invoice.amountPaid))));
}

function ageDaysFor(invoice, asOf) {
  const due = parseDate(invoice.dueDate || invoice.invoiceDate);
  if (!due) return 0;
  return Math.max(0, Math.floor((asOf.getTime() - due.getTime()) / 86400000));
}

function ageingBucket(days) {
  if (days <= 30) return '0–30 days';
  if (days <= 60) return '31–60 days';
  if (days <= 90) return '61–90 days';
  return '90+ days';
}

function customerKeyFor(invoice) {
  return invoice.customerId || `name:${normalizeCustomerName(invoice.customerName)}`;
}

function buildReceivables(data) {
  const asOf = financeAsOf(data);
  const validInvoices = data.invoices
    .filter(invoice => !['cancelled', 'void', 'reversed'].includes(String(invoice.status || '').toLowerCase()))
    .map(invoice => ({
      ...invoice,
      outstanding: invoiceOutstanding(invoice),
      ageDays: ageDaysFor(invoice, asOf),
      ageBucket: ageingBucket(ageDaysFor(invoice, asOf)),
      isOverdue: invoiceOutstanding(invoice) > 0 && ageDaysFor(invoice, asOf) > 0
    }));

  const openInvoices = validInvoices.filter(invoice => invoice.outstanding > 0);
  const ageing = { '0–30 days': 0, '31–60 days': 0, '61–90 days': 0, '90+ days': 0 };
  openInvoices.forEach(invoice => { ageing[invoice.ageBucket] += invoice.outstanding; });

  const customerMap = new Map();
  validInvoices.forEach(invoice => {
    const key = customerKeyFor(invoice);
    const current = customerMap.get(key) || {
      key,
      name: invoice.customerName || invoice.driverName || 'Unknown customer',
      customerId: invoice.customerId || '',
      phone: invoice.customerPhone || invoice.driverPhone || '',
      invoiceCount: 0,
      openInvoiceCount: 0,
      outstanding: 0,
      totalBilled: 0,
      totalCollected: 0,
      oldestDue: null,
      maxAgeDays: 0,
      vehicleRegistrations: new Set()
    };
    current.invoiceCount += 1;
    current.totalBilled += amount(invoice.totalAmount);
    current.totalCollected += amount(invoice.amountPaid);
    current.outstanding += invoice.outstanding;
    if (invoice.vehicleRegistration) current.vehicleRegistrations.add(invoice.vehicleRegistration);
    if (invoice.outstanding > 0) {
      current.openInvoiceCount += 1;
      current.maxAgeDays = Math.max(current.maxAgeDays, invoice.ageDays);
      if (!current.oldestDue || String(invoice.dueDate) < String(current.oldestDue)) current.oldestDue = invoice.dueDate;
    }
    customerMap.set(key, current);
  });

  const customers = [...customerMap.values()]
    .map(customer => ({
      ...customer,
      vehicleRegistrations: [...customer.vehicleRegistrations],
      ageBucket: ageingBucket(customer.maxAgeDays),
      status: customer.outstanding > 0 ? (customer.maxAgeDays > 0 ? 'Overdue' : 'Due') : 'Clear',
      collectionRate: customer.totalBilled ? Number((customer.totalCollected / customer.totalBilled * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.outstanding - a.outstanding || a.name.localeCompare(b.name));

  const paidInAsOfMonth = validInvoices
    .filter(invoice => invoice.paidDate && dateKey(invoice.paidDate)?.slice(0, 7) === dateKey(asOf)?.slice(0, 7))
    .reduce((sum, invoice) => sum + amount(invoice.amountPaid), 0);
  const trailingStart = new Date(asOf.getTime() - 29 * 86400000);
  const trailingBilled = validInvoices
    .filter(invoice => {
      const date = parseDate(invoice.invoiceDate);
      return date && date >= trailingStart && date <= asOf;
    })
    .reduce((sum, invoice) => sum + amount(invoice.totalAmount), 0);

  return {
    asOf: asOf.toISOString().slice(0, 10),
    summary: {
      totalOutstanding: Number(openInvoices.reduce((sum, invoice) => sum + invoice.outstanding, 0).toFixed(2)),
      unpaidInvoices: openInvoices.length,
      collectionsThisMonth: Number(paidInAsOfMonth.toFixed(2)),
      dso: trailingBilled ? Number((openInvoices.reduce((sum, invoice) => sum + invoice.outstanding, 0) / trailingBilled * 30).toFixed(1)) : null,
      overdueCustomers: customers.filter(customer => customer.status === 'Overdue').length,
      openCustomers: customers.filter(customer => customer.outstanding > 0).length
    },
    ageing: Object.fromEntries(Object.entries(ageing).map(([key, value]) => [key, Number(value.toFixed(2))])),
    invoices: validInvoices.sort((a, b) => String(b.dueDate || b.invoiceDate).localeCompare(String(a.dueDate || a.invoiceDate))),
    customers,
    dataSource: {
      mode: 'local-operational-records',
      label: 'Operational records',
      connected: false,
      syncedFrom: 'server/data/invoices.json, leases.json and drivers.json',
      recordCount: validInvoices.length
    }
  };
}

function parseTransactionAmount(value) {
  const numeric = amount(value);
  return String(value || '').trim().startsWith('-') ? -numeric : numeric;
}

function buildCustomerSoa(data, customerKey) {
  const receivables = buildReceivables(data);
  const customer = receivables.customers.find(item => item.key === customerKey);
  const invoices = receivables.invoices.filter(invoice => customerKeyFor(invoice) === customerKey);
  if (!customer || !invoices.length) return null;

  const entries = [];
  invoices.forEach(invoice => {
    entries.push({
      id: `invoice-${invoice.id}`,
      date: dateKey(invoice.invoiceDate),
      type: 'Invoice',
      reference: invoice.invoiceNumber,
      description: `Invoice raised · ${invoice.period || invoice.vehicleRegistration || 'Rental billing'}`,
      debit: amount(invoice.totalAmount),
      credit: 0,
      movement: amount(invoice.totalAmount),
      affectsBalance: true,
      status: invoice.status
    });

    if (String(invoice.status || '').toLowerCase() === 'waived') {
      const noteRef = String(invoice.paymentMethod || '').match(/CN-[A-Z0-9-]+/i)?.[0] || `CN-${invoice.invoiceNumber}`;
      entries.push({
        id: `credit-${invoice.id}`,
        date: dateKey(invoice.paidDate || invoice.invoiceDate),
        type: 'Credit Note',
        reference: noteRef,
        description: `Credit note issued · ${String(invoice.notes || '').replace(/^Waived:\s*/i, '') || 'Invoice waived'}`,
        debit: 0,
        credit: amount(invoice.totalAmount),
        movement: amount(invoice.totalAmount),
        affectsBalance: true,
        status: 'Posted'
      });
    } else if (amount(invoice.amountPaid) > 0) {
      entries.push({
        id: `payment-${invoice.id}`,
        date: dateKey(invoice.paidDate || invoice.invoiceDate),
        type: 'Payment',
        reference: invoice.receiptReference || `PAY-${invoice.invoiceNumber}`,
        description: `Payment received · ${invoice.paymentMethod || 'Recorded payment'}`,
        debit: 0,
        credit: amount(invoice.amountPaid),
        movement: amount(invoice.amountPaid),
        affectsBalance: true,
        status: 'Posted'
      });
    }
  });

  const matchingDriverIds = new Set(invoices.map(invoice => invoice.driverId).filter(Boolean));
  const matchingPhones = new Set(invoices.map(invoice => invoice.driverPhone || invoice.customerPhone).filter(Boolean));
  data.drivers
    .filter(driver => matchingDriverIds.has(driver.id) || matchingPhones.has(driver.phone))
    .forEach(driver => (driver.wallet?.recentTransactions || []).forEach(transaction => {
      if (!/top.?up|initial wallet|wallet funding|recharge/i.test(String(transaction.type || transaction.method || ''))) return;
      const movement = Math.abs(parseTransactionAmount(transaction.amount));
      if (!movement) return;
      entries.push({
        id: `wallet-${driver.id}-${transaction.id}`,
        date: dateKey(transaction.date),
        type: 'Wallet',
        reference: transaction.id,
        description: `Wallet funding · ${transaction.method || transaction.type}`,
        debit: 0,
        credit: 0,
        movement,
        affectsBalance: false,
        status: transaction.status || 'Recorded'
      });
    }));

  data.leases
    .filter(lease => customerKeyFor(lease) === customerKey || lease.customerId === customerKey)
    .filter(lease => amount(lease.depositPaid || lease.securityDeposit) > 0)
    .forEach(lease => entries.push({
      id: `deposit-${lease.id}`,
      date: dateKey(lease.signedDate || lease.startDate),
      type: 'Deposit',
      reference: lease.depositReceipt || lease.leaseNumber,
      description: 'Security deposit held in escrow',
      debit: 0,
      credit: 0,
      movement: amount(lease.depositPaid || lease.securityDeposit),
      affectsBalance: false,
      status: lease.depositStatus || 'Held'
    }));

  entries.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || a.id.localeCompare(b.id));
  let runningBalance = 0;
  const ledger = entries.map(entryItem => {
    if (entryItem.affectsBalance) runningBalance += entryItem.debit - entryItem.credit;
    return { ...entryItem, balance: Number(runningBalance.toFixed(2)) };
  }).reverse();

  const lease = data.leases.find(item => customerKeyFor(item) === customerKey || item.customerId === customerKey);
  return {
    customer: {
      key: customer.key,
      name: customer.name,
      customerId: customer.customerId,
      phone: customer.phone,
      vehicleRegistrations: customer.vehicleRegistrations,
      leaseNumber: lease?.leaseNumber || '',
      leaseStatus: lease?.status || ''
    },
    summary: {
      current: Number(receivables.invoices.filter(invoice => customerKeyFor(invoice) === customerKey && invoice.outstanding > 0 && invoice.ageDays <= 30).reduce((sum, invoice) => sum + invoice.outstanding, 0).toFixed(2)),
      days31to60: Number(receivables.invoices.filter(invoice => customerKeyFor(invoice) === customerKey && invoice.outstanding > 0 && invoice.ageDays > 30 && invoice.ageDays <= 60).reduce((sum, invoice) => sum + invoice.outstanding, 0).toFixed(2)),
      days61to90: Number(receivables.invoices.filter(invoice => customerKeyFor(invoice) === customerKey && invoice.outstanding > 0 && invoice.ageDays > 60 && invoice.ageDays <= 90).reduce((sum, invoice) => sum + invoice.outstanding, 0).toFixed(2)),
      over90: Number(receivables.invoices.filter(invoice => customerKeyFor(invoice) === customerKey && invoice.outstanding > 0 && invoice.ageDays > 90).reduce((sum, invoice) => sum + invoice.outstanding, 0).toFixed(2)),
      totalOutstanding: Number(customer.outstanding.toFixed(2)),
      totalBilled: Number(customer.totalBilled.toFixed(2)),
      totalCollected: Number(customer.totalCollected.toFixed(2))
    },
    entries: ledger,
    asOf: receivables.asOf,
    dataSource: receivables.dataSource
  };
}

function addDays(value, days) {
  const date = parseDate(value);
  return date ? new Date(date.getTime() + days * 86400000) : null;
}

function vendorName(value) {
  return String(value || 'Unassigned vendor').split('·')[0].trim() || 'Unassigned vendor';
}

function buildPayables(data) {
  const asOf = financeAsOf(data);
  const bills = data.maintenance
    .filter(job => job.bill && amount(job.bill.billedAmount) > 0)
    .map(job => {
      const invoiceDate = dateKey(job.bill.invoiceDate || job.reportedDate);
      const dueDate = dateKey(job.bill.dueDate || addDays(invoiceDate, 30));
      const total = amount(job.bill.billedAmount);
      const paid = Math.min(total, amount(job.payment?.amount));
      const outstanding = Math.max(0, total - paid);
      const ageDays = ageDaysFor({ dueDate }, asOf);
      return {
        id: job.id,
        vendor: vendorName(job.workshop),
        workshop: job.workshop || vendorName(job.workshop),
        invoiceNo: job.bill.invoiceNo || job.id,
        invoiceDate,
        dueDate,
        dueDateSource: job.bill.dueDate ? 'Vendor due date' : 'Default Net-30 terms',
        vehicle: job.vehicle || '',
        vehicleModel: job.vehicleModel || '',
        description: job.serviceType || job.complaint || 'Maintenance and repairs',
        total,
        paid,
        outstanding,
        ageDays,
        ageBucket: ageingBucket(ageDays),
        status: outstanding <= 0 ? 'Paid' : ageDays > 0 ? 'Overdue' : 'Open',
        payment: job.payment ? {
          method: job.payment.method || '',
          utr: job.payment.utr || '',
          date: dateKey(job.payment.date),
          amount: paid
        } : null
      };
    });

  const ageing = { '0–30 days': 0, '31–60 days': 0, '61–90 days': 0, '90+ days': 0 };
  bills.filter(bill => bill.outstanding > 0).forEach(bill => { ageing[bill.ageBucket] += bill.outstanding; });
  const vendorMap = new Map();
  bills.forEach(bill => {
    const current = vendorMap.get(bill.vendor) || { vendor: bill.vendor, billCount: 0, totalSpend: 0, totalPaid: 0, outstanding: 0, overdueBills: 0 };
    current.billCount += 1;
    current.totalSpend += bill.total;
    current.totalPaid += bill.paid;
    current.outstanding += bill.outstanding;
    if (bill.status === 'Overdue') current.overdueBills += 1;
    vendorMap.set(bill.vendor, current);
  });

  const monthKey = asOf.toISOString().slice(0, 7);
  const paymentsThisMonth = bills
    .filter(bill => bill.payment?.date?.slice(0, 7) === monthKey)
    .reduce((sum, bill) => sum + bill.paid, 0);

  return {
    asOf: asOf.toISOString().slice(0, 10),
    summary: {
      totalSpend: Number(bills.reduce((sum, bill) => sum + bill.total, 0).toFixed(2)),
      totalPaid: Number(bills.reduce((sum, bill) => sum + bill.paid, 0).toFixed(2)),
      totalPayable: Number(bills.reduce((sum, bill) => sum + bill.outstanding, 0).toFixed(2)),
      paymentsThisMonth: Number(paymentsThisMonth.toFixed(2)),
      openBills: bills.filter(bill => bill.outstanding > 0).length,
      overdueBills: bills.filter(bill => bill.status === 'Overdue').length,
      vendorCount: vendorMap.size
    },
    ageing: Object.fromEntries(Object.entries(ageing).map(([key, value]) => [key, Number(value.toFixed(2))])),
    vendors: [...vendorMap.values()]
      .map(vendor => ({ ...vendor, totalSpend: Number(vendor.totalSpend.toFixed(2)), totalPaid: Number(vendor.totalPaid.toFixed(2)), outstanding: Number(vendor.outstanding.toFixed(2)) }))
      .sort((a, b) => b.outstanding - a.outstanding || b.totalSpend - a.totalSpend),
    bills: bills.sort((a, b) => b.outstanding - a.outstanding || String(a.dueDate).localeCompare(String(b.dueDate))),
    controls: {
      defaultTerms: 'Net 30 when the vendor record does not provide a due date.',
      billSource: 'Verified maintenance vendor bills and recorded vendor payments.'
    },
    dataSource: {
      mode: 'local-operational-records',
      label: 'Maintenance and vendor records',
      connected: false,
      syncedFrom: 'server/data/maintenance.json',
      recordCount: bills.length
    }
  };
}

function periodWindow(asOf, period) {
  const key = String(period || 'month').toLowerCase();
  if (key === 'today') return { from: startOfDay(asOf.toISOString().slice(0, 10)), to: endOfDay(asOf.toISOString().slice(0, 10)), label: 'As of today' };
  if (key === 'week') return { from: new Date(asOf.getTime() - 6 * 86400000), to: endOfDay(asOf.toISOString().slice(0, 10)), label: 'Last 7 days' };
  return {
    from: new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 1)),
    to: new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() + 1, 0, 23, 59, 59, 999)),
    label: 'Current data month'
  };
}

function buildAssetFinancing(data, periodKey = 'month') {
  const asOf = financeAsOf(data);
  const window = periodWindow(asOf, periodKey);
  const assets = data.fleet
    .filter(vehicle => amount(vehicle.monthlyEmi) > 0)
    .map(vehicle => {
      const monthlyEmi = amount(vehicle.monthlyEmi);
      const invoices = data.invoices.filter(invoice => invoice.vehicleRegistration === vehicle.registration);
      const revenue = invoices
        .filter(invoice => inPeriod(invoice.invoiceDate, window.from, window.to))
        .reduce((sum, invoice) => sum + amount(invoice.totalAmount), 0);
      const collected = invoices
        .filter(invoice => inPeriod(invoice.paidDate || invoice.invoiceDate, window.from, window.to))
        .reduce((sum, invoice) => sum + amount(invoice.amountPaid), 0);
      const coverage = monthlyEmi ? Number((collected / monthlyEmi * 100).toFixed(1)) : 0;
      const principal = amount(vehicle.financedAmount || vehicle.loanAmount || vehicle.principal);
      return {
        registration: vehicle.registration,
        model: vehicle.model || 'Fleet asset',
        type: vehicle.type || '',
        lender: vehicle.lender || 'Lender not configured',
        status: vehicle.status || '',
        driver: vehicle.driver || 'Unassigned',
        monthlyEmi,
        dailyEmi: Number((monthlyEmi / 30).toFixed(2)),
        revenue: Number(revenue.toFixed(2)),
        collected: Number(collected.toFixed(2)),
        recovery: coverage,
        coverageStatus: coverage >= 100 ? 'Covered' : 'Shortfall',
        financedAmount: principal || null,
        principalConfigured: Boolean(principal)
      };
    });

  const totalEmi = assets.reduce((sum, asset) => sum + asset.monthlyEmi, 0);
  const totalRevenue = assets.reduce((sum, asset) => sum + asset.revenue, 0);
  const totalCollected = assets.reduce((sum, asset) => sum + asset.collected, 0);
  return {
    period: { key: periodKey, label: window.label, from: window.from.toISOString().slice(0, 10), to: window.to.toISOString().slice(0, 10) },
    summary: {
      financedAssets: assets.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalCollected: Number(totalCollected.toFixed(2)),
      monthlyEmi: Number(totalEmi.toFixed(2)),
      dailyEmi: Number((totalEmi / 30).toFixed(2)),
      coverage: totalEmi ? Number((totalCollected / totalEmi * 100).toFixed(1)) : 0,
      shortfall: Number(Math.max(0, totalEmi - totalCollected).toFixed(2)),
      principalConfigured: assets.some(asset => asset.principalConfigured),
      remainingPrincipal: assets.some(asset => asset.principalConfigured)
        ? Number(assets.reduce((sum, asset) => sum + (asset.financedAmount || 0), 0).toFixed(2))
        : null
    },
    assets: assets.sort((a, b) => b.monthlyEmi - a.monthlyEmi),
    controls: {
      emiBasis: 'Daily EMI is calculated as monthly EMI divided by 30 days.',
      recoveryBasis: 'Recovery compares collected invoice amounts for the asset against its monthly EMI obligation.',
      principalNote: assets.some(asset => asset.principalConfigured) ? 'Principal metadata is available for some assets.' : 'Financed principal, tenure and interest split are not configured in the current fleet records.'
    },
    dataSource: {
      mode: 'local-operational-records',
      label: 'Fleet and rental invoice records',
      connected: false,
      syncedFrom: 'server/data/fleet.json and invoices.json',
      recordCount: assets.length
    }
  };
}

function buildPnl(data, period) {
  const entries = [];
  const excluded = {
    gst: 0,
    deposits: 0,
    walletTransfers: 0,
    unpostedEmi: data.fleet.filter(v => amount(v.monthlyEmi) > 0).length
  };

  data.invoices
    .filter(invoice => inPeriod(invoice.invoiceDate, period.from, period.to))
    .filter(invoice => !['cancelled', 'void', 'reversed'].includes(String(invoice.status || '').toLowerCase()))
    .forEach(invoice => {
      const base = amount(invoice.baseAmount) || Math.max(0, amount(invoice.totalAmount) - amount(invoice.gstAmount));
      excluded.gst += amount(invoice.gstAmount);
      entries.push(entry({
        id: `invoice-${invoice.id}`,
        date: invoice.invoiceDate,
        description: `Rental invoice ${invoice.invoiceNumber}`,
        category: 'Rental revenue',
        amountValue: base,
        direction: 'income',
        source: 'Rental Invoice',
        sourceId: invoice.invoiceNumber,
        sourceRoute: 'invoices',
        note: `${invoice.customerName || 'Customer'} · ${invoice.vehicleRegistration || 'Vehicle'}`
      }));
    });

  data.trips
    .filter(trip => trip.status === 'Completed')
    .filter(trip => ['credited to wallet', 'settled', 'paid', 'completed'].some(status => String(trip.settlementStatus || '').toLowerCase().includes(status)))
    .filter(trip => inPeriod(trip.endTime || trip.startTime, period.from, period.to))
    .filter(trip => amount(trip.sikharShare) > 0)
    .forEach(trip => entries.push(entry({
      id: `trip-${trip.id}`,
      date: trip.endTime || trip.startTime,
      description: `Revenue-share settlement ${trip.id}`,
      category: 'Partner revenue share',
      amountValue: amount(trip.sikharShare),
      direction: 'income',
      source: 'Trip Settlement',
      sourceId: trip.id,
      sourceRoute: 'trips',
      note: `${trip.driver || 'Driver'} · ${trip.settlementStatus || 'Settled'}`
    })));

  data.maintenance
    .filter(job => job.bill && job.checklist?.billVerified === true)
    .filter(job => inPeriod(job.bill.invoiceDate, period.from, period.to))
    .forEach(job => entries.push(entry({
      id: `maintenance-${job.id}`,
      date: job.bill.invoiceDate,
      description: `Verified maintenance bill ${job.bill.invoiceNo || job.id}`,
      category: 'Maintenance',
      amountValue: amount(job.bill.billedAmount),
      direction: 'expense',
      source: 'Maintenance Bill',
      sourceId: job.id,
      sourceRoute: 'maintenance',
      note: `${job.vehicle} · ${job.workshop || 'Workshop'}`
    })));

  data.fuelData.fuelLogs
    .filter(log => log.status === 'Verified' && inPeriod(log.loggedAt, period.from, period.to))
    .forEach(log => entries.push(entry({
      id: `fuel-${log.id}`,
      date: log.loggedAt,
      description: `${log.fuelType || 'Fuel'} consumption ${log.id}`,
      category: 'Fuel and energy',
      amountValue: amount(log.totalAmount),
      direction: 'expense',
      source: 'Fuel Log',
      sourceId: log.id,
      sourceRoute: 'fuel',
      note: `${log.vehicle} · ${log.paymentMethod || 'Payment method pending'}`
    })));

  data.fuelData.chargingSessions
    .filter(session => session.status === 'Settled' && inPeriod(session.endTime || session.startTime, period.from, period.to))
    .forEach(session => entries.push(entry({
      id: `charging-${session.id}`,
      date: session.endTime || session.startTime,
      description: `Settled charging session ${session.id}`,
      category: 'Fuel and energy',
      amountValue: amount(session.settledAmount ?? session.currentCost),
      direction: 'expense',
      source: 'Charging Session',
      sourceId: session.id,
      sourceRoute: 'fuel',
      note: `${session.vehicle} · ${session.energyDeliveredKwh || 0} kWh`
    })));

  const income = entries.filter(item => item.direction === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = entries.filter(item => item.direction === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const categoryTotals = entries.reduce((result, item) => {
    result[item.category] = (result[item.category] || 0) + (item.direction === 'income' ? item.amount : -item.amount);
    return result;
  }, {});

  return {
    entries: entries.sort((a, b) => String(b.date).localeCompare(String(a.date))),
    summary: {
      revenue: Number(income.toFixed(2)),
      expenses: Number(expenses.toFixed(2)),
      netProfit: Number((income - expenses).toFixed(2)),
      grossMargin: income ? Number(((income - expenses) / income * 100).toFixed(1)) : 0,
      invoiceCount: data.invoices.filter(i => inPeriod(i.invoiceDate, period.from, period.to)).length,
      approvedExpenseCount: entries.filter(i => i.direction === 'expense').length
    },
    categoryTotals,
    controls: {
      gstExcluded: Number(excluded.gst.toFixed(2)),
      securityDepositsExcluded: data.leases
        .filter(lease => inPeriod(lease.signedDate || lease.startDate, period.from, period.to))
        .reduce((sum, lease) => sum + amount(lease.depositPaid || lease.securityDeposit), 0),
      walletTransfersExcluded: 'Invoice wallet debits and charging holds are not treated as new revenue or P&L cash receipts.',
      emiTreatment: `${excluded.unpostedEmi} fleet assets have EMI metadata, but no principal/interest split is posted yet.`
    }
  };
}

function buildCashFlow(data, period) {
  const flows = [];
  const excluded = [];

  data.invoices
    .filter(invoice => amount(invoice.amountPaid) > 0)
    .filter(invoice => !String(invoice.paymentMethod || '').toLowerCase().includes('wallet'))
    .filter(invoice => inPeriod(invoice.paidDate || invoice.invoiceDate, period.from, period.to))
    .forEach(invoice => flows.push(entry({
      id: `receipt-${invoice.id}`,
      date: invoice.paidDate || invoice.invoiceDate,
      description: `External receipt ${invoice.invoiceNumber}`,
      category: 'Customer receipts',
      amountValue: amount(invoice.amountPaid),
      direction: 'inflow',
      source: 'Invoice Receipt',
      sourceId: invoice.invoiceNumber,
      sourceRoute: 'invoices',
      note: `${invoice.customerName || 'Customer'} · ${invoice.paymentMethod || 'Captured payment'}`
    })));

  data.drivers.forEach(driver => {
    (driver.wallet?.recentTransactions || [])
      .filter(transaction => ['success', 'settled'].includes(String(transaction.status || '').toLowerCase()))
      .filter(transaction => /top.?up|initial deposit|initial wallet credit|onboarding credit/i.test(transaction.type || ''))
      .filter(transaction => inPeriod(transaction.date, period.from, period.to))
      .filter(transaction => amount(transaction.amount) > 0)
      .forEach(transaction => flows.push(entry({
        id: `wallet-${transaction.id}`,
        date: transaction.date,
        description: `${transaction.type} · ${driver.name}`,
        category: 'Wallet funding',
        amountValue: amount(transaction.amount),
        direction: 'inflow',
        source: 'Wallet Transaction',
        sourceId: transaction.id,
        sourceRoute: 'wallet',
        note: `${transaction.method || 'Funding source'} · restricted customer funds, not revenue`
      })));
  });

  data.leases
    .filter(lease => lease.depositStatus === 'Held in Escrow' && amount(lease.depositPaid || lease.securityDeposit) > 0)
    .filter(lease => inPeriod(lease.signedDate || lease.startDate, period.from, period.to))
    .forEach(lease => flows.push(entry({
      id: `deposit-${lease.id}`,
      date: lease.signedDate || lease.startDate,
      description: `Security deposit received · ${lease.leaseNumber}`,
      category: 'Escrow deposits',
      amountValue: amount(lease.depositPaid || lease.securityDeposit),
      direction: 'inflow',
      source: 'Lease Deposit',
      sourceId: lease.leaseNumber,
      sourceRoute: 'bookings',
      note: `${lease.customerName || 'Customer'} · held in escrow, excluded from revenue`
    })));

  data.trips
    .filter(trip => trip.status === 'Completed')
    .filter(trip => ['credited to wallet', 'settled', 'paid', 'completed'].some(status => String(trip.settlementStatus || '').toLowerCase().includes(status)))
    .filter(trip => amount(trip.sikharShare) > 0)
    .filter(trip => inPeriod(trip.endTime || trip.startTime, period.from, period.to))
    .forEach(trip => flows.push(entry({
      id: `partner-settlement-${trip.id}`,
      date: trip.endTime || trip.startTime,
      description: `Partner settlement · ${trip.id}`,
      category: 'Partner settlements',
      amountValue: amount(trip.sikharShare),
      direction: 'inflow',
      source: 'Trip Settlement',
      sourceId: trip.id,
      sourceRoute: 'trips',
      note: `${trip.source || 'Partner'} · Sikhar share only`
    })));

  data.maintenance
    .filter(job => job.payment && amount(job.payment.amount) > 0)
    .filter(job => inPeriod(job.payment.date, period.from, period.to))
    .forEach(job => flows.push(entry({
      id: `maintenance-payment-${job.id}`,
      date: job.payment.date,
      description: `Maintenance vendor payment · ${job.id}`,
      category: 'Maintenance payments',
      amountValue: amount(job.payment.amount),
      direction: 'outflow',
      source: 'Maintenance Payment',
      sourceId: job.id,
      sourceRoute: 'maintenance',
      note: `${job.vehicle} · ${job.payment.method || 'Payment recorded'}`
    })));

  data.fuelData.fuelLogs
    .filter(log => log.status === 'Verified' && inPeriod(log.loggedAt, period.from, period.to))
    .forEach(log => {
      if (/wallet/i.test(log.paymentMethod || '')) {
        excluded.push({ source: log.id, reason: 'Wallet-funded fuel is an internal wallet movement, not a second external cash outflow.' });
        return;
      }
      flows.push(entry({
        id: `fuel-payment-${log.id}`,
        date: log.loggedAt,
        description: `${log.fuelType || 'Fuel'} payment · ${log.id}`,
        category: 'Fuel and energy payments',
        amountValue: amount(log.totalAmount),
        direction: 'outflow',
        source: 'Fuel Log',
        sourceId: log.id,
        sourceRoute: 'fuel',
        note: `${log.vehicle} · ${log.paymentMethod || 'Payment recorded'}`
      }));
    });

  data.fuelData.chargingSessions
    .filter(session => session.status === 'Settled' && inPeriod(session.endTime || session.startTime, period.from, period.to))
    .forEach(session => {
      excluded.push({ source: session.id, reason: 'Charging settlement is wallet-funded; the wallet funding event is shown separately.' });
    });

  const inflows = flows.filter(item => item.direction === 'inflow');
  const outflows = flows.filter(item => item.direction === 'outflow');
  const totalInflow = inflows.reduce((sum, item) => sum + item.amount, 0);
  const totalOutflow = outflows.reduce((sum, item) => sum + item.amount, 0);
  const restrictedInflow = inflows
    .filter(item => ['Wallet funding', 'Escrow deposits'].includes(item.category))
    .reduce((sum, item) => sum + item.amount, 0);
  const operatingInflow = totalInflow - restrictedInflow;

  return {
    flows: flows.sort((a, b) => String(b.date).localeCompare(String(a.date))),
    summary: {
      totalInflow: Number(totalInflow.toFixed(2)),
      operatingInflow: Number(operatingInflow.toFixed(2)),
      restrictedInflow: Number(restrictedInflow.toFixed(2)),
      totalOutflow: Number(totalOutflow.toFixed(2)),
      netMovement: Number((totalInflow - totalOutflow).toFixed(2)),
      inflowCount: inflows.length,
      outflowCount: outflows.length
    },
    controls: {
      openingBalance: 'Not configured',
      closingBalance: 'Not calculated until opening cash is configured.',
      internalMovementsExcluded: excluded.length,
      exclusions: excluded,
      gstTreatment: 'GST is carried with receipts/payables but is not included in P&L revenue or expense totals.'
    }
  };
}

function buildReport(data, reportType, period) {
  const current = reportType === 'cash-flow' ? buildCashFlow(data, period) : buildPnl(data, period);
  const previous = previousPeriod(period);
  const previousReport = reportType === 'cash-flow' ? buildCashFlow(data, previous) : buildPnl(data, previous);
  const availableDates = data.dates.filter(Boolean).sort();

  return {
    reportType,
    period: {
      from: period.fromKey,
      to: period.toKey,
      label: period.label,
      previousFrom: previous.fromKey,
      previousTo: previous.toKey
    },
    availableRange: {
      from: availableDates[0] || period.fromKey,
      to: availableDates[availableDates.length - 1] || period.toKey
    },
    ...current,
    comparison: previousReport.summary,
    comparisonCategoryTotals: previousReport.categoryTotals || {},
    definitions: reportType === 'cash-flow'
      ? [
        'External receipts, verified wallet funding and escrow deposits are shown as distinct inflow categories.',
        'Invoice wallet debits, charging holds and wallet-funded fuel are excluded from external cash movement to prevent double counting.',
        'Opening and closing cash remain unconfigured until a bank/cash opening balance is approved.'
      ]
      : [
        'Rental revenue is recognised from issued invoices excluding GST; pending invoices remain revenue with receivables outstanding.',
        'Only completed and settled Sikhar revenue-share entitlements are included.',
        'Maintenance bills require bill verification; fuel requires Verified status; charging requires Settled status.',
        'Security deposits, wallet top-ups, driver earnings and full EMI cash are excluded from P&L.'
      ]
  };
}

let financeLedgerSchemaPromise = null;

async function ensureFinanceLedgerSchema() {
  if (!financeLedgerSchemaPromise) {
    financeLedgerSchemaPromise = query(`
      CREATE TABLE IF NOT EXISTS finance_ledger_entries (
        report_type VARCHAR(24) NOT NULL,
        period_from DATE NOT NULL,
        period_to DATE NOT NULL,
        entry_id VARCHAR(160) NOT NULL,
        entry_date DATE NULL,
        description VARCHAR(255) NOT NULL,
        category VARCHAR(120) NOT NULL,
        amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        direction VARCHAR(16) NOT NULL,
        source VARCHAR(120) NOT NULL,
        source_id VARCHAR(160) NULL,
        source_route VARCHAR(80) NULL,
        note TEXT NULL,
        synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (report_type, period_from, period_to, entry_id),
        KEY idx_finance_ledger_period (report_type, period_from, period_to),
        KEY idx_finance_ledger_date (entry_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `).then(() => true).catch((error) => {
      financeLedgerSchemaPromise = null;
      throw error;
    });
  }
  return financeLedgerSchemaPromise;
}

async function syncAndReadFinanceLedger(reportType, period, report) {
  await ensureFinanceLedgerSchema();
  await query(
    'DELETE FROM finance_ledger_entries WHERE report_type = ? AND period_from = ? AND period_to = ?',
    [reportType, period.fromKey, period.toKey]
  );

  const sourceEntries = report.entries || report.flows || [];
  for (const item of sourceEntries) {
    await query(
      `INSERT INTO finance_ledger_entries
        (report_type, period_from, period_to, entry_id, entry_date, description, category, amount, direction, source, source_id, source_route, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportType,
        period.fromKey,
        period.toKey,
        item.id,
        item.date || null,
        item.description,
        item.category,
        item.amount,
        item.direction,
        item.source,
        item.sourceId || null,
        item.sourceRoute || null,
        item.note || null
      ]
    );
  }

  const rows = await query(
    `SELECT entry_id AS id, DATE_FORMAT(entry_date, '%Y-%m-%d') AS date,
      description, category, amount, direction, source, source_id AS sourceId,
      source_route AS sourceRoute, note
     FROM finance_ledger_entries
     WHERE report_type = ? AND period_from = ? AND period_to = ?
     ORDER BY entry_date DESC, entry_id DESC`,
    [reportType, period.fromKey, period.toKey]
  );

  const normalizedRows = rows.map((row) => ({
    ...row,
    amount: Number(row.amount || 0)
  }));

  return {
    ...report,
    ...(reportType === 'cash-flow' ? { flows: normalizedRows } : { entries: normalizedRows }),
    dataSource: {
      mode: 'mysql-finance-ledger',
      label: 'MySQL finance ledger',
      connected: true,
      syncedFrom: 'Current operational records',
      recordCount: normalizedRows.length,
      syncedAt: new Date().toISOString()
    }
  };
}

router.get('/receivables', (req, res) => {
  try {
    const data = loadFinanceData();
    const report = buildReceivables(data);
    const search = String(req.query.search || '').trim().toLowerCase();
    const status = String(req.query.status || 'all').toLowerCase();
    if (search) {
      report.customers = report.customers.filter(customer =>
        [customer.name, customer.customerId, customer.phone, ...customer.vehicleRegistrations]
          .some(value => String(value || '').toLowerCase().includes(search))
      );
    }
    if (status === 'overdue') report.customers = report.customers.filter(customer => customer.status === 'Overdue');
    if (status === 'open') report.customers = report.customers.filter(customer => customer.outstanding > 0);
    return res.json({ success: true, data: report });
  } catch (error) {
    console.error('Accounts receivable error:', error);
    return res.status(500).json({ success: false, message: 'Failed to build accounts receivable.' });
  }
});

router.get('/customer-soa/:customerKey', (req, res) => {
  try {
    const data = loadFinanceData();
    const customerKey = decodeURIComponent(req.params.customerKey || '');
    const report = buildCustomerSoa(data, customerKey);
    if (!report) return res.status(404).json({ success: false, message: 'Customer statement not found.' });
    return res.json({ success: true, data: report });
  } catch (error) {
    console.error('Customer SOA error:', error);
    return res.status(500).json({ success: false, message: 'Failed to build customer statement.' });
  }
});

router.get('/payables', (req, res) => {
  try {
    const data = loadFinanceData();
    const report = buildPayables(data);
    const search = String(req.query.search || '').trim().toLowerCase();
    const status = String(req.query.status || 'all').toLowerCase();
    if (search) {
      report.bills = report.bills.filter(bill => [bill.vendor, bill.invoiceNo, bill.vehicle, bill.description].some(value => String(value || '').toLowerCase().includes(search)));
      report.vendors = report.vendors.filter(vendor => vendor.vendor.toLowerCase().includes(search));
    }
    if (status === 'open') report.bills = report.bills.filter(bill => bill.outstanding > 0);
    if (status === 'overdue') report.bills = report.bills.filter(bill => bill.status === 'Overdue');
    if (status === 'paid') report.bills = report.bills.filter(bill => bill.status === 'Paid');
    return res.json({ success: true, data: report });
  } catch (error) {
    console.error('Accounts payable error:', error);
    return res.status(500).json({ success: false, message: 'Failed to build accounts payable.' });
  }
});

router.get('/asset-financing', (req, res) => {
  try {
    const data = loadFinanceData();
    const period = ['today', 'week', 'month'].includes(String(req.query.period || '').toLowerCase()) ? String(req.query.period).toLowerCase() : 'month';
    return res.json({ success: true, data: buildAssetFinancing(data, period) });
  } catch (error) {
    console.error('Asset financing error:', error);
    return res.status(500).json({ success: false, message: 'Failed to build asset financing report.' });
  }
});

router.get('/reports/:reportType', async (req, res) => {
  try {
    const reportType = req.params.reportType === 'cash-flow' ? 'cash-flow' : req.params.reportType === 'pnl' ? 'pnl' : null;
    if (!reportType) return res.status(400).json({ success: false, message: 'Supported reports are pnl and cash-flow.' });
    const data = loadFinanceData();
    const period = periodFromQuery(req.query, data.dates);
    const report = buildReport(data, reportType, period);
    try {
      return res.json({ success: true, data: await syncAndReadFinanceLedger(reportType, period, report) });
    } catch (dbError) {
      console.warn(`Finance MySQL ledger unavailable; using source records for this response: ${dbError.code || dbError.message}`);
      return res.json({
        success: true,
        data: {
          ...report,
          dataSource: {
            mode: 'local-operational-records',
            label: 'Operational records (MySQL ledger unavailable)',
            connected: false,
            syncedFrom: 'server/data/*.json',
            recordCount: (report.entries || report.flows || []).length
          }
        }
      });
    }
  } catch (error) {
    console.error('Finance report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to build finance report from source records.' });
  }
});

export default router;
