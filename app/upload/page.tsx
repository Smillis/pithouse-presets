'use client';

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import Image from 'next/image';
import { WHEELBASES, GAMES } from '@/lib/types';

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1 MB
const MAX_IMAGES = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

declare global {
  interface Window {
    turnstile?: { reset: () => void };
    onTurnstileSuccess: (token: string) => void;
    onTurnstileExpired: () => void;
  }
}

interface ImageEntry {
  file: File;
  previewUrl: string;
  error: string;
}

export default function PublicUploadPage() {
  const [name, setName] = useState('');
  const [wheelbase, setWheelbase] = useState('');
  const [game, setGame] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [preview, setPreview] = useState<{ keys: string[]; sizeKb: string } | null>(null);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.onTurnstileSuccess = (token: string) => setTurnstileToken(token);
    window.onTurnstileExpired = () => setTurnstileToken('');
    return () => {
      delete (window as Partial<Window>).onTurnstileSuccess;
      delete (window as Partial<Window>).onTurnstileExpired;
    };
  }, []);

  // Revoke object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
  }, [images]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(null);
    setFileError('');
    if (!f) return;
    if (!f.name.endsWith('.json')) {
      setFileError('Only .json files are accepted.');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError(`File is too large (${(f.size / 1024).toFixed(0)} KB). Maximum is 1 MB.`);
      return;
    }
    if (!name) setName(f.name.replace('.json', '').replace(/[_-]/g, ' '));
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        setPreview({ keys: Object.keys(parsed).slice(0, 8), sizeKb: (f.size / 1024).toFixed(1) });
      } catch {
        setFileError('Could not parse JSON — make sure the file is valid.');
      }
    };
    reader.readAsText(f);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

    const remaining = MAX_IMAGES - images.length;
    const toAdd = selected.slice(0, remaining);

    const entries: ImageEntry[] = toAdd.map((f) => {
      let err = '';
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        err = `${f.name}: unsupported type. Use JPG, PNG, WebP or GIF.`;
      } else if (f.size > MAX_IMAGE_SIZE) {
        err = `${f.name}: too large (${(f.size / 1024).toFixed(0)} KB). Max is 1 MB.`;
      }
      return { file: f, previewUrl: URL.createObjectURL(f), error: err };
    });

    setImages((prev) => [...prev, ...entries]);
    // Reset input so the same file can be re-selected if removed
    if (imageRef.current) imageRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const hasImageErrors = images.some((img) => img.error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !wheelbase || !game) {
      setError('Please fill in all required fields and select a preset file.');
      return;
    }
    if (fileError || hasImageErrors) return;
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('wheelbase', wheelbase);
    formData.append('game', game);
    formData.append('description', description);
    formData.append('turnstileToken', turnstileToken);
    images.forEach((img) => formData.append('images', img.file));

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Upload failed. Please try again.');
      window.turnstile?.reset();
      setTurnstileToken('');
    } else {
      setSuccess(true);
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

  const resetForm = () => {
    setSuccess(false);
    setName(''); setWheelbase(''); setGame(''); setDescription('');
    setFile(null); setPreview(null); setTurnstileToken('');
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div
            className="w-full max-w-md rounded-2xl p-8 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}
          >
            <div className="text-4xl mb-4">🏁</div>
            <h2 className="text-xl font-bold mb-2">Preset uploaded!</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              Your preset is now live in the library.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--accent)', color: '#fff' }}>
                Browse presets
              </Link>
              <button onClick={resetForm} className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--muted-bg)', color: 'var(--muted)', border: 'none', cursor: 'pointer' }}>
                Upload another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <Header />

      <div className="py-10 px-4" style={{ borderBottom: '1px solid var(--card-border)' }}>
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Share a Preset</h1>
          <p style={{ color: 'var(--muted)' }}>
            Upload your FFB preset to the community library. JSON files only, max 1 MB.
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Preset JSON file */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Preset File <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} required
              style={{ ...inputStyle, cursor: 'pointer' }} />
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>.json only — maximum 1 MB</p>
            {fileError && <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>{fileError}</p>}
            {preview && (
              <div className="mt-2 rounded-lg p-3 text-xs"
                style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                <p className="font-semibold mb-1" style={{ color: '#22c55e' }}>
                  ✓ Valid JSON — {preview.sizeKb} KB
                </p>
                <p style={{ color: 'var(--muted)' }}>
                  Top-level keys: {preview.keys.join(', ')}{preview.keys.length === 8 ? '…' : ''}
                </p>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Display Name <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input type="text" placeholder="e.g. Balanced GT3 — Low Speed Focus"
              value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
          </div>

          {/* Wheelbase + Game */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Wheelbase <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <select value={wheelbase} onChange={(e) => setWheelbase(e.target.value)} required
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select…</option>
                {WHEELBASES.map((wb) => <option key={wb} value={wb}>Moza {wb}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Game <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <select value={game} onChange={(e) => setGame(e.target.value)} required
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select…</option>
                {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Description{' '}
              <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>(optional)</span>
            </label>
            <textarea placeholder="Brief notes — intended use, tuning philosophy, track conditions, etc."
              value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Screenshots */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Screenshots{' '}
              <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>
                (optional — up to {MAX_IMAGES})
              </span>
            </label>

            {/* Image previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {images.map((img, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden"
                    style={{ aspectRatio: '16/9', background: 'var(--muted-bg)',
                      border: img.error ? '1px solid var(--accent)' : '1px solid var(--card-border)' }}>
                    <Image src={img.previewUrl} alt={`Screenshot ${i + 1}`} fill
                      style={{ objectFit: 'cover' }} unoptimized />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                      style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      ✕
                    </button>
                    {img.error && (
                      <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-xs"
                        style={{ background: 'rgba(224,32,32,0.85)', color: '#fff' }}>
                        {img.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {images.length < MAX_IMAGES && (
              <>
                <input ref={imageRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple onChange={handleImageChange}
                  style={{ ...inputStyle, cursor: 'pointer' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  JPG, PNG, WebP or GIF — max 1 MB each
                  {images.length > 0 ? ` — ${MAX_IMAGES - images.length} remaining` : ''}
                </p>
              </>
            )}
          </div>

          {/* Turnstile */}
          <div
            className="cf-turnstile"
            data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            data-callback="onTurnstileSuccess"
            data-expired-callback="onTurnstileExpired"
            data-theme="dark"
          />

          {error && <p className="text-sm" style={{ color: 'var(--accent)' }}>{error}</p>}

          <button type="submit"
            disabled={loading || !!fileError || hasImageErrors || !turnstileToken}
            className="py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
            style={{
              background: loading || fileError || hasImageErrors || !turnstileToken
                ? 'var(--muted-bg)' : 'var(--accent)',
              color: loading || fileError || hasImageErrors || !turnstileToken
                ? 'var(--muted)' : '#fff',
              cursor: loading || fileError || hasImageErrors || !turnstileToken
                ? 'not-allowed' : 'pointer',
              border: 'none',
            }}>
            {loading ? 'Uploading…' : 'Submit Preset'}
          </button>
        </form>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-10"
      style={{ background: 'rgba(13,13,13,0.92)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--card-border)' }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--accent)' }}>
            ⬡ PitHouse
          </span>
          <span className="font-medium text-lg hidden sm:block">Presets</span>
        </Link>
        <Link href="/" className="text-sm hover:underline" style={{ color: 'var(--muted)' }}>← Browse</Link>
      </div>
    </header>
  );
}
