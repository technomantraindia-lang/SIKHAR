import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Download,
  RefreshCw,
  Truck
} from '../common/Icons';
import { fetchAssetFinancingApi } from '../../services/api';

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function exportAssets(assets) {
  const rows = [
    ['Asset', 'Model', 'Lender', 'Monthly EMI', 'Daily EMI', 'Revenue', 'Collected', 'Recovery', 'Status'],
    ...assets.map(asset => [asset.registration, asset.model, asset.lender, asset.monthlyEmi, asset.dailyEmi, asset.revenue, asset.collected, `${asset.recovery}%`, asset.coverageStatus])
  ];
  const csv = rows.map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'asset-financing.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function Stat({ label, value, detail, tone = '' }) {
  return <div className={`finance-emi-stat ${tone}`}><div className="finance-emi-stat-label">{label}</div><strong>{value}</strong><span>{detail}</span></div>;
}

export default function FinanceAssetFinancingPage({ onBackToDashboard, onNavigate }) {
  const [period, setPeriod] = useState('month');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async (selectedPeriod = period) => {
    try {
      setLoading(true);
      setError('');
      setReport(await fetchAssetFinancingApi(selectedPeriod));
    } catch (err) {
      setError(err.message || 'Asset financing could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData('month'); }, []);

  const selectPeriod = (nextPeriod) => {
    setPeriod(nextPeriod);
    loadData(nextPeriod);
  };

  const coverage = Math.min(100, Number(report?.summary?.coverage || 0));

  return (
    <div className="terminal-content finance-emi-stage">
      <div className="finance-emi-hero">
        <div>
          <div className="breadcrumb-nav"><span className="breadcrumb-link" onClick={onBackToDashboard}>Dashboard</span><ChevronRight size={13} className="breadcrumb-sep" /><span className="breadcrumb-link">Finance</span><ChevronRight size={13} className="breadcrumb-sep" /><span className="breadcrumb-active">Asset EMI / Financing</span></div>
          <div className="finance-page-eyebrow">FINANCE / ASSET OBLIGATIONS</div>
          <h1 className="finance-emi-title">Asset EMI / Financing</h1>
          <p className="finance-emi-description">Track financed fleet assets, monthly obligations and whether rental collections cover the EMI burden.</p>
        </div>
        <div className="finance-emi-actions"><button className="btn" onClick={() => loadData()}><RefreshCw size={15} /> Refresh</button><button className="btn" onClick={() => report && exportAssets(report.assets)} disabled={!report}><Download size={15} /> Export CSV</button><button className="btn primary" onClick={() => onNavigate?.('fleet')}><Truck size={15} /> Open fleet</button></div>
      </div>

      {error && <div className="finance-emi-error"><AlertTriangle size={16} />{error}</div>}
      {loading && !report ? <div className="finance-emi-loading"><RefreshCw size={22} className="spin-icon" />Calculating asset EMI coverage…</div> : report && (
        <>
          <div className="finance-emi-period-row"><div><span className="finance-emi-period-kicker">REPORTING WINDOW</span><strong>{report.period.label}</strong><small>{report.period.from} to {report.period.to}</small></div><div className="finance-emi-period-tabs">{[['today', 'Today'], ['week', 'This week'], ['month', 'This month']].map(([key, label]) => <button key={key} className={period === key ? 'active' : ''} onClick={() => selectPeriod(key)}>{label}</button>)}</div><span className="finance-emi-source-pill"><span />{report.dataSource?.recordCount || 0} financed assets</span></div>
          <div className="finance-emi-stat-grid"><Stat label="FINANCED ASSETS" value={report.summary.financedAssets} detail="Fleet records with an EMI" /><Stat label="REVENUE / PERIOD" value={money(report.summary.totalRevenue)} detail="Invoice value for financed assets" tone="income" /><Stat label="MONTHLY EMI" value={money(report.summary.monthlyEmi)} detail={`Daily obligation ${money(report.summary.dailyEmi)}`} tone="obligation" /><Stat label="COLLECTED / PERIOD" value={money(report.summary.totalCollected)} detail={`${report.summary.coverage}% of monthly EMI`} tone={report.summary.coverage >= 100 ? 'covered' : 'shortfall'} /></div>

          <div className="finance-emi-overview-grid">
            <section className="finance-emi-panel finance-emi-coverage-panel"><div className="finance-emi-panel-head"><div><div className="finance-emi-kicker">COLLECTION COVERAGE</div><h2>Can collections carry the EMI?</h2></div><span className={`finance-emi-result ${report.summary.coverage >= 100 ? 'covered' : 'shortfall'}`}>{report.summary.coverage >= 100 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{report.summary.coverage >= 100 ? 'Covered' : 'Shortfall'}</span></div><div className="finance-emi-gauge"><div className="finance-emi-gauge-ring" style={{ '--coverage': `${coverage * 3.6}deg` }}><div><strong>{report.summary.coverage}%</strong><span>recovery</span></div></div><div className="finance-emi-gauge-copy"><div><span>Collected</span><strong>{money(report.summary.totalCollected)}</strong></div><div><span>Monthly EMI</span><strong>{money(report.summary.monthlyEmi)}</strong></div><div className="finance-emi-gap"><span>{report.summary.coverage >= 100 ? 'Surplus after EMI' : 'Uncovered obligation'}</span><strong>{money(report.summary.coverage >= 100 ? report.summary.totalCollected - report.summary.monthlyEmi : report.summary.shortfall)}</strong></div></div></div><div className="finance-emi-note">{report.controls.recoveryBasis}</div></section>
            <section className="finance-emi-panel finance-emi-data-panel"><div className="finance-emi-panel-head"><div><div className="finance-emi-kicker">FINANCING DATA HEALTH</div><h2>What is configured</h2></div><BarChart3 size={18} /></div><div className="finance-emi-check-row"><CheckCircle2 size={16} /><span>Lender and monthly EMI mapped</span><strong>{report.summary.financedAssets} assets</strong></div><div className="finance-emi-check-row"><CheckCircle2 size={16} /><span>Asset-to-invoice recovery mapping</span><strong>Active</strong></div><div className="finance-emi-check-row warning"><AlertTriangle size={16} /><span>Financed principal / tenure</span><strong>{report.summary.principalConfigured ? 'Partial' : 'Pending'}</strong></div><div className="finance-emi-note">{report.controls.principalNote} Add principal, interest and tenure to the fleet financing records before displaying a remaining loan balance.</div><button className="finance-emi-link-btn" onClick={() => onNavigate?.('fleet')}>Review fleet asset records <ChevronRight size={15} /></button></section>
          </div>

          <section className="finance-emi-panel finance-emi-register-panel"><div className="finance-emi-table-head"><div><div className="finance-emi-kicker">ASSET FINANCING REGISTER</div><h2>EMI obligations by vehicle</h2><p>Hover an asset row for a quick operational summary. Recovery is based on collected rental invoice amounts.</p></div><span className="finance-emi-record-count">{report.assets.length} records</span></div><div className="finance-emi-table-wrap"><table className="finance-emi-table"><thead><tr><th>Asset</th><th>Lender</th><th>Driver / status</th><th>Monthly EMI</th><th>Daily EMI</th><th>Collected</th><th>Recovery</th><th>Principal</th><th /></tr></thead><tbody>{report.assets.map(asset => <tr key={asset.registration}><td><strong>{asset.registration}</strong><small>{asset.model} · {asset.type}</small></td><td><span className="finance-emi-lender">{asset.lender}</span></td><td><strong>{asset.driver}</strong><small>{asset.status}</small></td><td className="finance-emi-obligation"><strong>{money(asset.monthlyEmi)}</strong></td><td>{money(asset.dailyEmi)}</td><td className="finance-emi-collected">{money(asset.collected)}</td><td><div className="finance-emi-recovery-cell"><div className="finance-emi-mini-track"><span style={{ width: `${Math.min(100, asset.recovery)}%` }} /></div><b className={asset.coverageStatus === 'Covered' ? 'covered-text' : 'shortfall-text'}>{asset.recovery}%</b></div></td><td>{asset.principalConfigured ? money(asset.financedAmount) : <span className="finance-emi-not-configured">Not configured</span>}</td><td><button className="finance-emi-view-btn" onClick={() => onNavigate?.('fleet')}>View asset <ChevronRight size={14} /></button></td></tr>)}</tbody></table></div></section>
        </>
      )}
    </div>
  );
}
