import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/client';

type Student = { _id?: string; name: string; uid: string; contact: string; scores?: Array<{ round: number; aryan?: any; kunal?: any }>; };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState<Student>({ name: '', uid: '', contact: '' });
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  
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

  // Select-all computed states for the currently filtered list
  const filteredIds: string[] = useMemo(() => filtered.map((s) => s._id!).filter(Boolean) as string[], [filtered]);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someSelected = filteredIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  const load = async () => {
    const res = await api.get('/students');
    setStudents(res.data);
    setSelectedIds(new Set());
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

  const onBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} student(s)? This cannot be undone.`)) return;
    for (const id of selectedIds) {
      await api.delete(`/students/${id}`);
    }
    await load();
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
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
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={onBulkDelete}
            disabled={selectedIds.size === 0}
            className="px-3 py-1.5 bg-red-700 rounded disabled:opacity-60"
          >
            Delete Selected ({selectedIds.size})
          </button>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b border-neutral-800">
              <th className="p-2 w-10">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (checked) {
                        for (const id of filteredIds) next.add(id);
                      } else {
                        for (const id of filteredIds) next.delete(id);
                      }
                      return next;
                    });
                  }}
                />
              </th>
              <th className="p-2">Name</th>
              <th className="p-2">UID</th>
              <th className="p-2">Contact</th>
              <th className="p-2">Scored?</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const scored = Array.isArray(s.scores)
                ? s.scores.some((r) => (r.aryan?.bodyExpressions > 0 || r.aryan?.confidence > 0 || r.kunal?.dialogue > 0 || r.kunal?.creativity > 0))
                : false;
              return (
              <tr key={s._id} className="border-b border-neutral-900">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={s._id ? selectedIds.has(s._id) : false}
                    onChange={(e) => s._id && toggleSelect(s._id, (e.target as HTMLInputElement).checked)}
                  />
                </td>
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.uid}</td>
                <td className="p-2">{s.contact}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${scored ? 'bg-green-900/30 text-green-300' : 'bg-neutral-800 text-neutral-300'}`}>
                    {scored ? 'Scored' : 'Unscored'}
                  </span>
                </td>
                <td className="p-2 flex gap-2">
                  <button className="px-2 py-1 bg-neutral-800 rounded" onClick={() => setForm(s)}>
                    Edit
                  </button>
                  <button className="px-2 py-1 bg-red-700 rounded" onClick={() => onDelete(s._id!)}>
                    Delete
                  </button>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </div>
  );
}
