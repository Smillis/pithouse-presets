import Link from 'next/link';
import type { Preset } from '@/lib/types';
import StarRating from './StarRating';

interface PresetCardProps {
  preset: Preset;
}

export default function PresetCard({ preset }: PresetCardProps) {
  return (
    <Link href={`/preset/${preset.id}`} className="block group">
      <div
        className="rounded-xl p-5 flex flex-col gap-3 h-full transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          boxShadow: '0 0 0 0 transparent',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = '#444';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(224,32,32,0.08)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--card-border)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 0 transparent';
        }}
      >
        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {preset.wheelbase}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--muted-bg)', color: 'var(--muted)' }}
          >
            {preset.game}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-base leading-snug group-hover:text-white transition-colors">
          {preset.name}
        </h3>

        {/* Description */}
        {preset.description && (
          <p className="text-sm line-clamp-2" style={{ color: 'var(--muted)' }}>
            {preset.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: '1px solid var(--card-border)' }}>
          <StarRating
            presetId={preset.id}
            avgRating={preset.avg_rating ?? 0}
            ratingCount={preset.rating_count ?? 0}
            interactive={false}
          />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            ↓ {preset.downloads.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
