import { FormEvent, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

type Student = { _id?: string; name: string; uid: string; contact: string };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState<Student>({ name: '', uid: '', contact: '' });
  const [uploading, setUploading] = useState(false);
  
  const [colNames, setColNames] = useState<string>('');
  const [colUids, setColUids] = useState<string>('');
  const [colContacts, setColContacts] = useState<string>('');
  const [bulkColsMsg, setBulkColsMsg] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');

  const filtered: Student[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.name, s.uid, s.contact].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [students, query]);

  const load = async () => {
    const res = await api.get('/students');
    setStudents(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form._id) await api.put(`/students/${form._id}`, form);
    else await api.post('/students', form);
    setForm({ name: '', uid: '', contact: '' });
    await load();
  };

  const onDelete = async (id: string) => {
    await api.delete(`/students/${id}`);
    await load();
  };

  

  const onBulkColumns = async () => {
    // Accept comma/newline/semicolon separated lists for names/uids/contacts, zip by index
    const split = (s: string) =>
      s
        .split(/[\n,;]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    const names = split(colNames);
    const uids = split(colUids);
    const contacts = split(colContacts);
    const n = Math.max(names.length, uids.length, contacts.length);
    if (n === 0) return;
    // Build lines "Name, UID, Contact"; UID required
    const lines: string[] = [];
    let skipped = 0;
    for (let i = 0; i < n; i++) {
      const uid = (uids[i] || '').trim();
      if (!uid) { skipped++; continue; }
      const name = (names[i] || 'Unknown').trim();
      const contact = (contacts[i] || '').trim();
      lines.push([name, uid, contact].join(', '));
    }
    if (lines.length === 0) {
      setBulkColsMsg('No valid rows (UID missing).');
      setTimeout(() => setBulkColsMsg(null), 3000);
      return;
    }
    try {
      setUploading(true);
      const res = await api.post('/students/bulk-text', { text: lines.join('\n') });
      const { processed, upserts, skipped: serverSkipped } = res.data || {};
      setBulkColsMsg(
        `Processed: ${processed || lines.length}, Added/Updated: ${upserts || 0}, Skipped: ${(serverSkipped || 0) + skipped}`
      );
      setColNames('');
      setColUids('');
      setColContacts('');
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Bulk columns add failed';
      setBulkColsMsg(msg);
    } finally {
      setUploading(false);
      setTimeout(() => setBulkColsMsg(null), 4000);
    }
  };

  

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={onSubmit} className="bg-neutral-900 p-4 rounded">
        <h3 className="font-bold mb-3">Add / Edit Student</h3>
        <input
          placeholder="Name"
          className="w-full mb-2 p-2 bg-neutral-800 rounded"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: (e.target as HTMLInputElement).value })}
        />
        <input
          placeholder="UID"
          className="w-full mb-2 p-2 bg-neutral-800 rounded"
          value={form.uid}
          onChange={(e) => setForm({ ...form, uid: (e.target as HTMLInputElement).value })}
        />
        <input
          placeholder="Contact"
          className="w-full mb-2 p-2 bg-neutral-800 rounded"
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: (e.target as HTMLInputElement).value })}
        />
        <button className="px-4 py-2 bg-netflix-red rounded">{form._id ? 'Update' : 'Add'}</button>
      </form>

      

      <div className="bg-neutral-900 p-4 rounded">
        <h3 className="font-bold mb-3">Bulk Add by Columns</h3>
        <p className="text-sm text-neutral-400 mb-2">Paste three lists (comma/newline/semicolon separated). Rows are paired by position. UID is required.</p>
        <div className="grid md:grid-cols-3 gap-2">
          <div>
            <div className="text-xs text-neutral-400 mb-1">Names</div>
            <textarea
              className="w-full h-28 p-2 bg-neutral-800 rounded"
              placeholder={"Jane Doe, Raj Patel, Priya Shah"}
              value={colNames}
              onChange={(e) => setColNames((e.target as HTMLTextAreaElement).value)}
            />
          </div>
          <div>
            <div className="text-xs text-neutral-400 mb-1">UIDs</div>
            <textarea
              className="w-full h-28 p-2 bg-neutral-800 rounded"
              placeholder={"STU-101, STU-102, STU-103"}
              value={colUids}
              onChange={(e) => setColUids((e.target as HTMLTextAreaElement).value)}
            />
          </div>
          <div>
            <div className="text-xs text-neutral-400 mb-1">Contacts (optional)</div>
            <textarea
              className="w-full h-28 p-2 bg-neutral-800 rounded"
              placeholder={"9876543210, , priya@mail.com"}
              value={colContacts}
              onChange={(e) => setColContacts((e.target as HTMLTextAreaElement).value)}
            />
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <button onClick={onBulkColumns} disabled={uploading} className="px-4 py-2 bg-netflix-red rounded disabled:opacity-60">
            {uploading ? 'Submitting…' : 'Add from Columns'}
          </button>
          <button onClick={() => { setColNames(''); setColUids(''); setColContacts(''); }} className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded">Clear</button>
        </div>
        {bulkColsMsg && <div className="mt-2 text-sm text-neutral-300">{bulkColsMsg}</div>}
      </div>

      <div className="md:col-span-2 overflow-x-auto">
        <div className="mb-3 flex items-center gap-3">
          <input
            className="w-full max-w-md p-2 bg-neutral-900 border border-neutral-800 rounded"
            placeholder="Search by name, UID, or contact"
            value={query}
            onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
          />
          <div className="text-xs text-neutral-400">{filtered.length} of {students.length}</div>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b border-neutral-800">
              <th className="p-2">Name</th>
              <th className="p-2">UID</th>
              <th className="p-2">Contact</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s._id} className="border-b border-neutral-900">
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.uid}</td>
                <td className="p-2">{s.contact}</td>
                <td className="p-2 flex gap-2">
                  <button className="px-2 py-1 bg-neutral-800 rounded" onClick={() => setForm(s)}>
                    Edit
                  </button>
                  <button className="px-2 py-1 bg-red-700 rounded" onClick={() => onDelete(s._id!)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
