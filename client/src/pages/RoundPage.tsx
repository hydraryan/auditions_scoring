import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

type Student = {
  _id: string;
  name: string;
  uid: string;
  contact: string;
  scores: Array<{
    round: number;
    aryan: { bodyExpressions?: number; confidence?: number };
    kunal: { dialogue?: number; creativity?: number };
  }>;
};

export default function RoundPage({ round }: { round: 1 | 2 | 3 }) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [form, setForm] = useState<{ bodyExpressions?: number | ''; confidence?: number | ''; dialogue?: number | ''; creativity?: number | '' }>({});
  const [saving, setSaving] = useState(false);
  const [unscoredOnly, setUnscoredOnly] = useState<boolean>(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [appliedQuery, setAppliedQuery] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await api.get(`/scores/round/${round}`);
      setStudents(res.data);
      setLoading(false);
    })();
  }, [round]);

  const isAryan = user?.username === 'Aryan';

  // helper to detect if a candidate is unscored for current director/round
  const isUnscoredForDirector = (s: Student) => {
    const sc = s.scores.find((x) => x.round === round);
    if (!sc) return true;
    if (isAryan) {
      const be = sc.aryan?.bodyExpressions;
      const cf = sc.aryan?.confidence;
      // unscored if missing or 0 or less
      return be == null || cf == null || be <= 0 || cf <= 0;
    }
    const dl = sc.kunal?.dialogue;
    const cr = sc.kunal?.creativity;
    return dl == null || cr == null || dl <= 0 || cr <= 0;
  };

  // filtered list per toggle
  const filteredStudents = useMemo(() => {
    const base = unscoredOnly ? students.filter((s) => isUnscoredForDirector(s)) : students;
    const q = appliedQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((s) => [s.name, s.uid, s.contact].some((v) => (v || '').toLowerCase().includes(q)));
  }, [students, unscoredOnly, appliedQuery]);

  // highlight helpers (for search UI)
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const getHighlighted = (text: string, q: string) => {
    if (!q) return text;
    const safe = escapeRegExp(q);
    const re = new RegExp(`(${safe})`, 'ig');
    const parts = text.split(re);
    return (
      <>
        {parts.map((part, i) =>
          re.test(part) ? (
            <mark key={i} className="bg-yellow-800/60 text-yellow-100 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  // compute progress for current director
  const scoredCount = useMemo(
    () => students.filter((s) => !isUnscoredForDirector(s)).length,
    [students]
  );

  // preselect first candidate (unscored preferred) after load or toggle change
  useEffect(() => {
    if (!loading && students.length) {
      const pool = filteredStudents;
      if (pool.length === 0) {
        setSelectedId('');
        return;
      }
      const first = pool[0];
      setSelectedId((prev) => (prev && pool.some((s) => s._id === prev) ? prev : first._id));
    }
  }, [loading, filteredStudents, students.length]);

  // set form when student selection changes
  useEffect(() => {
    if (!selectedId) {
      setForm({});
      return;
    }
    const s = students.find((x) => x._id === selectedId);
    if (!s) return;
    const sc = s.scores.find((x) => x.round === round);
    if (!sc) return;
    if (isAryan) {
      setForm({
        bodyExpressions: sc.aryan?.bodyExpressions ?? '',
        confidence: sc.aryan?.confidence ?? '',
      });
    } else {
      setForm({
        dialogue: sc.kunal?.dialogue ?? '',
        creativity: sc.kunal?.creativity ?? '',
      });
    }
  }, [selectedId, students, round, isAryan]);

  // derive saved values for current selection
  const savedForSelected = useMemo(() => {
    if (!selectedId) return null as
      | { bodyExpressions: number | ''; confidence: number | '' }
      | { dialogue: number | ''; creativity: number | '' }
      | null;
    const s = students.find((x) => x._id === selectedId);
    if (!s) return null;
    const sc = s.scores.find((x) => x.round === round);
    if (!sc) return null;
    return isAryan
      ? { bodyExpressions: sc.aryan?.bodyExpressions ?? '', confidence: sc.aryan?.confidence ?? '' }
      : { dialogue: sc.kunal?.dialogue ?? '', creativity: sc.kunal?.creativity ?? '' };
  }, [selectedId, students, round, isAryan]);

  // dirty flag: true if form differs from savedForSelected
  const dirty = useMemo(() => {
    if (!savedForSelected) return false;
    if (isAryan) {
      const sf = savedForSelected as { bodyExpressions: number | ''; confidence: number | '' };
      return (form.bodyExpressions ?? '') !== sf.bodyExpressions || (form.confidence ?? '') !== sf.confidence;
    }
    const sf = savedForSelected as { dialogue: number | ''; creativity: number | '' };
    return (form.dialogue ?? '') !== sf.dialogue || (form.creativity ?? '') !== sf.creativity;
  }, [form, savedForSelected, isAryan]);

  // whether the currently selected candidate is unscored for this director
  const unscoredSelected = useMemo(() => {
    if (!selectedId) return false;
    const s = students.find((x) => x._id === selectedId);
    if (!s) return false;
    return isUnscoredForDirector(s);
  }, [selectedId, students, isAryan]);

  const resetToSaved = () => {
    if (!savedForSelected) return;
    if (isAryan) {
      const sf = savedForSelected as { bodyExpressions: number | ''; confidence: number | '' };
      setForm({ bodyExpressions: sf.bodyExpressions, confidence: sf.confidence });
    } else {
      const sf = savedForSelected as { dialogue: number | ''; creativity: number | '' };
      setForm({ dialogue: sf.dialogue, creativity: sf.creativity });
    }
  };

  const handleSubmit = async () => {
    if (!selectedId) return;
  const payload: any = {};
  const isValidScore = (v: number | '') => v !== '' && v > 0 && v <= 10; // 0 is considered unscored
    if (isAryan) {
      if (!isValidScore(form.bodyExpressions ?? '') || !isValidScore(form.confidence ?? '')) {
        setToast({ type: 'error', message: 'Please enter both scores between 0 and 10.' });
        return;
      }
      payload.bodyExpressions = Number(form.bodyExpressions);
      payload.confidence = Number(form.confidence);
    } else {
      if (!isValidScore(form.dialogue ?? '') || !isValidScore(form.creativity ?? '')) {
        setToast({ type: 'error', message: 'Please enter both scores between 0 and 10.' });
        return;
      }
      payload.dialogue = Number(form.dialogue);
      payload.creativity = Number(form.creativity);
    }
    try {
      setSaving(true);
      await api.put(`/scores/round/${round}/student/${selectedId}`, payload);
      // refetch latest round data to ensure accurate view
      const refreshed = await api.get(`/scores/round/${round}`);
      setStudents(refreshed.data);
      // if we were showing only unscored and this candidate is now scored, keep them visible
      try {
        const updated = (refreshed.data as typeof students).find((s: any) => s._id === selectedId);
        if (updated && unscoredOnly && !isUnscoredForDirector(updated as any)) {
          setUnscoredOnly(false);
        }
      } catch {}
  setToast({ type: 'success', message: 'Scores submitted' });
      // clear toast after a short delay
      setTimeout(() => setToast(null), 1500);
      // auto-advance to next unscored candidate, else next in list
      const list = filteredStudents.length ? filteredStudents : students;
      const idx = list.findIndex((s) => s._id === selectedId);
      const after = [...list.slice(idx + 1), ...list.slice(0, idx)];
      const nextUnscored = after.find((s) => isUnscoredForDirector(s));
      const next = nextUnscored || after[0] || list[idx];
      if (next) setSelectedId(next._id);
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', message: 'Failed to save scores' });
      setTimeout(() => setToast(null), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedId) return;
    if (!confirm('Reset your scores for this candidate on this round? This will mark them Unscored.')) return;
    try {
      setSaving(true);
      await api.delete(`/scores/round/${round}/student/${selectedId}`);
      const refreshed = await api.get(`/scores/round/${round}`);
      setStudents(refreshed.data);
      setToast({ type: 'success', message: 'Scores reset' });
      setTimeout(() => setToast(null), 1500);
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', message: 'Failed to reset' });
      setTimeout(() => setToast(null), 2000);
    } finally {
      setSaving(false);
    }
  };

  // navigation helpers
  const currentIndex = useMemo(() => filteredStudents.findIndex((s) => s._id === selectedId), [filteredStudents, selectedId]);
  const prevCandidate = () => {
    if (!filteredStudents.length) return;
    if (dirty) {
      setToast({ type: 'error', message: 'You have unsaved changes. Save or discard to navigate.' });
      setTimeout(() => setToast(null), 2000);
      return;
    }
    const idx = currentIndex >= 0 ? currentIndex : 0;
    const prev = filteredStudents[(idx - 1 + filteredStudents.length) % filteredStudents.length];
    setSelectedId(prev._id);
  };
  const nextCandidate = () => {
    if (!filteredStudents.length) return;
    if (dirty) {
      setToast({ type: 'error', message: 'You have unsaved changes. Save or discard to navigate.' });
      setTimeout(() => setToast(null), 2000);
      return;
    }
    const idx = currentIndex >= 0 ? currentIndex : 0;
    const next = filteredStudents[(idx + 1) % filteredStudents.length];
    setSelectedId(next._id);
  };

  // keyboard shortcuts: Left/Right to navigate, Enter to save while typing, Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isTyping = !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.getAttribute('contenteditable') === 'true');
      if (isTyping) {
        if (e.key === 'Enter' && !e.shiftKey && selectedId) {
          // Only submit on Enter for numeric score inputs or textareas, not for search text box
          const tag = (active!.tagName || '').toUpperCase();
          const type = (active as HTMLInputElement).type;
          const isScoreField = (tag === 'INPUT' && type === 'number') || tag === 'TEXTAREA';
          if (isScoreField) {
            e.preventDefault();
            handleSubmit();
          }
        }
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!dirty) prevCandidate();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (!dirty) nextCandidate();
      } else if ((e.key === 's' || e.key === 'S') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (selectedId) handleSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, students, form, isAryan]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Round {round}</h2>
        <button
          onClick={async () => {
            try {
              setDownloading(true);
              const res = await api.get(`/scores/export/round/${round}.xlsx`, { responseType: 'blob' });
              const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `round${round}_scores.xlsx`;
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
          }}
          disabled={downloading}
          className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 disabled:opacity-60"
        >
          {downloading ? 'Preparing…' : 'Download Round Excel'}
        </button>
      </div>

      {/* Candidate selector */}
      <div className="mb-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm text-neutral-300 mb-1">Select candidate to score</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={dirty}
              className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 disabled:opacity-60"
            >
              <option value="">-- Choose a candidate --</option>
              {filteredStudents.map((s, i) => {
                const unscored = isUnscoredForDirector(s);
                return (
                  <option key={s._id} value={s._id}>
                    {i + 1}. {s.name} ({s.uid}) {unscored ? '- Unscored' : '- Scored'}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <button onClick={prevCandidate} disabled={dirty} className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60">← Prev</button>
            <div className="text-sm text-neutral-400 w-16 text-center">
              {currentIndex >= 0 ? `${currentIndex + 1} / ${filteredStudents.length}` : `0 / ${filteredStudents.length}`}
            </div>
            <button onClick={nextCandidate} disabled={dirty} className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60">Next →</button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            className="flex-1 max-w-md p-2 bg-neutral-900 border border-neutral-800 rounded"
            placeholder="Search by name, UID, or contact"
            value={searchText}
            onChange={(e) => {
              const v = (e.target as HTMLInputElement).value;
              setSearchText(v);
              setAppliedQuery(v);
            }}
          />
          {appliedQuery && (
            <button
              onClick={() => { setSearchText(''); setAppliedQuery(''); }}
              disabled={dirty}
              className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60"
            >Clear</button>
          )}
          <div className="text-xs text-neutral-400">{filteredStudents.length} of {students.length}</div>
        </div>
        {appliedQuery.trim() && (
          <div className="mt-2 bg-neutral-900 border border-neutral-800 rounded">
            <div className="px-2 py-1 text-xs text-neutral-400 flex justify-between">
              <span>Matches</span>
              <span>{filteredStudents.length}</span>
            </div>
            <ul className="max-h-56 overflow-auto divide-y divide-neutral-800">
              {filteredStudents.map((s, i) => {
                const unscored = isUnscoredForDirector(s);
                return (
                  <li
                    key={s._id}
                    className={`p-2 flex items-center justify-between ${dirty ? 'opacity-60 cursor-not-allowed' : 'hover:bg-neutral-800 cursor-pointer'}`}
                    onClick={() => { if (!dirty) setSelectedId(s._id); }}
                    title={dirty ? 'Save or discard changes to switch' : ''}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm text-neutral-200">
                        <span className="text-neutral-300 mr-1">{i + 1}.</span> {getHighlighted(s.name, appliedQuery)}
                      </div>
                      <div className="truncate text-xs text-neutral-500">UID: {getHighlighted(s.uid, appliedQuery)} • {getHighlighted(s.contact || '', appliedQuery)}</div>
                    </div>
                    <div className={`ml-3 shrink-0 text-xs px-2 py-0.5 rounded ${unscored ? 'bg-neutral-800 text-neutral-300' : 'bg-green-900/30 text-green-300'}`}>
                      {unscored ? 'Unscored' : 'Scored'}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
          <div>Shortcuts: ←/→ navigate, Enter saves while typing, Ctrl+S saves.</div>
          <div className="text-neutral-400">
            Progress: <span className="text-white">{scoredCount}</span>/<span>{students.length}</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unscoredOnly}
              onChange={(e) => setUnscoredOnly(e.target.checked)}
              className="accent-red-600"
            />
            Show unscored only
          </label>
          {dirty && <span className="text-red-400">Unsaved changes — save or discard to switch candidate.</span>}
        </div>
      </div>

      {/* Form */}
      {selectedId ? (
        (() => {
          const s = students.find((x) => x._id === selectedId)!;
          const sc = s.scores.find((x) => x.round === round)!;
          const directorTotal = isAryan
            ? (Number(form.bodyExpressions || 0) + Number(form.confidence || 0))
            : (Number(form.dialogue || 0) + Number(form.creativity || 0));
          const combinedTotal =
            (Number(sc.aryan?.bodyExpressions || 0) + Number(sc.aryan?.confidence || 0) + Number(sc.kunal?.dialogue || 0) + Number(sc.kunal?.creativity || 0)) -
            (isAryan
              ? (Number(sc.aryan?.bodyExpressions || 0) + Number(sc.aryan?.confidence || 0))
              : (Number(sc.kunal?.dialogue || 0) + Number(sc.kunal?.creativity || 0))) +
            directorTotal;
          return (
            <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
              <div className="mb-3 flex items-center justify-between text-sm text-neutral-400">
                <div>
                  Scoring for: <span className="text-white font-medium">{s.name}</span> <span className="text-neutral-500">({s.uid})</span>
                </div>
                <div>
                  {dirty ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-900/40 text-yellow-300">● Editing…</span>
                  ) : unscoredSelected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">Unscored</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-900/30 text-green-300">✔ Scored</span>
                  )}
                </div>
              </div>
              {/* No extra controls while editing; only a single Submit button below */}
              {isAryan ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Body Language & Expressions (10)</label>
                    <input
                      className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded"
                      type="number"
                      min={0}
                      max={10}
                      value={form.bodyExpressions ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, bodyExpressions: e.target.value === '' ? '' : Number(e.target.value) }))}
                    />
                    {savedForSelected && (form.bodyExpressions ?? '') !== (savedForSelected as any).bodyExpressions && (
                      <div className="text-xs text-neutral-400 mt-1">Previous: {(savedForSelected as any).bodyExpressions ?? '—'}</div>
                    )}
                    {form.bodyExpressions !== '' && (form.bodyExpressions! < 0 || form.bodyExpressions! > 10) && (
                      <div className="text-xs text-red-400 mt-1">Enter a value between 0 and 10.</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Confidence & Stage Presence (10)</label>
                    <input
                      className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded"
                      type="number"
                      min={0}
                      max={10}
                      value={form.confidence ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, confidence: e.target.value === '' ? '' : Number(e.target.value) }))}
                    />
                    {savedForSelected && (form.confidence ?? '') !== (savedForSelected as any).confidence && (
                      <div className="text-xs text-neutral-400 mt-1">Previous: {(savedForSelected as any).confidence ?? '—'}</div>
                    )}
                    {form.confidence !== '' && (form.confidence! < 0 || form.confidence! > 10) && (
                      <div className="text-xs text-red-400 mt-1">Enter a value between 0 and 10.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Dialogue Delivery & Voice (10)</label>
                    <input
                      className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded"
                      type="number"
                      min={0}
                      max={10}
                      value={form.dialogue ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, dialogue: e.target.value === '' ? '' : Number(e.target.value) }))}
                    />
                    {savedForSelected && (form.dialogue ?? '') !== (savedForSelected as any).dialogue && (
                      <div className="text-xs text-neutral-400 mt-1">Previous: {(savedForSelected as any).dialogue ?? '—'}</div>
                    )}
                    {form.dialogue !== '' && (form.dialogue! < 0 || form.dialogue! > 10) && (
                      <div className="text-xs text-red-400 mt-1">Enter a value between 0 and 10.</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Creativity & Voice (10)</label>
                    <input
                      className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded"
                      type="number"
                      min={0}
                      max={10}
                      value={form.creativity ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, creativity: e.target.value === '' ? '' : Number(e.target.value) }))}
                    />
                    {savedForSelected && (form.creativity ?? '') !== (savedForSelected as any).creativity && (
                      <div className="text-xs text-neutral-400 mt-1">Previous: {(savedForSelected as any).creativity ?? '—'}</div>
                    )}
                    {form.creativity !== '' && (form.creativity! < 0 || form.creativity! > 10) && (
                      <div className="text-xs text-red-400 mt-1">Enter a value between 0 and 10.</div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="text-neutral-400">
                  Director Total: <span className="text-white font-semibold">{directorTotal}</span>
                  <span className="mx-2">•</span>
                  Combined Total: <span className="text-white font-semibold">{combinedTotal}</span>
                </div>
                {(unscoredSelected || dirty) && (
                  <button
                    onClick={handleSubmit}
                    disabled={
                      saving ||
                      (isAryan
                        ? (form.bodyExpressions === '' || form.confidence === '' || (form.bodyExpressions as number) <= 0 || (form.bodyExpressions as number) > 10 || (form.confidence as number) <= 0 || (form.confidence as number) > 10)
                        : (form.dialogue === '' || form.creativity === '' || (form.dialogue as number) <= 0 || (form.dialogue as number) > 10 || (form.creativity as number) <= 0 || (form.creativity as number) > 10)
                      )
                    }
                    className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 disabled:opacity-60"
                  >
                    {saving ? 'Submitting…' : 'Submit'}
                  </button>
                )}
                {!unscoredSelected && !dirty && (
                  <button
                    onClick={handleReset}
                    disabled={saving}
                    className="px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 ml-2 disabled:opacity-60"
                  >Reset Marks</button>
                )}
              </div>
              {toast && (
                <div className={`mt-3 text-sm ${toast.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{toast.message}</div>
              )}
            </div>
          );
        })()
      ) : (
        <div className="text-neutral-400">Pick a candidate from the list to start scoring.</div>
      )}
    </div>
  );
}
