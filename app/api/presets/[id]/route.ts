import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('presets')
    .select('*, ratings(rating)')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const ratings = data.ratings ?? [];
  const avg_rating =
    ratings.length > 0
      ? ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratings.length
      : 0;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ratings: _r, ...rest } = data;
  return NextResponse.json({
    ...rest,
    avg_rating: Math.round(avg_rating * 10) / 10,
    rating_count: ratings.length,
  });
}
