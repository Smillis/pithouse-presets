'use client';

import { useEffect, useState } from 'react';
import { WHEELBASES, GAMES } from '@/lib/types';
import type { Preset } from '@/lib/types';
import StarRating from '@/components/StarRating';

interface EditState {
  name: string;
  wheelbase: string;
  game: string;
  description: string;
}

export default function AdminPresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    name: '',
    wheelbase: '',
    game: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchPresets = () => {
    setLoading(true);
    fetch('/api/presets')
      .then((r) => r.json())
      .then((data) => setPresets(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const startEdit = (preset: Preset) => {
    setEditingId(preset.id);
    setEditState({
      name: preset.name,
      wheelbase: preset.wheelbase,
      game: preset.game,
      description: preset.description ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError('');
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/admin/presets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editState),
    });
    if (res.ok) {
      setEditingId(null);
      fetchPresets();
    } else {
      const data = await res.json();
      setError(data.error || 'Save failed');
    }
    setSaving(false);
  };

  const deletePreset = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/presets/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPresets((p) => p.filter((x) => x.id !== id));
    } else {
      alert('Delete failed. Please try again.');
    }
    setDeletingId(null);
  };

  const inputStyle = {
    background: 'var(--muted-bg)',
    border: '1px solid var(--card-border)',
    color: 'var(--foreground)',
    borderRadius: '0.375rem',
    padding: '0.375rem 0.5rem',
    fontSize: '0.8rem',
    outline: 'none',
    width: '100%',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Manage Presets</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        Edit or remove presets from the library.
      </p>

      {error && (
        <p className="text-sm mb-4" style={{ color: 'var(--accent)' }}>
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl animate-pulse"
              style={{ background: 'var(--card)' }}
            />
          ))}
        </div>
      ) : presets.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
          No presets uploaded yet.
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--card-border)' }}
        >
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--muted-bg)', borderBottom: '1px solid var(--card-border)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell" style={{ color: 'var(--muted)' }}>
                  Wheelbase
                </th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell" style={{ color: 'var(--muted)' }}>
                  Game
                </th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell" style={{ color: 'var(--muted)' }}>
                  Rating
                </th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell" style={{ color: 'var(--muted)' }}>
                  Downloads
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {presets.map((preset, i) => (
                <tr
                  key={preset.id}
                  style={{
                    background: i % 2 === 0 ? 'var(--card)' : 'transparent',
                    borderBottom: i < presets.length - 1 ? '1px solid var(--card-border)' : 'none',
                  }}
                >
                  {editingId === preset.id ? (
                    <>
                      <td className="px-4 py-3" colSpan={4}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            value={editState.name}
                            onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                            placeholder="Name"
                            style={inputStyle}
                          />
                          <select
                            value={editState.wheelbase}
                            onChange={(e) => setEditState((s) => ({ ...s, wheelbase: e.target.value }))}
                            style={{ ...inputStyle, cursor: 'pointer' }}
                          >
                            {WHEELBASES.map((wb) => (
                              <option key={wb} value={wb}>
                                Moza {wb}
                              </option>
                            ))}
                          </select>
                          <select
                            value={editState.game}
                            onChange={(e) => setEditState((s) => ({ ...s, game: e.target.value }))}
                            style={{ ...inputStyle, cursor: 'pointer' }}
                          >
                            {GAMES.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                          <input
                            value={editState.description}
                            onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))}
                            placeholder="Description (optional)"
                            style={inputStyle}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(preset.id)}
                            disabled={saving}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                            style={{
                              background: 'var(--accent)',
                              color: '#fff',
                              border: 'none',
                              cursor: saving ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {saving ? '…' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                            style={{
                              background: 'var(--muted-bg)',
                              color: 'var(--muted)',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{preset.name}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: 'var(--accent)', color: '#fff' }}
                        >
                          {preset.wheelbase}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--muted)' }}>
                        {preset.game}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <StarRating
                          presetId={preset.id}
                          avgRating={preset.avg_rating ?? 0}
                          ratingCount={preset.rating_count ?? 0}
                          interactive={false}
                        />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell" style={{ color: 'var(--muted)' }}>
                        {preset.downloads.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => startEdit(preset)}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all"
                            style={{
                              background: 'var(--muted-bg)',
                              color: 'var(--muted)',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deletePreset(preset.id, preset.name)}
                            disabled={deletingId === preset.id}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all"
                            style={{
                              background: 'transparent',
                              color: deletingId === preset.id ? 'var(--muted)' : 'var(--accent)',
                              border: '1px solid',
                              borderColor: deletingId === preset.id ? 'var(--muted)' : 'var(--accent)',
                              cursor: deletingId === preset.id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {deletingId === preset.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
