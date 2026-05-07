import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const file = formData.get('file') as File | null;
  const name = formData.get('name') as string;
  const wheelbase = formData.get('wheelbase') as string;
  const game = formData.get('game') as string;
  const description = (formData.get('description') as string) || null;

  if (!file || !name || !wheelbase || !game) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!file.name.endsWith('.json')) {
    return NextResponse.json({ error: 'File must be a .json file' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Generate a unique storage path
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${wheelbase}/${game.replace(/[^a-zA-Z0-9]/g, '_')}/${timestamp}_${safeName}`;

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const { error: uploadError } = await supabase.storage
    .from('presets')
    .upload(filePath, bytes, {
      contentType: 'application/json',
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: preset, error: dbError } = await supabase
    .from('presets')
    .insert({
      name,
      wheelbase,
      game,
      description,
      file_path: filePath,
      original_filename: file.name,
    })
    .select()
    .single();

  if (dbError) {
    // Clean up the uploaded file if DB insert failed
    await supabase.storage.from('presets').remove([filePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(preset, { status: 201 });
}
