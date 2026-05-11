'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FilterBar from '@/components/FilterBar';
import PresetCard from '@/components/PresetCard';
import type { Preset } from '@/lib/types';

function PresetGrid() {
  const searchParams = useSearchParams();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    const wb = searchParams.get('wheelbase');
    const game = searchParams.get('game');
    const search = searchParams.get('search');
    if (wb) params.set('wheelbase', wb);
    if (game) params.set('game', game);
    if (search) params.set('search', search);

    fetch(`/api/presets?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setPresets(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl h-48 animate-pulse"
            style={{ background: 'var(--card)' }}
          />
        ))}
      </div>
    );
  }

  if (presets.length === 0) {
    return (
      <div className="text-center py-24" style={{ color: 'var(--muted)' }}>
        <div className="text-4xl mb-3">🏁</div>
        <p className="text-lg font-medium">No presets found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {presets.map((preset) => (
        <PresetCard key={preset.id} preset={preset} />
      ))}
    </div>
  );
}

export default function HomePage() {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span
              className="font-bold text-lg tracking-tight"
              style={{ color: 'var(--accent)' }}
            >
              ⬡ PitHouse
            </span>
            <span className="font-medium text-lg hidden sm:block">Presets</span>
          </Link>
          <Link
            href="/upload"
            className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: 'var(--accent)',
              color: '#fff',
            }}
          >
            + Share Preset
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div
        className="py-10 px-4"
        style={{ borderBottom: '1px solid var(--card-border)' }}
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Wheel Presets
          </h1>
          <p className="mb-6" style={{ color: 'var(--muted)' }}>
            Community-made FFB presets for Moza wheelbases. Download, rate, and share.
          </p>
          <Suspense>
            <FilterBar />
          </Suspense>
        </div>
      </div>

      {/* Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <Suspense>
          <PresetGrid />
        </Suspense>
      </main>

      {/* Footer */}
      <footer
        className="py-6 text-center text-xs"
        style={{
          color: 'var(--muted)',
          borderTop: '1px solid var(--card-border)',
        }}
      >
        PitHouse Presets — Community resource for Moza sim racers
      </footer>
    </div>
  );
}
