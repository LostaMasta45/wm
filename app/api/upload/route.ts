import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'bg', 'wm', 'poster'
    const brandSlug = formData.get('brandSlug') as string || 'default';

    if (!file) {
      return NextResponse.json(
        { status: 'error', message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid file type. Only JPG, PNG, WEBP allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { status: 'error', message: 'File too large. Max 5MB.' },
        { status: 400 }
      );
    }

    // Generate file path
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${type}_${timestamp}.${ext}`;
    const filePath = `${brandSlug}/${yearMonth}/${type}/${fileName}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('posters')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { status: 'error', message: 'Upload failed', error: error.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('posters')
      .getPublicUrl(filePath);

    return NextResponse.json({
      status: 'success',
      data: {
        path: filePath,
        url: urlData.publicUrl,
        type,
        size: file.size,
        contentType: file.type,
      },
    });
  } catch (error: any) {
    console.error('POST /api/upload error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Upload failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
