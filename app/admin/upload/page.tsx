'use client';

import { useState, useRef } from 'react';
import { WHEELBASES, GAMES } from '@/lib/types';

interface ParsedPreview {
  keys: string[];
  size: number;
}

export default function AdminUploadPage() {
  const [name, setName] = useState('');
  const [wheelbase, setWheelbase] = useState('');
  const [game, setGame] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [parseError, setParseError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(null);
    setParseError('');
    if (!f) return;

    if (!f.name.endsWith('.json')) {
      setParseError('File must be a .json file.');
      return;
    }

    // Auto-fill name from filename if empty
    if (!name) {
      setName(f.name.replace('.json', '').replace(/[_-]/g, ' '));
    }

    // Parse and preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        setPreview({
          keys: Object.keys(parsed).slice(0, 8),
          size: f.size,
        });
      } catch {
        setParseError('Could not parse JSON — make sure the file is valid.');
      }
    };
    reader.readAsText(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !wheelbase || !game) {
      setError('Please fill in all required fields and select a file.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('wheelbase', wheelbase);
    formData.append('game', game);
    formData.append('description', description);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Upload failed');
    } else {
      setSuccess(`"${data.name}" uploaded successfully!`);
      setName('');
      setWheelbase('');
      setGame('');
      setDescription('');
      setFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    }
    setLoading(false);
  };

  const inputStyle = {
    background: 'var(--muted-bg)',
    border: '1px solid var(--card-border)',
    color: 'var(--foreground)',
    borderRadius: '0.5rem',
    padding: '0.625rem 0.75rem',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-1">Upload Preset</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        Add a new JSON preset file to the library.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* File picker */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Preset File <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            required
            style={{ ...inputStyle, cursor: 'pointer' }}
          />
          {parseError && (
            <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>
              {parseError}
            </p>
          )}
          {preview && (
            <div
              className="mt-2 rounded-lg p-3 text-xs"
              style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}
            >
              <p className="font-semibold mb-1" style={{ color: '#22c55e' }}>
                ✓ Valid JSON — {(preview.size / 1024).toFixed(1)} KB
              </p>
              <p style={{ color: 'var(--muted)' }}>
                Top-level keys: {preview.keys.join(', ')}
                {preview.keys.length === 8 ? '…' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Display Name <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Balanced GT3 — Low Speed Focus"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        {/* Wheelbase + Game row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Wheelbase <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <select
              value={wheelbase}
              onChange={(e) => setWheelbase(e.target.value)}
              required
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Select…</option>
              {WHEELBASES.map((wb) => (
                <option key={wb} value={wb}>
                  Moza {wb}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Game <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <select
              value={game}
              onChange={(e) => setGame(e.target.value)}
              required
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Select…</option>
              {GAMES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Description{' '}
            <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>
              (optional)
            </span>
          </label>
          <textarea
            placeholder="Brief notes about the preset — intended use, tuning philosophy, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--accent)' }}>
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm" style={{ color: '#22c55e' }}>
            ✓ {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !!parseError}
          className="py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
          style={{
            background: loading || parseError ? 'var(--muted-bg)' : 'var(--accent)',
            color: loading || parseError ? 'var(--muted)' : '#fff',
            cursor: loading || parseError ? 'not-allowed' : 'pointer',
            border: 'none',
          }}
        >
          {loading ? 'Uploading…' : 'Upload Preset'}
        </button>
      </form>
    </div>
  );
}
