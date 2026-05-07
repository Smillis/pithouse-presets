'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import StarRating from '@/components/StarRating';
import type { Preset } from '@/lib/types';

export default function PresetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [preset, setPreset] = useState<Preset | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    fetch(`/api/presets/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPreset(data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      const res = await fetch(`/api/presets/${id}/download`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setDownloadError(data.error || 'Download failed');
        return;
      }
      // Trigger browser download via temporary anchor
      const a = document.createElement('a');
      a.href = data.url;
      a.download = preset?.original_filename ?? 'preset.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Update local download count optimistically
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
        <div className="animate-pulse text-sm" style={{ color: 'var(--muted)' }}>
          Loading preset…
        </div>
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-10"
        style={{
          background: 'rgba(13,13,13,0.92)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--card-border)',
        }}
      >
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
        {/* Breadcrumb */}
        <Link
          href="/"
          className="text-sm hover:underline mb-6 inline-block"
          style={{ color: 'var(--muted)' }}
        >
          ← All presets
        </Link>

        {/* Main card */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-border)',
          }}
        >
          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span
              className="text-sm font-semibold px-3 py-1 rounded-full"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {preset.wheelbase}
            </span>
            <span
              className="text-sm px-3 py-1 rounded-full"
              style={{ background: 'var(--muted-bg)', color: 'var(--muted)' }}
            >
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
          <div
            className="flex flex-wrap items-center gap-6 py-4 mb-6"
            style={{ borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)' }}
          >
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                Rating
              </div>
              <StarRating
                presetId={preset.id}
                avgRating={preset.avg_rating ?? 0}
                ratingCount={preset.rating_count ?? 0}
                interactive={true}
              />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                Downloads
              </div>
              <div className="font-semibold">{preset.downloads.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                Added
              </div>
              <div className="font-semibold">
                {new Date(preset.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                File
              </div>
              <div className="font-semibold text-sm font-mono">{preset.original_filename}</div>
            </div>
          </div>

          {/* Download button */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
              style={{
                background: downloading ? 'var(--muted-bg)' : 'var(--accent)',
                color: downloading ? 'var(--muted)' : '#fff',
                cursor: downloading ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              {downloading ? (
                <>
                  <span className="animate-spin">⟳</span> Preparing download…
                </>
              ) : (
                <>↓ Download Preset</>
              )}
            </button>
            {downloadError && (
              <p className="text-sm" style={{ color: 'var(--accent)' }}>
                {downloadError}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
