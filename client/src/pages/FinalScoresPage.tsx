import { useEffect, useState } from 'react';
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
  useEffect(() => {
    (async () => {
      const res = await api.get('/scores/final');
      setRows(res.data);
    })();
  }, []);
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
        <button
          onClick={downloadExcel}
          disabled={downloading}
          className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 disabled:opacity-60"
        >
          {downloading ? 'Preparing…' : 'Download Excel'}
        </button>
      </div>
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
          {rows.map((r) => (
            <tr key={r._id} className="border-b border-neutral-900">
              <td className="p-2">{r.name}</td>
              <td className="p-2">{r.uid}</td>
              <td className="p-2">{r.contact}</td>
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
