import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { posterUrl, backgroundUrl, watermarkUrl, settings, brandSlug = 'default' } = body;

    console.log('[RENDER] Request received:', {
      posterUrl: posterUrl?.substring(0, 50),
      backgroundUrl: backgroundUrl?.substring(0, 50),
      watermarkUrl: watermarkUrl?.substring(0, 50),
      settings,
    });

    if (!posterUrl) {
      return NextResponse.json(
        { status: 'error', message: 'Poster URL required' },
        { status: 400 }
      );
    }

    // Canvas settings (3:4 ratio)
    const canvasWidth = settings?.width || 1080;
    const canvasHeight = settings?.height || 1440;
    const backgroundColor = settings?.backgroundColor || '#FFFFFF';

    console.log('[RENDER] Canvas settings:', { canvasWidth, canvasHeight, backgroundColor });

    // Create blank canvas
    const canvas = sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 4,
        background: backgroundColor,
      },
    });

    const layers: any[] = [];

    // Layer 1: Background (if provided)
    if (backgroundUrl) {
      try {
        const bgResponse = await fetch(backgroundUrl);
        const bgBuffer = Buffer.from(await bgResponse.arrayBuffer());
        const bgImage = sharp(bgBuffer);
        const bgMeta = await bgImage.metadata();

        // Cover mode: fill entire canvas
        const bgResized = await bgImage
          .resize(canvasWidth, canvasHeight, {
            fit: 'cover',
            position: 'center',
          })
          .toBuffer();

        layers.push({ input: bgResized, top: 0, left: 0 });
      } catch (error) {
        console.error('Background processing error:', error);
      }
    }

    // Layer 2: Poster (main content)
    try {
      console.log('[RENDER] Fetching poster:', posterUrl);
      const posterResponse = await fetch(posterUrl);
      
      if (!posterResponse.ok) {
        throw new Error(`Failed to fetch poster: ${posterResponse.status}`);
      }
      
      const posterBuffer = Buffer.from(await posterResponse.arrayBuffer());
      console.log('[RENDER] Poster buffer size:', posterBuffer.length);
      
      const posterImage = sharp(posterBuffer);
      const posterMeta = await posterImage.metadata();
      console.log('[RENDER] Poster metadata:', posterMeta);

      // Contain mode: fit within canvas with padding
      const padding = settings?.paddingPct || 0;
      const paddingPx = Math.floor((Math.min(canvasWidth, canvasHeight) * padding) / 100);
      const availableWidth = canvasWidth - paddingPx * 2;
      const availableHeight = canvasHeight - paddingPx * 2;

      // Calculate scale to fit
      const scaleX = availableWidth / (posterMeta.width || 1);
      const scaleY = availableHeight / (posterMeta.height || 1);
      const scale = Math.min(scaleX, scaleY);

      const posterWidth = Math.floor((posterMeta.width || 1) * scale);
      const posterHeight = Math.floor((posterMeta.height || 1) * scale);

      // Center position
      const posterX = Math.floor((canvasWidth - posterWidth) / 2);
      const posterY = Math.floor((canvasHeight - posterHeight) / 2);

      // Add shadow if enabled
      let posterProcessed = posterImage.resize(posterWidth, posterHeight, {
        fit: 'contain',
      });

      const posterResized = await posterProcessed.toBuffer();

      layers.push({ input: posterResized, top: posterY, left: posterX });
    } catch (error) {
      console.error('Poster processing error:', error);
      return NextResponse.json(
        { status: 'error', message: 'Failed to process poster' },
        { status: 500 }
      );
    }

    // Layer 3: Watermark (if provided)
    if (watermarkUrl) {
      try {
        const wmResponse = await fetch(watermarkUrl);
        const wmBuffer = Buffer.from(await wmResponse.arrayBuffer());
        const wmImage = sharp(wmBuffer);

        const opacity = settings?.watermarkOpacity || 0.12;

        // Full canvas watermark
        const wmResized = await wmImage
          .resize(canvasWidth, canvasHeight, {
            fit: 'cover',
          })
          .composite([
            {
              input: Buffer.from([255, 255, 255, Math.floor(opacity * 255)]),
              raw: {
                width: 1,
                height: 1,
                channels: 4,
              },
              tile: true,
              blend: 'dest-in',
            },
          ])
          .toBuffer();

        layers.push({ input: wmResized, top: 0, left: 0, blend: 'over' });
      } catch (error) {
        console.error('Watermark processing error:', error);
      }
    }

    // Composite all layers
    console.log('[RENDER] Compositing', layers.length, 'layers');
    const result = await canvas.composite(layers).png({ quality: 92 }).toBuffer();
    console.log('[RENDER] Result buffer size:', result.length);

    // Upload to Supabase Storage
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const timestamp = Date.now();
    const outputFileName = `output_${timestamp}_3x4.png`;
    const outputPath = `${brandSlug}/${yearMonth}/outputs/${outputFileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('posters')
      .upload(outputPath, result, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload output error:', uploadError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to save output' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('posters')
      .getPublicUrl(outputPath);

    console.log('[RENDER] Success! Public URL:', urlData.publicUrl);

    return NextResponse.json({
      status: 'success',
      data: {
        url: urlData.publicUrl,
        path: outputPath,
        width: canvasWidth,
        height: canvasHeight,
        size: result.length,
      },
    });
  } catch (error: any) {
    console.error('POST /api/render error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Render failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
