import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wheelbase = searchParams.get('wheelbase');
  const game = searchParams.get('game');
  const search = searchParams.get('search');

  const supabase = createServerClient();

  let query = supabase
    .from('presets')
    .select('*, ratings(rating)')
    .order('created_at', { ascending: false });

  if (wheelbase) query = query.eq('wheelbase', wheelbase);
  if (game) query = query.eq('game', game);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compute avg_rating from the related ratings rows
  const presets = (data ?? []).map((p: {
    ratings: { rating: number }[];
    [key: string]: unknown;
  }) => {
    const ratings = p.ratings ?? [];
    const avg_rating =
      ratings.length > 0
        ? ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratings.length
        : 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ratings: _ratings, ...rest } = p;
    return {
      ...rest,
      avg_rating: Math.round(avg_rating * 10) / 10,
      rating_count: ratings.length,
    };
  });

  return NextResponse.json(presets);
}
