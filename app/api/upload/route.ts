import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1 MB
const MAX_IMAGES = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

async function verifyTurnstile(token: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });
  const data = await res.json();
  return data.success === true;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const file = formData.get('file') as File | null;
  const name = formData.get('name') as string;
  const wheelbase = formData.get('wheelbase') as string;
  const game = formData.get('game') as string;
  const description = (formData.get('description') as string) || null;
  const turnstileToken = formData.get('turnstileToken') as string;
  const imageFiles = formData.getAll('images') as File[];

  // Required field validation
  if (!file || !name || !wheelbase || !game) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }
  if (!turnstileToken) {
    return NextResponse.json({ error: 'CAPTCHA token missing.' }, { status: 400 });
  }

  // Verify CAPTCHA
  const captchaValid = await verifyTurnstile(turnstileToken);
  if (!captchaValid) {
    return NextResponse.json({ error: 'CAPTCHA verification failed. Please try again.' }, { status: 400 });
  }

  // Validate preset file
  if (!file.name.endsWith('.json')) {
    return NextResponse.json({ error: 'Only .json files are accepted.' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `Preset file exceeds 1 MB (${(file.size / 1024).toFixed(0)} KB received).` },
      { status: 400 }
    );
  }
  const text = await file.text();
  try {
    JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Preset file is not valid JSON.' }, { status: 400 });
  }

  // Validate images
  const validImages = imageFiles.filter((f) => f.size > 0);
  if (validImages.length > MAX_IMAGES) {
    return NextResponse.json({ error: `Maximum ${MAX_IMAGES} screenshots allowed.` }, { status: 400 });
  }
  for (const img of validImages) {
    if (!ALLOWED_IMAGE_TYPES.includes(img.type)) {
      return NextResponse.json(
        { error: `${img.name}: unsupported image type. Use JPG, PNG, WebP or GIF.` },
        { status: 400 }
      );
    }
    if (img.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: `${img.name} exceeds 1 MB (${(img.size / 1024).toFixed(0)} KB).` },
        { status: 400 }
      );
    }
  }

  const supabase = createServerClient();
  const timestamp = Date.now();
  const safeGame = game.replace(/[^a-zA-Z0-9]/g, '_');

  // Upload preset JSON
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `community/${wheelbase}/${safeGame}/${timestamp}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from('presets')
    .upload(filePath, new TextEncoder().encode(text), {
      contentType: 'application/json',
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Upload images to the public 'images' bucket
  const imagePaths: string[] = [];
  for (let i = 0; i < validImages.length; i++) {
    const img = validImages[i];
    const ext = img.name.split('.').pop() ?? 'jpg';
    const imgPath = `${wheelbase}/${safeGame}/${timestamp}_${i}.${ext}`;
    const imgBuffer = await img.arrayBuffer();

    const { error: imgError } = await supabase.storage
      .from('images')
      .upload(imgPath, imgBuffer, { contentType: img.type, upsert: false });

    if (imgError) {
      // Roll back preset file and any images already uploaded
      await supabase.storage.from('presets').remove([filePath]);
      await supabase.storage.from('images').remove(imagePaths);
      return NextResponse.json({ error: `Image upload failed: ${imgError.message}` }, { status: 500 });
    }
    imagePaths.push(imgPath);
  }

  // Insert preset row
  const { data: preset, error: dbError } = await supabase
    .from('presets')
    .insert({
      name,
      wheelbase,
      game,
      description,
      file_path: filePath,
      original_filename: file.name,
      images: imagePaths,
    })
    .select()
    .single();

  if (dbError) {
    await supabase.storage.from('presets').remove([filePath]);
    await supabase.storage.from('images').remove(imagePaths);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(preset, { status: 201 });
}
