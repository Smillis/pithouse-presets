'use client';

import { useState, useEffect } from 'react';
import { getFingerprint } from '@/lib/fingerprint';

interface StarRatingProps {
  presetId: string;
  avgRating: number;
  ratingCount: number;
  interactive?: boolean;
}

export default function StarRating({
  presetId,
  avgRating,
  ratingCount,
  interactive = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [liveAvg, setLiveAvg] = useState(avgRating);
  const [liveCount, setLiveCount] = useState(ratingCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user already rated this preset
  useEffect(() => {
    const key = `ph_rated_${presetId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setUserRating(parseInt(saved));
      setSubmitted(true);
    }
  }, [presetId]);

  const handleRate = async (star: number) => {
    if (!interactive || submitted || loading) return;
    setLoading(true);
    setError('');
    try {
      const fp = await getFingerprint();
      const res = await fetch(`/api/presets/${presetId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: star, fingerprint: fp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not submit rating.');
      } else {
        setUserRating(star);
        setSubmitted(true);
        setLiveAvg(data.avg_rating);
        setLiveCount(data.rating_count);
        localStorage.setItem(`ph_rated_${presetId}`, String(star));
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const displayRating = interactive && hovered > 0 ? hovered : (interactive && userRating > 0 ? userRating : liveAvg);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(displayRating);
          const partial = !filled && star - 1 < displayRating && displayRating < star;
          return (
            <button
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => interactive && !submitted && setHovered(star)}
              onMouseLeave={() => interactive && setHovered(0)}
              disabled={!interactive || submitted || loading}
              className={[
                'text-xl leading-none transition-all',
                interactive && !submitted ? 'cursor-pointer hover:scale-110' : 'cursor-default',
                loading ? 'opacity-50' : '',
              ].join(' ')}
              title={interactive && !submitted ? `Rate ${star} star${star !== 1 ? 's' : ''}` : ''}
            >
              {filled ? (
                <span style={{ color: '#f59e0b' }}>★</span>
              ) : partial ? (
                <span style={{ color: '#f59e0b', opacity: 0.5 }}>★</span>
              ) : (
                <span style={{ color: '#444' }}>★</span>
              )}
            </button>
          );
        })}
        <span className="text-sm ml-1" style={{ color: 'var(--muted)' }}>
          {liveAvg > 0 ? liveAvg.toFixed(1) : '—'}
        </span>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          ({liveCount})
        </span>
      </div>
      {interactive && submitted && (
        <p className="text-xs" style={{ color: '#22c55e' }}>
          ✓ You rated this {userRating} star{userRating !== 1 ? 's' : ''}
        </p>
      )}
      {error && (
        <p className="text-xs" style={{ color: 'var(--accent)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
