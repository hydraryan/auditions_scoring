import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

type Row = {
  _id: string;
  name: string;
  uid: string;
  contact: string;
  round1: number;
  round2: number;
  round3: number;
  grandTotal: number;
  average: number;
};

export default function FinalScoresPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  useEffect(() => {
    (async () => {
      const res = await api.get('/scores/final');
      setRows(res.data);
    })();
  }, []);

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const getHighlighted = (text: string | number, q: string) => {
    const src = String(text ?? '');
    if (!q) return src;
    const safe = escapeRegExp(q);
    const re = new RegExp(`(${safe})`, 'ig');
    const parts = src.split(re);
    return (
      <>
        {parts.map((part, i) =>
          re.test(part) ? (
            <mark key={i} className="bg-yellow-800/60 text-yellow-100 px-0.5 rounded">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const filtered = useMemo(() => {
    const q = appliedQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.name, r.uid, r.contact].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [rows, appliedQuery]);
  const downloadExcel = async () => {
    try {
      setDownloading(true);
      const res = await api.get('/scores/export.xlsx', { responseType: 'blob' });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const cd = (res.headers as any)['content-disposition'] as string | undefined;
      let filename = 'scores_export.xlsx';
      if (cd) {
        const m = cd.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
        const enc = (m && (m[1] || m[2])) || '';
        if (enc) filename = decodeURIComponent(enc);
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
      alert('Export failed');
    } finally {
      setDownloading(false);
    }
  };
  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Final Scores</h2>
        <div className="flex items-center gap-2">
          <input
            className="w-64 max-w-[70vw] p-2 bg-neutral-900 border border-neutral-800 rounded"
            placeholder="Search by name, UID, or contact"
            value={searchText}
            onChange={(e) => setSearchText((e.target as HTMLInputElement).value)}
          />
          <button onClick={() => setAppliedQuery(searchText)} className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700">Search</button>
          {appliedQuery && (
            <button onClick={() => { setAppliedQuery(''); setSearchText(''); }} className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700">Clear</button>
          )}
          <div className="text-xs text-neutral-400">{filtered.length} of {rows.length}</div>
          <button
            onClick={downloadExcel}
            disabled={downloading}
            className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 disabled:opacity-60"
          >
            {downloading ? 'Preparing…' : 'Download Excel'}
          </button>
        </div>
      </div>
      {appliedQuery && (
        <div className="mb-2 bg-neutral-900 border border-neutral-800 rounded">
          <div className="px-2 py-1 text-xs text-neutral-400 flex justify-between">
            <span>Matches</span>
            <span>{filtered.length}</span>
          </div>
          <ul className="max-h-56 overflow-auto divide-y divide-neutral-800">
            {filtered.map((r) => (
              <li key={r._id} className="p-2 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm text-neutral-200">{getHighlighted(r.name, appliedQuery)}</div>
                  <div className="truncate text-xs text-neutral-500">UID: {getHighlighted(r.uid, appliedQuery)} • {getHighlighted(r.contact, appliedQuery)}</div>
                </div>
                <div className="ml-3 shrink-0 text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">Total: {r.grandTotal}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b border-neutral-800">
            <th className="p-2">Student Name</th>
            <th className="p-2">UID</th>
            <th className="p-2">Contact</th>
            <th className="p-2">Round 1 Total</th>
            <th className="p-2">Round 2 Total</th>
            <th className="p-2">Round 3 Total</th>
            <th className="p-2">Grand Total (120)</th>
            <th className="p-2">Average</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r._id} className="border-b border-neutral-900">
              <td className="p-2">{getHighlighted(r.name, appliedQuery)}</td>
              <td className="p-2">{getHighlighted(r.uid, appliedQuery)}</td>
              <td className="p-2">{getHighlighted(r.contact, appliedQuery)}</td>
              <td className="p-2">{r.round1}</td>
              <td className="p-2">{r.round2}</td>
              <td className="p-2">{r.round3}</td>
              <td className="p-2">{r.grandTotal}</td>
              <td className="p-2">{r.average.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
