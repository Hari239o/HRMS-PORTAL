import React, { useState } from 'react';
import axios from 'axios';

const REPORTS = [
  { key: 'leads', label: 'Lead Report' },
  { key: 'calls', label: 'Call Report' },
  { key: 'employees-report', label: 'Employee Report' },
  { key: 'revenue', label: 'Revenue Report' },
  { key: 'payments', label: 'Payment Report' },
];

const reportEndpoint = (reportKey) => {
  if (reportKey === 'payments') return 'payments';
  return reportKey;
};

export default function ReportsCenter() {
  const [report, setReport] = useState(REPORTS[0].key);
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState('json');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const getParams = () => {
    const params = {};
    if (period === 'custom') {
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
    } else {
      params.period = period;
    }
    params.format = format;
    return params;
  };

  const fetchReport = async () => {
    setLoading(true);
    setResult(null);
    try {
      const params = getParams();
      const url = `/api/reports/${reportEndpoint(report)}`;
      if (format === 'csv' || format === 'excel' || format === 'pdf') {
        const res = await axios.get(url, { params, responseType: 'blob' });
        const blob = new Blob([res.data], { type: res.headers['content-type'] });
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        const ext = format === 'pdf' ? 'pdf' : (format === 'excel' ? 'xls' : 'csv');
        a.download = `${reportEndpoint(report)}_${params.startDate || params.period}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
      } else {
        const res = await axios.get(url, { params });
        setResult(res.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-black mb-4">Reports Center</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-bold mb-1">Report</label>
          <select className="w-full p-2 border rounded" value={report} onChange={e => setReport(e.target.value)}>
            {REPORTS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Period</label>
          <select className="w-full p-2 border rounded" value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Export Format</label>
          <select className="w-full p-2 border rounded" value={format} onChange={e => setFormat(e.target.value)}>
            <option value="json">JSON (preview)</option>
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
      </div>

      {period === 'custom' && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold mb-1">Start Date</label>
            <input type="date" className="w-full p-2 border rounded" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">End Date</label>
            <input type="date" className="w-full p-2 border rounded" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={fetchReport}
          disabled={loading || (period === 'custom' && (!startDate || !endDate))}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          {loading ? 'Loading...' : (format === 'json' ? 'Preview' : 'Download')}
        </button>
      </div>

      {result && (
        <div className="bg-white p-4 rounded border">
          {result.rows ? (
            <div className="overflow-x-auto">
              <div className="mb-3 text-sm font-semibold text-slate-700">{REPORTS.find(r => r.key === report)?.label} Preview</div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    {Object.keys(result.rows[0] || {}).map((key) => (
                      <th key={key} className="px-3 py-2 border text-slate-600 uppercase tracking-[0.08em]">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.slice(0, 20).map((row, index) => (
                    <tr key={index} className="odd:bg-slate-50">
                      {Object.values(row).map((value, idx) => (
                        <td key={idx} className="px-3 py-2 border text-slate-700">{String(value ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.hasMore && (
                <p className="mt-3 text-xs text-slate-500">Showing first 20 rows. Use CSV/Excel/PDF download for the full report.</p>
              )}
            </div>
          ) : (
            <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
