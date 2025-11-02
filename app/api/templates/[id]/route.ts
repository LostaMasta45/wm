import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// PATCH - Update template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { backgroundUrl, watermarkUrl, settings } = body;

    // Check if preset exists
    const { data: existingPreset, error: fetchError } = await supabaseAdmin
      .from('presets')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPreset) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'E_TEMPLATE_NOT_FOUND',
          message: 'Template not found',
        },
        { status: 404 }
      );
    }

    // Merge existing settings with new updates
    const currentSettings = existingPreset.settings as any;
    const updatedSettings = {
      ...currentSettings,
      ...(backgroundUrl !== undefined && { backgroundUrl }),
      ...(watermarkUrl !== undefined && { watermarkUrl }),
      ...(settings?.padding !== undefined && { padding: settings.padding }),
      ...(settings?.watermarkOpacity !== undefined && { watermarkOpacity: settings.watermarkOpacity }),
      ...(settings?.watermarkSize !== undefined && { watermarkSize: settings.watermarkSize }),
      ...(settings?.backgroundColor !== undefined && { backgroundColor: settings.backgroundColor }),
    };

    // Update preset
    const { data: preset, error: updateError } = await supabaseAdmin
      .from('presets')
      .update({
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !preset) {
      throw updateError || new Error('Failed to update preset');
    }

    return NextResponse.json({
      status: 'success',
      data: preset,
    });
  } catch (error) {
    console.error('PATCH /api/templates/[id] error:', error);
    return NextResponse.json(
      {
        status: 'error',
        code: 'E_UPDATE_TEMPLATE',
        message: 'Failed to update template',
      },
      { status: 500 }
    );
  }
}

// GET - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: preset, error: presetError } = await supabaseAdmin
      .from('presets')
      .select(`
        *,
        brand:brands (
          id,
          name,
          slug
        )
      `)
      .eq('id', id)
      .single();

    if (presetError || !preset) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'E_TEMPLATE_NOT_FOUND',
          message: 'Template not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: preset,
    });
  } catch (error) {
    console.error('GET /api/templates/[id] error:', error);
    return NextResponse.json(
      {
        status: 'error',
        code: 'E_FETCH_TEMPLATE',
        message: 'Failed to fetch template',
      },
      { status: 500 }
    );
  }
}
