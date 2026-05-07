'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { WHEELBASES, GAMES } from '@/lib/types';

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const wheelbase = searchParams.get('wheelbase') ?? '';
  const game = searchParams.get('game') ?? '';
  const search = searchParams.get('search') ?? '';

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const hasFilters = wheelbase || game || search;

  const inputStyle = {
    background: 'var(--muted-bg)',
    border: '1px solid var(--card-border)',
    color: 'var(--foreground)',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      {/* Search */}
      <div className="flex-1 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted)' }}>
          🔍
        </span>
        <input
          type="text"
          placeholder="Search presets…"
          value={search}
          onChange={(e) => update('search', e.target.value)}
          style={{ ...inputStyle, paddingLeft: '2rem' }}
        />
      </div>

      {/* Wheelbase filter */}
      <select
        value={wheelbase}
        onChange={(e) => update('wheelbase', e.target.value)}
        style={{ ...inputStyle, width: 'auto', minWidth: '130px', cursor: 'pointer' }}
      >
        <option value="">All Wheelbases</option>
        {WHEELBASES.map((wb) => (
          <option key={wb} value={wb}>
            Moza {wb}
          </option>
        ))}
      </select>

      {/* Game filter */}
      <select
        value={game}
        onChange={(e) => update('game', e.target.value)}
        style={{ ...inputStyle, width: 'auto', minWidth: '180px', cursor: 'pointer' }}
      >
        <option value="">All Games</option>
        {GAMES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={() => router.push('/')}
          className="text-sm px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
          style={{
            background: 'var(--muted-bg)',
            color: 'var(--muted)',
            border: '1px solid var(--card-border)',
          }}
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}
