import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET all templates (presets) from all brands
export async function GET(request: NextRequest) {
  try {
    // Fetch ALL presets from ALL brands (no brand filter)
    const { data: presets, error: presetsError } = await supabaseAdmin
      .from('presets')
      .select('*')
      .order('created_at', { ascending: true });

    if (presetsError) {
      console.error('Error fetching presets:', presetsError);
      throw presetsError;
    }

    console.log(`GET /api/templates - Found ${presets?.length || 0} templates`);

    return NextResponse.json({
      status: 'success',
      data: presets || [],
    });
  } catch (error) {
    console.error('GET /api/templates error:', error);
    return NextResponse.json(
      {
        status: 'error',
        code: 'E_FETCH_TEMPLATES',
        message: 'Failed to fetch templates',
      },
      { status: 500 }
    );
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, brandSlug, backgroundUrl, watermarkUrl, settings } = body;

    // Get or create brand
    const { data: brands } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('slug', brandSlug || 'default')
      .limit(1);

    let brandId: string;

    if (!brands || brands.length === 0) {
      const { data: newBrand, error: createError } = await supabaseAdmin
        .from('brands')
        .insert({
          name: name,
          slug: brandSlug || 'default',
          owner_user_id: 'system',
        })
        .select()
        .single();

      if (createError || !newBrand) {
        throw new Error('Failed to create brand');
      }

      brandId = newBrand.id;
    } else {
      brandId = brands[0].id;
    }

    // Check if preset name already exists for this brand
    const { data: existingPresets } = await supabaseAdmin
      .from('presets')
      .select('name')
      .eq('brand_id', brandId)
      .ilike('name', `${name}%`);

    // Generate unique name if needed
    let uniqueName = name;
    if (existingPresets && existingPresets.length > 0) {
      const existingNames = existingPresets.map(p => p.name);
      let counter = 1;
      while (existingNames.includes(uniqueName)) {
        counter++;
        uniqueName = `${name} (${counter})`;
      }
    }

    // Create preset
    const { data: preset, error: presetError } = await supabaseAdmin
      .from('presets')
      .insert({
        brand_id: brandId,
        name: uniqueName,
        is_default: false,
        settings: {
          backgroundUrl: backgroundUrl || '',
          watermarkUrl: watermarkUrl || '',
          padding: settings?.padding || 5,
          watermarkOpacity: settings?.watermarkOpacity || 12,
          watermarkSize: settings?.watermarkSize || 30,
          backgroundColor: settings?.backgroundColor || '#FFFFFF',
        },
        created_by: 'system',
      })
      .select()
      .single();

    if (presetError || !preset) {
      throw presetError || new Error('Failed to create preset');
    }

    return NextResponse.json(
      {
        status: 'success',
        data: preset,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/templates error:', error);
    return NextResponse.json(
      {
        status: 'error',
        code: 'E_CREATE_TEMPLATE',
        message: 'Failed to create template',
      },
      { status: 500 }
    );
  }
}
