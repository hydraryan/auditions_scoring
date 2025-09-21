import { FormEvent, useEffect, useState } from 'react';
import api from '../api/client';

type Student = { _id?: string; name: string; uid: string; contact: string };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState<Student>({ name: '', uid: '', contact: '' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

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

  const onBulk = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      setUploading(true);
      const res = await api.post('/students/bulk-upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const count = (res.data && (res.data.count as number)) || 0;
      setUploadMsg(`Imported ${count} rows successfully.`);
      setFile(null);
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Bulk upload failed';
      setUploadMsg(msg);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadMsg(null), 3000);
    }
  };

  const downloadTemplate = () => {
    const csv = ['Name,UID,Contact', 'Aarav Sharma,STU-001,9876543210', 'Priya Verma,STU-002,9876501234', 'Rohan Mehta,STU-003,9876598765'].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
        <h3 className="font-bold mb-3">Bulk Upload (CSV / Excel)</h3>
        <div className="flex flex-wrap items-center gap-2">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button onClick={onBulk} disabled={!file || uploading} className="px-4 py-2 bg-netflix-red rounded disabled:opacity-60">
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <button onClick={downloadTemplate} className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded">
            Download CSV Template
          </button>
        </div>
        {uploadMsg && <div className="mt-2 text-sm text-neutral-300">{uploadMsg}</div>}
        <div className="mt-2 text-xs text-neutral-500">Headers required: Name, UID, Contact. UID is mandatory; existing UIDs will be updated.</div>
      </div>

      <div className="md:col-span-2 overflow-x-auto">
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
            {students.map((s) => (
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
