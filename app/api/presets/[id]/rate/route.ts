import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { rating, fingerprint } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }
  if (!fingerprint) {
    return NextResponse.json({ error: 'Fingerprint required' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Check if this fingerprint already rated this preset
  const { data: existing } = await supabase
    .from('ratings')
    .select('id')
    .eq('preset_id', id)
    .eq('fingerprint', fingerprint)
    .maybeSingle();

  if (existing) {
    // Update the existing rating
    await supabase
      .from('ratings')
      .update({ rating })
      .eq('id', existing.id);
  } else {
    // Insert a new rating
    await supabase.from('ratings').insert({
      preset_id: id,
      rating,
      fingerprint,
    });
  }

  // Compute updated avg and count
  const { data: ratings } = await supabase
    .from('ratings')
    .select('rating')
    .eq('preset_id', id);

  const ratingList = ratings ?? [];
  const avg_rating =
    ratingList.length > 0
      ? ratingList.reduce((sum, r) => sum + r.rating, 0) / ratingList.length
      : 0;

  return NextResponse.json({
    avg_rating: Math.round(avg_rating * 10) / 10,
    rating_count: ratingList.length,
  });
}
