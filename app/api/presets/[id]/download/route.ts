import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  // Get preset
  const { data: preset, error } = await supabase
    .from('presets')
    .select('file_path, original_filename')
    .eq('id', id)
    .single();

  if (error || !preset) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
  }

  // Increment download count
  await supabase.rpc('increment_downloads', { preset_id: id });

  // Generate a signed URL valid for 60 seconds
  const { data: signed, error: signError } = await supabase.storage
    .from('presets')
    .createSignedUrl(preset.file_path, 60, {
      download: preset.original_filename,
    });

  if (signError || !signed) {
    return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
