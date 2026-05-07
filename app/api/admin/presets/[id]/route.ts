import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

// PATCH — update preset metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, wheelbase, game, description } = body;

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('presets')
    .update({ name, wheelbase, game, description })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE — remove preset and its file from storage
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  // Fetch file_path first
  const { data: preset, error: fetchError } = await supabase
    .from('presets')
    .select('file_path')
    .eq('id', id)
    .single();

  if (fetchError || !preset) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
  }

  // Delete the file from storage
  await supabase.storage.from('presets').remove([preset.file_path]);

  // Delete ratings
  await supabase.from('ratings').delete().eq('preset_id', id);

  // Delete the DB row
  const { error: deleteError } = await supabase
    .from('presets')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
