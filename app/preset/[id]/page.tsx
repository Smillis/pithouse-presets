'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import StarRating from '@/components/StarRating';
import type { Preset } from '@/lib/types';

function getImageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${path}`;
}

export default function PresetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [preset, setPreset] = useState<Preset | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/presets/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPreset(data))
      .finally(() => setLoading(false));
  }, [id]);

  // Close lightbox on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight' && lightboxIndex !== null && preset?.images)
        setLightboxIndex((lightboxIndex + 1) % preset.images.length);
      if (e.key === 'ArrowLeft' && lightboxIndex !== null && preset?.images)
        setLightboxIndex((lightboxIndex - 1 + preset.images.length) % preset.images.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, preset?.images]);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      const res = await fetch(`/api/presets/${id}/download`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setDownloadError(data.error || 'Download failed'); return; }
      const a = document.createElement('a');
      a.href = data.url;
      a.download = preset?.original_filename ?? 'preset.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setPreset((p) => p ? { ...p, downloads: p.downloads + 1 } : p);
    } catch {
      setDownloadError('Something went wrong.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-sm" style={{ color: 'var(--muted)' }}>Loading preset…</div>
      </div>
    );
  }

  if (!preset) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-4xl">🏁</div>
        <p className="font-medium">Preset not found</p>
        <Link href="/" style={{ color: 'var(--accent)' }} className="text-sm hover:underline">
          ← Back to presets
        </Link>
      </div>
    );
  }

  const images = preset.images ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Lightbox */}
      {lightboxIndex !== null && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-2xl w-10 h-10 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + images.length) % images.length); }}
                className="absolute left-4 text-xl w-10 h-10 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % images.length); }}
                className="absolute right-14 text-xl w-10 h-10 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                ›
              </button>
            </>
          )}

          <div
            className="relative max-w-5xl max-h-screen w-full mx-8"
            style={{ aspectRatio: '16/9' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={getImageUrl(images[lightboxIndex])}
              alt={`Screenshot ${lightboxIndex + 1}`}
              fill
              style={{ objectFit: 'contain' }}
              unoptimized
            />
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {lightboxIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10"
        style={{ background: 'rgba(13,13,13,0.92)', backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--card-border)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--accent)' }}>
              ⬡ PitHouse
            </span>
            <span className="font-medium text-lg hidden sm:block">Presets</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <Link href="/" className="text-sm hover:underline mb-6 inline-block" style={{ color: 'var(--muted)' }}>
          ← All presets
        </Link>

        {/* Main card */}
        <div className="rounded-2xl p-6 sm:p-8"
          style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-sm font-semibold px-3 py-1 rounded-full"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              {preset.wheelbase}
            </span>
            <span className="text-sm px-3 py-1 rounded-full"
              style={{ background: 'var(--muted-bg)', color: 'var(--muted)' }}>
              {preset.game}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-3">{preset.name}</h1>

          {preset.description && (
            <p className="text-base mb-6 leading-relaxed" style={{ color: 'var(--muted)' }}>
              {preset.description}
            </p>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6 py-4 mb-6"
            style={{ borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)' }}>
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>Rating</div>
              <StarRating presetId={preset.id} avgRating={preset.avg_rating ?? 0}
                ratingCount={preset.rating_count ?? 0} interactive={true} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>Downloads</div>
              <div className="font-semibold">{preset.downloads.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>Added</div>
              <div className="font-semibold">
                {new Date(preset.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>File</div>
              <div className="font-semibold text-sm font-mono">{preset.original_filename}</div>
            </div>
          </div>

          {/* Download button */}
          <div className="flex flex-col gap-2 mb-8">
            <button onClick={handleDownload} disabled={downloading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
              style={{
                background: downloading ? 'var(--muted-bg)' : 'var(--accent)',
                color: downloading ? 'var(--muted)' : '#fff',
                cursor: downloading ? 'not-allowed' : 'pointer',
                border: 'none',
              }}>
              {downloading ? <><span className="animate-spin">⟳</span> Preparing download…</> : <>↓ Download Preset</>}
            </button>
            {downloadError && <p className="text-sm" style={{ color: 'var(--accent)' }}>{downloadError}</p>}
          </div>

          {/* Screenshots */}
          {images.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
                Screenshots
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((path, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className="relative rounded-lg overflow-hidden transition-all hover:opacity-80 hover:scale-[1.02]"
                    style={{ aspectRatio: '16/9', background: 'var(--muted-bg)',
                      border: '1px solid var(--card-border)', cursor: 'pointer' }}
                  >
                    <Image
                      src={getImageUrl(path)}
                      alt={`Screenshot ${i + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
